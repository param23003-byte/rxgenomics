import { SCENARIOS, type Scenario } from "@/study/scenarios";

/**
 * Assigns case scenarios to a participant.
 *
 * The protocol asks for 5-8 scenarios per participant, counterbalanced between
 * participants so that order effects (fatigue, learning) do not always fall on
 * the same cases. Each participant starts at a different point in the bank and
 * takes a contiguous run, wrapping around.
 *
 * The assignment is derived from the participant ID, so it is reproducible: the
 * same ID always receives the same scenarios in the same order, which matters
 * if a session has to be repeated or audited.
 */

export const DEFAULT_SCENARIOS_PER_PARTICIPANT = 6;

function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function assignScenarios(participantId: string, count = DEFAULT_SCENARIOS_PER_PARTICIPANT): Scenario[] {
  const size = Math.min(Math.max(count, 1), SCENARIOS.length);
  const offset = hash(participantId) % SCENARIOS.length;
  const picked = Array.from({ length: size }, (_, i) => SCENARIOS[(offset + i) % SCENARIOS.length]);

  // Every participant must see at least one normal case, otherwise that
  // participant's session cannot show whether the system raises false alerts.
  if (!picked.some((s) => s.kind === "normal")) {
    const normals = SCENARIOS.filter((s) => s.kind === "normal");
    picked[picked.length - 1] = normals[hash(participantId) % normals.length];
  }
  return picked;
}

export function scenariosByIds(ids: string[]): Scenario[] {
  return ids.map((id) => SCENARIOS.find((s) => s.id === id)).filter((s): s is Scenario => !!s);
}
