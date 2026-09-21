import { describe, expect, test } from "bun:test";

import { createTikTokPixelScript, TIKTOK_PIXEL_ID } from "./tiktok-pixel";

describe("TikTok pixel", () => {
  test("loads the configured pixel and enables first-party cookies before the page event", () => {
    const script = createTikTokPixelScript();

    expect(script).toContain(`ttq.load("${TIKTOK_PIXEL_ID}")`);
    expect(script.indexOf("ttq.enableCookie()")).toBeGreaterThan(
      script.indexOf(`ttq.load("${TIKTOK_PIXEL_ID}")`),
    );
    expect(script.indexOf("ttq.enableCookie()")).toBeLessThan(script.indexOf("ttq.page()"));
  });
});
