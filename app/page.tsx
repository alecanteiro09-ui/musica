import Link from "next/link";
import { Sparkles, Ear, Send } from "lucide-react";
import { DemoPreview } from "@/components/marketing/DemoPreview";
import { ReactionMoment } from "@/components/marketing/ReactionMoment";
import { StatsStrip } from "@/components/marketing/StatsStrip";
import { OccasionGrid } from "@/components/marketing/OccasionGrid";
import { FullGiftFeature } from "@/components/marketing/FullGiftFeature";
import { WhyItLasts } from "@/components/marketing/WhyItLasts";
import { TwoVersions } from "@/components/marketing/TwoVersions";
import { PricingIncludes } from "@/components/marketing/PricingIncludes";
import { Faq } from "@/components/marketing/Faq";
import { Reveal } from "@/components/marketing/Reveal";

const STEPS = [
  {
    icon: Sparkles,
    title: "Conte a história",
    body: "Quem é a pessoa, o que vocês viveram, o detalhe que só vocês dois entendem. Em texto ou falando.",
  },
  {
    icon: Ear,
    title: "Leia a letra, de graça",
    body: "Em segundos, uma letra escrita com os detalhes reais que você contou — não é frase pronta.",
  },
  {
    icon: Send,
    title: "Envie a canção",
    body: "A música cantada vira uma página com a letra acendendo junto — um link pronto pra mandar.",
  },
];

export default function HomePage() {
  return (
    <div className="overflow-x-clip">
      <section className="relative mx-auto grid max-w-5xl gap-12 px-6 pb-14 pt-16 md:grid-cols-[1.1fr_0.9fr] md:items-center md:pt-24">
        <div
          className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-accent-soft opacity-70 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-16 top-40 h-56 w-56 rounded-full bg-accent-soft opacity-50 blur-3xl"
          aria-hidden
        />

        <div className="relative">
          <span className="inline-flex items-center rounded-full border border-base-border bg-base-soft px-3 py-1 text-xs text-ink-muted">
            🎁 pra mãe, pai, namorado(a), avó ou em memória
          </span>
          <p className="mt-4 text-sm font-medium uppercase tracking-wide text-accent">presente que se ouve</p>
          <h1 className="mt-4 max-w-xl font-display text-4xl italic leading-tight text-ink md:text-6xl">
            Sua história, em canção.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-ink-muted">
            Conte sobre alguém que você ama. Em minutos, você recebe uma música original — composta e cantada a
            partir dessa história — pronta pra emocionar.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/criar"
              className="rounded-full bg-accent px-6 py-3 font-medium text-on-accent transition-transform hover:scale-[1.03] hover:bg-accent-dim active:scale-[0.98]"
            >
              Criar minha música — grátis
            </Link>
            <p className="text-sm text-ink-muted">A letra é grátis. Você decide depois de ouvir.</p>
          </div>
        </div>

        <div className="relative space-y-4">
          <ReactionMoment />
          <DemoPreview />
        </div>
      </section>

      <StatsStrip />

      <Reveal>
        <section className="border-b border-base-border py-20">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <h2 className="font-display text-2xl italic text-ink md:text-3xl">
              Todo ano, a mesma pergunta: o que dar de presente?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-ink-muted">
              Perfume acaba. Flor murcha em três dias. Caneca vira só mais uma caneca na prateleira. No fim, você
              compra qualquer coisa, entrega meio sem graça, e em dois meses ninguém lembra o que foi. Uma música
              feita da história de vocês não. Ela toca nesse aniversário — e no próximo.
            </p>
          </div>
        </section>
      </Reveal>

      <OccasionGrid />

      <Reveal>
        <section id="como-funciona" className="border-y border-base-border bg-base-soft py-20">
          <div className="mx-auto max-w-5xl px-6">
            <h2 className="text-center font-display text-3xl italic text-ink">Como funciona</h2>
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
      <TwoVersions />
      <PricingIncludes />
      <Faq />

      <Reveal>
        <section className="py-20">
          <div className="mx-auto max-w-5xl px-6 text-center">
            <h2 className="font-display text-3xl italic text-ink">A letra fica pronta na hora, de graça</h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-ink-muted">
              Você só decide sobre a música completa depois de ler a letra e ouvir um trecho cantado. Leva menos
              de 2 minutos pra começar.
            </p>
            <Link
              href="/criar"
              className="mt-8 inline-block rounded-full bg-accent px-6 py-3 font-medium text-on-accent transition-transform hover:scale-[1.03] hover:bg-accent-dim active:scale-[0.98]"
            >
              Começar agora
            </Link>
          </div>
        </section>
      </Reveal>
    </div>
  );
}
