import Link from "next/link";
import { Check } from "lucide-react";
import { Reveal } from "./Reveal";

const INCLUDES = [
  "A letra, feita da sua história (grátis, antes de decidir)",
  "Um trecho de 40s cantado, pra ouvir antes de pagar",
  "A música completa, com produção de estúdio",
  "A página-presente com fotos e a letra acendendo em karaokê",
  "Link e QR Code prontos pra enviar",
  "O MP3 pra baixar e guardar pra sempre",
];

export function PricingIncludes() {
  return (
    <section className="border-y border-base-border bg-base-soft py-20">
      <div className="mx-auto max-w-lg px-6 text-center">
        <Reveal>
          <h2 className="font-display text-3xl italic text-ink md:text-4xl">O que vem no pagamento único</h2>
          <p className="mx-auto mt-3 max-w-sm text-ink-muted">
            Sem mensalidade, sem taxa escondida. Você paga uma vez e leva tudo.
          </p>

          <div className="mt-8 rounded-2xl border border-base-border bg-base p-6 text-left shadow-card">
            <ul className="space-y-3">
              {INCLUDES.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-ink">
                  <Check size={18} className="mt-0.5 shrink-0 text-success" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <Link
            href="/criar"
            className="mt-8 inline-block rounded-full bg-accent px-6 py-3 font-medium text-on-accent shadow-[0_10px_30px_-10px_rgba(255,122,84,0.55)] transition-all hover:scale-[1.03] hover:bg-accent-dim active:scale-[0.98]"
          >
            Criar minha música — grátis pra começar
          </Link>
          <p className="mt-3 text-xs text-ink-muted">
            Não gostou da letra? Não paga nada. A cobrança só acontece depois que você já ouviu um trecho cantado.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
