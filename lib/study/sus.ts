/**
 * System Usability Scale (Brooke 1996; protocol reference 20).
 *
 * The ten standard items with "the system" replaced by "RxGenomics". Odd items
 * are positively worded and even items negatively worded, which is what makes
 * the alternating scoring rule work; do not reorder them.
 */
export const SUS_ITEMS: string[] = [
  "I think that I would like to use RxGenomics frequently.",
  "I found RxGenomics unnecessarily complex.",
  "I thought RxGenomics was easy to use.",
  "I think that I would need the support of a technical person to be able to use RxGenomics.",
  "I found the various functions in RxGenomics were well integrated.",
  "I thought there was too much inconsistency in RxGenomics.",
  "I would imagine that most people would learn to use RxGenomics very quickly.",
  "I found RxGenomics very cumbersome to use.",
  "I felt very confident using RxGenomics.",
  "I needed to learn a lot of things before I could get going with RxGenomics.",
];

export const LIKERT_LABELS = ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"];

/**
 * Standard SUS scoring: odd items contribute (response - 1), even items
 * contribute (5 - response); the sum is multiplied by 2.5 to give 0-100.
 *
 * Interpretation used in the protocol: >68 above average, >=80 good,
 * >=85 excellent. The score is NOT a percentage.
 */
export function scoreSus(responses: number[]): number {
  if (responses.length !== SUS_ITEMS.length) {
    throw new Error(`SUS needs ${SUS_ITEMS.length} responses, got ${responses.length}`);
  }
  let total = 0;
  responses.forEach((value, index) => {
    if (!Number.isInteger(value) || value < 1 || value > 5) {
      throw new Error(`SUS item ${index + 1} must be an integer 1-5, got ${value}`);
    }
    total += index % 2 === 0 ? value - 1 : 5 - value;
  });
  return total * 2.5;
}

export function susAdjective(score: number): string {
  if (score >= 85) return "Excellent";
  if (score >= 80) return "Good";
  if (score > 68) return "Above average";
  if (score === 68) return "Average";
  return "Below average";
}
