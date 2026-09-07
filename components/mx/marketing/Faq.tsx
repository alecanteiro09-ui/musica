"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/marketing/Reveal";

const QUESTIONS = [
  {
    q: "¿Y si la letra no queda bien?",
    a: "Lees la letra completa antes de pagar cualquier cosa. Si no te gusta, puedes editarla tú mismo o pedir otra versión — y si aun así no queda como quieres, simplemente no la sigues. La letra siempre es gratis.",
  },
  {
    q: "¿Cuánto tiempo tarda?",
    a: "La letra queda lista en segundos. La canción cantada tarda unos minutos en grabarse — puedes cerrar la pestaña y volver después, te avisamos cuando esté lista.",
  },
  {
    q: "¿La canción es realmente solo mía?",
    a: "Sí. Nace de la historia que cuentas en el formulario — apodo, ocasión, los detalles que solo ustedes saben. No es una canción ya hecha con el nombre cambiado.",
  },
  {
    q: "¿Necesito saber escribir bien?",
    a: "No. Cuéntalo a tu manera, con tus propias palabras, aunque sea desordenado. La letra se escribe a partir de eso.",
  },
  {
    q: "¿Cómo se lo entrego a la persona?",
    a: "Recibes un enlace y un código QR en cuanto la canción se libera. Lo mandas por WhatsApp, o imprimes el QR y lo pegas en una tarjeta, en un cuadro, en lo que quieras.",
  },
  {
    q: "¿Dónde quedan mis datos?",
    a: "Guardados con acceso restringido a quien tiene el enlace de tu pedido — no exponemos ningún pedido públicamente. Las fotos y la letra solo aparecen en la página-regalo después de que la canción está pagada.",
  },
  {
    q: "¿Y si no me gusta después de pagar?",
    a: "Tienes 7 días naturales para pedir tu reembolso, sin necesidad de justificar el motivo. Solo escribe a nuestro correo con el correo usado en la compra.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="py-20">
      <div className="mx-auto max-w-2xl px-6">
        <Reveal>
          <h2 className="text-center font-display text-3xl italic text-ink md:text-4xl">Preguntas que todos hacen</h2>
        </Reveal>
        <div className="mt-10 divide-y divide-base-border border-y border-base-border">
          {QUESTIONS.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={item.q}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 py-5 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="font-medium text-ink">{item.q}</span>
                  <ChevronDown
                    size={18}
                    className={cn("shrink-0 text-ink-muted transition-transform", isOpen && "rotate-180")}
                  />
                </button>
                <div
                  className={cn(
                    "grid overflow-hidden transition-all duration-300",
                    isOpen ? "grid-rows-[1fr] pb-5 opacity-100" : "grid-rows-[0fr] opacity-0"
                  )}
                >
                  <p className="min-h-0 text-sm text-ink-muted">{item.a}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
