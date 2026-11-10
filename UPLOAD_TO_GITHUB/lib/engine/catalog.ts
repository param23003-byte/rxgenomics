import { kb } from "./kb";

/** The small, client-safe slice of the knowledge base the input form needs. */
export type DrugOption = { name: string; genes: string[]; populations: string[] };

export function drugCatalog(): DrugOption[] {
  return Object.values(kb.drugs)
    .map((d) => ({
      name: d.name,
      genes: d.genes,
      populations: [...new Set(kb.recommendations.filter((r) => r.drug === d.name).map((r) => r.population))].sort(),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Example inputs shown as hints next to each gene field. */
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
