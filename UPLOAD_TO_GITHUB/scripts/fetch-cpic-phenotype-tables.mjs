#!/usr/bin/env node
/**
 * Freeze the CPIC tables that turn a diplotype into a phenotype.
 *
 * The recommendation snapshot (data/cpic/cpic_recommendations.tsv, retrieved
 * 2026-10-05) maps phenotype / activity score -> recommendation. To go from a
 * genotype to that phenotype the rule engine also needs, for every Level A gene:
 *   allele              each allele's clinical function and activity value
 *   gene_result         the phenotype names (and activity scores) per gene
 *   gene_result_lookup  which pair of allele functions gives which phenotype
 *
 * Like the recommendation snapshot, these are downloaded once, written to disk
 * with the retrieval date and never looked up live.
 *
 * Usage: node scripts/fetch-cpic-phenotype-tables.mjs [outdir]
 */
import { writeFile, readFile, mkdir } from "node:fs/promises";
import path from "node:path";

const API = "https://api.cpicpgx.org/v1";
const UA = "RxGenomics-validation/1.0 (academic CDS development)";
const outdir = process.argv[2] ?? "data/cpic";

async function get(table, params = {}) {
  const out = [];
  const page = 1000;
  for (let offset = 0; ; offset += page) {
    const q = new URLSearchParams({ ...params, limit: String(page), offset: String(offset) });
    const res = await fetch(`${API}/${table}?${q}`, {
      headers: { "User-Agent": UA, Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`${table}: HTTP ${res.status}`);
    const batch = await res.json();
    out.push(...batch);
    if (batch.length < page) return out;
    await new Promise((r) => setTimeout(r, 200));
  }
}

async function main() {
  await mkdir(outdir, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 16).replace("T", " ") + " UTC";

  // Genes come from the frozen Level A pair list, so both snapshots cover the same genes.
  const pairsTsv = await readFile(path.join(outdir, "cpic_level_a_pairs.tsv"), "utf8");
  const genes = [...new Set(pairsTsv.trim().split(/\r?\n/).slice(1).map((l) => l.split("\t")[0]))].sort();
  const inList = `in.(${genes.map((g) => `"${g}"`).join(",")})`;

  const alleles = await get("allele", {
    genesymbol: inList,
    select: "genesymbol,name,clinicalfunctionalstatus,activityvalue",
  });
  const results = await get("gene_result", {
    genesymbol: inList,
    select: "id,genesymbol,result,activityscore,ehrpriority,consultationtext",
  });
  const resultIds = new Set(results.map((r) => r.id));
  const lookups = (
    await get("gene_result_lookup", {
      select: "phenotypeid,lookupkey,function1,function2,activityvalue1,activityvalue2,totalactivityscore,description",
    })
  ).filter((l) => resultIds.has(l.phenotypeid));

  const sortBy = (k) => (a, b) => String(a[k]).localeCompare(String(b[k])) || String(a.name ?? a.result ?? "").localeCompare(String(b.name ?? b.result ?? ""));
  const write = (file, rows) => writeFile(path.join(outdir, file), JSON.stringify(rows, null, 1) + "\n", "utf8");
  await write("cpic_alleles.json", alleles.sort(sortBy("genesymbol")));
  await write("cpic_gene_results.json", results.sort(sortBy("genesymbol")));
  await write("cpic_gene_result_lookups.json", lookups.sort((a, b) => a.phenotypeid - b.phenotypeid));

  const count = (rows) =>
    genes.map((g) => `  ${g.padEnd(10)} ${String(rows.filter((r) => r.genesymbol === g).length).padStart(4)}`).join("\n");
  const prov = [
    `CPIC API retrieval: ${stamp}`,
    `Endpoint: ${API}`,
    `Genes: the ${genes.length} genes in cpic_level_a_pairs.tsv`,
    "",
    `allele              -> ${alleles.length} rows   (cpic_alleles.json)`,
    `gene_result         -> ${results.length} rows   (cpic_gene_results.json)`,
    `gene_result_lookup  -> ${lookups.length} rows   (cpic_gene_result_lookups.json)`,
    "",
    "Alleles per gene:",
    count(alleles),
    "",
  ].join("\n");
  await writeFile(path.join(outdir, "cpic_phenotype_provenance.txt"), prov, "utf8");
  console.log(prov);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
