import { describe, expect, test } from "bun:test";
import { isPathAllowedDuringPrelaunch, isSupabaseAuthCallbackHash } from "./prelaunch";

describe("prelaunch admin routes", () => {
  test("allows the sitemap to be fetched", () => {
    expect(isPathAllowedDuringPrelaunch("/sitemap.xml")).toBe(true);
  });

  test.each(["/community", "/events", "/premium", "/profiles"])(
    "lets %s reach its route-specific access guard",
    (path) => expect(isPathAllowedDuringPrelaunch(path)).toBe(true),
  );

  test.each([
    "/discover",
    "/discover/likes",
    "/matches",
    "/matches/new",
    "/messages",
    "/profile/setup",
    "/profile/blocked",
    "/super-likes/sent",
    "/rides",
    "/admin/status",
  ])("lets the protected route %s reach its own access guard", (path) => {
    expect(isPathAllowedDuringPrelaunch(path)).toBe(true);
    expect(isPathAllowedDuringPrelaunch(`${path}/`)).toBe(true);
  });

  test("keeps unrelated routes closed", () => {
    expect(isPathAllowedDuringPrelaunch("/private-unknown-page")).toBe(false);
  });

  test.each(["/admin/login", "/admin/forgot-password", "/admin/reset-password"])(
    "keeps the removed legacy admin route %s closed",
    (path) => expect(isPathAllowedDuringPrelaunch(path)).toBe(false),
  );

  test("allows public appointment share links", () => {
    expect(isPathAllowedDuringPrelaunch("/rdv/4f27d9ee-4b54-4afd-a191-76ecfbc18c0a")).toBe(true);
    expect(isPathAllowedDuringPrelaunch("/rdv/4f27d9ee-4b54-4afd-a191-76ecfbc18c0a/")).toBe(true);
  });
});

describe("Supabase auth callback fragments", () => {
  test("recognizes an implicit magic-link session", () => {
    expect(
      isSupabaseAuthCallbackHash(
        "#access_token=access&expires_in=3600&refresh_token=refresh&token_type=bearer&type=magiclink",
      ),
    ).toBe(true);
  });

  test("does not treat ordinary fragments or incomplete tokens as auth callbacks", () => {
    expect(isSupabaseAuthCallbackHash("#section")).toBe(false);
    expect(isSupabaseAuthCallbackHash("#access_token=access")).toBe(false);
    expect(isSupabaseAuthCallbackHash("")).toBe(false);
  });
});
