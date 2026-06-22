// Regenerates every raster brand asset from violet (#a06cff) dot-peen sources.
// Run: node scripts/gen-brand-assets.mjs   (from mcplexer.com/)
//
// Sources of truth:
//   - the routing/mux glyph  -> favicon, PWA icons, apple-icon, favicon.ico
//   - the dot-peen MCPLEXER   -> OG / twitter social cards (frozen RGB-split)
// Keep this in sync with app/icon.svg and components/mcplexer-mark.tsx.

import sharp from "sharp";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const p = (...s) => join(root, ...s);

const VIOLET = "#a06cff";
const CYAN = "#19e6ff";
const RED = "#ff3147";
const BG = "#0a0810";
const TILE = "#14101e";

// ── the routing/mux glyph, on a violet-dark tile (matches app/icon.svg) ──
const glyph = (stroke = VIOLET) => `
  <g transform="translate(58.03,58.03) scale(12.3733)">
    <g fill="none" stroke="${stroke}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4 8H9L16 16"/><path d="M4 16H16"/><path d="M4 24H9L16 16"/><path d="M16 16H28"/>
    </g>
    <circle cx="16" cy="16" r="2.7" fill="${stroke}"/>
  </g>`;

const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" rx="92.2" fill="${TILE}"/>
  <rect x="8" y="8" width="496" height="496" rx="86" fill="none" stroke="${VIOLET}" stroke-opacity="0.35" stroke-width="4"/>
  ${glyph()}
</svg>`;

// maskable: full-bleed tile, glyph pulled into the inner ~64% safe zone.
const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" fill="${TILE}"/>
  <g transform="translate(256,256) scale(0.66) translate(-256,-256)">${glyph()}</g>
</svg>`;

// ── dot-peen MCPLEXER wordmark for the social card (5x7 pin-stamp matrix) ──
const FONT = {
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  C: ["01110", "10001", "10000", "10000", "10000", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
};

function buildDots(lines, p) {
  const glyphW = 4 * p, glyphH = 6 * p, space = 4 * p;
  const r = p * 0.34, gap = p * 1.45, padX = p * 1.6, padY = p * 1.6, lineGap = p * 2.4;
  const lineWidth = (s) => {
    let w = 0;
    for (const ch of s) w += (ch === " " ? space : glyphW) + gap;
    return w - gap;
  };
  const maxW = Math.max(...lines.map(lineWidth));
  const width = +(maxW + padX * 2 + 2 * r).toFixed(2);
  const lineH = glyphH + 2 * r;
  const height = +(lines.length * lineH + (lines.length - 1) * lineGap + padY * 2).toFixed(2);
  const dots = [];
  lines.forEach((s, li) => {
    let cx0 = (width - lineWidth(s)) / 2 + r;
    const oy = padY + r + li * (lineH + lineGap);
    for (const ch of s) {
      const rows = FONT[ch];
      if (rows) for (let y = 0; y < 7; y++) for (let x = 0; x < 5; x++) {
        if (rows[y][x] === "1") dots.push({ cx: +(cx0 + x * p).toFixed(2), cy: +(oy + y * p).toFixed(2) });
      }
      cx0 += (ch === " " ? space : glyphW) + gap;
    }
  });
  return { dots, width, height, r };
}

function ogSvg() {
  const W = 1600, H = 900;
  const pitch = 24;
  const { dots, width, height, r } = buildDots(["MCP", "LEXER"], pitch);
  const ox = (W - width) / 2;
  const oy = 132;
  const layer = (fill, dx, dy, op) =>
    `<g fill="${fill}" opacity="${op}" transform="translate(${(ox + dx).toFixed(2)},${(oy + dy).toFixed(2)})">` +
    dots.map((d) => `<circle cx="${d.cx}" cy="${d.cy}" r="${r.toFixed(2)}"/>`).join("") +
    `</g>`;
  // faint grid
  let grid = "";
  for (let x = 0; x <= W; x += 64) grid += `<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="#251f3a" stroke-width="1"/>`;
  for (let y = 0; y <= H; y += 64) grid += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="#251f3a" stroke-width="1"/>`;
  const taglineY = oy + height + 86;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
    <defs><radialGradient id="g" cx="28%" cy="34%" r="62%">
      <stop offset="0%" stop-color="${VIOLET}" stop-opacity="0.20"/>
      <stop offset="70%" stop-color="${VIOLET}" stop-opacity="0"/>
    </radialGradient></defs>
    <rect width="${W}" height="${H}" fill="${BG}"/>
    <g opacity="0.5">${grid}</g>
    <rect width="${W}" height="${H}" fill="url(#g)"/>
    ${layer(CYAN, -8, 3, 0.55)}
    ${layer(RED, 8, -3, 0.45)}
    ${layer(VIOLET, 0, 0, 1)}
    <rect x="${(W / 2 - 70).toFixed(0)}" y="${(taglineY - 44).toFixed(0)}" width="140" height="5" fill="${VIOLET}"/>
    <text x="${W / 2}" y="${taglineY}" text-anchor="middle" font-family="ui-monospace,monospace" font-size="40" font-weight="800" fill="#e7e3f2" letter-spacing="2">Cross-Harness AI Runtime</text>
    <text x="${W / 2}" y="${(H - 70).toFixed(0)}" text-anchor="middle" font-family="ui-monospace,monospace" font-size="24" letter-spacing="3" fill="#9b93b3">mcplexer.com  ·  open source by Revitt  ·  AGPL-3.0</text>
  </svg>`;
}

const og = Buffer.from(ogSvg());
const icon = Buffer.from(iconSvg);
const maskable = Buffer.from(maskableSvg);

async function png(svg, size, out) {
  await sharp(svg, { density: 384 }).resize(size, size).png().toFile(p(out));
  console.log("wrote", out, `${size}x${size}`);
}
async function og16x9(out) {
  await sharp(og, { density: 192 }).resize(1600, 900).png().toFile(p(out));
  console.log("wrote", out, "1600x900");
}

// ICO: 6-byte header + 16-byte dir entry + embedded PNG payload.
async function ico(out) {
  const buf = await sharp(icon, { density: 192 }).resize(48, 48).png().toBuffer();
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(1, 4);
  const dir = Buffer.alloc(16);
  dir.writeUInt8(48, 0); dir.writeUInt8(48, 1); dir.writeUInt8(0, 2); dir.writeUInt8(0, 3);
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
