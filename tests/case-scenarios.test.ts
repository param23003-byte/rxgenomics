/**
 * Freezes the Phase III case scenarios.
 *
 * The protocol requires the expected answer for each scenario to be fixed
 * before the system is queried. These assertions make that enforceable: if the
 * engine or the CPIC snapshot changes in a way that would alter any expected
 * answer, the build fails instead of the study quietly losing its baseline.
 *
 * It also checks that each scenario resolves to exactly one recommendation, so
 * a facilitator scoring a session is never left choosing between two answers.
 */
import { describe, expect, it } from "vitest";
import { checkDrug } from "@/lib/engine";
import { SCENARIOS } from "@/study/scenarios";

describe("Phase III case scenarios", () => {
  it("has a usable bank size and a mix of actionable and normal cases", () => {
    expect(SCENARIOS.length).toBeGreaterThanOrEqual(8);
    expect(SCENARIOS.filter((s) => s.kind === "normal").length).toBeGreaterThanOrEqual(3);
    expect(new Set(SCENARIOS.map((s) => s.id)).size).toBe(SCENARIOS.length);
  });

  it.each(SCENARIOS.map((s) => [`${s.id} ${s.gene} ${s.diplotype} + ${s.drug}`, s] as const))("%s", (_, s) => {
    const result = checkDrug(s.drug, [{ gene: s.gene, diplotype: s.diplotype }], s.population);
    const genotype = result.genotypes[0];

    expect(genotype.status, genotype.messages.join("; ")).toBe("ok");
    expect(genotype.phenotype).toBe(s.expected.phenotype);
    expect(result.tier).toBe(s.expected.tier);

    // Exactly one answer, so scoring is unambiguous.
    expect(result.primary).toHaveLength(1);
    expect(result.primary[0].id).toBe(s.expected.recommendationId);

    // An "actionable" scenario must raise an alert; a "normal" one must not.
    if (s.kind === "normal") expect(result.tier).toBe("normal");
    else expect(["critical", "warning"]).toContain(result.tier);
  });
});
