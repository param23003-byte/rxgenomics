# Phase III Case Scenarios — Facilitator Copy

**Status: DRAFT for review by the Guide and the Ethics Committee.**
Not to be used in a session until approved.

Platform version under test: see `lib/version.ts` (record on Appendix C).

## How these were built

Each scenario pairs a fictional clinical vignette with a genotype written in the
format a PharmVar-based laboratory report would use, and a drug that has a CPIC
Level A recommendation for that gene. **No real patient data, laboratory reports
or identifiable information is used at any stage**, as required by the protocol.

The expected answer for every scenario was fixed **before** any session, is stored
in `study/scenarios.ts`, and is enforced by `tests/case-scenarios.test.ts`. If a
change to the system would alter any expected answer, the build fails rather than
the study silently losing its baseline. The authoritative recommendation wording
is the CPIC row id given below, held in the frozen snapshot in `data/cpic/` — the
summaries here are abbreviations for quick scoring, not the full text.

## Composition of the bank

| | Count |
|---|---|
| Total scenarios | 16 |
| Actionable (should raise an alert) | 12 |
| Normal (should **not** raise an alert) | 4 |
| Genes covered | CYP2C19, CYP2D6, CYP2C9, CYP3A5, DPYD, TPMT, SLCO1B1, G6PD, HLA-B |

Normal cases are included deliberately. Testing only abnormal genotypes would show
whether the system raises alerts, but not whether it raises false ones.

Several scenarios reflect prescribing patterns and variant frequencies relevant to
Indian practice: clopidogrel after PCI, HLA-B\*15:02 before carbamazepine, and
G6PD testing before primaquine for *P. vivax* malaria.

**Assign 5–8 scenarios per participant** and counterbalance the order between
participants, so that fatigue and learning effects do not fall on the same cases.
Give each participant at least one *normal* case.

---

## Scenarios

### CS-01 — Clopidogrel after PCI (actionable)
A 58-year-old man has undergone percutaneous coronary intervention following an acute
coronary syndrome. The cardiology team plans to start clopidogrel 75 mg daily as part of
dual antiplatelet therapy. A pharmacogenomic panel was performed before discharge.

**Lab report:** `CYP2C19  *2/*2` · **Context:** CVI ACS PCI
**Expected:** Poor Metabolizer · **Critical alert** · CPIC row `8480389`
*Avoid clopidogrel if possible; use prasugrel or ticagrelor at standard dose.*

### CS-02 — Clopidogrel, intermediate metabolizer (actionable)
A 45-year-old woman is admitted with an acute coronary syndrome and undergoes percutaneous
coronary intervention. Clopidogrel is planned. Her pharmacogenomic report is available.

**Lab report:** `CYP2C19  *1/*2` · **Context:** CVI ACS PCI
**Expected:** Intermediate Metabolizer · **Critical alert** · CPIC row `8480387`
*Avoid standard-dose clopidogrel if possible; use prasugrel or ticagrelor.*

### CS-03 — Clopidogrel, normal metabolizer (normal)
A 61-year-old man is started on clopidogrel after percutaneous coronary intervention for an
acute coronary syndrome. His pharmacogenomic report has just arrived.

**Lab report:** `CYP2C19  *1/*1` · **Context:** CVI ACS PCI
**Expected:** Normal Metabolizer · **No alert** · CPIC row `8480385`
*Use clopidogrel at standard dose (75 mg/day).*

### CS-04 — Carbamazepine and HLA-B\*15:02 (actionable)
A 24-year-old woman has newly diagnosed focal epilepsy. The neurologist intends to start
carbamazepine. She has never received carbamazepine before. Pre-treatment HLA screening was
ordered.

**Lab report:** `HLA-B  *15:02 positive` · **Context:** CBZ naive
**Expected:** \*15:02 positive · **Critical alert** · CPIC row `8480092`
*If carbamazepine-naïve, do not use carbamazepine.*

### CS-05 — Codeine, poor metabolizer (actionable)
A 52-year-old man requires analgesia after orthopaedic surgery. Codeine 30 mg six-hourly is
planned. A pharmacogenomic panel performed during a previous admission is on file.

**Lab report:** `CYP2D6  *4/*4`
**Expected:** Poor Metabolizer · **Critical alert** · CPIC row `8480417`
*Avoid codeine (diminished analgesia); consider a non-tramadol opioid.*

### CS-06 — Tramadol, gene duplication (actionable)
A 30-year-old woman with chronic low back pain is to be started on tramadol. Her
pharmacogenomic report notes a gene duplication.

**Lab report:** `CYP2D6  *1/*1x2`
**Expected:** Ultrarapid Metabolizer · **Critical alert** · CPIC row `8481540`
*Avoid tramadol (toxicity risk); consider a non-codeine opioid.*

### CS-07 — Codeine, normal metabolizer (normal)
A 40-year-old man is prescribed codeine for short-term pain relief following a minor
procedure. His pharmacogenomic report is available.

**Lab report:** `CYP2D6  *1/*1`
**Expected:** Normal Metabolizer · **No alert** · CPIC row `8480415`
*Use label-recommended age- or weight-specific dosing.*

### CS-08 — Capecitabine and DPYD (actionable)
A 63-year-old woman with colorectal cancer is due to begin capecitabine. The oncology
pharmacist reviews her pre-treatment pharmacogenomic screen.

**Lab report:** `DPYD  c.1905+1G>A (*2A)/Reference`
**Expected:** Intermediate Metabolizer · **Critical alert** · CPIC row `8480749`
*Reduce starting dose by 50%, then titrate on toxicity or therapeutic drug monitoring.*

### CS-09 — Azathioprine and TPMT (actionable)
A 29-year-old man with Crohn's disease is to start azathioprine 2 mg/kg/day. Thiopurine
pharmacogenomic testing was performed before initiation.

**Lab report:** `TPMT  *1/*3A`
**Expected:** Intermediate Metabolizer · **Critical alert** · CPIC row `8480084`
*Reduce starting dose to 30–80% of standard; adjust on myelosuppression.*
Note: the system will also state that NUDT15 was not tested.

### CS-10 — Simvastatin and SLCO1B1 (actionable)
A 57-year-old man with hyperlipidaemia is to be started on simvastatin 40 mg at night. His
pharmacogenomic report is available.

**Lab report:** `SLCO1B1  *5/*5`
**Expected:** Poor Function · **Critical alert** · CPIC row `8481448`
*Prescribe an alternative statin according to the desired potency.*

### CS-11 — Simvastatin, normal function (normal)
A 50-year-old woman is prescribed simvastatin for primary prevention. Her pharmacogenomic
report has been received.

**Lab report:** `SLCO1B1  *1/*1`
**Expected:** Normal Function · **No alert** · CPIC row `8481445`
*Prescribe the desired starting dose.*

### CS-12 — Primaquine and G6PD deficiency (actionable)
A 34-year-old man is diagnosed with *Plasmodium vivax* malaria. Primaquine is planned for
radical cure of liver-stage infection. G6PD testing was performed before prescribing, as
recommended.

**Lab report:** `G6PD  Mediterranean Haplotype (hemizygous)`
**Expected:** Deficient · **Critical alert** · CPIC row `8481351`
*Avoid primaquine except under the specified malaria-treatment exceptions.*
Note: G6PD is X-linked, so a male hemizygote is entered as a single allele.

### CS-13 — Abacavir and HLA-B\*57:01 (actionable)
A 38-year-old man with newly diagnosed HIV infection is being considered for an
abacavir-containing antiretroviral regimen. Pre-treatment screening has been completed.

**Lab report:** `HLA-B  *57:01 positive`
**Expected:** \*57:01 positive · **Critical alert** · CPIC row `8479702`
*Abacavir is not recommended.*

### CS-14 — Tacrolimus and CYP3A5 (actionable)
A 46-year-old man has received a kidney transplant and is to be started on tacrolimus. The
transplant team has his pharmacogenomic report.

**Lab report:** `CYP3A5  *1/*3`
**Expected:** Intermediate Metabolizer · **Critical alert** · CPIC row `8481452`
*Increase starting dose 1.5–2×, not exceeding 0.3 mg/kg/day; use drug monitoring.*

### CS-15 — Escitalopram, rapid metabolizer (actionable, lower severity)
A 27-year-old woman with major depressive disorder is to begin escitalopram. Her
pharmacogenomic report is available.

**Lab report:** `CYP2C19  *1/*17`
**Expected:** Rapid Metabolizer · **Warning** · CPIC row `8480170`
*Start at the recommended dose; if response is inadequate, consider titration or an
alternative antidepressant.*
This is the only scenario expected to produce a **Warning** rather than a Critical alert,
and it is worth including to test whether users distinguish the tiers.

### CS-16 — Celecoxib, normal metabolizer (normal)
A 55-year-old woman with osteoarthritis is prescribed celecoxib. Her pharmacogenomic report
has been received.

**Lab report:** `CYP2C9  *1/*1`
**Expected:** Normal Metabolizer · **No alert** · CPIC row `8480112`
*Initiate at the recommended starting dose.*

---

## Scoring a task as successful

Count the task as successful when the participant, without assistance:

1. enters the gene and diplotype exactly as given on the lab report,
2. selects the correct drug (and clinical context where the system asks for one), and
3. correctly states the resulting recommendation — specifically whether the drug
   should be used as planned, dose-adjusted, or avoided.

Record time from the moment the vignette is shown to the moment the participant
states their answer. Record an error for each incorrect entry the participant makes
before reaching the answer, including rejected genotype entries.
