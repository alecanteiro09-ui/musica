"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Reveal } from "./Reveal";

const QUESTIONS = [
  {
    q: "E se a letra não ficar boa?",
    a: "Você lê a letra inteira antes de pagar qualquer coisa. Se não gostar, pode editar você mesmo ou pedir outra versão — e se ainda assim não for a cara da pessoa, é só não seguir. A letra é sempre grátis.",
  },
  {
    q: "Quanto tempo demora?",
    a: "A letra fica pronta em segundos. A música cantada leva alguns minutos pra gravar — dá pra fechar a aba e voltar depois, a gente avisa quando estiver pronta.",
  },
  {
    q: "A música é realmente só minha?",
    a: "Sim. Ela nasce da história que você conta no formulário — apelido, ocasião, os detalhes que só vocês sabem. Não é uma música pronta com o nome trocado.",
  },
  {
    q: "Preciso saber escrever bem?",
    a: "Não. Conte do seu jeito, com suas palavras, mesmo que seja bagunçado. A letra é escrita a partir disso.",
  },
  {
    q: "Como eu entrego pra pessoa?",
    a: "Você recebe um link e um QR Code assim que a música é liberada. Manda por WhatsApp, ou imprime o QR e cola num cartão, numa moldura, no que quiser.",
  },
  {
    q: "Onde ficam meus dados?",
    a: "Guardados com acesso restrito a quem tem o link do seu pedido — a gente não expõe pedido nenhum publicamente. Fotos e letra só aparecem na página-presente depois que a música é paga.",
  },
  {
    q: "E se eu não gostar depois de pagar?",
    a: "Você tem 7 dias corridos pra pedir reembolso, sem precisar justificar o motivo. É só escrever pro nosso e-mail com o e-mail usado na compra.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="py-20">
      <div className="mx-auto max-w-2xl px-6">
        <Reveal>
          <h2 className="text-center font-display text-3xl italic text-ink md:text-4xl">Perguntas que todo mundo faz</h2>
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
