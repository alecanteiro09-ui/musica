"use client";

import { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";
import { AudioPlayer } from "./AudioPlayer";
import { KaraokeLyrics } from "./KaraokeLyrics";
import { QrCode } from "./QrCode";
import { FloatingHearts } from "./FloatingHearts";
import { ShareActions } from "./ShareActions";
import { relationshipPhoto } from "@/lib/gift/relationshipPhoto";
import { cn } from "@/lib/utils";
import type { GiftBundle } from "@/lib/actions/orders";

const PHOTO_INTERVAL_MS = 6000;

export function GiftExperience({
  gift,
  giftUrl,
  giftToken,
}: {
  gift: GiftBundle;
  giftUrl: string;
  giftToken: string;
}) {
  const track = gift.tracks[0];
  const customPhotos = gift.photos;
  const hasCustomPhotos = customPhotos.length > 0;

  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [activePhoto, setActivePhoto] = useState(0);

  useEffect(() => {
    if (customPhotos.length < 2) return;
    const t = setInterval(() => setActivePhoto((i) => (i + 1) % customPhotos.length), PHOTO_INTERVAL_MS);
    return () => clearInterval(t);
  }, [customPhotos.length]);

  useEffect(() => {
    if (!playing) return;
    let raf: number;
    const loop = () => {
      const el = audioRef.current;
      if (el) setCurrentTime(Math.round(el.currentTime * 10) / 10);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  function toggle() {
    const el = audioRef.current;
    if (!el) return;
    if (playing) el.pause();
    else el.play();
  }

  function seek(time: number) {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = time;
    setCurrentTime(time);
  }

  if (!track) {
    return <p className="text-center text-ink-muted">Este presente ainda não tem áudio disponível.</p>;
  }

  function openGift() {
    audioRef.current?.play();
    setRevealed(true);
  }

  return (
    <div className="relative min-h-screen" style={{ background: "#1A1420" }}>
      {/* Foto de fundo — a(s) que o casal/família subiu, ou um retrato em P&B
          combinando com o tipo de relação enquanto ninguém sobe nenhuma.
          Fixa atrás de todo o conteúdo pra dar aquele clima de "capa de
          álbum" em vez de um cartão solto no meio de uma página branca. */}
      <div className="fixed inset-0 z-0">
        {(hasCustomPhotos ? customPhotos : [{ id: "fallback", imageUrl: relationshipPhoto(gift.relationship) }]).map(
          (p, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={p.id}
              src={p.imageUrl}
              alt=""
              className={cn(
                "absolute inset-0 h-full w-full object-cover transition-opacity duration-[1800ms]",
                (hasCustomPhotos ? i === activePhoto : true) ? "opacity-100" : "opacity-0",
                !hasCustomPhotos && "grayscale"
              )}
            />
          )
        )}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(20,14,24,0.80) 0%, rgba(20,14,24,0.45) 32%, rgba(20,14,24,0.55) 60%, rgba(20,14,24,0.95) 100%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(circle at 80% 10%, rgba(255,122,84,0.22), transparent 45%)" }}
        />
      </div>

      <FloatingHearts active={revealed && playing} />

      <audio
        key={track.audioUrl}
        ref={audioRef}
        src={track.audioUrl}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        className="hidden"
      />

      {!revealed && (
        <div className="relative z-10 flex min-h-screen w-full flex-col items-center justify-center px-6 text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-wax">Verso Único</p>
          <h1 className="mt-4 max-w-md font-display text-4xl italic text-[#FBF7FA] sm:text-5xl">
            Uma música pra {gift.nickname}
          </h1>
          <p className="mt-3 text-sm text-[#C9BBCE]">Toque para ouvir</p>
          <button
            onClick={openGift}
            aria-label="Tocar a música"
            className="mt-10 flex h-20 w-20 items-center justify-center rounded-full bg-accent text-on-accent transition-transform animate-[pulse-ring_2.4s_ease-out_infinite] hover:scale-105 active:scale-95"
          >
            <Play size={30} fill="currentColor" className="ml-1" />
          </button>
        </div>
      )}

      {revealed && (
        <div className="relative z-10 mx-auto max-w-xl px-6 py-16" style={{ animation: "rise-in 0.7s ease both" }}>
          <p className="text-center text-sm uppercase tracking-wide text-accent">uma música para</p>
          <h1 className="mt-2 text-center font-display text-3xl italic text-[#FBF7FA]">{gift.nickname}</h1>

          <div className="mt-8">
            <AudioPlayer playing={playing} currentTime={currentTime} duration={track.durationSeconds} onToggle={toggle} onSeek={seek} />
          </div>

          <div className="mt-8">
            <KaraokeLyrics
              lyric={gift.lyric}
              wordTimestamps={(track.wordTimestamps as any) ?? null}
              currentTime={currentTime}
              dark
            />
          </div>

          <div className="mt-12 flex flex-col items-center gap-6 border-t border-white/10 pt-8">
            <ShareActions audioUrl={track.audioUrl} giftToken={giftToken} nickname={gift.nickname} />
            <div className="flex flex-col items-center gap-2">
              <QrCode value={giftUrl} size={120} />
              <p className="text-xs text-[#FBF7FA]/50">Aponte a câmera pra abrir esse presente de novo</p>
            </div>
          </div>

          <p className="mt-10 text-center text-xs text-[#FBF7FA]/40">Feito com Verso Único</p>
        </div>
      )}
    </div>
  );
}
