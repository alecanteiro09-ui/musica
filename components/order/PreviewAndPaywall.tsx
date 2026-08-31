"use client";

import { useRef, useState } from "react";
import { Play, Pause } from "lucide-react";
import { parseTaggedLyric, formatBRL } from "@/lib/utils";
import { PixCharge } from "./PixCharge";

const PREVIEW_CAP_SECONDS = 40;

export function PreviewAndPaywall({
  buyerToken,
  nickname,
  priceCents,
  lyric,
  previewAudioUrl,
}: {
  buyerToken: string;
  nickname: string;
  priceCents: number;
  lyric: string;
  previewAudioUrl: string | null;
}) {
  const [wantsToPay, setWantsToPay] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  function toggle() {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
    } else {
      el.play();
    }
  }

  function onTimeUpdate() {
    const el = audioRef.current;
    if (!el) return;
    if (el.currentTime >= PREVIEW_CAP_SECONDS) {
      el.pause();
      el.currentTime = 0;
      setPlaying(false);
    }
  }

  const blocks = parseTaggedLyric(lyric);

  return (
    <div className="mx-auto max-w-xl px-6 py-16">
      <p className="text-center text-sm uppercase tracking-wide text-accent">falta um passo</p>
      <h1 className="mt-2 text-center font-display text-2xl italic text-ink">
        A música de {nickname || "vocês"} já está gravada
      </h1>
      <p className="mt-2 text-center text-sm text-ink-muted">
        Você ouve {PREVIEW_CAP_SECONDS}s grátis, agora. Ela continua e termina do jeito exato que você escreveu.
      </p>

      {previewAudioUrl && (
        <div className="mt-8 flex items-center gap-4 rounded-xl border border-base-border bg-base-soft p-4">
          <button
            type="button"
            onClick={toggle}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-on-accent transition-transform hover:scale-105 active:scale-95"
          >
            {playing ? <Pause size={20} /> : <Play size={20} />}
          </button>
          <p className="text-sm text-ink-muted">Trecho de {PREVIEW_CAP_SECONDS}s — a música completa é maior.</p>
          <audio
            ref={audioRef}
            src={previewAudioUrl}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onTimeUpdate={onTimeUpdate}
            className="hidden"
          />
        </div>
      )}

      <div className="mt-8 rounded-xl border border-base-border bg-base-soft p-5 text-sm leading-relaxed text-ink-muted">
        {blocks.map((block, i) => (
          <div key={i} className="mb-4 last:mb-0">
            {block.tag && <p className="mb-1 text-xs uppercase tracking-wide text-accent">{block.tag}</p>}
            {block.lines.map((line, j) => (
              <p key={j}>{line}</p>
            ))}
          </div>
        ))}
      </div>

      {!wantsToPay && (
        <ul className="mt-8 space-y-2 text-sm text-ink-muted">
          {[
            "A música completa, cantada, em 2 versões diferentes",
            "A página-presente com fotos e a letra acendendo em karaokê",
            "Link e QR Code prontos pra enviar",
            "O MP3 pra baixar e guardar pra sempre",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="mt-0.5 text-accent">✓</span>
              {item}
            </li>
          ))}
        </ul>
      )}

      {!wantsToPay ? (
        <button
          type="button"
          onClick={() => setWantsToPay(true)}
          className="mt-6 w-full animate-[pulse-ring_2.4s_ease-out_infinite] rounded-full bg-accent px-6 py-3 font-medium text-on-accent transition-transform hover:scale-[1.02] hover:bg-accent-dim active:scale-[0.98]"
        >
          Quero a música completa — {formatBRL(priceCents)}
        </button>
      ) : (
        <PixCharge buyerToken={buyerToken} priceCents={priceCents} />
      )}

      <p className="mt-4 text-center text-xs text-ink-muted">
        Pagamento único via Pix, liberação automática. Não gostou? A gente devolve, sem perguntas.
      </p>
    </div>
  );
}
