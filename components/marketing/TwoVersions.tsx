"use client";

import { useRef, useState } from "react";
import { Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";
import { Reveal } from "./Reveal";

const TRACKS = [
  { id: "take1", label: "Versão 1", src: "/audio/landing-demo-take1.mp3" },
  { id: "take2", label: "Versão 2", src: "/audio/landing-demo-take2.mp3" },
] as const;

/**
 * Toda música do Verso Único vem em 2 versões cantadas — você escolhe a que
 * mais parece com a pessoa antes de decidir. Aqui usamos as 2 faixas reais
 * de um pedido de teste (mesma letra, interpretações diferentes) pra provar
 * isso, em vez de inventar uma galeria com relações que não gravamos de verdade.
 */
export function TwoVersions() {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({});

  function toggle(id: string) {
    const current = audioRefs.current[id];
    if (!current) return;
    if (playingId === id) {
      current.pause();
      return;
    }
    if (playingId) audioRefs.current[playingId]?.pause();
    current.currentTime = 0;
    current.play();
  }

  return (
    <section className="py-20">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <Reveal>
          <p className="text-sm font-medium uppercase tracking-wide text-accent">músicas de verdade</p>
          <h2 className="mt-3 font-display text-3xl italic text-ink md:text-4xl">
            Toda música vem em duas versões
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-ink-muted">
            Mesma letra, duas interpretações cantadas diferentes — você escolhe a que mais parece com vocês antes
            de levar a música completa. Ouça um trecho real de um pedido gravado no Verso Único.
          </p>
        </Reveal>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {TRACKS.map((track, i) => {
            const playing = playingId === track.id;
            return (
              <Reveal key={track.id} delay={i * 100}>
                <div className="flex items-center gap-4 rounded-2xl border border-base-border bg-base-soft p-5 text-left shadow-card">
                  <button
                    type="button"
                    onClick={() => toggle(track.id)}
                    aria-label={playing ? "Pausar" : `Tocar ${track.label}`}
                    className={cn(
                      "flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-on-accent transition-transform hover:scale-105 active:scale-95",
                      playing && "animate-[pulse-ring_1.6s_ease-out_infinite]"
                    )}
                  >
                    {playing ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
                  </button>
                  <div>
                    <p className="text-sm font-semibold text-ink">{track.label}</p>
                    <p className="text-xs text-ink-muted">Verso Único · pedido de teste</p>
                  </div>
                  <audio
                    ref={(el) => {
                      audioRefs.current[track.id] = el;
                    }}
                    src={track.src}
                    onPlay={() => setPlayingId(track.id)}
                    onPause={() => setPlayingId((p) => (p === track.id ? null : p))}
                    onEnded={() => setPlayingId((p) => (p === track.id ? null : p))}
                    className="hidden"
                  />
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
