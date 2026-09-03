function formatDwell(ms: number): string {
  if (ms <= 0) return "—";
  const s = Math.round(ms / 1000);
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}min`;
}

/**
 * "Onde as pessoas param e saem": % de sessões que chegaram em cada faixa
 * de 10% da página + quanto tempo pararam ali. A faixa onde o % despenca é
 * onde a maioria está desistindo/saindo.
 */
export function ScrollDepthBar({ bands }: { bands: { band: number; reachedPct: number; dwellMs: number }[] }) {
  return (
    <div className="flex flex-col gap-1.5">
      {bands.map((b) => (
        <div key={b.band} className="flex items-center gap-2 text-xs">
          <span className="w-14 shrink-0 text-ink-muted">{b.band}–{b.band + 10}%</span>
          <div className="h-4 flex-1 overflow-hidden rounded bg-base-border">
            <div
              className="h-full rounded bg-accent transition-all"
              style={{ width: `${b.reachedPct}%`, opacity: 0.4 + (b.reachedPct / 100) * 0.6 }}
            />
          </div>
          <span className="w-9 shrink-0 text-right text-ink">{b.reachedPct}%</span>
          <span className="w-12 shrink-0 text-right text-ink-muted">{formatDwell(b.dwellMs)}</span>
        </div>
      ))}
    </div>
  );
}
