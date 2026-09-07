"use client";

import { useRef, useState } from "react";
import { Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/marketing/Reveal";

const CATEGORIES = [
  { id: "papa", emoji: "👨", label: "Papá", nickname: "tu papá", photo: "/images/occasions/pai.jpg", audio: "/audio/occasions/mx-papa-preview.mp3" },
  { id: "mama", emoji: "👩", label: "Mamá", nickname: "tu mamá", photo: "/images/occasions/mae.jpg", audio: "/audio/occasions/mx-mama-preview.mp3" },
  { id: "avos", emoji: "👵", label: "Abuelos", nickname: "tu abuela", photo: "/images/occasions/avos.jpg", audio: "/audio/occasions/mx-avos-preview.mp3" },
  { id: "filhos", emoji: "🧒", label: "Hijos", nickname: "tu hijo", photo: "/images/occasions/filhos.jpg", audio: "/audio/occasions/mx-filhos-preview.mp3" },
  { id: "namorados", emoji: "❤️", label: "Novios", nickname: "tu amor", photo: "/images/occasions/namorados.jpg", audio: "/audio/occasions/mx-namorados-preview.mp3" },
  { id: "esposa", emoji: "💍", label: "Esposa", nickname: "tu esposa", photo: "/images/occasions/esposa.jpg", audio: "/audio/occasions/mx-esposa-preview.mp3" },
  { id: "marido", emoji: "💍", label: "Esposo", nickname: "tu esposo", photo: "/images/occasions/marido.jpg", audio: "/audio/occasions/mx-marido-preview.mp3" },
  { id: "amiga", emoji: "👭", label: "Amiga", nickname: "tu amiga", photo: "/images/occasions/amiga.jpg", audio: "/audio/occasions/mx-amiga-preview.mp3" },
] as const;

/**
 * Equivalente MX de RelationshipGallery.tsx (Brasil) — mismas fotos de
 * banco (language-agnostic), pero 8 letras y grabaciones DIFERENTES,
 * generadas de verdad por Verso Único (Suno vía Kie.ai) en géneros
 * mexicanos distintos por categoría (mariachi, bolero, corridos, cumbia,
 * norteño, banda) — no es el mismo ejemplo genérico reciclado.
 */
export function RelationshipGallery() {
  const [active, setActive] = useState<(typeof CATEGORIES)[number]["id"]>("papa");
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
          <p className="text-center text-sm font-medium uppercase tracking-wide text-accent">ejemplo real</p>
          <h2 className="mt-3 text-center font-display text-3xl italic text-ink md:text-4xl">
            Mira cómo queda para cada tipo de relación
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-center text-ink-muted">
            Una letra y una grabación distintas para cada tipo de relación — para que sientas el ambiente de la
            página-regalo antes de contar tu propia historia.
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
                ejemplo
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
                aria-label={playing ? "Pausar" : "Tocar ejemplo"}
                className={cn(
                  "absolute bottom-4 left-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-on-accent transition-transform hover:scale-105 active:scale-95",
                  playing && "animate-[pulse-ring_1.6s_ease-out_infinite]"
                )}
              >
                {playing ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
              </button>
              <p className="absolute bottom-5 left-20 right-4 text-sm font-medium text-white">
                Una canción para {category.nickname}
              </p>
            </div>
            <audio
              key={category.audio}
              ref={audioRef}
              src={category.audio}
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
