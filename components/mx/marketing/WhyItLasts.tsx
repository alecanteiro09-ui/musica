import { Sparkles, Gem, PenLine, Link2 } from "lucide-react";
import { Reveal } from "@/components/marketing/Reveal";

const POINTS = [
  {
    icon: Sparkles,
    title: "Ella va a saber que es suya",
    body: "La letra menciona el apodo, la broma interna, el detalle que solo ustedes dos entienden. No hay forma de confundirla con una canción de radio.",
  },
  {
    icon: Gem,
    title: "No existe otra igual",
    body: "Cada letra y cada grabación nacen desde cero, a partir de la historia que tú contaste. Nadie más en el mundo recibió esta misma canción.",
  },
  {
    icon: PenLine,
    title: "No necesitas saber escribir",
    body: "Cuéntalo a tu manera, con tus propias palabras — hasta puedes hablarlo en vez de escribirlo. Nosotros lo convertimos en letra.",
  },
  {
    icon: Link2,
    title: "Fácil de entregar",
    body: "Recibes un enlace con la página lista. Lo mandas por WhatsApp y se abre con la canción sonando y la letra encendiéndose.",
  },
];

export function WhyItLasts() {
  return (
    <section className="border-y border-base-border bg-base-soft py-20">
      <div className="mx-auto max-w-4xl px-6">
        <Reveal>
          <h2 className="text-center font-display text-3xl italic text-ink md:text-4xl">
            Por qué una canción nunca pasa de moda
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
