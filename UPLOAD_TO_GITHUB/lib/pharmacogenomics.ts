/**
 * Compatibility layer for the dashboard components.
 *
 * This file used to hold a small hand-written allele table and a
 * nearest-activity-score guess. That approach disagreed with CPIC on common
 * diplotypes (CYP2C19 *1/*2 came back "Normal Metabolizer" instead of
 * "Intermediate Metabolizer"), so the data and the logic have been replaced by
 * the verified rule engine in lib/engine, which is driven by the frozen CPIC
 * snapshot in data/cpic and is tested against the 180 study test cases.
 *
 * The exported names are unchanged so existing UI keeps working. New screens
 * should import from "@/lib/engine" directly, which also returns the CPIC
 * recommendation text, evidence strength and guideline links.
 */
import { kb } from "@/lib/engine/kb";
import { interpretGenotype } from "@/lib/engine/genotype";

export interface Allele {
  name: string;
  gene: string;
  /** CPIC clinical function, e.g. "No function", "Decreased function". */
  function: string | null;
  /** Activity value for the score-based genes (CYP2D6, CYP2C9, DPYD). */
  activityValue: string | null;
  description: string;
}

export interface Phenotype {
  name: string;
  /** CPIC total activity score where the gene uses one, otherwise null. */
  activityScore: string | null;
  description: string;
  clinicalMeaning: string;
}

export interface GeneAlleles {
  gene: string;
  commonAlleles: Allele[];
  phenotypes: Record<string, Phenotype>;
}

function buildRegistry(): Record<string, GeneAlleles> {
  const registry: Record<string, GeneAlleles> = {};
  for (const [symbol, gene] of Object.entries(kb.genes)) {
    const phenotypes: Record<string, Phenotype> = {};
    for (const result of Object.values(gene.results)) {
      phenotypes[result.phenotype] = {
        name: result.phenotype,
        activityScore: result.activityScore === "n/a" ? null : result.activityScore,
        description:
          gene.lookups
            .filter((l) => gene.results[l.resultId]?.phenotype === result.phenotype)
            .map((l) => l.description)[0] ?? "",
        clinicalMeaning: result.consultation,
      };
    }
    registry[symbol] = {
      gene: symbol,
      commonAlleles: Object.entries(gene.alleles).map(([name, a]) => ({
        name,
        gene: symbol,
        function: a.function,
        activityValue: a.activityValue,
        description: a.function ?? "Function not assigned by CPIC",
      })),
      phenotypes,
    };
  }
  return registry;
}

/** Every CPIC Level A gene, with its allele table and phenotype list. */
export const GENE_REGISTRY: Record<string, GeneAlleles> = buildRegistry();

export const HLA_ALLELES: Record<string, string> = {
  "HLA-B*57:01": "High risk for abacavir hypersensitivity",
  "HLA-B*15:02": "High risk for carbamazepine SJS/TEN",
  "HLA-A*31:01": "High risk for carbamazepine adverse reactions",
};

/** Diplotype -> CPIC phenotype. Returns "Unknown" if CPIC does not define one. */
export function calculatePhenotype(allele1: string, allele2: string, gene: string): string {
  return interpretGenotype(gene, `${allele1}/${allele2}`).phenotype ?? "Unknown";
}

export function getPhenotypeDetails(phenotype: string, gene: string): Phenotype | null {
  return GENE_REGISTRY[gene]?.phenotypes[phenotype] ?? null;
}
