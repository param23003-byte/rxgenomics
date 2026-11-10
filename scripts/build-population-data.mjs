#!/usr/bin/env node
/**
 * Build lib/kb/population.json from this study's own genotype results.
 *
 * Source: data/population/diplotypes.tsv, the "strict" run over 514 donors from
 * the five South Asian populations of the 1000 Genomes reference panel. Strict
 * means a missing position was recorded as "not determined" rather than assumed
 * to be reference; the study chose that run as its primary result.
 *
 * Produces, per gene:
 *   - how often each allele was actually observed, so the UI can offer the
 *     common ones first instead of alphabetically
 *   - how often each phenotype was observed, for the "how common is this"
 *     context shown beside a result
 *   - a small set of complete donor profiles, used as worked examples
 *
 * Only unambiguous calls (n_candidates = 1) are counted. Where PharmCAT could
 * not resolve a single diplotype it emits several candidates, and counting
 * those would inflate whichever alleles happen to appear in the alternatives.
 * CYP2D6 and SLCO1B1 lose the most rows this way, which is itself worth
 * knowing: those are the genes a real laboratory finds hardest to call.
 *
 * Usage: node scripts/build-population-data.mjs
 */
import { readFile, writeFile } from "node:fs/promises";
import { parseTsv } from "./tsv.mjs";

const SRC = "data/population/diplotypes.tsv";
const KB = "lib/kb/kb.json";
const OUT = "lib/kb/population.json";

const POPULATION_LABELS = {
  GIH: "Gujarati Indian",
  PJL: "Punjabi",
  BEB: "Bengali",
  ITU: "Indian Telugu",
  STU: "Sri Lankan Tamil",
};

/** Split "a/b" on top-level slashes only, so "[x + y]" stays intact. */
function splitDiplotype(diplotype) {
  const parts = [];
  let depth = 0;
  let cur = "";
  for (const c of diplotype) {
    if (c === "[") depth++;
    if (c === "]") depth--;
    if (c === "/" && depth === 0) {
      parts.push(cur.trim());
      cur = "";
    } else cur += c;
  }
  parts.push(cur.trim());
  return parts.filter(Boolean);
}

const kb = JSON.parse(await readFile(KB, "utf8"));
const rows = parseTsv(await readFile(SRC, "utf8"));

// Level A genes only, and only calls PharmCAT resolved to a single diplotype.
const usable = rows.filter(
  (r) => kb.genes[r.gene] && r.n_candidates === "1" && r.diplotype.trim() && r.phenotype.trim(),
);

const genes = {};
for (const row of usable) {
  const gene = (genes[row.gene] ??= { called: 0, alleles: {}, phenotypes: {} });
  gene.called += 1;
  gene.phenotypes[row.phenotype] ??= { count: 0, class: row.call_class };
  gene.phenotypes[row.phenotype].count += 1;

  for (const allele of splitDiplotype(row.diplotype)) {
    // Only count names the rule engine recognises, so the UI never offers an
    // allele that the engine would then reject.
    if (kb.genes[row.gene].alleles[allele]) gene.alleles[allele] = (gene.alleles[allele] ?? 0) + 1;
  }
}

const pct = (n, total) => Number(((n / total) * 100).toFixed(1));

const out = { genes: {} };
for (const [symbol, gene] of Object.entries(genes)) {
  const alleleTotal = Object.values(gene.alleles).reduce((a, b) => a + b, 0);
  out.genes[symbol] = {
    donorsCalled: gene.called,
    alleles: Object.entries(gene.alleles)
      .map(([name, count]) => ({ name, count, pct: pct(count, alleleTotal) }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
    phenotypes: Object.entries(gene.phenotypes)
      .map(([phenotype, v]) => ({ phenotype, count: v.count, pct: pct(v.count, gene.called), class: v.class }))
      .sort((a, b) => b.count - a.count),
  };
}

// ---- worked-example profiles ------------------------------------------------
// One donor per population: the one with the most unambiguous Level A calls,
// preferring donors who carry at least two actionable results so the example
// actually shows the system doing something.
const bySample = {};
for (const row of usable) {
  const s = (bySample[row.sample] ??= { sample: row.sample, population: row.population, genotypes: {}, actionable: 0 });
  s.genotypes[row.gene] = row.diplotype;
  if (row.call_class === "actionable") s.actionable += 1;
}

out.profiles = Object.keys(POPULATION_LABELS)
  .map((population) => {
    const candidates = Object.values(bySample)
      .filter((s) => s.population === population && s.actionable >= 2)
      .sort(
        (a, b) =>
          Object.keys(b.genotypes).length - Object.keys(a.genotypes).length ||
          b.actionable - a.actionable ||
          a.sample.localeCompare(b.sample),
      );
    const chosen = candidates[0];
    return chosen
      ? {
          sample: chosen.sample,
          population,
          populationLabel: POPULATION_LABELS[population],
          actionableCount: chosen.actionable,
          genotypes: Object.fromEntries(Object.entries(chosen.genotypes).sort()),
        }
      : null;
  })
  .filter(Boolean);

out.meta = {
  source: "1000 Genomes South Asian reference panel, analysed in this study (strict run)",
  donors: new Set(rows.map((r) => r.sample)).size,
  populations: POPULATION_LABELS,
  unambiguousCalls: usable.length,
  totalCalls: rows.length,
  genesCovered: Object.keys(out.genes).length,
  builtAt: new Date().toISOString(),
  note: "Public consented reference donors, not patients. No identifiable data.",
};

await writeFile(OUT, JSON.stringify(out) + "\n", "utf8");
console.log(
  `wrote ${OUT}\n` +
    `  ${out.meta.donors} donors, ${usable.length}/${rows.length} calls usable, ${out.meta.genesCovered} Level A genes\n` +
    `  profiles: ${out.profiles.map((p) => `${p.sample} (${p.population}, ${Object.keys(p.genotypes).length} genes)`).join(", ")}`,
);
