import { describe, expect, test } from "bun:test";
import { ageFromBirthDate, formatDateFr } from "./format";

describe("ageFromBirthDate", () => {
  test("anniversaire pas encore passé", () => {
    expect(ageFromBirthDate("1990-12-31", new Date(2026, 5, 1))).toBe(35);
  });
  test("anniversaire déjà passé", () => {
    expect(ageFromBirthDate("1990-01-01", new Date(2026, 5, 1))).toBe(36);
  });
});

describe("formatDateFr", () => {
  test("format jj/mm/aaaa", () => {
    expect(formatDateFr(new Date(2026, 9, 13))).toBe("13/10/2026");
  });
});
