import { describe, expect, it } from "vitest";
import {
  alleleOptions,
  commonDiplotypes,
  phenotypeFrequency,
  phenotypeOptions,
  populationMeta,
  sampleProfiles,
} from "@/lib/engine/catalog";
import { checkPanel, interpretGenotype, panelSummary } from "@/lib/engine";
import { kb } from "@/lib/engine/kb";

describe("allele options", () => {
  it("puts the commonest observed alleles first", () => {
    const top = alleleOptions("CYP2C19").slice(0, 3).map((a) => a.name);
    expect(top).toEqual(["*1", "*2", "*17"]);
  });

  it("carries the CPIC function so the UI can explain each allele", () => {
    const star2 = alleleOptions("CYP2C19").find((a) => a.name === "*2");
    expect(star2?.function).toBe("No function");
  });

  it("only offers alleles the engine can actually resolve", () => {
    for (const gene of ["CYP2C19", "CYP2D6", "TPMT", "SLCO1B1"]) {
      for (const option of alleleOptions(gene)) {
        expect(kb.genes[gene].alleles[option.name], `${gene} ${option.name}`).toBeDefined();
      }
    }
  });

  it("every offered pair resolves to a phenotype, not an input error", () => {
    const top = alleleOptions("CYP2C19").slice(0, 4);
    for (const a of top) {
      for (const b of top) {
        const result = interpretGenotype("CYP2C19", `${a.name}/${b.name}`);
        expect(result.status, `${a.name}/${b.name}: ${result.messages.join("; ")}`).not.toBe("unknown-allele");
      }
    }
  });
});

describe("phenotype options", () => {
  it("offers the phenotypes a report would state", () => {
    const names = phenotypeOptions("CYP2C19").map((p) => p.phenotype);
    expect(names).toContain("Poor Metabolizer");
    expect(names).toContain("Ultrarapid Metabolizer");
  });

  it("leaves out outcomes a user would never choose", () => {
    const names = phenotypeOptions("CYP2C19").map((p) => p.phenotype);
    expect(names).not.toContain("Indeterminate");
    expect(names).not.toContain("No Result");
  });

  it("every offered phenotype is accepted as direct entry", () => {
    for (const gene of ["CYP2C19", "TPMT", "SLCO1B1", "CYP3A5"]) {
      for (const option of phenotypeOptions(gene)) {
        const result = interpretGenotype(gene, option.phenotype);
        expect(result.phenotype, `${gene} "${option.phenotype}"`).toBe(option.phenotype);
      }
    }
  });
});

describe("population context", () => {
  it("reports frequencies from this study's own donor set", () => {
    const pm = phenotypeFrequency("CYP2C19", "Poor Metabolizer");
    // The study's own README reports about 16.3% CYP2C19 poor metabolizers.
    expect(pm!.pct).toBeGreaterThan(15);
    expect(pm!.pct).toBeLessThan(18);
    // 499 of the 514 donors had an unambiguous CYP2C19 call.
    expect(pm!.donors).toBeGreaterThan(490);
  });

  it("reproduces the known Asian NUDT15 / TPMT pattern", () => {
    const nudt15 = phenotypeFrequency("NUDT15", "Intermediate Metabolizer")!.pct;
    const tpmt = phenotypeFrequency("TPMT", "Intermediate Metabolizer")!.pct;
    expect(nudt15).toBeGreaterThan(tpmt);
  });

  it("covers 514 donors", () => {
    expect(populationMeta.donors).toBe(514);
  });

  it("offers common diplotypes that the engine resolves", () => {
    for (const { diplotype } of commonDiplotypes("CYP2C19")) {
      expect(interpretGenotype("CYP2C19", diplotype).status).toBe("ok");
    }
  });
});

describe("sample profiles", () => {
  it("has one worked example per South Asian population", () => {
    const profiles = sampleProfiles();
    expect(profiles.length).toBe(5);
    expect(new Set(profiles.map((p) => p.population)).size).toBe(5);
  });

  it("every genotype in every profile resolves", () => {
    for (const profile of sampleProfiles()) {
      for (const [gene, diplotype] of Object.entries(profile.genotypes)) {
        const result = interpretGenotype(gene, diplotype);
        expect(["ok", "indeterminate"], `${profile.sample} ${gene} ${diplotype}`).toContain(result.status);
      }
    }
  });
});

describe("reverse check (panel)", () => {
  it("finds every drug affected by the supplied genes", () => {
    const entries = checkPanel([{ gene: "CYP2C19", diplotype: "*2/*2" }]);
    expect(entries.map((e) => e.drug)).toContain("clopidogrel");
    expect(entries.map((e) => e.drug)).toContain("voriconazole");
    expect(entries.length).toBeGreaterThan(5);
  });

  it("orders the most severe first", () => {
    const entries = checkPanel([{ gene: "CYP2C19", diplotype: "*2/*2" }]);
    const order = { critical: 0, warning: 1, info: 2, normal: 3 };
    const tiers = entries.map((e) => order[e.tier]);
    expect(tiers).toEqual([...tiers].sort((a, b) => a - b));
  });

  it("flags nothing as critical for a wholly normal panel", () => {
    const entries = checkPanel([
      { gene: "CYP2C19", diplotype: "*1/*1" },
      { gene: "TPMT", diplotype: "*1/*1" },
    ]);
    expect(entries.length).toBeGreaterThan(0);
    expect(panelSummary(entries).critical).toBe(0);
  });

  it("marks drugs whose advice depends on clinical context", () => {
    const entries = checkPanel([{ gene: "CYP2C19", diplotype: "*2/*2" }]);
    // clopidogrel splits by indication, voriconazole by age; omeprazole does not split.
    expect(entries.find((e) => e.drug === "clopidogrel")?.needsClinicalContext).toBe(true);
    expect(entries.find((e) => e.drug === "voriconazole")?.needsClinicalContext).toBe(true);
    expect(entries.find((e) => e.drug === "omeprazole")?.needsClinicalContext).toBe(false);
  });

  it("scores each drug on its own genes only", () => {
    // One high-risk gene in a panel must not raise an alert on unrelated drugs.
    // Before this was fixed, a CYP2C19 poor metabolizer made celecoxib (CYP2C9)
    // and atorvastatin (SLCO1B1) critical even though those genes were normal.
    const entries = checkPanel([
      { gene: "CYP2C19", diplotype: "*2/*2" },
      { gene: "CYP2C9", diplotype: "*1/*1" },
      { gene: "SLCO1B1", diplotype: "*1/*1" },
    ]);
    expect(entries.find((e) => e.drug === "clopidogrel")?.tier).toBe("critical");
    expect(entries.find((e) => e.drug === "celecoxib")?.tier).toBe("normal");
    expect(entries.find((e) => e.drug === "atorvastatin")?.tier).toBe("normal");
  });

  it("does not flag most drugs as critical for a whole real donor profile", () => {
    const profile = sampleProfiles()[0];
    const inputs = Object.entries(profile.genotypes).map(([gene, diplotype]) => ({ gene, diplotype }));
    const summary = panelSummary(checkPanel(inputs));
    // A real donor carries a handful of actionable results, not dozens.
    expect(summary.critical).toBeLessThan(summary.total / 3);
  });

  it("returns nothing when no genotype is supplied", () => {
    expect(checkPanel([{ gene: "CYP2C19", diplotype: "  " }])).toEqual([]);
  });

  it("handles a whole donor profile", () => {
    const profile = sampleProfiles()[0];
    const inputs = Object.entries(profile.genotypes).map(([gene, diplotype]) => ({ gene, diplotype }));
    const entries = checkPanel(inputs);
    expect(entries.length).toBeGreaterThan(20);
  });
});
