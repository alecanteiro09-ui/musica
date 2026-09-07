import Link from "next/link";
import { Music2, Images, QrCode, Download } from "lucide-react";
import { Reveal } from "@/components/marketing/Reveal";
import { FallingHearts } from "@/components/marketing/FallingHearts";

const FEATURES = [
  {
    icon: Music2,
    title: "La canción con la letra encendiéndose",
    body: "Palabra por palabra, al ritmo de la voz — karaoke de verdad, no subtítulo estático.",
  },
  {
    icon: Images,
    title: "Sus fotos, deslizando",
    body: "Las fotos que subas pasan de fondo, junto con la canción.",
  },
  {
    icon: QrCode,
    title: "Enlace y código QR listos",
    body: "Lo mandas por WhatsApp, o imprimes el QR y lo pegas en una tarjeta o en una caja de regalo.",
  },
  {
    icon: Download,
    title: "El MP3 para descargar y guardar",
    body: "La canción es tuya para siempre. La página se queda en línea para reabrirla cuando quieras.",
  },
];

export function FullGiftFeature() {
  return (
    <section
      className="py-24 text-base-soft"
      style={{
        background:
          "radial-gradient(circle at 85% 10%, rgba(255,122,84,0.18), transparent 45%), radial-gradient(circle at 5% 95%, rgba(227,167,61,0.14), transparent 40%), #241C2C",
      }}
    >
      <div className="mx-auto grid max-w-5xl gap-12 px-6 md:grid-cols-2 md:items-center">
        <Reveal>
          <p className="text-sm uppercase tracking-wide text-wax">el regalo, completo</p>
          <h2 className="mt-3 max-w-md font-display text-3xl italic leading-tight text-[#FBF7FA] md:text-4xl">
            No es solo una canción. Es la página que envías.
          </h2>
          <p className="mt-5 max-w-md text-[#C9BBCE]">
            La mayoría de los regalos digitales se pierden como un archivo más en la conversación de WhatsApp. Aquí,
            quien lo recibe abre un enlace y vive un momento completo.
          </p>

          <ul className="mt-8 space-y-5">
            {FEATURES.map((f) => (
              <li key={f.title} className="flex gap-4">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-wax">
                  <f.icon size={16} />
                </span>
                <div>
                  <p className="font-medium text-[#FBF7FA]">{f.title}</p>
                  <p className="mt-1 text-sm text-[#C9BBCE]">{f.body}</p>
                </div>
              </li>
            ))}
          </ul>

          <Link
            href="/mx/criar"
            className="mt-9 inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 font-medium text-on-accent shadow-[0_10px_30px_-10px_rgba(255,122,84,0.55)] transition-all hover:scale-[1.03] active:scale-[0.98]"
          >
            Crear la mía ahora
          </Link>
        </Reveal>

        <Reveal delay={120}>
          <PhoneMockup />
        </Reveal>
      </div>
    </section>
  );
}

function PhoneMockup() {
  return (
    <div className="mx-auto w-full max-w-[280px] overflow-hidden rounded-[2rem] border border-white/10 bg-black/30 p-6 shadow-2xl backdrop-blur">
      <p className="text-center text-[10px] uppercase tracking-wide text-wax">una canción para</p>
      <p className="mt-1 text-center font-display text-xl italic text-[#FBF7FA]">Rosario</p>
      <div className="relative mt-6 h-32 overflow-hidden rounded-xl">
        <img src="/images/occasions/mae.jpg" alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black/35" />
        <FallingHearts />
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-on-accent shadow-lg">
            <Music2 size={18} />
          </span>
        </span>
      </div>
      <div className="mt-5 space-y-1.5">
        <p className="text-xs text-wax">Doña Rosario, mujer de fe</p>
        <p className="text-xs text-[#FBF7FA]">Se levantaba antes que saliera el sol</p>
        <p className="text-xs text-[#C9BBCE]">Para que nunca faltara nada en casa</p>
      </div>
    </div>
  );
}
