"use client";

import { useRef, useState } from "react";
import { Play, Pause } from "lucide-react";
import { parseTaggedLyric, formatMXN } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics/track";
import { CheckoutModal } from "./CheckoutModal";

const PREVIEW_CAP_SECONDS = 40;

export function PreviewAndPaywall({
  buyerToken,
  nickname,
  priceCents,
  discountCents,
  freePhoto,
  buyerEmail,
  lyric,
  previewAudioUrl,
  initialWantsPhotoPdf,
  initialPhotoPdfFrameSize,
}: {
  buyerToken: string;
  nickname: string;
  /** Precio base (con voz clonada, si aplica, y ya con el descuento de remarketing) — SIN el upsell de cuadro-foto. */
  priceCents: number;
  discountCents: number;
  freePhoto: boolean;
  buyerEmail: string;
  lyric: string;
  previewAudioUrl: string | null;
  initialWantsPhotoPdf: boolean;
  initialPhotoPdfFrameSize: string | null;
}) {
  const [checkoutOpen, setCheckoutOpen] = useState(false);
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

  function openCheckout() {
    trackEvent("AddToCart", {
      valueCents: priceCents,
      currency: "MXN",
      contentName: `Canción para ${nickname || "alguien especial"}`,
      email: buyerEmail,
      externalId: buyerToken,
    });
    setCheckoutOpen(true);
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-16">
      <p className="text-center text-sm uppercase tracking-wide text-accent">falta un paso</p>
      <h1 className="mt-2 text-center font-display text-2xl italic text-ink">
        La canción de {nickname || "ustedes"} ya está grabada
      </h1>
      <p className="mt-2 text-center text-sm text-ink-muted">
        Escuchas {PREVIEW_CAP_SECONDS}s gratis, ahora mismo. Continúa y termina exactamente como la escribiste.
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
          <p className="text-sm text-ink-muted">Fragmento de {PREVIEW_CAP_SECONDS}s — la canción completa es más larga.</p>
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

      <ul className="mt-8 space-y-2 text-sm text-ink-muted">
        {[
          "La canción completa, cantada como tú la elegiste",
          "La página-regalo con fotos y la letra encendiéndose en karaoke",
          "Enlace y código QR listos para enviar",
          "El MP3 para descargar y guardar para siempre",
        ].map((item) => (
          <li key={item} className="flex items-start gap-2">
            <span className="mt-0.5 text-accent">✓</span>
            {item}
          </li>
        ))}
      </ul>

      {(discountCents > 0 || freePhoto) && (
        <p className="mt-6 text-center text-xs font-medium text-accent">
          🎁 {discountCents > 0 && `Descuento de ${formatMXN(discountCents)}`}
          {discountCents > 0 && freePhoto && " + "}
          {freePhoto && "cuadro en PDF gratis"} ya aplicados
        </p>
      )}

      <button
        type="button"
        onClick={openCheckout}
        className={`w-full animate-[pulse-ring_2.4s_ease-out_infinite] rounded-full bg-accent px-6 py-3 font-medium text-on-accent transition-transform hover:scale-[1.02] hover:bg-accent-dim active:scale-[0.98] ${discountCents > 0 || freePhoto ? "mt-3" : "mt-6"}`}
      >
        Quiero la canción completa — {formatMXN(priceCents)}
      </button>

      <p className="mt-4 text-center text-xs text-ink-muted">
        Pago único con tarjeta, liberación automática. ¿No te gustó? Te devolvemos, sin preguntas.
      </p>

      {checkoutOpen && (
        <CheckoutModal
          buyerToken={buyerToken}
          nickname={nickname}
          priceCents={priceCents}
          freePhoto={freePhoto}
          buyerEmail={buyerEmail}
          initialWantsPhotoPdf={initialWantsPhotoPdf}
          initialFrameSize={initialPhotoPdfFrameSize}
          onClose={() => setCheckoutOpen(false)}
        />
      )}
    </div>
  );
}
