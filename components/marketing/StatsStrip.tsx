const STATS = [
  { value: "segundos", label: "pra letra ficar pronta" },
  { value: "poucos minutos", label: "pra música ser gravada" },
  { value: "100% única", label: "nunca se repete" },
];

export function StatsStrip() {
  return (
    <div className="border-y border-base-border bg-base-soft">
      <div className="mx-auto grid max-w-4xl grid-cols-3 gap-4 px-6 py-6 text-center">
        {STATS.map((s) => (
          <div key={s.label}>
            <p className="font-display text-lg italic text-ink sm:text-xl">{s.value}</p>
            <p className="mt-0.5 text-[11px] text-ink-muted sm:text-xs">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
