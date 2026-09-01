import { cn } from "@/lib/utils";

/**
 * Marca do Verso Único: um equalizador de 5 barras cujas alturas desenham um
 * "V" — o som virando a inicial do nome. Barras com topo arredondado,
 * proporções fixas (não é uma curva desenhada à mão) pra ficar nítida em
 * qualquer tamanho, do favicon ao header.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={cn("h-8 w-8", className)} aria-hidden>
      <rect x="3.5" y="6" width="3" height="20" rx="1.5" className="fill-accent" />
      <rect x="9" y="13" width="3" height="13" rx="1.5" className="fill-accent" />
      <rect x="14.5" y="19" width="3" height="7" rx="1.5" className="fill-accent" />
      <rect x="20" y="13" width="3" height="13" rx="1.5" className="fill-accent" />
      <rect x="25.5" y="6" width="3" height="20" rx="1.5" className="fill-accent" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark className="text-ink" />
      <span className="font-display text-lg italic text-ink sm:text-xl">Verso Único</span>
    </span>
  );
}
