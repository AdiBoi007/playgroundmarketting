import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { chromium } from "@playwright/test";

// Render the existing brand mask as a native CSS icon, preserving its geometry.
const root = new URL("../", import.meta.url);
const mark = await readFile(new URL("public/brand/playground-mark.webp", root));
const { data, info } = await sharp(mark).removeAlpha().raw().toBuffer({ resolveWithObject: true });
let left = info.width, top = info.height, right = 0, bottom = 0;
for (let y = 0; y < info.height; y++) {
  for (let x = 0; x < info.width; x++) {
    if (data[(y * info.width + x) * info.channels] < 128) continue;
    left = Math.min(left, x); right = Math.max(right, x);
    top = Math.min(top, y); bottom = Math.max(bottom, y);
  }
}
const extent = Math.max(right - left + 1, bottom - top + 1);
const cropLeft = (left + right + 1 - extent) / 2;
const cropTop = (top + bottom + 1 - extent) / 2;
const browser = await chromium.launch();
const context = await browser.newContext({ deviceScaleFactor: 4 });
const page = await context.newPage();
const buffers = new Map();
try {
  for (const size of [16, 32, 48, 180]) {
    const scale = size * .72 / extent;
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(`<style>
      * { box-sizing: border-box; }
      html, body { margin: 0; background: transparent; }
      .tile { width: ${size}px; height: ${size}px; border-radius: 23%; background: #fff;
        box-shadow: inset 0 0 0 ${size / 64}px #d8d8d8; position: relative; }
      .mark { position: absolute; inset: 14%; background: #000;
        mask-image: url(data:image/webp;base64,${mark.toString("base64")}); mask-mode: luminance;
        mask-repeat: no-repeat; mask-size: ${info.width * scale}px ${info.height * scale}px;
        mask-position: ${-cropLeft * scale}px ${-cropTop * scale}px; }
    </style><div class="tile"><div class="mark"></div></div>`);
    const rendered = await page.screenshot({ omitBackground: true });
    const png = await sharp(rendered).resize(size, size).png().toBuffer();
    await writeFile(new URL(`public/brand/icon-${size}.png`, root), png);
    buffers.set(size, png);
  }
} finally {
  await browser.close();
}

// ICO supports PNG entries; include common tab sizes in one browser fallback.
const sizes = [16, 32, 48];
const header = Buffer.alloc(6 + sizes.length * 16);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
for (const [index, size] of sizes.entries()) {
  const png = buffers.get(size);
  const entry = 6 + index * 16;
  header[entry] = size; header[entry + 1] = size;
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(png.length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += png.length;
}
await writeFile(new URL("app/favicon.ico", root), Buffer.concat([header, ...sizes.map(size => buffers.get(size))]));
console.log(`Generated rounded monochrome favicons in ${fileURLToPath(new URL("public/brand/", root))}`);
