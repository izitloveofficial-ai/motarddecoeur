// Génère les vidéos TikTok verticales (1080×1920, 30 i/s, MP4 H.264) décrites dans videos.json.
// Usage : node marketing/tiktok/render.mjs            → toutes les vidéos
//         node marketing/tiktok/render.mjs 03 07      → seulement les vidéos dont l'id commence par 03 ou 07
//         node marketing/tiktok/render.mjs --preview  → une image PNG par scène (vérification rapide)
import { execFileSync, spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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

// Voix off : Piper (synthèse vocale libre, hors ligne) et sa voix française « siwis ».
const PIPER = process.env.PIPER || "piper";
const VOICE = process.env.PIPER_VOICE || `${HERE}/assets/voix/fr-siwis-medium.onnx`;
const VOICE_LEAD = 0.25; // silence avant chaque réplique
const VOICE_TAIL = 0.45; // respiration après chaque réplique
const hasVoice = existsSync(VOICE);
if (!hasVoice) console.warn(`Voix introuvable (${VOICE}) : vidéos rendues sans voix off.`);

/** WAV PCM 16 bits → { rate, samples } (mono attendu, comme Piper). */
function readWav(file) {
  const buf = readFileSync(file);
  let rate = 22050;
  for (let o = 12; o < buf.length - 8; ) {
    const id = buf.toString("ascii", o, o + 4);
    const size = buf.readUInt32LE(o + 4);
    if (id === "fmt ") rate = buf.readUInt32LE(o + 12);
    if (id === "data")
      return {
        rate,
        samples: new Int16Array(
          buf.buffer.slice(buf.byteOffset + o + 8, buf.byteOffset + o + 8 + size),
        ),
      };
    o += 8 + size + (size % 2);
  }
  throw new Error(`WAV invalide : ${file}`);
}

function writeWav(file, rate, samples) {
  const head = Buffer.alloc(44);
  head.write("RIFF", 0);
  head.writeUInt32LE(36 + samples.byteLength, 4);
  head.write("WAVEfmt ", 8);
  head.writeUInt32LE(16, 16);
  head.writeUInt16LE(1, 20);
  head.writeUInt16LE(1, 22);
  head.writeUInt32LE(rate, 24);
  head.writeUInt32LE(rate * 2, 28);
  head.writeUInt16LE(2, 32);
  head.writeUInt16LE(16, 34);
  head.write("data", 36);
  head.writeUInt32LE(samples.byteLength, 40);
  writeFileSync(file, Buffer.concat([head, Buffer.from(samples.buffer)]));
}

/** Synthétise chaque réplique, allonge les scènes trop courtes et renvoie la piste voix (ou null). */
function buildVoiceTrack(video) {
  if (!hasVoice || !video.scenes.some((s) => s.voice)) return null;
  const clips = video.scenes.map((s, i) => {
    if (!s.voice) return null;
    const file = `${outDir}/.voix-${video.id}-${i}.wav`;
    execFileSync(
      PIPER,
      ["-m", VOICE, "-f", file, "--length-scale", "0.95", "--sentence-silence", "0.2"],
      {
        input: s.voice,
        stdio: ["pipe", "ignore", "pipe"],
      },
    );
    const clip = readWav(file);
    rmSync(file);
    return clip;
  });
  const rate = clips.find(Boolean).rate;
  video.scenes.forEach((s, i) => {
    if (clips[i])
      s.duration = Math.max(s.duration, VOICE_LEAD + clips[i].samples.length / rate + VOICE_TAIL);
  });
  const total = video.scenes.reduce((sum, s) => sum + s.duration, 0);
  const track = new Int16Array(Math.ceil(total * rate));
  let start = 0;
  video.scenes.forEach((s, i) => {
    if (clips[i])
      track.set(
        clips[i].samples.subarray(0, track.length - Math.round((start + VOICE_LEAD) * rate)),
        Math.round((start + VOICE_LEAD) * rate),
      );
    start += s.duration;
  });
  const file = `${outDir}/.voix-${video.id}.wav`;
  writeWav(file, rate, track);
  return file;
}

const chromium = await loadChromium();
const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1080, height: 1920 },
  deviceScaleFactor: 1,
});

for (const video of videos) {
  const voiceFile = buildVoiceTrack(video);
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
    if (voiceFile) rmSync(voiceFile);
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
      ...(voiceFile ? ["-i", voiceFile] : ["-f", "lavfi", "-i", "anullsrc=r=44100:cl=stereo"]),
      "-af",
      "apad",
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
      "-ar",
      "44100",
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
  if (voiceFile) rmSync(voiceFile);
  console.log(`✓ ${file} (${total.toFixed(1)} s)`);
}

await browser.close();
