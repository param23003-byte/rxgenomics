import { describe, expect, it } from "vitest";
import { checkDrug, interpretGenotype, splitDiplotype } from "@/lib/engine";

describe("diplotype parsing", () => {
  it("keeps bracketed combinations together", () => {
    expect(splitDiplotype("Reference/[c.85T>C (*9A) + c.2194G>A (*6)]")).toEqual([
      "Reference",
      "[c.85T>C (*9A) + c.2194G>A (*6)]",
    ]);
  });
});

describe("phenotype assignment", () => {
  it("CYP2C19 *2/*2 is a poor metabolizer", () => {
    expect(interpretGenotype("CYP2C19", "*2/*2").phenotype).toBe("Poor Metabolizer");
  });

  it("CYP2D6 gene duplication is scored by activity value", () => {
    const g = interpretGenotype("CYP2D6", "*1/*1x2");
    expect(g.activityScore).toBe("3.0");
    expect(g.phenotype).toBe("Ultrarapid Metabolizer");
  });

  it("rejects an allele CPIC does not define", () => {
    expect(interpretGenotype("CYP2C19", "*1/*999").status).toBe("unknown-allele");
  });

  it("accepts a reported HLA carrier status", () => {
    expect(interpretGenotype("HLA-B", "*57:01 positive").phenotype).toBe("*57:01 positive");
  });
});

describe("drug check", () => {
  it("clopidogrel in a CYP2C19 poor metabolizer is a critical alert", () => {
    const r = checkDrug("clopidogrel", [{ gene: "CYP2C19", diplotype: "*2/*2" }]);
    expect(r.tier).toBe("critical");
    expect(r.primary.length).toBeGreaterThan(0);
  });

  it("abacavir with HLA-B*57:01 positive is a critical alert", () => {
    const r = checkDrug("abacavir", [{ gene: "HLA-B", diplotype: "*57:01 positive" }]);
    expect(r.tier).toBe("critical");
    expect(r.primary[0].recommendation).toMatch(/not recommended/i);
  });

  it("normal genotype gives a normal tier", () => {
    expect(checkDrug("clopidogrel", [{ gene: "CYP2C19", diplotype: "*1/*1" }]).tier).toBe("normal");
  });

  it("multi-gene drug reads untested genes as No Result for the primary answer", () => {
    const r = checkDrug("rosuvastatin", [{ gene: "SLCO1B1", diplotype: "*5/*5" }]);
    expect(r.missingGenes).toEqual(expect.arrayContaining(["ABCG2"]));
    expect(r.primary.every((p) => p.lookup.ABCG2 === undefined || p.lookup.ABCG2 === "No Result")).toBe(true);
  });

  it("warfarin has no CPIC recommendation rows (algorithm-based)", () => {
    const r = checkDrug("warfarin", [{ gene: "CYP2C9", diplotype: "*1/*3" }]);
    expect(r.candidates).toHaveLength(0);
    expect(r.tier).toBe("info");
  });
});
