import { kb } from "./kb";
import { interpretGenotype } from "./genotype";
import type { AlertTier, DrugCheck, GenotypeResult, Recommendation } from "./types";

/**
 * Step 2 of the rule engine: phenotype(s) + drug -> CPIC recommendation and alert tier.
 */

/** Same normalisation as the test-case builder: numbers compared numerically, text case-insensitively. */
export function normaliseLookup(v: string | null | undefined): string {
  const s = (v ?? "").trim();
  if (!s) return "";
  return /^-?\d+(\.\d+)?$/.test(s) ? String(parseFloat(s)) : s.toLowerCase();
}

// What CPIC writes in a recommendation's lookup key for a gene that was not tested.
const NOT_TESTED = new Set(["no result", "n/a"]);

const isHighRisk = (priority: string | null) =>
  !!priority && /high.?risk/i.test(priority) && !/low.?risk/i.test(priority);

/**
 * Alert tier rule (documented for the expert panel):
 *   critical - a relevant gene has a high-risk CPIC phenotype AND the recommendation is "Strong"
 *   warning  - a relevant gene has a high-risk CPIC phenotype (Moderate / Optional recommendation)
 *   normal   - phenotypes are routine / low risk and a recommendation was found
 *   info     - no recommendation could be matched, or the phenotype is indeterminate
 *
 * `genotypes` must contain only the genes this drug is keyed on. Passing every
 * genotype a patient has would let one high-risk gene raise a critical alert on
 * every unrelated drug, which is how an alerting system becomes noise.
 */
export function alertTier(genotypes: GenotypeResult[], primary: Recommendation[]): AlertTier {
  if (!primary.length || genotypes.some((g) => g.status !== "ok")) return "info";
  if (!genotypes.some((g) => isHighRisk(g.ehrPriority))) return "normal";
  return primary.some((r) => r.classification === "Strong") ? "critical" : "warning";
}

export function checkDrug(
  drugName: string,
  inputs: { gene: string; diplotype: string }[],
  population?: string,
): DrugCheck {
  const drug = kb.drugs[drugName];
  const genotypes = inputs.filter((i) => i.diplotype.trim()).map((i) => interpretGenotype(i.gene, i.diplotype.trim()));

  const result: DrugCheck = {
    drug: drugName,
    known: !!drug,
    guidelines: drug?.guidelines ?? [],
    genotypes,
    missingGenes: drug ? drug.genes.filter((g) => !genotypes.some((r) => r.gene === g)) : [],
    primary: [],
    candidates: [],
    tier: "info",
    messages: [],
  };
  if (!drug) {
    result.messages.push(`${drugName} is not a CPIC Level A drug in this knowledge base.`);
    return result;
  }

  const supplied = new Map(genotypes.filter((g) => g.lookupValue).map((g) => [g.gene, normaliseLookup(g.lookupValue)]));
  if (!supplied.size) {
    result.messages.push(`Enter a genotype for ${drug.genes.join(" or ")}.`);
    return result;
  }

  // A recommendation fits if every supplied gene it is keyed on matches.
  result.candidates = kb.recommendations.filter((r) => {
    if (r.drug !== drugName) return false;
    if (population && r.population !== population) return false;
    const genes = Object.keys(r.lookup);
    if (!genes.some((g) => supplied.has(g))) return false;
    return genes.every((g) => !supplied.has(g) || normaliseLookup(r.lookup[g]) === supplied.get(g));
  });

  // Primary: candidates whose unsupplied genes are recorded as "not tested".
  result.primary = result.candidates.filter((r) =>
    Object.keys(r.lookup).every((g) => supplied.has(g) || NOT_TESTED.has(normaliseLookup(r.lookup[g]))),
  );
  if (!result.primary.length) result.primary = result.candidates;

  if (!result.candidates.length) {
    result.messages.push("CPIC has no recommendation for this drug at the supplied phenotype.");
  }
  if (result.missingGenes.length && result.candidates.length) {
    result.messages.push(
      `CPIC also uses ${result.missingGenes.join(", ")} for ${drugName}; the recommendation shown assumes ${
        result.missingGenes.length > 1 ? "they were" : "it was"
      } not tested.`,
    );
  }
  // Scored on this drug's own genes only: a whole-panel check supplies many
  // genotypes, and an unrelated gene must not drive this drug's alert.
  result.tier = alertTier(
    genotypes.filter((g) => drug.genes.includes(g.gene)),
    result.primary,
  );
  return result;
}
