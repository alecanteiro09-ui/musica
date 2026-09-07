import { Cake, Heart, Crown, HeartHandshake, Flower2, Music } from "lucide-react";
import { Reveal } from "@/components/marketing/Reveal";

// Además de las ocasiones universales, destaca las que pesan de verdad en el
// calendario mexicano — Día de las Madres (10 de mayo) y XV años son fechas
// sin equivalente directo en la versión BR (ver plan de expansión).
const OCCASIONS = [
  {
    icon: Flower2,
    title: "Día de las Madres",
    body: "El 10 de mayo llega cada año. Este año, en vez de flores que se marchitan, regálale una canción que suena en el próximo también.",
  },
  {
    icon: Crown,
    title: "Los XV años",
    body: "Un vals no se repite dos veces en la vida. Una canción escrita para ella, con su historia, se queda para siempre.",
  },
  {
    icon: Cake,
    title: "El cumpleaños",
    body: "La canción que suena este año — y gana un verso nuevo el próximo, cuando cuentes una historia más.",
  },
  {
    icon: HeartHandshake,
    title: "El amor de muchos años",
    body: "Para quien ya escuchó 'te amo' de mil formas y nunca lo escuchó como solo una canción lo dice.",
  },
  {
    icon: Heart,
    title: "Mamá y papá",
    body: "Para quien hizo tanto por tanto tiempo y nunca pidió nada a cambio — ni una canción.",
  },
  {
    icon: Music,
    title: "Sin fecha ninguna",
    body: "Sin cumpleaños, sin fecha especial. Solo porque quisiste contarle a alguien lo que significa para ti.",
  },
];

export function OccasionGrid() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-5xl px-6">
        <Reveal>
          <p className="text-center text-sm font-medium uppercase tracking-wide text-accent">para quién es este regalo</p>
          <h2 className="mt-3 text-center font-display text-3xl italic text-ink md:text-4xl">
            Cada ocasión pide una forma distinta de contarlo
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
