import { execSync } from "node:child_process";
import { dirname } from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

export const HERE = dirname(fileURLToPath(import.meta.url));

/** Playwright du projet s'il est installé, sinon l'installation globale (npm i -g playwright). */
export async function loadChromium() {
  try {
    return (await import("playwright")).chromium;
  } catch {
    const root = execSync("npm root -g").toString().trim();
    return createRequire(`${root}/`)("playwright").chromium;
  }
}

/** ffmpeg : variable FFMPEG, sinon celui du PATH. */
export const FFMPEG = process.env.FFMPEG || "ffmpeg";
