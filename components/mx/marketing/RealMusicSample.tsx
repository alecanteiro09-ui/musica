"use client";

import { useRef, useState } from "react";
import { Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/marketing/Reveal";

const BARS = [6, 14, 9, 18, 11, 20, 8, 16, 12, 22, 10, 15, 7, 19, 13, 9, 17, 11, 6, 14];

/**
 * Equivalente MX de RealMusicSample.tsx (Brasil) — misma pista real generada
 * por Verso Único que ya usa el DemoPreview del hero
 * (public/audio/landing-demo-mx-take1.mp3), no un jingle sintetizado.
 */
export function RealMusicSample() {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  function toggle() {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
      return;
    }
    el.play();
  }

  return (
    <section className="py-20">
      <div className="mx-auto max-w-2xl px-6 text-center">
        <Reveal>
          <p className="text-sm font-medium uppercase tracking-wide text-accent">música de verdad</p>
          <h2 className="mt-3 font-display text-3xl italic text-ink md:text-4xl">Esto no es un jingle genérico</h2>
          <p className="mx-auto mt-4 max-w-lg text-ink-muted">
            Letra escrita a la medida, producción de estudio, voz que emociona de verdad — escucha un fragmento real
            de un pedido hecho en Verso Único.
          </p>
        </Reveal>

        <Reveal delay={100}>
          <div className="mt-10 flex items-center gap-5 rounded-2xl border border-base-border bg-base-soft p-6 text-left shadow-card">
            <button
              type="button"
              onClick={toggle}
              aria-label={playing ? "Pausar" : "Tocar muestra"}
              className={cn(
                "flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent text-on-accent transition-transform hover:scale-105 active:scale-95",
                playing && "animate-[pulse-ring_1.6s_ease-out_infinite]"
              )}
            >
              {playing ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
            </button>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink">Muestra real · Verso Único</p>
              <div className="mt-3 flex h-8 items-end gap-[3px]" aria-hidden="true">
                {BARS.map((h, i) => (
                  <span
                    key={i}
                    className={cn("w-1 rounded-full bg-accent/40 transition-all duration-300", playing && "bg-accent")}
                    style={{
                      height: `${h}px`,
                      animation: playing ? `bar-bounce 900ms ease-in-out ${i * 60}ms infinite alternate` : undefined,
                    }}
                  />
                ))}
              </div>
            </div>

            <audio
              ref={audioRef}
              src="/audio/landing-demo-mx-take1.mp3"
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onEnded={() => setPlaying(false)}
              className="hidden"
            />
          </div>
        </Reveal>
      </div>

      <style>{`
        @keyframes bar-bounce {
          from { transform: scaleY(0.4); }
          to { transform: scaleY(1); }
        }
      `}</style>
    </section>
  );
}
