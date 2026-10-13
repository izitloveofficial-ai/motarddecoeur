import { describe, expect, test } from "bun:test";
import { buildDailySeries, percentChange } from "./admin-dashboard";

describe("buildDailySeries", () => {
  const now = new Date(2026, 9, 13, 12);
  test("renvoie une entrée par jour, du plus ancien au plus récent", () => {
    const series = buildDailySeries([], 3, now);
    expect(series.map((point) => point.label)).toEqual(["11/10", "12/10", "13/10"]);
    expect(series.every((point) => point.count === 0)).toBe(true);
  });
  test("compte les éléments par jour et ignore ceux hors période ou invalides", () => {
    const series = buildDailySeries(
      [
        new Date(2026, 9, 13, 8).toISOString(),
        new Date(2026, 9, 13, 9).toISOString(),
        new Date(2026, 9, 12, 9).toISOString(),
        new Date(2026, 8, 1).toISOString(),
        "n'importe quoi",
      ],
      3,
      now,
    );
    expect(series.map((point) => point.count)).toEqual([0, 1, 2]);
  });
});

describe("percentChange", () => {
  test("variation positive et négative", () => {
    expect(percentChange(15, 10)).toBe(50);
    expect(percentChange(5, 10)).toBe(-50);
  });
  test("période précédente vide", () => {
    expect(percentChange(5, 0)).toBeNull();
  });
});
