import { kb } from "./kb";
import { checkDrug } from "./recommend";
import type { AlertTier, DrugCheck } from "./types";

/**
 * Reverse check: given everything known about a patient's pharmacogenes, which
 * drugs would raise a flag?
 *
 * The drug-by-drug check answers "is this drug safe for this patient". This
 * answers "what should I watch out for in this patient", which is the question
 * a pharmacist reviewing a medication list actually starts from.
 */

export type PanelEntry = {
  drug: string;
  tier: AlertTier;
  genes: string[];
  phenotypes: { gene: string; phenotype: string | null }[];
  recommendation: string | null;
  classification: string | null;
  /** True when CPIC splits this drug's advice by clinical situation, which a
   *  panel view cannot know; the drug-by-drug screen asks for it. */
  needsClinicalContext: boolean;
  check: DrugCheck;
};

const TIER_ORDER: Record<AlertTier, number> = { critical: 0, warning: 1, info: 2, normal: 3 };

export function checkPanel(inputs: { gene: string; diplotype: string }[]): PanelEntry[] {
  const supplied = inputs.filter((i) => i.diplotype.trim());
  const suppliedGenes = new Set(supplied.map((i) => i.gene));
  if (suppliedGenes.size === 0) return [];

  const entries: PanelEntry[] = [];
  for (const drug of Object.values(kb.drugs)) {
    if (!drug.genes.some((g) => suppliedGenes.has(g))) continue;

    const populations = [...new Set(kb.recommendations.filter((r) => r.drug === drug.name).map((r) => r.population))];
    const check = checkDrug(drug.name, supplied);
    const rec = check.primary[0];

    entries.push({
      drug: drug.name,
      tier: check.tier,
      genes: drug.genes,
      phenotypes: check.genotypes
        .filter((g) => drug.genes.includes(g.gene))
        .map((g) => ({ gene: g.gene, phenotype: g.phenotype })),
      recommendation: rec?.recommendation ?? null,
      classification: rec?.classification ?? null,
      needsClinicalContext: populations.length > 1,
      check,
    });
  }

  return entries.sort(
    (a, b) => TIER_ORDER[a.tier] - TIER_ORDER[b.tier] || a.drug.localeCompare(b.drug),
  );
}

export function panelSummary(entries: PanelEntry[]) {
  return {
    total: entries.length,
    critical: entries.filter((e) => e.tier === "critical").length,
    warning: entries.filter((e) => e.tier === "warning").length,
    normal: entries.filter((e) => e.tier === "normal").length,
    info: entries.filter((e) => e.tier === "info").length,
  };
}
