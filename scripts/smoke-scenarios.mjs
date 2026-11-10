#!/usr/bin/env node
/**
 * End-to-end smoke test: puts every Phase III case scenario through the running
 * app's /api/check endpoint and compares the response with the frozen expected
 * answer in study/scenarios.ts.
 *
 * The vitest suite checks the engine directly; this checks the deployed path
 * (route handler, JSON serialisation, population matching) that a participant
 * actually exercises.
 *
 * Usage:  node scripts/smoke-scenarios.mjs [baseUrl]
 */
import { SCENARIOS } from "../study/scenarios.ts";

const base = process.argv[2] ?? "http://127.0.0.1:3000";
let failures = 0;

for (const s of SCENARIOS) {
  const res = await fetch(`${base}/api/check`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      drug: s.drug,
      inputs: [{ gene: s.gene, diplotype: s.diplotype }],
      population: s.population,
    }),
  });
  if (!res.ok) {
    console.log(`FAIL ${s.id}  HTTP ${res.status}`);
    failures++;
    continue;
  }
  const r = await res.json();
  const got = {
    phenotype: r.genotypes[0]?.phenotype,
    tier: r.tier,
    recommendationId: r.primary[0]?.id,
  };
  const ok =
    got.phenotype === s.expected.phenotype &&
    got.tier === s.expected.tier &&
    got.recommendationId === s.expected.recommendationId &&
    r.primary.length === 1;

  if (ok) {
    console.log(`  ok   ${s.id}  ${s.gene} ${s.diplotype} + ${s.drug}  ->  ${got.phenotype} / ${got.tier}`);
  } else {
    failures++;
    console.log(
      `FAIL  ${s.id}  ${s.gene} ${s.diplotype} + ${s.drug}\n` +
        `        expected ${JSON.stringify(s.expected)}\n` +
        `        got      ${JSON.stringify(got)} (n=${r.primary.length})`,
    );
  }
}

console.log(`\n${SCENARIOS.length - failures}/${SCENARIOS.length} scenarios passed end to end.`);
process.exit(failures ? 1 : 0);
