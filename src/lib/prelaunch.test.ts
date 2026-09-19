import { describe, expect, test } from "bun:test";
import { isPathAllowedDuringPrelaunch } from "./prelaunch";

describe("prelaunch admin routes", () => {
  test.each(["/community", "/events", "/premium", "/profiles"])(
    "lets %s reach its strict requireAdmin guard",
    (path) => expect(isPathAllowedDuringPrelaunch(path)).toBe(true),
  );

  test("keeps unrelated routes closed", () => {
    expect(isPathAllowedDuringPrelaunch("/private-unknown-page")).toBe(false);
  });
});
