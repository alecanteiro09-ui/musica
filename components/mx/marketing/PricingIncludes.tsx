import Link from "next/link";
import { Check } from "lucide-react";
import { Reveal } from "@/components/marketing/Reveal";
import { formatMXN } from "@/lib/utils";
import { BASE_PRICE_CENTS_MX } from "@/lib/pricing";

const INCLUDES = [
  "La letra, hecha con tu historia (gratis, antes de decidir)",
  "Un fragmento de 40s cantado, para escuchar antes de pagar",
  "La canción completa, con producción de estudio",
  "La página-regalo con fotos y la letra encendiéndose en karaoke",
  "Enlace y código QR listos para enviar",
  "El MP3 para descargar y guardar para siempre",
];

export function PricingIncludes() {
  return (
    <section className="border-y border-base-border bg-base-soft py-20">
      <div className="mx-auto max-w-lg px-6 text-center">
        <Reveal>
          <p className="text-sm font-medium uppercase tracking-wide text-accent">menos que un mariachi de la calle</p>
          <h2 className="mt-3 font-display text-3xl italic text-ink md:text-4xl">
            {formatMXN(BASE_PRICE_CENTS_MX)} pago único
          </h2>
          <p className="mx-auto mt-3 max-w-sm text-ink-muted">
            Una sola canción de mariachi en la calle cuesta 150–250 pesos. Aquí, por lo mismo, tienes una canción
            100% tuya — con el nombre, la historia y la ocasión reales — para siempre.
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
            href="/mx/criar"
            className="mt-8 inline-block rounded-full bg-accent px-6 py-3 font-medium text-on-accent shadow-[0_10px_30px_-10px_rgba(255,122,84,0.55)] transition-all hover:scale-[1.03] hover:bg-accent-dim active:scale-[0.98]"
          >
            Crear mi canción — gratis para empezar
          </Link>
          <p className="mt-3 text-xs text-ink-muted">
            ¿No te gustó la letra? No pagas nada. El cobro solo ocurre después de que ya escuchaste un fragmento
            cantado.
          </p>
          <p className="mt-1 text-xs font-medium text-ink-muted">Garantía de 7 días · reembolso sin preguntas</p>
        </Reveal>
      </div>
    </section>
  );
}
