// Dot-peen "MX" monogram — the compact mcplexer mark, same 5x7 pin-stamp
// matrix as the MCPLEXER wordmark. Inherits colour via currentColor.

const FONT: Record<string, string[]> = {
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
};

function mxDots(p = 12) {
  const glyphW = 4 * p;
  const gap = p * 1.45;
  const r = p * 0.34;
  const padX = p * 1.6;
  const padY = p * 1.6;
  let lineW = 0;
  for (const _ of "MX") lineW += glyphW + gap;
  lineW -= gap;
  const width = +(lineW + padX * 2 + 2 * r).toFixed(2);
  const height = +(6 * p + 2 * r + padY * 2).toFixed(2);
  const dots: { cx: number; cy: number }[] = [];
  let cx0 = (width - lineW) / 2 + r;
  const oy = padY + r;
  for (const ch of "MX") {
    const rows = FONT[ch];
    for (let y = 0; y < 7; y++)
      for (let x = 0; x < 5; x++)
        if (rows[y][x] === "1")
          dots.push({ cx: +(cx0 + x * p).toFixed(2), cy: +(oy + y * p).toFixed(2) });
    cx0 += glyphW + gap;
  }
  return { dots, width, height, r };
}

export function McplexerLogo({ className }: { className?: string }) {
  const { dots, width, height, r } = mxDots();
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="MCPlexer"
    >
      <g fill="currentColor">
        {dots.map((d, i) => (
          <circle key={i} cx={d.cx} cy={d.cy} r={r} />
        ))}
      </g>
    </svg>
  );
}
