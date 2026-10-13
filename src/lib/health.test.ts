import { describe, expect, test } from "bun:test";
import { healthResponse } from "./health";

describe("healthResponse", () => {
  test("répond 200 avec un statut ok, sans cache", async () => {
    const response = healthResponse(new Date("2026-10-13T10:00:00Z"));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({ status: "ok", time: "2026-10-13T10:00:00.000Z" });
  });
});
