const HEARTS = [
  { left: "6%", delay: "0s", duration: "4.6s", size: 13 },
  { left: "20%", delay: "1.1s", duration: "5.2s", size: 10 },
  { left: "36%", delay: "0.4s", duration: "4.8s", size: 15 },
  { left: "52%", delay: "1.8s", duration: "4.2s", size: 11 },
  { left: "68%", delay: "0.8s", duration: "5.6s", size: 13 },
  { left: "84%", delay: "1.4s", duration: "4.9s", size: 10 },
];

/** Corações caindo em loop — usado como camada decorativa sobre fotos/fundos escuros. */
export function FallingHearts({ className }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className ?? ""}`} aria-hidden>
      {HEARTS.map((h, i) => (
        <span
          key={i}
          className="absolute top-0 text-accent"
          style={{
            left: h.left,
            fontSize: h.size,
            animation: `heart-fall ${h.duration} linear infinite`,
            animationDelay: h.delay,
          }}
        >
          ❤
        </span>
      ))}
    </div>
  );
}
