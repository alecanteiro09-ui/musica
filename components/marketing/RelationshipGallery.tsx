"use client";

import { useRef, useState } from "react";
import { Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";
import { Reveal } from "./Reveal";

const CATEGORIES = [
  { id: "pai", emoji: "👨", label: "Pai", nickname: "seu pai", photo: "/images/occasions/pai.jpg" },
  { id: "mae", emoji: "👩", label: "Mãe", nickname: "sua mãe", photo: "/images/occasions/mae.jpg" },
  { id: "avos", emoji: "👵", label: "Avós", nickname: "sua avó", photo: "/images/occasions/avos.jpg" },
  { id: "filhos", emoji: "🧒", label: "Filhos", nickname: "seu filho", photo: "/images/occasions/filhos.jpg" },
  { id: "namorados", emoji: "❤️", label: "Namorados", nickname: "seu amor", photo: "/images/occasions/namorados.jpg" },
  { id: "esposa", emoji: "💍", label: "Esposa", nickname: "sua esposa", photo: "/images/occasions/esposa.jpg" },
  { id: "marido", emoji: "💍", label: "Marido", nickname: "seu marido", photo: "/images/occasions/marido.jpg" },
  { id: "amiga", emoji: "👭", label: "Amiga", nickname: "sua amiga", photo: "/images/occasions/amiga.jpg" },
] as const;

/**
 * Fotos: banco licenciado (Pexels License — uso comercial livre), uma por
 * categoria, sem relação com o Serenata Gift além do gênero da foto
 * (retrato/casal genérico). Áudio: a MESMA faixa real gerada pelo Verso
 * Único (public/audio/landing-demo-take1.mp3) em todas as abas — por isso
 * o selo "exemplo" fica sempre visível e a legenda não afirma ser uma
 * composição diferente por categoria. Inventar 8 letras/gravações
 * distintas exigiria 8 pedidos reais que não temos; fingir que existem
 * seria enganoso.
 */
export function RelationshipGallery() {
  const [active, setActive] = useState<(typeof CATEGORIES)[number]["id"]>("pai");
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const category = CATEGORIES.find((c) => c.id === active)!;

  function toggle() {
    const el = audioRef.current;
    if (!el) return;
    if (playing) el.pause();
    else el.play();
  }

  return (
    <section className="py-20">
      <div className="mx-auto max-w-3xl px-6">
        <Reveal>
          <p className="text-center text-sm font-medium uppercase tracking-wide text-accent">exemplo real</p>
          <h2 className="mt-3 text-center font-display text-3xl italic text-ink md:text-4xl">
            Veja como fica pra cada tipo de relação
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-center text-ink-muted">
            O mesmo trecho cantado, mostrando o clima da página-presente pra quem você quer homenagear. A sua vai
            nascer da sua própria história.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setActive(c.id);
                  setPlaying(false);
                  audioRef.current?.pause();
                  if (audioRef.current) audioRef.current.currentTime = 0;
                }}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm transition-colors",
                  active === c.id
                    ? "border-accent bg-accent text-on-accent"
                    : "border-base-border bg-base-soft text-ink-muted hover:border-accent-dim"
                )}
              >
                {c.emoji} {c.label}
              </button>
            ))}
          </div>

          <div className="mx-auto mt-8 max-w-xs">
            <div className="relative overflow-hidden rounded-2xl shadow-card">
              <span className="absolute right-3 top-3 z-10 rounded-full bg-black/60 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white">
                exemplo
              </span>
              <img
                key={category.photo}
                src={category.photo}
                alt=""
                className="h-72 w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0" />
              <button
                type="button"
                onClick={toggle}
                aria-label={playing ? "Pausar" : "Tocar exemplo"}
                className={cn(
                  "absolute bottom-4 left-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-on-accent transition-transform hover:scale-105 active:scale-95",
                  playing && "animate-[pulse-ring_1.6s_ease-out_infinite]"
                )}
              >
                {playing ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
              </button>
              <p className="absolute bottom-5 left-20 right-4 text-sm font-medium text-white">
                Uma música pra {category.nickname}
              </p>
            </div>
            <audio
              ref={audioRef}
              src="/audio/landing-demo-take1.mp3"
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onEnded={() => setPlaying(false)}
              className="hidden"
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
