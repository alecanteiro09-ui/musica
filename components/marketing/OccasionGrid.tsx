import { Cake, Heart, Plane, HeartHandshake, Flower2, Gift } from "lucide-react";
import { Reveal } from "./Reveal";

const OCCASIONS = [
  {
    icon: Cake,
    title: "O aniversário",
    body: "A música que toca esse ano — e ganha um verso novo no próximo, quando você contar mais uma história.",
  },
  {
    icon: Flower2,
    title: "Em memória",
    body: "Uma forma de guardar quem partiu. A voz muda, mas a história que vocês viveram continua tocando.",
  },
  {
    icon: Plane,
    title: "Quem está longe",
    body: "A saudade não cabe numa chamada de vídeo. Cabe numa música que a pessoa ouve quando quiser.",
  },
  {
    icon: HeartHandshake,
    title: "O amor de muitos anos",
    body: "Pra quem já ouviu 'eu te amo' de mil jeitos e nunca ouviu do jeito que só uma música diz.",
  },
  {
    icon: Heart,
    title: "Pais e mães",
    body: "Pra quem fez tanto por tanto tempo e nunca pediu nada em troca — nem uma música.",
  },
  {
    icon: Gift,
    title: "Sem data nenhuma",
    body: "Sem aniversário, sem data comemorativa. Só porque você quis contar pra alguém o que ela significa.",
  },
];

export function OccasionGrid() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-5xl px-6">
        <Reveal>
          <p className="text-center text-sm font-medium uppercase tracking-wide text-accent">pra quem é esse presente</p>
          <h2 className="mt-3 text-center font-display text-3xl italic text-ink md:text-4xl">
            Cada motivo pede um jeito diferente de contar
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {OCCASIONS.map((o, i) => (
            <Reveal key={o.title} delay={i * 80}>
              <div className="h-full rounded-2xl border border-base-border bg-base-soft p-6 transition-all hover:-translate-y-1 hover:shadow-card">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft text-accent">
                  <o.icon size={18} />
                </span>
                <h3 className="mt-4 text-lg font-semibold text-ink">{o.title}</h3>
                <p className="mt-2 text-sm text-ink-muted">{o.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
