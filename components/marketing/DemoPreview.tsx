"use client";

import { useRef, useState } from "react";
import { Play, Pause } from "lucide-react";
import { KaraokeLyrics } from "@/components/gift/KaraokeLyrics";
import { cn } from "@/lib/utils";
import type { WordTimestamp } from "@/types";

const DEMO_LYRIC = [
  "[Verse]",
  "Foi num detalhe pequeno",
  "que a gente virou canção",
  "[Chorus]",
  "Essa aqui é sua, é nossa",
  "do jeito que só a gente sabe contar",
  "por mais que o tempo passe rápido",
  "essa é a parte que eu quero guardar",
].join("\n");

const DEMO_DURATION = 18;

function buildTimestamps(lyric: string, duration: number): WordTimestamp[] {
  const words = lyric
    .split("\n")
    .filter((l) => !l.trim().startsWith("["))
    .join(" ")
    .split(/\s+/)
    .filter(Boolean);
  const step = duration / words.length;
  return words.map((word, i) => ({ word, start: +(i * step).toFixed(2), end: +((i + 1) * step).toFixed(2) }));
}

const TIMESTAMPS = buildTimestamps(DEMO_LYRIC, DEMO_DURATION);

/**
 * Demo ao vivo pra landing page: toca um trecho de uma faixa real, gerada
 * pelo Verso Único (Suno via Kie.ai — ver lib/ai/providers/real-music.ts),
 * salva em public/audio/landing-demo-take1.mp3. A letra acendendo em
 * karaokê é a mesma experiência de quem recebe um presente de verdade, só
 * que com um exemplo genérico. Substitui um vídeo/gif de reação real, que
 * exigiria licenciar imagem de pessoas de verdade.
 */
export function DemoPreview() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [hearts, setHearts] = useState<number[]>([]);

  function toggle() {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
    } else {
      el.currentTime = 0;
      el.play();
      const id = Date.now();
      setHearts((h) => [...h, id]);
      setTimeout(() => setHearts((h) => h.filter((x) => x !== id)), 1800);
    }
  }

  function onTimeUpdate() {
    const el = audioRef.current;
    if (!el) return;
    if (el.currentTime >= DEMO_DURATION) {
      el.pause();
      el.currentTime = 0;
      setCurrentTime(0);
      return;
    }
    setCurrentTime(el.currentTime);
  }

  return (
    <div className="relative mx-auto w-full max-w-sm overflow-hidden rounded-2xl border border-base-border bg-base-soft p-6 shadow-card">
      <span className="absolute right-4 top-4 rounded-full border border-base-border px-2 py-0.5 text-[10px] uppercase tracking-wide text-ink-muted">
        exemplo
      </span>

      <p className="text-xs uppercase tracking-wide text-accent">uma música para</p>
      <h3 className="mt-1 font-display text-2xl italic text-ink">Ana</h3>

      <div className="mt-5 flex items-center gap-4">
        <button
          type="button"
          onClick={toggle}
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-on-accent transition-all hover:scale-105 active:scale-95",
            playing && "animate-[pulse-ring_1.6s_ease-out_infinite]"
          )}
          aria-label={playing ? "Pausar" : "Tocar exemplo"}
        >
          {playing ? <Pause size={18} /> : <Play size={18} />}
        </button>
        <Waveform playing={playing} />
      </div>
      <audio
        ref={audioRef}
        src="/audio/landing-demo-take1.mp3"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={onTimeUpdate}
        className="hidden"
      />

      <div className="mt-6">
        <KaraokeLyrics lyric={DEMO_LYRIC} wordTimestamps={TIMESTAMPS} currentTime={currentTime} />
      </div>

      {hearts.map((id) => (
        <span
          key={id}
          className="pointer-events-none absolute bottom-10 right-10 animate-[float-up_1.8s_ease-out_forwards] text-lg"
        >
          🧡
        </span>
      ))}
    </div>
  );
}

const BAR_DELAYS = [0, 0.12, 0.24, 0.08, 0.2];

function Waveform({ playing }: { playing: boolean }) {
  return (
    <div className="flex h-8 flex-1 items-center gap-1">
      {BAR_DELAYS.map((delay, i) => (
        <span
          key={i}
          className={cn(
            "w-1 rounded-full bg-accent/60 transition-all duration-300",
            playing ? "h-6 animate-[wave-bounce_0.9s_ease-in-out_infinite]" : "h-2"
          )}
          style={{ animationDelay: `${delay}s` }}
        />
      ))}
    </div>
  );
}
