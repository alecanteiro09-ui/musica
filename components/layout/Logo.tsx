import { cn } from "@/lib/utils";

/**
 * Marca do Verso Único: uma forma de onda sonora que se curva em traço de
 * caneta — som virando escrita, escrita virando canção. Usada como ícone
 * isolado (favicon) e ao lado do wordmark no header/footer.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={cn("h-8 w-8", className)} aria-hidden>
      <circle cx="20" cy="20" r="19" stroke="currentColor" strokeOpacity="0.25" />
      <path
        d="M9 22 C 9 22, 12 13, 14 13 C 16 13, 16 27, 18 27 C 20 27, 20 9, 22 9 C 24 9, 23 24, 26 24 C 28 24, 29 19, 31 19"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-accent"
      />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark className="text-ink" />
      <span className="font-display text-xl italic text-ink">Verso Único</span>
    </span>
  );
}
