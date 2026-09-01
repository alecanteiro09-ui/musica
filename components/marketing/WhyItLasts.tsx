import { Sparkles, Gem, PenLine, Link2 } from "lucide-react";
import { Reveal } from "./Reveal";

const POINTS = [
  {
    icon: Sparkles,
    title: "Ela vai saber que é dela",
    body: "A letra cita o apelido, a piada interna, o detalhe que só vocês dois entendem. Não tem como confundir com música de rádio.",
  },
  {
    icon: Gem,
    title: "Não existe outra igual",
    body: "Cada letra e cada gravação nascem do zero, a partir da história que você contou. Ninguém no mundo recebeu essa mesma música.",
  },
  {
    icon: PenLine,
    title: "Você não precisa saber escrever",
    body: "Conte do seu jeito, com suas palavras — pode até falar em vez de digitar. A gente transforma isso em letra.",
  },
  {
    icon: Link2,
    title: "Fácil de entregar",
    body: "Você recebe um link com a página pronta. Manda no WhatsApp e ela abre com a música tocando e a letra acendendo.",
  },
];

export function WhyItLasts() {
  return (
    <section className="border-y border-base-border bg-base-soft py-20">
      <div className="mx-auto max-w-4xl px-6">
        <Reveal>
          <h2 className="text-center font-display text-3xl italic text-ink md:text-4xl">
            Por que uma música não sai de moda
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-x-10 gap-y-8 sm:grid-cols-2">
          {POINTS.map((p, i) => (
            <Reveal key={p.title} delay={i * 90}>
              <div className="flex gap-4">
                <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                  <p.icon size={16} />
                </span>
                <div>
                  <h3 className="font-semibold text-ink">{p.title}</h3>
                  <p className="mt-1.5 text-sm text-ink-muted">{p.body}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
