// Génère les vidéos TikTok verticales (1080×1920, 30 i/s, MP4 H.264) décrites dans videos.json.
// Usage : node marketing/tiktok/render.mjs            → toutes les vidéos
//         node marketing/tiktok/render.mjs 03 07      → seulement les vidéos dont l'id commence par 03 ou 07
//         node marketing/tiktok/render.mjs --preview  → une image PNG par scène (vérification rapide)
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { FFMPEG, HERE, loadChromium } from "./lib.mjs";

const FPS = 30;
const args = process.argv.slice(2);
const preview = args.includes("--preview");
const filters = args.filter((a) => !a.startsWith("--"));
const config = JSON.parse(readFileSync(`${HERE}/videos.json`, "utf8"));
const videos = config.videos.filter(
  (v) => !filters.length || filters.some((f) => v.id.startsWith(f)),
);
const outDir = `${HERE}/out`;
mkdirSync(outDir, { recursive: true });

if (!existsSync(`${HERE}/assets/logo-transparent.png`)) {
  console.error("Logo manquant : lancer d'abord node marketing/tiktok/logo.mjs");
  process.exit(1);
}

const chromium = await loadChromium();
const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1080, height: 1920 },
  deviceScaleFactor: 1,
});

for (const video of videos) {
  await page.goto(pathToFileURL(`${HERE}/template.html`).href);
  const total = await page.evaluate(
    ([v, o]) => window.setup(v, o),
    [video, { assets: "../../src/assets", logo: "assets/logo-transparent.png", url: config.url }],
  );
  await page.evaluate(() =>
    Promise.all(
      ['900 10px "Playfair Display"', 'italic 700 10px "Playfair Display"', '800 10px "Inter"'].map(
        (f) => document.fonts.load(f),
      ),
    ),
  );
  await page.evaluate(() =>
    Promise.all([...document.images].map((i) => i.decode().catch(() => {}))).then(() =>
      Promise.all(
        [...document.querySelectorAll(".bg")].map((el) => {
          const img = new Image();
          img.src = getComputedStyle(el).backgroundImage.slice(5, -2);
          return img.decode().catch(() => {});
        }),
      ),
    ),
  );

  if (preview) {
    let start = 0;
    for (const [i, s] of video.scenes.entries()) {
      await page.evaluate((t) => window.renderAt(t), start + s.duration - 0.5);
      await page.screenshot({ path: `${outDir}/${video.id}-scene${i + 1}.png` });
      start += s.duration;
    }
    console.log(`✓ aperçu ${video.id}`);
    continue;
  }

  const file = `${outDir}/${video.id}.mp4`;
  const ffmpeg = spawn(
    FFMPEG,
    [
      "-y",
      "-loglevel",
      "error",
      "-f",
      "image2pipe",
      "-framerate",
      String(FPS),
      "-i",
      "-",
      "-f",
      "lavfi",
      "-i",
      "anullsrc=r=44100:cl=stereo",
      "-shortest",
      "-c:v",
      "libx264",
      "-preset",
      "medium",
      "-crf",
      "19",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      "-movflags",
      "+faststart",
      file,
    ],
    { stdio: ["pipe", "inherit", "inherit"] },
  );
  const done = new Promise((ok, ko) =>
    ffmpeg.on("close", (c) => (c ? ko(new Error(`ffmpeg ${c}`)) : ok())),
  );
  const frames = Math.round(total * FPS);
  for (let f = 0; f < frames; f++) {
    await page.evaluate((t) => window.renderAt(t), f / FPS);
    const buf = await page.screenshot({ type: "jpeg", quality: 92 });
    if (!ffmpeg.stdin.write(buf)) await new Promise((r) => ffmpeg.stdin.once("drain", r));
  }
  ffmpeg.stdin.end();
  await done;
  console.log(`✓ ${file} (${total.toFixed(1)} s)`);
}

await browser.close();
