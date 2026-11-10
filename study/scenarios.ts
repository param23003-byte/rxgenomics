/**
 * Standardised case scenarios for Phase III usability testing.
 *
 * Constructed from CPIC published guideline examples, per the protocol's
 * inclusion criteria. No real patient data, laboratory reports or identifiable
 * information is used: every vignette is fictional and the genotype lines are
 * written in the format a PharmVar-based laboratory report would use.
 *
 * The `expected` block is the answer recorded IN ADVANCE. It is enforced by
 * tests/case-scenarios.test.ts, so a change to the engine or the knowledge base
 * that would alter any expected answer fails the build rather than silently
 * invalidating the study. `recommendationId` is the CPIC recommendation row id
 * in the frozen snapshot, so the full text is never transcribed by hand.
 *
 * Assign 5-8 scenarios per participant (protocol, Materials and Methods),
 * counterbalancing the order between participants.
 */
import type { AlertTier } from "@/lib/engine/types";

export type Scenario = {
  id: string;
  /** Clinical vignette read by the participant. */
  vignette: string;
  /** The genotype line as it would appear on a laboratory report. */
  labReport: string;
  gene: string;
  diplotype: string;
  drug: string;
  /** Required where CPIC splits its recommendation by clinical context. */
  population?: string;
  /** "actionable" = should raise an alert; "normal" = should NOT raise one. */
  kind: "actionable" | "normal";
  expected: {
    phenotype: string;
    tier: AlertTier;
    recommendationId: string;
  };
};

export const SCENARIOS: Scenario[] = [
  {
    id: "CS-01",
    vignette:
      "A 58-year-old man has undergone percutaneous coronary intervention following an acute coronary syndrome. The cardiology team plans to start clopidogrel 75 mg daily as part of dual antiplatelet therapy. A pharmacogenomic panel was performed before discharge.",
    labReport: "CYP2C19  *2/*2",
    gene: "CYP2C19",
    diplotype: "*2/*2",
    drug: "clopidogrel",
    population: "CVI ACS PCI",
    kind: "actionable",
    expected: { phenotype: "Poor Metabolizer", tier: "critical", recommendationId: "8480389" },
  },
  {
    id: "CS-02",
    vignette:
      "A 45-year-old woman is admitted with an acute coronary syndrome and undergoes percutaneous coronary intervention. Clopidogrel is planned. Her pharmacogenomic report is available.",
    labReport: "CYP2C19  *1/*2",
    gene: "CYP2C19",
    diplotype: "*1/*2",
    drug: "clopidogrel",
    population: "CVI ACS PCI",
    kind: "actionable",
    expected: { phenotype: "Intermediate Metabolizer", tier: "critical", recommendationId: "8480387" },
  },
  {
    id: "CS-03",
    vignette:
      "A 61-year-old man is started on clopidogrel after percutaneous coronary intervention for an acute coronary syndrome. His pharmacogenomic report has just arrived.",
    labReport: "CYP2C19  *1/*1",
    gene: "CYP2C19",
    diplotype: "*1/*1",
    drug: "clopidogrel",
    population: "CVI ACS PCI",
    kind: "normal",
    expected: { phenotype: "Normal Metabolizer", tier: "normal", recommendationId: "8480385" },
  },
  {
    id: "CS-04",
    vignette:
      "A 24-year-old woman has newly diagnosed focal epilepsy. The neurologist intends to start carbamazepine. She has never received carbamazepine before. Pre-treatment HLA screening was ordered.",
    labReport: "HLA-B  *15:02 positive",
    gene: "HLA-B",
    diplotype: "*15:02 positive",
    drug: "carbamazepine",
    population: "CBZ naive",
    kind: "actionable",
    expected: { phenotype: "*15:02 positive", tier: "critical", recommendationId: "8480092" },
  },
  {
    id: "CS-05",
    vignette:
      "A 52-year-old man requires analgesia after orthopaedic surgery. Codeine 30 mg six-hourly is planned. A pharmacogenomic panel performed during a previous admission is on file.",
    labReport: "CYP2D6  *4/*4",
    gene: "CYP2D6",
    diplotype: "*4/*4",
    drug: "codeine",
    kind: "actionable",
    expected: { phenotype: "Poor Metabolizer", tier: "critical", recommendationId: "8480417" },
  },
  {
    id: "CS-06",
    vignette:
      "A 30-year-old woman with chronic low back pain is to be started on tramadol. Her pharmacogenomic report notes a gene duplication.",
    labReport: "CYP2D6  *1/*1x2",
    gene: "CYP2D6",
    diplotype: "*1/*1x2",
    drug: "tramadol",
    kind: "actionable",
    expected: { phenotype: "Ultrarapid Metabolizer", tier: "critical", recommendationId: "8481540" },
  },
  {
    id: "CS-07",
    vignette:
      "A 40-year-old man is prescribed codeine for short-term pain relief following a minor procedure. His pharmacogenomic report is available.",
    labReport: "CYP2D6  *1/*1",
    gene: "CYP2D6",
    diplotype: "*1/*1",
    drug: "codeine",
    kind: "normal",
    expected: { phenotype: "Normal Metabolizer", tier: "normal", recommendationId: "8480415" },
  },
  {
    id: "CS-08",
    vignette:
      "A 63-year-old woman with colorectal cancer is due to begin capecitabine. The oncology pharmacist reviews her pre-treatment pharmacogenomic screen.",
    labReport: "DPYD  c.1905+1G>A (*2A)/Reference",
    gene: "DPYD",
    diplotype: "c.1905+1G>A (*2A)/Reference",
    drug: "capecitabine",
    kind: "actionable",
    expected: { phenotype: "Intermediate Metabolizer", tier: "critical", recommendationId: "8480749" },
  },
  {
    id: "CS-09",
    vignette:
      "A 29-year-old man with Crohn's disease is to start azathioprine 2 mg/kg/day. Thiopurine pharmacogenomic testing was performed before initiation.",
    labReport: "TPMT  *1/*3A",
    gene: "TPMT",
    diplotype: "*1/*3A",
    drug: "azathioprine",
    kind: "actionable",
    expected: { phenotype: "Intermediate Metabolizer", tier: "critical", recommendationId: "8480084" },
  },
  {
    id: "CS-10",
    vignette:
      "A 57-year-old man with hyperlipidaemia is to be started on simvastatin 40 mg at night. His pharmacogenomic report is available.",
    labReport: "SLCO1B1  *5/*5",
    gene: "SLCO1B1",
    diplotype: "*5/*5",
    drug: "simvastatin",
    kind: "actionable",
    expected: { phenotype: "Poor Function", tier: "critical", recommendationId: "8481448" },
  },
  {
    id: "CS-11",
    vignette:
      "A 50-year-old woman is prescribed simvastatin for primary prevention. Her pharmacogenomic report has been received.",
    labReport: "SLCO1B1  *1/*1",
    gene: "SLCO1B1",
    diplotype: "*1/*1",
    drug: "simvastatin",
    kind: "normal",
    expected: { phenotype: "Normal Function", tier: "normal", recommendationId: "8481445" },
  },
  {
    id: "CS-12",
    vignette:
      "A 34-year-old man is diagnosed with Plasmodium vivax malaria. Primaquine is planned for radical cure of liver-stage infection. G6PD testing was performed before prescribing, as recommended.",
    labReport: "G6PD  Mediterranean Haplotype (hemizygous)",
    gene: "G6PD",
    diplotype: "Mediterranean Haplotype",
    drug: "primaquine",
    kind: "actionable",
    expected: { phenotype: "Deficient", tier: "critical", recommendationId: "8481351" },
  },
  {
    id: "CS-13",
    vignette:
      "A 38-year-old man with newly diagnosed HIV infection is being considered for an abacavir-containing antiretroviral regimen. Pre-treatment screening has been completed.",
    labReport: "HLA-B  *57:01 positive",
    gene: "HLA-B",
    diplotype: "*57:01 positive",
    drug: "abacavir",
    kind: "actionable",
    expected: { phenotype: "*57:01 positive", tier: "critical", recommendationId: "8479702" },
  },
  {
    id: "CS-14",
    vignette:
      "A 46-year-old man has received a kidney transplant and is to be started on tacrolimus. The transplant team has his pharmacogenomic report.",
    labReport: "CYP3A5  *1/*3",
    gene: "CYP3A5",
    diplotype: "*1/*3",
    drug: "tacrolimus",
    kind: "actionable",
    expected: { phenotype: "Intermediate Metabolizer", tier: "critical", recommendationId: "8481452" },
  },
  {
    id: "CS-15",
    vignette:
      "A 27-year-old woman with major depressive disorder is to begin escitalopram. Her pharmacogenomic report is available.",
    labReport: "CYP2C19  *1/*17",
    gene: "CYP2C19",
    diplotype: "*1/*17",
    drug: "escitalopram",
    kind: "actionable",
    expected: { phenotype: "Rapid Metabolizer", tier: "warning", recommendationId: "8480170" },
  },
  {
    id: "CS-16",
    vignette:
      "A 55-year-old woman with osteoarthritis is prescribed celecoxib. Her pharmacogenomic report has been received.",
    labReport: "CYP2C9  *1/*1",
    gene: "CYP2C9",
    diplotype: "*1/*1",
    drug: "celecoxib",
    kind: "normal",
    expected: { phenotype: "Normal Metabolizer", tier: "normal", recommendationId: "8480112" },
  },
];
