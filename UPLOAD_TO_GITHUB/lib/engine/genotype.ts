import { kb } from "./kb";
import type { GeneEntry, GenotypeResult, ResolvedAllele } from "./types";

/**
 * Step 1 of the rule engine: diplotype -> phenotype, following CPIC's own tables.
 *
 *   each allele      -> clinical function (or activity value for score-based genes)
 *   pair of values   -> gene_result_lookup row -> phenotype / activity score
 */

// Worst first. Used when one haplotype carries several variants and only the
// lowest-function one decides the haplotype's function (CPIC DPYD/RYR1 practice).
const FUNCTION_SEVERITY = [
  "Malignant Hyperthermia associated",
  "I/Deficient with CNSHA",
  "II/Deficient",
  "III/Deficient",
  "No function",
  "Decreased function",
  "Possible decreased function",
  "Uncertain function",
  "Unknown function",
  "Normal function",
  "IV/Normal",
  "Increased function",
];

const severity = (fn: string | null) => {
  const i = fn ? FUNCTION_SEVERITY.indexOf(fn) : -1;
  return i === -1 ? FUNCTION_SEVERITY.indexOf("Unknown function") : i;
};

/** "≥3.0" -> 3, "n/a" -> NaN */
const activityNumber = (v: string | null) => (v ? parseFloat(v.replace(/[≥>]/g, "")) : NaN);

/** Split "a/b" on top-level slashes only, so "[x + y]" stays intact. */
export function splitDiplotype(diplotype: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let cur = "";
  for (const c of diplotype) {
    if (c === "[") depth++;
    if (c === "]") depth--;
    if (c === "/" && depth === 0) {
      parts.push(cur.trim());
      cur = "";
    } else {
      cur += c;
    }
  }
  parts.push(cur.trim());
  return parts.filter(Boolean);
}

function findAllele(gene: GeneEntry, token: string) {
  if (gene.alleles[token]) return token;
  const lower = token.toLowerCase();
  return Object.keys(gene.alleles).find((n) => n.toLowerCase() === lower) ?? null;
}

export function resolveAllele(gene: GeneEntry, token: string): ResolvedAllele {
  const name = findAllele(gene, token);
  if (name) {
    const a = gene.alleles[name];
    return { input: token, name, function: a.function, activityValue: a.activityValue };
  }

  // Combination on one haplotype: "[a + b]" or, if not a CPIC name itself, "a+b".
  const inner = token.startsWith("[") && token.endsWith("]") ? token.slice(1, -1) : token;
  const pieces = inner.split(/\s*\+\s*/).filter(Boolean);
  if (pieces.length > 1) {
    const components = pieces.map((p) => resolveAllele(gene, p));
    if (components.some((c) => !c.name && !c.components)) {
      return { input: token, name: null, function: null, activityValue: null, components };
    }
    const decider = gene.scoreBased
      ? components.reduce((lo, c) =>
          activityNumber(c.activityValue) < activityNumber(lo.activityValue) ? c : lo,
        )
      : components.reduce((lo, c) => (severity(c.function) < severity(lo.function) ? c : lo));
    return {
      input: token,
      name: components.map((c) => c.name).join(" + "),
      function: decider.function,
      activityValue: decider.activityValue,
      components,
    };
  }

  return { input: token, name: null, function: null, activityValue: null };
}

const sameKey = (a: Record<string, number>, b: Record<string, number>) => {
  const ka = Object.keys(a);
  return ka.length === Object.keys(b).length && ka.every((k) => a[k] === b[k]);
};

export function interpretGenotype(geneSymbol: string, diplotype: string): GenotypeResult {
  const base: GenotypeResult = {
    gene: geneSymbol,
    diplotype,
    status: "ok",
    alleles: [],
    phenotype: null,
    activityScore: null,
    lookupValue: null,
    ehrPriority: null,
    consultation: null,
    messages: [],
  };

  const gene = kb.genes[geneSymbol];
  if (!gene) {
    return { ...base, status: "unknown-gene", messages: [`${geneSymbol} is not a CPIC Level A gene in this knowledge base.`] };
  }

  // A lab-reported result typed directly, e.g. "*57:01 positive" (HLA) or "Poor Metabolizer".
  const reported = Object.values(gene.results).find((r) => r.phenotype.toLowerCase() === diplotype.trim().toLowerCase());
  if (reported) {
    return {
      ...base,
      status: reported.phenotype === "Indeterminate" ? "indeterminate" : "ok",
      phenotype: reported.phenotype,
      activityScore: reported.activityScore !== "n/a" ? reported.activityScore : null,
      lookupValue: gene.scoreBased ? reported.activityScore : reported.phenotype,
      ehrPriority: reported.ehrPriority,
      consultation: reported.consultation,
      messages: ["Entered as a reported phenotype; no diplotype translation was needed."],
    };
  }

  const tokens = splitDiplotype(diplotype);
  if (tokens.length < 1 || tokens.length > 2) {
    return { ...base, status: "invalid", messages: ["Enter a diplotype as allele/allele (or a single allele for G6PD in males)."] };
  }

  const alleles = tokens.map((t) => resolveAllele(gene, t));
  const unknown = alleles.filter((a) => !a.name);
  if (unknown.length) {
    return {
      ...base,
      alleles,
      status: "unknown-allele",
      messages: unknown.map((a) => `"${a.input}" is not a recognised ${geneSymbol} allele in the CPIC allele table.`),
    };
  }

  const key: Record<string, number> = {};
  for (const a of alleles) {
    const k = gene.scoreBased ? (a.activityValue ?? "n/a") : (a.function ?? "Unknown function");
    key[k] = (key[k] ?? 0) + 1;
  }

  const match = gene.lookups.find((l) => sameKey(l.key, key));
  const resultId = match?.resultId ?? Object.entries(gene.results).find(([, r]) => r.phenotype === "Indeterminate")?.[0];
  const result = resultId != null ? gene.results[resultId] : undefined;

  if (!result) {
    return { ...base, alleles, status: "indeterminate", messages: ["CPIC defines no phenotype for this allele combination."] };
  }

  const score = result.activityScore && result.activityScore !== "n/a" ? result.activityScore : null;
  return {
    ...base,
    alleles,
    status: match && result.phenotype !== "Indeterminate" ? "ok" : "indeterminate",
    phenotype: result.phenotype,
    activityScore: score,
    lookupValue: gene.scoreBased ? (result.activityScore ?? "n/a") : result.phenotype,
    ehrPriority: result.ehrPriority,
    consultation: result.consultation,
    messages: match ? [] : ["This allele combination has no CPIC phenotype assignment; reported as Indeterminate."],
  };
}
