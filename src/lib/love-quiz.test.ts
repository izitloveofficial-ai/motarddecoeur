import { describe, expect, test } from "bun:test";
import { QUIZ_PROFILES, getQuizResult } from "./love-quiz";

describe("anonymous love quiz", () => {
  test("never shows a result for missing or invalid answers", () => {
    for (const answers of [
      [],
      [0],
      [0, 0, 0, 0],
      [0, 0, 0, 0, 3],
      [0, 0, 0, 0, -1],
      [0, 0, 0, 0, 0.5],
      [0, 0, 0, 0, NaN],
      [0, 0, 0, 0, 0, 0],
    ])
      expect(getQuizResult(answers)).toBeNull();
  });
  test("all 243 complete answer combinations produce a known profile", () => {
    const seen = new Set();
    for (let n = 0; n < 243; n++) {
      const answers = Array.from({ length: 5 }, (_, i) => Math.floor(n / 3 ** i) % 3);
      const profile = getQuizResult(answers);
      expect(profile).not.toBeNull();
      expect(QUIZ_PROFILES[profile!]).toBeDefined();
      seen.add(profile);
    }
    expect(seen.size).toBe(3);
  });
  test("returns the chosen affinity when all five choices agree", () => {
    expect(getQuizResult([0, 2, 1, 0, 1])).toBe("aventure");
    expect(getQuizResult([1, 0, 2, 2, 0])).toBe("complicite");
    expect(getQuizResult([2, 1, 0, 1, 2])).toBe("epicurien");
  });
  test("a tie uses the latest answer among the tied profiles", () => {
    expect(getQuizResult([0, 0, 0, 0, 0])).toBe("complicite");
  });
});
