/**
 * Regression test for lib/pharmacogenomics.ts.
 *
 * The previous hand-written version of that module assigned a phenotype by
 * picking the nearest activity-score midpoint. It disagreed with CPIC on three
 * of these five common CYP2C19 diplotypes, including calling *1/*2 a normal
 * metabolizer, which would suppress a clopidogrel alert. These cases are pinned
 * so the dashboard cannot silently drift away from CPIC again.
 */
import { describe, expect, it } from "vitest";
import { calculatePhenotype, GENE_REGISTRY, getPhenotypeDetails } from "@/lib/pharmacogenomics";

describe("dashboard compatibility layer", () => {
  it.each([
    ["*1", "*1", "Normal Metabolizer"],
    ["*1", "*2", "Intermediate Metabolizer"],
    ["*2", "*2", "Poor Metabolizer"],
    ["*1", "*17", "Rapid Metabolizer"],
    ["*2", "*17", "Intermediate Metabolizer"],
  ])("CYP2C19 %s/%s is a %s", (a1, a2, expected) => {
    expect(calculatePhenotype(a1, a2, "CYP2C19")).toBe(expected);
  });

  it("covers every CPIC Level A gene, not just three", () => {
    expect(Object.keys(GENE_REGISTRY).length).toBe(21);
    expect(GENE_REGISTRY.SLCO1B1.phenotypes["Poor Function"]).toBeDefined();
  });

  it("returns CPIC consultation text as the clinical meaning", () => {
    expect(getPhenotypeDetails("Poor Metabolizer", "CYP2C19")?.clinicalMeaning).toMatch(/poor metabolizer/i);
  });

  it("reports Unknown rather than guessing for an undefined allele", () => {
    expect(calculatePhenotype("*1", "*999", "CYP2C19")).toBe("Unknown");
  });
});
