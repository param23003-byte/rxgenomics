#!/usr/bin/env node
/**
 * Build the RxGenomics knowledge base (lib/kb/kb.json) from the frozen CPIC
 * snapshot in data/cpic. The app and the verification tests both read this one
 * file, so what is tested is exactly what is deployed.
 *
 * Re-run after any change to data/cpic:  npm run kb:build
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { parseTsv } from "./tsv.mjs";

const SRC = "data/cpic";
const OUT = "lib/kb/kb.json";

const read = (f) => readFile(`${SRC}/${f}`, "utf8");
const json = async (f) => JSON.parse(await read(f));

const pairs = parseTsv(await read("cpic_level_a_pairs.tsv"));
const recRows = parseTsv(await read("cpic_recommendations.tsv"));
const alleles = await json("cpic_alleles.json");
const results = await json("cpic_gene_results.json");
const lookups = await json("cpic_gene_result_lookups.json");

// ---- drugs: Level A pairs only -------------------------------------------
const drugs = {};
for (const p of pairs) {
  const d = (drugs[p.drugname] ??= {
    name: p.drugname,
    drugId: p.drugid,
    genes: [],
    guidelines: [],
  });
  d.genes.push(p.genesymbol);
  if (!d.guidelines.some((g) => g.url === p.guidelineurl)) {
    d.guidelines.push({ name: p.guidelinename, url: p.guidelineurl });
  }
}

// ---- recommendations: one TSV row per gene, regrouped by recommendation id --
const recs = new Map();
const scoreGenes = new Set();
for (const r of recRows) {
  if (!drugs[r.drugname]) continue;
  const rec = recs.get(r.recommendation_id) ?? {
    id: r.recommendation_id,
    drug: r.drugname,
    population: r.population,
    lookup: {},
    recommendation: r.drugrecommendation,
    classification: r.classification,
    implications: {},
    comments: r.comments === "n/a" ? "" : r.comments,
    alternateDrugAvailable: r.alternatedrugavailable === "True",
    guidelineId: r.guidelineid,
  };
  rec.lookup[r.gene] = r.lookup_value;
  if (r.implications) rec.implications[r.gene] = r.implications;
  if (r.lookup_kind === "activity_score") scoreGenes.add(r.gene);
  recs.set(r.recommendation_id, rec);
}

// ---- genes: alleles, phenotypes and the function-pair -> phenotype table ----
const genes = {};
const geneOf = (sym) =>
  (genes[sym] ??= { symbol: sym, scoreBased: false, alleles: {}, results: {}, lookups: [] });

for (const a of alleles) {
  geneOf(a.genesymbol).alleles[a.name] = {
    function: a.clinicalfunctionalstatus ?? null,
    activityValue: a.activityvalue ?? null,
  };
}
const resultGene = {};
for (const r of results) {
  resultGene[r.id] = r.genesymbol;
  geneOf(r.genesymbol).results[r.id] = {
    phenotype: r.result,
    activityScore: r.activityscore,
    ehrPriority: r.ehrpriority ?? "",
    consultation: r.consultationtext ?? "",
  };
}
for (const l of lookups) {
  geneOf(resultGene[l.phenotypeid]).lookups.push({
    key: l.lookupkey,
    resultId: l.phenotypeid,
    description: l.description,
  });
}
for (const g of scoreGenes) geneOf(g).scoreBased = true;

const firstLine = async (f) => (await read(f)).split(/\r?\n/)[0];
const kb = {
  meta: {
    recommendationsRetrieved: await firstLine("cpic_provenance.txt"),
    phenotypeTablesRetrieved: await firstLine("cpic_phenotype_provenance.txt"),
    levelAPairs: pairs.length,
    builtAt: new Date().toISOString(),
  },
  drugs,
  genes,
  recommendations: [...recs.values()],
};

await mkdir("lib/kb", { recursive: true });
await writeFile(OUT, JSON.stringify(kb) + "\n", "utf8");
console.log(
  `wrote ${OUT}: ${Object.keys(drugs).length} drugs, ${Object.keys(genes).length} genes, ` +
    `${kb.recommendations.length} recommendations; activity-score genes: ${[...scoreGenes].join(", ")}`,
);
