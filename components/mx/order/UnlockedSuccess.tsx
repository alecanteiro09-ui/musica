"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import QRCode from "qrcode";
import { ImagePlus, Loader2, Sparkles } from "lucide-react";
import { uploadPhotoFile } from "@/lib/photos/uploadPhotoFile";
import { trackEvent } from "@/lib/analytics/track";
import { PhotoPdfStatus } from "./PhotoPdfStatus";
import type { OrderPhoto } from "@/types";

export function UnlockedSuccess({
  orderId,
  buyerToken,
  giftToken,
  priceCents,
  buyerEmail,
  photos,
  siteUrl,
}: {
  /** Usado solo para armar el event_id de Purchase (purchase_<orderId>) — necesita ser fijo para deduplicar entre el pixel del navegador y el que ya manda el webhook (lib/payments/confirm.ts). */
  orderId: string;
  buyerToken: string;
  giftToken: string;
  /** Valor realmente pagado (ya con descuento y upsell de foto, si aplica). */
  priceCents: number;
  buyerEmail: string | null;
  photos: OrderPhoto[];
  /** Viene de NEXT_PUBLIC_SITE_URL (Server Component) — nunca leer de window.location aquí. */
  siteUrl: string;
}) {
  const [qr, setQr] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const giftUrl = `${siteUrl}/mx/g/${giftToken}`;

  useEffect(() => {
    if (!giftUrl) return;
    QRCode.toDataURL(giftUrl, { margin: 1, width: 240 }).then(setQr);
  }, [giftUrl]);

  // Purchase también se dispara server-side por el webhook de Stripe en
  // cuanto el pago confirma (lib/payments/confirm.ts) — este es el pixel del
  // navegador, con el MISMO event_id, para que Meta/TikTok deduplicen los dos.
  useEffect(() => {
    trackEvent("Purchase", {
      eventId: `purchase_${orderId}`,
      valueCents: priceCents,
      currency: "MXN",
      contentName: "Canción personalizada",
      email: buyerEmail,
      externalId: buyerToken,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  function onPickFile() {
    fileInput.current?.click();
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    startTransition(async () => {
      const result = await uploadPhotoFile(buyerToken, file);
      if (!result.ok) setUploadError(result.error);
    });
    e.target.value = "";
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-16 text-center">
      <p className="text-sm uppercase tracking-wide text-success">regalo listo</p>
      <h1 className="mt-2 font-display text-2xl italic text-ink">Tu canción ya está disponible</h1>
      <p className="mt-2 text-sm text-ink-muted">Envía el enlace, o imprime el código QR y pégalo en un regalo físico.</p>

      {qr && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={qr} alt="Código QR del regalo" className="mx-auto mt-6 h-48 w-48 rounded-lg bg-white p-2" />
      )}

      <a
        href={`/mx/g/${giftToken}`}
        className="mt-6 block truncate rounded-xl border border-base-border bg-base-soft px-4 py-3 text-sm text-accent"
      >
        {giftUrl}
      </a>

      <a
        href={`/mx/g/${giftToken}`}
        target="_blank"
        rel="noreferrer"
        className="mt-4 inline-block rounded-full bg-accent px-6 py-3 font-medium text-on-accent transition-transform hover:scale-[1.02] hover:bg-accent-dim active:scale-[0.98]"
      >
        Abrir el regalo
      </a>

      <div className="mt-12 rounded-2xl border-2 border-accent-soft bg-accent-soft/40 p-6 text-left">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-bold uppercase tracking-wide text-on-accent">
          <Sparkles size={13} />
          Recomendado
        </span>
        <h2 className="mt-3 font-display text-xl italic text-ink">Complétalo con su foto</h2>
        <p className="mt-1.5 text-sm text-ink-muted">
          Hasta 12 fotos — se vuelven el fondo de la página del regalo, detrás de la canción y la letra en
          karaoke. Sin ninguna foto, usamos una imagen genérica según el tipo de relación — pero se ve mucho
          más especial con la foto real.
        </p>

        <div className="mt-5 grid grid-cols-4 gap-2.5">
          {photos.map((p) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={p.id} src={p.image_url} alt="" className="aspect-square rounded-xl object-cover shadow-card" />
          ))}
        </div>

        <button
          type="button"
          onClick={onPickFile}
          disabled={isPending}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-accent bg-base px-4 py-4 font-medium text-accent transition-colors hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? (
            <>
              <Loader2 size={18} className="animate-spin" /> Subiendo foto...
            </>
          ) : (
            <>
              <ImagePlus size={18} /> {photos.length > 0 ? "Agregar otra foto" : "Agregar foto ahora"}
            </>
          )}
        </button>
        <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
        {uploadError && <p className="mt-2 text-xs text-accent">{uploadError}</p>}
      </div>

      <PhotoPdfStatus buyerToken={buyerToken} />
    </div>
  );
}
