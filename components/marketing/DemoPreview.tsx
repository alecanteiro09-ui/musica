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

// A faixa real (public/audio/landing-demo-take1.mp3) não vem com timing
// palavra-a-palavra do provedor — assim como pedidos reais sem alinhamento
// (ver aviso em real-music.ts), é interpolado uniformemente. O erro visível
// antes era outro: quando a letra foi de 2 pra 6 linhas, a duração só
// subiu de 13s pra 18s (2,25s/linha — rápido demais pra qualquer música
// pop de verdade), fazendo o karaokê disparar bem à frente do que estava
// sendo cantado. Ajustado pra um ritmo plausível (verso mais falado,
// refrão mais espaçado) com uma pequena folga inicial pro instrumental.
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
          exemplo
        </span>
        <div className="absolute bottom-2.5 left-4">
          <p className="text-[10px] uppercase tracking-wide text-white/80">uma música para</p>
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
