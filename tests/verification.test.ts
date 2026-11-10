/**
 * LEVEL 1 - SOFTWARE VERIFICATION (protocol: internal quality check, not a study outcome)
 *
 * Runs the 180 frozen test cases (RxGenomics_Study/07_Step6_Test_Cases) through
 * the rule engine. Expected answers were fixed before the engine existed.
 *
 * For every case:
 *   1. the engine's phenotype must equal the expected CPIC phenotype
 *   2. the expected CPIC recommendation must be among those the engine returns
 *
 * Check 2 is "among" rather than "equal" because, for drugs keyed on several
 * genes (rosuvastatin, sertraline, thiopurines, anaesthetics...), the test-case
 * builder matched on one gene only, so the expected row is one of several valid
 * rows for that phenotype.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseTsv } from "../scripts/tsv.mjs";
import { checkDrug, interpretGenotype } from "@/lib/engine";

type Case = Record<string, string>;
const cases: Case[] = parseTsv(readFileSync("data/verification/selected_test_cases.tsv", "utf8"));

describe("Level 1 verification: 180 frozen CPIC test cases", () => {
  it("loads all 180 cases", () => expect(cases).toHaveLength(180));

  it.each(cases.map((c) => [`${c.case_id} ${c.gene} ${c.diplotype} + ${c.candidate_drug}`, c] as const))(
    "%s",
    (_, c) => {
      const g = interpretGenotype(c.gene, c.diplotype);
      // "indeterminate" is a valid CPIC answer (e.g. G6PD Gond); only input errors fail.
      expect(["ok", "indeterminate"], g.messages.join("; ")).toContain(g.status);
      expect(g.phenotype?.toLowerCase()).toBe(c.expected_phenotype.toLowerCase());

      const check = checkDrug(c.candidate_drug, [{ gene: c.gene, diplotype: c.diplotype }], c.cpic_population);
      expect(check.candidates.map((r) => r.id)).toContain(c.cpic_recommendation_id);
    },
  );
});
