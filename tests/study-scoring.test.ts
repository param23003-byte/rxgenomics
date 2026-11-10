import { describe, expect, it } from "vitest";
import { SUS_ITEMS, scoreSus, susAdjective } from "@/lib/study/sus";
import { TAM_ITEMS, scoreTam } from "@/lib/study/tam";
import { assignScenarios } from "@/lib/study/assign";
import { SCENARIOS } from "@/study/scenarios";

describe("SUS scoring", () => {
  it("has the ten standard items", () => {
    expect(SUS_ITEMS).toHaveLength(10);
  });

  it("scores all-5s as 50, not 100, because even items are reverse-scored", () => {
    // Someone agreeing with every statement agrees the system is both easy and
    // cumbersome, so the correct SUS score is the midpoint.
    expect(scoreSus(Array(10).fill(5))).toBe(50);
    expect(scoreSus(Array(10).fill(1))).toBe(50);
    expect(scoreSus(Array(10).fill(3))).toBe(50);
  });

  it("scores the best possible pattern as 100 and the worst as 0", () => {
    const best = Array.from({ length: 10 }, (_, i) => (i % 2 === 0 ? 5 : 1));
    const worst = Array.from({ length: 10 }, (_, i) => (i % 2 === 0 ? 1 : 5));
    expect(scoreSus(best)).toBe(100);
    expect(scoreSus(worst)).toBe(0);
  });

  it("matches a worked example", () => {
    // odd: 4,4,4,4,4 -> 3 each = 15 ; even: 2,2,2,2,2 -> 3 each = 15 ; 30 * 2.5
    expect(scoreSus([4, 2, 4, 2, 4, 2, 4, 2, 4, 2])).toBe(75);
  });

  it("rejects an incomplete or out-of-range instrument", () => {
    expect(() => scoreSus([5, 1, 5])).toThrow();
    expect(() => scoreSus([5, 1, 5, 1, 5, 1, 5, 1, 5, 6])).toThrow();
    expect(() => scoreSus([5, 1, 5, 1, 5, 1, 5, 1, 5, 2.5])).toThrow();
  });

  it("applies the protocol's interpretation bands", () => {
    expect(susAdjective(85)).toBe("Excellent");
    expect(susAdjective(80)).toBe("Good");
    expect(susAdjective(70)).toBe("Above average");
    expect(susAdjective(50)).toBe("Below average");
  });
});

describe("TAM scoring", () => {
  const all = (value: number) => Object.fromEntries(TAM_ITEMS.map((i) => [i.id, value]));

  it("has 6 + 6 + 3 items across three constructs", () => {
    expect(TAM_ITEMS).toHaveLength(15);
    expect(TAM_ITEMS.filter((i) => i.construct === "perceived_usefulness")).toHaveLength(6);
    expect(TAM_ITEMS.filter((i) => i.construct === "perceived_ease_of_use")).toHaveLength(6);
    expect(TAM_ITEMS.filter((i) => i.construct === "intention_to_use")).toHaveLength(3);
  });

  it("returns a mean per construct, not a total", () => {
    expect(scoreTam(all(4))).toEqual({
      perceived_usefulness: 4,
      perceived_ease_of_use: 4,
      intention_to_use: 4,
    });
  });

  it("scores constructs independently", () => {
    const responses = { ...all(5), PEOU1: 1, PEOU2: 1, PEOU3: 1, PEOU4: 1, PEOU5: 1, PEOU6: 1 };
    const scores = scoreTam(responses);
    expect(scores.perceived_ease_of_use).toBe(1);
    expect(scores.perceived_usefulness).toBe(5);
  });

  it("rejects a missing item", () => {
    const partial = all(4);
    delete partial.ITU3;
    expect(() => scoreTam(partial)).toThrow(/ITU3/);
  });
});

describe("scenario assignment", () => {
  it("is reproducible for the same participant", () => {
    expect(assignScenarios("P-001", 6).map((s) => s.id)).toEqual(assignScenarios("P-001", 6).map((s) => s.id));
  });

  it("counterbalances: different participants do not all start on the same case", () => {
    const firsts = new Set(
      Array.from({ length: 12 }, (_, i) => assignScenarios(`P-${String(i + 1).padStart(3, "0")}`, 6)[0].id),
    );
    expect(firsts.size).toBeGreaterThan(1);
  });

  it("gives every participant at least one normal case", () => {
    for (let i = 1; i <= 60; i++) {
      const picked = assignScenarios(`P-${String(i).padStart(3, "0")}`, 5);
      expect(picked.some((s) => s.kind === "normal"), `P-${i} had no normal case`).toBe(true);
    }
  });

  it("never repeats a scenario within one participant's set", () => {
    for (let i = 1; i <= 30; i++) {
      const picked = assignScenarios(`P-${String(i).padStart(3, "0")}`, 8);
      expect(new Set(picked.map((s) => s.id)).size).toBe(picked.length);
    }
  });

  it("respects the protocol's 5-8 range and the bank size", () => {
    expect(assignScenarios("P-001", 5)).toHaveLength(5);
    expect(assignScenarios("P-001", 8)).toHaveLength(8);
    expect(assignScenarios("P-001", 99)).toHaveLength(SCENARIOS.length);
  });
});
