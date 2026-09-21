import { describe, expect, test } from "bun:test";

import { createTikTokPixelScript, TIKTOK_PIXEL_ID } from "./tiktok-pixel";

describe("TikTok pixel", () => {
  test("loads the configured pixel before tracking the page", () => {
    const script = createTikTokPixelScript();

    expect(script).toContain(`ttq.load("${TIKTOK_PIXEL_ID}")`);
    expect(script.indexOf(`ttq.load("${TIKTOK_PIXEL_ID}")`)).toBeLessThan(
      script.indexOf("ttq.page()"),
    );
    expect(script).not.toContain("ttq.enableCookie()");
  });
});
