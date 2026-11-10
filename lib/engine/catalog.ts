import { kb } from "./kb";
import population from "@/lib/kb/population.json";

/**
 * Presentation helpers for the UI. Nothing here decides a recommendation; that
 * is lib/engine/recommend.ts. This file only shapes the knowledge base into the
 * lists the input screens need.
 *
 * Where this study's own genotype results cover a gene, options are ordered by
 * how often they were actually observed in 514 South Asian donors, so the
 * common answers come first instead of the alphabetical ones.
 */

export type DrugOption = { name: string; genes: string[]; populations: string[] };

export type AlleleOption = {
  name: string;
  /** CPIC clinical function, e.g. "No function". */
  function: string | null;
  activityValue: string | null;
  /** Percentage of observed alleles in the South Asian donor set, if seen. */
  observedPct: number | null;
};

export type PhenotypeOption = {
  phenotype: string;
  /** Percentage of donors with this phenotype, if the gene was analysed. */
  observedPct: number | null;
};

type PopGene = { donorsCalled: number; alleles: { name: string; pct: number }[]; phenotypes: { phenotype: string; pct: number; class: string }[] };
const pop = population as {
  genes: Record<string, PopGene>;
  profiles: { sample: string; population: string; populationLabel: string; actionableCount: number; genotypes: Record<string, string> }[];
  meta: { donors: number; unambiguousCalls: number; populations: Record<string, string>; source: string };
};

export function drugCatalog(): DrugOption[] {
  return Object.values(kb.drugs)
    .map((d) => ({
      name: d.name,
      genes: d.genes,
      populations: [...new Set(kb.recommendations.filter((r) => r.drug === d.name).map((r) => r.population))].sort(),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Alleles a laboratory could report for this gene, commonest first. */
export function alleleOptions(gene: string): AlleleOption[] {
  const entry = kb.genes[gene];
  if (!entry) return [];
  const observed = new Map((pop.genes[gene]?.alleles ?? []).map((a) => [a.name, a.pct]));

  return Object.entries(entry.alleles)
    .map(([name, a]) => ({
      name,
      function: a.function,
      activityValue: a.activityValue,
      observedPct: observed.get(name) ?? null,
    }))
    .sort((a, b) => (b.observedPct ?? -1) - (a.observedPct ?? -1) || a.name.localeCompare(b.name, undefined, { numeric: true }));
}

/**
 * Phenotypes a report might state directly, for users whose laboratory gives a
 * phenotype rather than star alleles. "Indeterminate" and "No Result" are left
 * out: they are outcomes the engine can produce, not answers a user would pick.
 */
export function phenotypeOptions(gene: string): PhenotypeOption[] {
  const entry = kb.genes[gene];
  if (!entry) return [];
  const observed = new Map((pop.genes[gene]?.phenotypes ?? []).map((p) => [p.phenotype, p.pct]));
  const skip = /^(indeterminate|no result|n\/a)$/i;

  const seen = new Set<string>();
  return Object.values(entry.results)
    .filter((r) => !skip.test(r.phenotype) && !seen.has(r.phenotype) && seen.add(r.phenotype))
    .map((r) => ({ phenotype: r.phenotype, observedPct: observed.get(r.phenotype) ?? null }))
    .sort((a, b) => (b.observedPct ?? -1) - (a.observedPct ?? -1) || a.phenotype.localeCompare(b.phenotype));
}

/** The commonest real diplotypes for a gene, for one-tap entry. */
export function commonDiplotypes(gene: string, limit = 3): { diplotype: string; label: string }[] {
  const alleles = (pop.genes[gene]?.alleles ?? []).slice(0, 3).map((a) => a.name);
  if (alleles.length === 0) return [];

  const pairs: { diplotype: string; label: string }[] = [];
  for (let i = 0; i < alleles.length && pairs.length < limit; i++) {
    for (let j = i; j < alleles.length && pairs.length < limit; j++) {
      pairs.push({ diplotype: `${alleles[i]}/${alleles[j]}`, label: `${alleles[i]}/${alleles[j]}` });
    }
  }
  return pairs.slice(0, limit);
}

/** How often this phenotype was seen in the donor set, for context beside a result. */
export function phenotypeFrequency(gene: string, phenotype: string): { pct: number; donors: number } | null {
  const entry = pop.genes[gene];
  const match = entry?.phenotypes.find((p) => p.phenotype === phenotype);
  return match ? { pct: match.pct, donors: entry.donorsCalled } : null;
}

/** Complete donor profiles used as worked examples. */
export function sampleProfiles() {
  return pop.profiles;
}

export const populationMeta = pop.meta;

/**
 * Flat list of the values a dropdown may offer for this gene, commonest first.
 *
 * For HLA this returns the carrier statuses exactly as the engine accepts them
 * ("*57:01 positive"), not bare "positive"/"negative": those would be joined
 * into "positive/negative", which is not a diplotype and is rejected.
 */
export function alleleCatalog(gene: string): string[] {
  if (CARRIER_GENES.includes(gene)) return phenotypeOptions(gene).map((p) => p.phenotype);
  return alleleOptions(gene).map((a) => a.name);
}

/**
 * True when the gene is entered as one value rather than a pair: HLA carrier
 * status, and the X-linked genes where a male hemizygote has a single allele.
 */
export function isSingleEntryGene(gene: string): boolean {
  return CARRIER_GENES.includes(gene) || SINGLE_ALLELE_GENES.includes(gene);
}

/** Example inputs shown as hints next to a free-text gene field. */
export const GENE_HINTS: Record<string, string> = {
  "HLA-A": "*31:01 positive",
  "HLA-B": "*57:01 positive",
  "MT-RNR1": "m.1555A>G",
  G6PD: "B (reference)/A- 202A_376G",
  DPYD: "c.1905+1G>A (*2A)/Reference",
  CFTR: "G551D/ivacaftor non-responsive CFTR sequence",
  RYR1: "Reference/c.1021G>A",
  CACNA1S: "Reference/c.520C>T",
  ABCG2: "rs2231142 reference (G)/rs2231142 variant (T)",
  VKORC1: "rs9923231 reference (C)/rs9923231 variant (T)",
};

/** Genes reported as a carrier status rather than a diplotype. */
export const CARRIER_GENES = ["HLA-A", "HLA-B"];

/** X-linked: a male hemizygote is reported as a single allele. */
export const SINGLE_ALLELE_GENES = ["G6PD", "MT-RNR1"];
