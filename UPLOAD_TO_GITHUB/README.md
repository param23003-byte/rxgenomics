# RxGenomics

Web-based pharmacogenomic clinical decision support built on CPIC Level A guidelines.
Research prototype for the usability study *"Development and Usability Evaluation of
RxGenomics"* (SAL Institute of Pharmacy). **Not for clinical use.**

## How an answer is produced

The rule engine (`lib/engine`) is deterministic and traceable, in four steps:

1. Each allele is looked up in CPIC's allele table for its clinical function
   (or activity value, for CYP2D6 / CYP2C9 / DPYD).
2. The pair of allele functions is matched against CPIC's phenotype table.
3. The phenotype (or activity score) is matched to CPIC's recommendation for the drug.
4. An alert tier is assigned:
   - **Critical** — high-risk CPIC phenotype with a *Strong* recommendation
   - **Warning** — high-risk CPIC phenotype with a *Moderate* or *Optional* recommendation
   - **Normal** — routine phenotype, recommendation found
   - **Info** — no recommendation applies, or the phenotype is indeterminate

Nothing is hand-written: every phenotype, recommendation, implication and evidence
strength comes from the frozen CPIC snapshot.

## Frozen knowledge base

CPIC updates its guidance over time. To keep the study reproducible, the data were
downloaded once and committed, with retrieval dates recorded:

| File | Contents |
|---|---|
| `data/cpic/cpic_level_a_pairs.tsv` | the 96 CPIC Level A gene-drug pairs (21 genes) |
| `data/cpic/cpic_recommendations.tsv` | every recommendation for those drugs |
| `data/cpic/cpic_alleles.json` | allele clinical function and activity values |
| `data/cpic/cpic_gene_results.json` | phenotype definitions per gene |
| `data/cpic/cpic_gene_result_lookups.json` | allele-function pair → phenotype |
| `data/cpic/*_provenance.txt` | what was retrieved, when, and row counts |

`lib/kb/kb.json` is built from those files by `pnpm kb:build`. The app and the tests
read that one file, so what is tested is exactly what is deployed.

Do not edit `lib/kb/kb.json` or anything in `data/` by hand. Re-running
`pnpm kb:fetch` would pull current CPIC data and break comparability with the
frozen expected answers — only do that deliberately, between study phases.

## Level 1 verification (protocol: internal software verification)

`tests/verification.test.ts` runs the 180 frozen study test cases
(`data/verification/selected_test_cases.tsv`) through the engine. Each case pairs a
real genotype from the 1000 Genomes public reference panel with a CPIC Level A drug,
and carries the expected phenotype and recommendation recorded **before** the engine
existed.

```bash
pnpm verify   # the 180 study test cases
pnpm test     # all tests, including engine edge cases
```

Current status: **199 passing.** Run this before every deployment and keep the output
as the Level 1 quality record.

## Known limits

- **Warfarin is not supported.** CPIC's warfarin guidance is a dosing algorithm, not a
  lookup table, so the snapshot has no recommendation rows for it.
- **Multi-gene drugs** (statins, thiopurines, volatile anaesthetics, carbamazepine)
  use several genes. Genes left blank are read as CPIC's "No Result", and the app says
  so on screen.
- **Indeterminate is a valid answer.** Where CPIC assigns no phenotype to an allele
  combination, the app reports Indeterminate rather than guessing.

## Development

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm typecheck
pnpm build
```

Version is pinned in `lib/version.ts` and recorded on every study session
(Appendix C, "Platform Version"). Freeze it before Phase II/III and change it only
between study phases.
