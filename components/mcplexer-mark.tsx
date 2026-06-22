// Dot-peen wordmark — 5x7 pin-stamp dot matrix rendered as an SVG, the same
// system DonWorks (lime) and brw (magenta) use. mcplexer's base is blue; the
// RGB-split glitch (cyan + red ghost layers) is driven entirely by CSS in
// globals.css, so this stays a server component with no client JS.

type Glyph = readonly [string, string, string, string, string, string, string];

const FONT: Record<string, Glyph> = {
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  C: ["01110", "10001", "10000", "10000", "10000", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
};

type Dot = { cx: number; cy: number };

function buildDots(lines: readonly string[], p: number) {
  const glyphW = 4 * p;
  const glyphH = 6 * p;
  const space = 4 * p;
  const r = p * 0.34;
  const gap = p * 1.45;
  const padX = p * 1.6;
  const padY = p * 1.6;
  const lineGap = p * 2.4;

  const lineWidth = (s: string) => {
    let w = 0;
    for (const ch of s) w += (ch === " " ? space : glyphW) + gap;
    return w - gap;
  };

  const maxW = Math.max(...lines.map(lineWidth));
  const width = +(maxW + padX * 2 + 2 * r).toFixed(2);
  const lineH = glyphH + 2 * r;
  const height = +(
    lines.length * lineH +
    (lines.length - 1) * lineGap +
    padY * 2
  ).toFixed(2);

  const dots: Dot[] = [];
  lines.forEach((s, li) => {
    let cx0 = (width - lineWidth(s)) / 2 + r;
    const oy = padY + r + li * (lineH + lineGap);
    for (const ch of s) {
      const rows = FONT[ch] ?? FONT[" "];
      for (let y = 0; y < 7; y++) {
        for (let x = 0; x < 5; x++) {
          if (rows[y][x] === "1") {
            dots.push({
              cx: +(cx0 + x * p).toFixed(2),
              cy: +(oy + y * p).toFixed(2),
            });
          }
        }
      }
      cx0 += (ch === " " ? space : glyphW) + gap;
    }
  });

  return { dots, width, height, r };
}

type McplexerMarkProps = {
  lines?: readonly string[];
  /** Base (resting) dot colour. */
  color?: string;
  /** RGB-split ghost colours that flare during the glitch. */
  ghostA?: string;
  ghostB?: string;
  pitch?: number;
  className?: string;
  title?: string;
};

export function McplexerMark({
  lines = ["MCPLEXER"],
  color = "var(--color-blue)",
  ghostA = "var(--color-cyan)",
  ghostB = "var(--color-red)",
  pitch = 12,
  className,
  title = "MCPLEXER",
}: McplexerMarkProps) {
  const { dots, width, height, r } = buildDots(lines, pitch);
  const circles = (cls: string, fill: string) => (
    <g className={cls} fill={fill}>
      {dots.map((d, i) => (
        <circle key={`${cls}-${i}`} cx={d.cx} cy={d.cy} r={r} />
      ))}
    </g>
  );

  return (
    <svg
      className={["peen", className].filter(Boolean).join(" ")}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={title}
    >
      {circles("gh ghA", ghostA)}
      {circles("gh ghB", ghostB)}
      {circles("base", color)}
    </svg>
  );
}
