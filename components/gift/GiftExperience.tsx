"use client";

import { useEffect, useRef, useState } from "react";
import { Download } from "lucide-react";
import { AudioPlayer } from "./AudioPlayer";
import { KaraokeLyrics } from "./KaraokeLyrics";
import { PhotoSlideshow } from "./PhotoSlideshow";
import { QrCode } from "./QrCode";
import type { GiftBundle } from "@/lib/actions/orders";

export function GiftExperience({ gift, giftUrl }: { gift: GiftBundle; giftUrl: string }) {
  const [activeVariant, setActiveVariant] = useState(gift.tracks[0]?.variant ?? "take_1");
  const track = gift.tracks.find((t) => t.variant === activeVariant) ?? gift.tracks[0];

  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

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

  return (
    <div className="mx-auto max-w-xl px-6 py-16">
      <p className="text-center text-sm uppercase tracking-wide text-accent">uma música para</p>
      <h1 className="mt-2 text-center font-display text-3xl italic text-ink">{gift.nickname}</h1>

      <div className="mt-6">
        <PhotoSlideshow photos={gift.photos.map((p) => ({ id: p.id, imageUrl: p.imageUrl }))} />
      </div>

      <div className="mt-6">
        <AudioPlayer
          playing={playing}
          currentTime={currentTime}
          duration={track.durationSeconds}
          onToggle={toggle}
          onSeek={seek}
          variants={gift.tracks.map((t) => t.variant)}
          activeVariant={activeVariant}
          onChangeVariant={(v) => {
            setActiveVariant(v);
            setPlaying(false);
            setCurrentTime(0);
          }}
        />
        <audio
          key={track.audioUrl}
          ref={audioRef}
          src={track.audioUrl}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          className="hidden"
        />
      </div>

      <div className="mt-8">
        <KaraokeLyrics
          lyric={gift.lyric}
          wordTimestamps={(track.wordTimestamps as any) ?? null}
          currentTime={currentTime}
        />
      </div>

      <div className="mt-12 flex flex-col items-center gap-4 border-t border-base-border pt-8">
        <QrCode value={giftUrl} size={140} />
        <a
          href={track.audioUrl}
          download
          className="inline-flex items-center gap-2 rounded-full border border-base-border px-5 py-2 text-sm text-ink-muted hover:border-accent-dim"
        >
          <Download size={16} /> Baixar MP3
        </a>
      </div>

      <p className="mt-10 text-center text-xs text-ink-muted">Feito com Verso Único</p>
    </div>
  );
}
