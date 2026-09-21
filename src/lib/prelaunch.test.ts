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

  test("allows public appointment share links", () => {
    expect(isPathAllowedDuringPrelaunch("/rdv/4f27d9ee-4b54-4afd-a191-76ecfbc18c0a")).toBe(true);
    expect(isPathAllowedDuringPrelaunch("/rdv/4f27d9ee-4b54-4afd-a191-76ecfbc18c0a/")).toBe(true);
  });
});
