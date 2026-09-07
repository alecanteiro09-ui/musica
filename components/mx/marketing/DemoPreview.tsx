"use client";

import { useRef, useState } from "react";
import { Play, Pause } from "lucide-react";
import { KaraokeLyrics } from "@/components/gift/KaraokeLyrics";
import { cn } from "@/lib/utils";
import type { WordTimestamp } from "@/types";

const DEMO_LYRIC = [
  "[Verse]",
  "Fue en un detalle pequeño",
  "que nuestra historia se hizo canción",
  "[Chorus]",
  "Esta de aquí es tuya, es nuestra",
  "como solo tú y yo sabemos contar",
  "aunque el tiempo pase volando",
  "esta es la parte que quiero guardar",
].join("\n");

// Misma proporción de tiempo que el equivalente BR (DemoPreview.tsx) — ver
// el comentario allá sobre por qué un ritmo interpolado uniforme necesita
// un pequeño respiro inicial antes de la voz entrar.
const INTRO_OFFSET = 2;
const SUNG_DURATION = 28;
const DEMO_DURATION = INTRO_OFFSET + SUNG_DURATION;

function buildTimestamps(lyric: string, offset: number, duration: number): WordTimestamp[] {
  const words = lyric
    .split("\n")
    .filter((l) => !l.trim().startsWith("["))
    .join(" ")
    .split(/\s+/)
    .filter(Boolean);
  const step = duration / words.length;
  return words.map((word, i) => ({
    word,
    start: +(offset + i * step).toFixed(2),
    end: +(offset + (i + 1) * step).toFixed(2),
  }));
}

const TIMESTAMPS = buildTimestamps(DEMO_LYRIC, INTRO_OFFSET, SUNG_DURATION);

const SPARKLES = [
  { left: "12%", top: "22%", size: 12, delay: "0s", duration: "2.6s" },
  { left: "82%", top: "18%", size: 9, delay: "0.8s", duration: "3.1s" },
  { left: "60%", top: "60%", size: 10, delay: "1.4s", duration: "2.8s" },
  { left: "30%", top: "70%", size: 8, delay: "0.4s", duration: "3.4s" },
];

/**
 * Equivalente MX de DemoPreview.tsx (Brasil) — mismo mecanismo, con una
 * pista real generada por Verso Único en mariachi/español (Suno vía Kie.ai
 * — ver lib/ai/providers/real-music.ts), guardada en
 * public/audio/landing-demo-mx-take1.mp3.
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
    <div className="relative mx-auto w-full max-w-sm overflow-hidden rounded-2xl border border-base-border bg-base-soft shadow-card">
      <div className="relative h-28 overflow-hidden">
        <img src="/images/occasions/namorados.jpg" alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-black/0" />
        {SPARKLES.map((s, i) => (
          <span
            key={i}
            className="absolute text-wax"
            style={{
              left: s.left,
              top: s.top,
              fontSize: s.size,
              animation: `sparkle ${s.duration} ease-in-out infinite`,
              animationDelay: s.delay,
            }}
          >
            ✦
          </span>
        ))}
        <span className="absolute right-3 top-3 rounded-full bg-black/50 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white">
          ejemplo
        </span>
        <div className="absolute bottom-2.5 left-4">
          <p className="text-[10px] uppercase tracking-wide text-white/80">una canción para</p>
          <p className="font-display text-xl italic text-white">Ana</p>
        </div>
      </div>

      <div className="p-6 pt-5">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={toggle}
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-on-accent transition-all hover:scale-105 active:scale-95",
            playing && "animate-[pulse-ring_1.6s_ease-out_infinite]"
          )}
          aria-label={playing ? "Pausar" : "Escuchar ejemplo"}
        >
          {playing ? <Pause size={18} /> : <Play size={18} />}
        </button>
        <Waveform playing={playing} />
      </div>
      <audio
        ref={audioRef}
        src="/audio/landing-demo-mx-take1.mp3"
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
