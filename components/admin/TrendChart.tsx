const WIDTH = 600;
const HEIGHT = 140;
const PADDING = 24;

/** Gráfico de linha simples em SVG puro — sem lib nova só pra isso. */
export function TrendChart({ data }: { data: { date: string; count: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const stepX = (WIDTH - PADDING * 2) / Math.max(1, data.length - 1);

  const points = data.map((d, i) => {
    const x = PADDING + i * stepX;
    const y = HEIGHT - PADDING - (d.count / max) * (HEIGHT - PADDING * 2);
    return { x, y, d };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L${points[points.length - 1]?.x ?? PADDING},${HEIGHT - PADDING} L${PADDING},${HEIGHT - PADDING} Z`;

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Visitantes por dia">
      <line x1={PADDING} y1={HEIGHT - PADDING} x2={WIDTH - PADDING} y2={HEIGHT - PADDING} stroke="currentColor" className="text-base-border" />
      <path d={areaPath} fill="currentColor" className="text-accent" fillOpacity={0.12} />
      <path d={linePath} fill="none" stroke="currentColor" className="text-accent" strokeWidth={2} />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={2.5} fill="currentColor" className="text-accent-dim" />
      ))}
      {points
        .filter((_, i) => i % 3 === 0 || i === points.length - 1)
        .map((p, i) => (
          <text key={i} x={p.x} y={HEIGHT - 6} fontSize={9} textAnchor="middle" fill="currentColor" className="text-ink-muted">
            {p.d.date.slice(5)}
          </text>
        ))}
    </svg>
  );
}
