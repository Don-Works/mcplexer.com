// Regenerates every raster brand asset from electric-blue (#3b82f6) dot-peen sources.
// Run: node scripts/gen-brand-assets.mjs   (from mcplexer.com/)
//
// Logo / favicon / app icons = dot-peen "MX" monogram.
// OG / twitter social cards    = dot-peen "MCPLEXER" wordmark.
// Keep in sync with app/icon.svg (written here) and components/logo.tsx.

import sharp from "sharp";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const p = (...s) => join(root, ...s);

const BLUE = "#3b82f6";
const BG = "#0a0b10";
const TILE = "#11141d";

const FONT = {
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  C: ["01110", "10001", "10000", "10000", "10000", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
};

function buildDots(line, pitch) {
  const glyphW = 4 * pitch, gap = pitch * 1.45, r = pitch * 0.34;
  const padX = pitch * 1.6, padY = pitch * 1.6;
  let lineW = 0;
  for (const ch of line) lineW += glyphW + gap;
  lineW -= gap;
  const width = +(lineW + padX * 2 + 2 * r).toFixed(2);
  const height = +(6 * pitch + 2 * r + padY * 2).toFixed(2);
  const dots = [];
  let cx0 = (width - lineW) / 2 + r;
  const oy = padY + r;
  for (const ch of line) {
    const rows = FONT[ch];
    if (rows) for (let y = 0; y < 7; y++) for (let x = 0; x < 5; x++) {
      if (rows[y][x] === "1") dots.push({ cx: +(cx0 + x * pitch).toFixed(2), cy: +(oy + y * pitch).toFixed(2) });
    }
    cx0 += glyphW + gap;
  }
  return { dots, width, height, r };
}

// dot-peen "MX" monogram centred on a 512 tile
function mxIconSvg({ tile = true, pitch = 30 } = {}) {
  const S = 512;
  const { dots, width, height, r } = buildDots("MX", pitch);
  const ox = (S - width) / 2, oy = (S - height) / 2;
  const circles = dots
    .map((d) => `<circle cx="${(ox + d.cx).toFixed(2)}" cy="${(oy + d.cy).toFixed(2)}" r="${r.toFixed(2)}"/>`)
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="${S}" height="${S}" role="img" aria-label="MCPlexer">${
    tile
      ? `<rect width="${S}" height="${S}" rx="92.2" fill="${TILE}"/><rect x="8" y="8" width="496" height="496" rx="86" fill="none" stroke="${BLUE}" stroke-opacity="0.35" stroke-width="4"/>`
      : `<rect width="${S}" height="${S}" fill="${TILE}"/>`
  }<g fill="${BLUE}">${circles}</g></svg>`;
}

function ogSvg() {
  const W = 1600, H = 900, pitch = 28;
  const { dots, width, height, r } = buildDots("MCPLEXER", pitch);
  const ox = (W - width) / 2, oy = 222;
  const circles = dots
    .map((d) => `<circle cx="${(ox + d.cx).toFixed(2)}" cy="${(oy + d.cy).toFixed(2)}" r="${r.toFixed(2)}"/>`)
    .join("");
  let grid = "";
  for (let x = 0; x <= W; x += 64) grid += `<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="#251f3a" stroke-width="1"/>`;
  for (let y = 0; y <= H; y += 64) grid += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="#251f3a" stroke-width="1"/>`;
  const taglineY = oy + height + 86;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
    <defs><radialGradient id="g" cx="28%" cy="34%" r="62%"><stop offset="0%" stop-color="${BLUE}" stop-opacity="0.20"/><stop offset="70%" stop-color="${BLUE}" stop-opacity="0"/></radialGradient></defs>
    <rect width="${W}" height="${H}" fill="${BG}"/>
    <g opacity="0.5">${grid}</g>
    <rect width="${W}" height="${H}" fill="url(#g)"/>
    <g fill="${BLUE}">${circles}</g>
    <rect x="${(W / 2 - 70).toFixed(0)}" y="${(taglineY - 44).toFixed(0)}" width="140" height="5" fill="${BLUE}"/>
    <text x="${W / 2}" y="${taglineY}" text-anchor="middle" font-family="ui-monospace,monospace" font-size="40" font-weight="800" fill="#e7e3f2" letter-spacing="2">Cross-Harness AI Runtime</text>
    <text x="${W / 2}" y="${(H - 70).toFixed(0)}" text-anchor="middle" font-family="ui-monospace,monospace" font-size="24" letter-spacing="3" fill="#9b93b3">mcplexer.com  ·  open source by Revitt  ·  AGPL-3.0</text>
  </svg>`;
}

const iconSvg = mxIconSvg({ tile: true });
const maskableSvg = mxIconSvg({ tile: false, pitch: 24 });
const og = Buffer.from(ogSvg());
const icon = Buffer.from(iconSvg);
const maskable = Buffer.from(maskableSvg);

// keep the live favicon SVG in lockstep with the generated icons
writeFileSync(p("app/icon.svg"), iconSvg + "\n");

async function png(svg, size, out) {
  await sharp(svg, { density: 384 }).resize(size, size).png().toFile(p(out));
  console.log("wrote", out, `${size}x${size}`);
}
async function og16x9(out) {
  await sharp(og, { density: 192 }).resize(1600, 900).png().toFile(p(out));
  console.log("wrote", out, "1600x900");
}
async function ico(out) {
  const buf = await sharp(icon, { density: 192 }).resize(48, 48).png().toBuffer();
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(1, 4);
  const dir = Buffer.alloc(16);
  dir.writeUInt8(48, 0); dir.writeUInt8(48, 1);
  dir.writeUInt16LE(1, 4); dir.writeUInt16LE(32, 6);
  dir.writeUInt32LE(buf.length, 8); dir.writeUInt32LE(22, 12);
  writeFileSync(p(out), Buffer.concat([header, dir, buf]));
  console.log("wrote", out, "ico 48x48");
}

await png(icon, 192, "public/icon-192.png");
await png(icon, 512, "public/icon-512.png");
await png(maskable, 512, "public/icon-maskable-512.png");
await png(icon, 180, "app/apple-icon.png");
await og16x9("app/opengraph-image.png");
await og16x9("app/twitter-image.png");
await og16x9("public/og.png");
await ico("app/favicon.ico");
console.log("done.");
