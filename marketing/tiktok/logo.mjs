// Rend transparente toute la partie blanche du logo et recadre l'image.
// Usage : node marketing/tiktok/logo.mjs [source] [sortie]
//   source par défaut : marketing/tiktok/assets/logo-source.(png|jpg|jpeg|webp|svg), sinon le logo du site
//   sortie par défaut : marketing/tiktok/assets/logo-transparent.png
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, extname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { loadChromium, HERE } from "./lib.mjs";

const candidates = ["png", "jpg", "jpeg", "webp", "svg"].map(
  (ext) => `${HERE}/assets/logo-source.${ext}`,
);
const source = resolve(
  process.argv[2] ??
    candidates.find(existsSync) ??
    `${HERE}/../../public/logo-motards-de-coeur.svg`,
);
const output = resolve(process.argv[3] ?? `${HERE}/assets/logo-transparent.png`);

// Passée en data URL : une image file:// rendrait le canevas illisible (origine opaque).
function toDataUrl(file) {
  const ext = extname(file).slice(1).toLowerCase();
  const mime = ext === "svg" ? "image/svg+xml" : ext === "jpg" ? "image/jpeg" : `image/${ext}`;
  return `data:${mime};base64,${readFileSync(file).toString("base64")}`;
}

const chromium = await loadChromium();
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(pathToFileURL(`${HERE}/template.html`).href);
const dataUrl = await page.evaluate(async (src) => {
  const img = new Image();
  img.src = src;
  await img.decode();
  // Les petites sources sont agrandies pour rester nettes en 1080×1920.
  const scale = Math.max(1, Math.ceil(900 / Math.max(img.naturalWidth, img.naturalHeight)));
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth * scale;
  canvas.height = img.naturalHeight * scale;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const px = data.data;
  let [x0, y0, x1, y1] = [canvas.width, canvas.height, 0, 0];
  for (let i = 0; i < px.length; i += 4) {
    const [r, g, b] = [px[i], px[i + 1], px[i + 2]];
    const lo = Math.min(r, g, b);
    const sat = Math.max(r, g, b) - lo;
    // Blanc et gris très clair peu saturé → transparent, avec un fondu pour éviter le liseré.
    const white = sat < 45 ? Math.min(1, Math.max(0, (lo - 185) / 50)) : 0;
    const alpha = (1 - white) * (px[i + 3] / 255);
    if (alpha > 0 && alpha < 1) {
      // Retire la part de blanc mélangée aux bords.
      for (let c = 0; c < 3; c++)
        px[i + c] = Math.max(0, Math.min(255, (px[i + c] - 255 * white) / (1 - white)));
    }
    px[i + 3] = Math.round(alpha * 255);
    if (alpha > 0.08) {
      const p = i / 4;
      const x = p % canvas.width;
      const y = (p - x) / canvas.width;
      x0 = Math.min(x0, x);
      y0 = Math.min(y0, y);
      x1 = Math.max(x1, x);
      y1 = Math.max(y1, y);
    }
  }
  ctx.putImageData(data, 0, 0);
  const out = document.createElement("canvas");
  out.width = x1 - x0 + 1;
  out.height = y1 - y0 + 1;
  out.getContext("2d").drawImage(canvas, -x0, -y0);
  return out.toDataURL("image/png");
}, toDataUrl(source));
await browser.close();

mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, Buffer.from(dataUrl.split(",")[1], "base64"));
console.log(`Logo transparent : ${output}`);
