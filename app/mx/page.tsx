import Link from "next/link";
import { Sparkles, Ear, Send } from "lucide-react";
import { ReactionMoment } from "@/components/mx/marketing/ReactionMoment";
import { DemoPreview } from "@/components/mx/marketing/DemoPreview";
import { StatsStrip } from "@/components/mx/marketing/StatsStrip";
import { OccasionGrid } from "@/components/mx/marketing/OccasionGrid";
import { FullGiftFeature } from "@/components/mx/marketing/FullGiftFeature";
import { WhyItLasts } from "@/components/mx/marketing/WhyItLasts";
import { RelationshipGallery } from "@/components/mx/marketing/RelationshipGallery";
import { RealMusicSample } from "@/components/mx/marketing/RealMusicSample";
import { PricingIncludes } from "@/components/mx/marketing/PricingIncludes";
import { Faq } from "@/components/mx/marketing/Faq";
import { Reveal } from "@/components/marketing/Reveal";

export const metadata = {
  title: "Verso Único México — Una canción hecha con tu historia",
  description:
    "Cuenta la historia de alguien que amas y recibe una canción original en mariachi, banda, norteño o bolero. La letra es gratis.",
  // Sin esto, la vista previa de enlaces (anuncios, WhatsApp, redes) hereda
  // el openGraph en portugués del layout raíz (ver app/layout.tsx) — un
  // problema real para una campaña de anuncios en español.
  openGraph: {
    title: "Verso Único México",
    description: "Tu historia, hecha canción.",
    type: "website",
    locale: "es_MX",
  },
};

const STEPS = [
  {
    icon: Sparkles,
    title: "Cuenta la historia",
    body: "Quién es la persona, qué han vivido juntos, el detalle que solo ustedes dos entienden. En texto o hablando.",
  },
  {
    icon: Ear,
    title: "Lee la letra, gratis",
    body: "En segundos, una letra escrita con los detalles reales que contaste — no es una frase genérica.",
  },
  {
    icon: Send,
    title: "Envía la canción",
    body: "La canción cantada se convierte en una página con la letra encendiéndose — un enlace listo para mandar.",
  },
];

export default function HomePageMx() {
  return (
    <div className="overflow-x-clip">
      <section className="relative mx-auto grid max-w-5xl gap-12 px-6 pb-14 pt-16 md:grid-cols-[1.1fr_0.9fr] md:items-center md:pt-24">
        <div
          className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-accent-soft opacity-70 blur-3xl animate-[drift-a_14s_ease-in-out_infinite]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-16 top-40 h-56 w-56 rounded-full bg-accent-soft opacity-50 blur-3xl animate-[drift-b_18s_ease-in-out_infinite]"
          aria-hidden
        />

        <div className="relative flex flex-col items-center text-center md:items-start md:text-left">
          <span className="inline-flex items-center rounded-full border border-base-border bg-base-soft px-3 py-1 text-xs text-ink-muted">
            🎁 para mamá, papá, tu pareja, tu abuela o en su memoria
          </span>
          <p className="mt-4 text-sm font-medium uppercase tracking-wide text-accent">el regalo que se escucha</p>
          <h1 className="mt-4 max-w-xl font-display text-4xl italic leading-tight text-ink sm:text-5xl md:text-6xl">
            Tu historia, hecha canción.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-ink-muted">
            Cuéntanos sobre alguien que amas. En minutos recibes una canción original — compuesta y cantada en
            mariachi, banda, norteño o bolero — lista para emocionar.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row">
            <Link
              href="/mx/criar"
              className="rounded-full bg-accent px-6 py-3 font-medium text-on-accent shadow-[0_10px_30px_-10px_rgba(255,122,84,0.55)] transition-all hover:scale-[1.03] hover:bg-accent-dim active:scale-[0.98]"
            >
              Crear mi canción — gratis
            </Link>
            <p className="text-sm text-ink-muted">La letra y un fragmento cantado son gratis. Pagas solo después de escuchar.</p>
          </div>
          <p className="mt-3 text-xs font-medium text-ink-muted">🔒 Garantía de 7 días · reembolso sin preguntas</p>
        </div>

        <div className="relative space-y-4">
          <ReactionMoment />
          <DemoPreview />
          <div className="text-center">
            <Link
              href="/mx/criar"
              className="inline-block w-full rounded-full bg-accent px-6 py-3 font-medium text-on-accent shadow-[0_10px_30px_-10px_rgba(255,122,84,0.55)] transition-all hover:scale-[1.03] hover:bg-accent-dim active:scale-[0.98] sm:w-auto"
            >
              Hacer nuestra canción — gratis para empezar
            </Link>
            <p className="mt-2 text-xs text-ink-muted">Sin tarjeta por ahora · garantía de 7 días</p>
          </div>
        </div>
      </section>

      <StatsStrip />

      <Reveal>
        <section className="border-b border-base-border py-20">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <h2 className="font-display text-2xl italic text-ink md:text-3xl">
              Cada año la misma pregunta: ¿qué le regalo?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-ink-muted">
              El perfume se acaba. La flor se marchita en tres días. La taza termina siendo una taza más en la
              alacena. Al final compras cualquier cosa, la entregas sin mucha emoción, y en dos meses nadie la
              recuerda. Una canción hecha con la historia de ustedes no. Suena en este cumpleaños — y en el
              siguiente.
            </p>
          </div>
        </section>
      </Reveal>

      <OccasionGrid />

      <Reveal>
        <section id="como-funciona" className="border-y border-base-border bg-base-soft py-20">
          <div className="mx-auto max-w-5xl px-6">
            <h2 className="text-center font-display text-3xl italic text-ink">Cómo funciona</h2>
            <div className="mt-10 grid gap-8 md:grid-cols-3">
              {STEPS.map((step, i) => (
                <Reveal key={step.title} delay={i * 120}>
                  <div className="group rounded-2xl border border-base-border bg-base p-6 transition-all hover:-translate-y-1 hover:shadow-card">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft text-accent transition-transform group-hover:scale-110">
                      <step.icon size={18} />
                    </span>
                    <h3 className="mt-4 text-lg font-semibold text-ink">{step.title}</h3>
                    <p className="mt-2 text-sm text-ink-muted">{step.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      <FullGiftFeature />
      <WhyItLasts />
      <RelationshipGallery />
      <RealMusicSample />
      <PricingIncludes />
      <Faq />

      <Reveal>
        <section className="py-20">
          <div className="mx-auto max-w-5xl px-6 text-center">
            <h2 className="font-display text-3xl italic text-ink">La letra está lista al instante, gratis</h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-ink-muted">
              Decides sobre la canción completa solo después de leer la letra y escuchar un fragmento cantado. Toma
              menos de 2 minutos empezar.
            </p>
            <Link
              href="/mx/criar"
              className="mt-8 inline-block rounded-full bg-accent px-6 py-3 font-medium text-on-accent shadow-[0_10px_30px_-10px_rgba(255,122,84,0.55)] transition-all hover:scale-[1.03] hover:bg-accent-dim active:scale-[0.98]"
            >
              Empezar ahora
            </Link>
          </div>
        </section>
      </Reveal>
    </div>
  );
}
