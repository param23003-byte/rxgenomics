/**
 * Technology Acceptance Model questionnaire (adapted from Davis 1989;
 * protocol reference 26). See study/TAM-QUESTIONNAIRE.md for the draft wording
 * and the points awaiting Guide / Ethics Committee approval.
 *
 * No item is reverse-scored, so a higher response always means greater
 * acceptance. Constructs are reported separately and never summed into a single
 * score, because the protocol lists them as three separate endpoints.
 */
export type TamConstruct = "perceived_usefulness" | "perceived_ease_of_use" | "intention_to_use";

export const TAM_CONSTRUCT_LABELS: Record<TamConstruct, string> = {
  perceived_usefulness: "Perceived usefulness",
  perceived_ease_of_use: "Perceived ease of use",
  intention_to_use: "Intention to use",
};

export type TamItem = { id: string; construct: TamConstruct; text: string };

export const TAM_ITEMS: TamItem[] = [
  { id: "PU1", construct: "perceived_usefulness", text: "Using RxGenomics would improve my performance in making genotype-guided prescribing decisions." },
  { id: "PU2", construct: "perceived_usefulness", text: "Using RxGenomics would make it easier to apply pharmacogenomic guidelines in practice." },
  { id: "PU3", construct: "perceived_usefulness", text: "Using RxGenomics would increase my productivity when reviewing a patient's medication." },
  { id: "PU4", construct: "perceived_usefulness", text: "Using RxGenomics would help me identify patients at risk of an adverse drug reaction." },
  { id: "PU5", construct: "perceived_usefulness", text: "Using RxGenomics would improve the safety of the prescribing decisions I contribute to." },
  { id: "PU6", construct: "perceived_usefulness", text: "Overall, I would find RxGenomics useful in my clinical or academic work." },
  { id: "PEOU1", construct: "perceived_ease_of_use", text: "Learning to operate RxGenomics was easy for me." },
  { id: "PEOU2", construct: "perceived_ease_of_use", text: "I found it easy to get RxGenomics to do what I wanted it to do." },
  { id: "PEOU3", construct: "perceived_ease_of_use", text: "My interaction with RxGenomics was clear and understandable." },
  { id: "PEOU4", construct: "perceived_ease_of_use", text: "I found entering a genotype result into RxGenomics straightforward." },
  { id: "PEOU5", construct: "perceived_ease_of_use", text: "I found the recommendation displayed by RxGenomics easy to interpret." },
  { id: "PEOU6", construct: "perceived_ease_of_use", text: "Overall, I would find RxGenomics easy to use." },
  { id: "ITU1", construct: "intention_to_use", text: "If RxGenomics were available to me, I would intend to use it in my practice or training." },
  { id: "ITU2", construct: "intention_to_use", text: "I would use RxGenomics regularly when a patient's pharmacogenomic result is available." },
  { id: "ITU3", construct: "intention_to_use", text: "I would recommend RxGenomics to a colleague." },
];

export const TAM_OPEN_QUESTIONS = [
  "What did you find most useful about RxGenomics?",
  "What did you find most difficult or confusing?",
  "What would need to change before you would be willing to use it in practice?",
  "Is there anything you expected the system to do that it did not do?",
];

/** Mean response (1-5) per construct. */
export function scoreTam(responses: Record<string, number>): Record<TamConstruct, number> {
  const sums = {} as Record<TamConstruct, { total: number; count: number }>;
  for (const item of TAM_ITEMS) {
    const value = responses[item.id];
    if (!Number.isInteger(value) || value < 1 || value > 5) {
      throw new Error(`TAM item ${item.id} must be an integer 1-5, got ${value}`);
    }
    sums[item.construct] ??= { total: 0, count: 0 };
    sums[item.construct].total += value;
    sums[item.construct].count += 1;
  }
  const means = {} as Record<TamConstruct, number>;
  for (const [construct, { total, count }] of Object.entries(sums) as [TamConstruct, { total: number; count: number }][]) {
    means[construct] = Number((total / count).toFixed(4));
  }
  return means;
}
