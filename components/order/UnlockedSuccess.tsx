"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import QRCode from "qrcode";
import { ImagePlus, Loader2 } from "lucide-react";
import { uploadOrderPhoto } from "@/lib/actions/photos";
import type { OrderPhoto } from "@/types";

export function UnlockedSuccess({
  buyerToken,
  giftToken,
  photos,
  siteUrl,
}: {
  buyerToken: string;
  giftToken: string;
  photos: OrderPhoto[];
  /** Vem de NEXT_PUBLIC_SITE_URL (Server Component) — nunca ler de window.location aqui:
   *  isso rende diferente no servidor (sem window) e no cliente, e quebra a hidratação. */
  siteUrl: string;
}) {
  const [qr, setQr] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const giftUrl = `${siteUrl}/g/${giftToken}`;

  useEffect(() => {
    if (!giftUrl) return;
    QRCode.toDataURL(giftUrl, { margin: 1, width: 240 }).then(setQr);
  }, [giftUrl]);

  function onPickFile() {
    fileInput.current?.click();
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    const formData = new FormData();
    formData.set("photo", file);
    startTransition(async () => {
      const result = await uploadOrderPhoto(buyerToken, formData);
      if (!result.ok) setUploadError(result.error);
    });
    e.target.value = "";
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-16 text-center">
      <p className="text-sm uppercase tracking-wide text-success">presente pronto</p>
      <h1 className="mt-2 font-display text-2xl italic text-ink">Sua música está liberada</h1>
      <p className="mt-2 text-sm text-ink-muted">Envie o link, ou imprima o QR Code e cole num presente físico.</p>

      {qr && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={qr} alt="QR Code do presente" className="mx-auto mt-6 h-48 w-48 rounded-lg bg-white p-2" />
      )}

      <a
        href={`/g/${giftToken}`}
        className="mt-6 block truncate rounded-xl border border-base-border bg-base-soft px-4 py-3 text-sm text-accent"
      >
        {giftUrl}
      </a>

      <a
        href={`/g/${giftToken}`}
        target="_blank"
        rel="noreferrer"
        className="mt-4 inline-block rounded-full bg-accent px-6 py-3 font-medium text-on-accent transition-transform hover:scale-[1.02] hover:bg-accent-dim active:scale-[0.98]"
      >
        Abrir o presente
      </a>

      <div className="mt-12 text-left">
        <h2 className="font-display text-lg italic text-ink">Uma foto de fundo (opcional, mas fica lindo)</h2>
        <p className="mt-1 text-xs text-ink-muted">
          Até 12 fotos — elas viram o fundo da página do presente, atrás da música e da letra. Sem foto nenhuma, a
          gente usa uma imagem combinando com o tipo de relação.
        </p>

        <div className="mt-4 grid grid-cols-4 gap-2">
          {photos.map((p) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={p.id} src={p.image_url} alt="" className="aspect-square rounded-lg object-cover" />
          ))}
          <button
            type="button"
            onClick={onPickFile}
            disabled={isPending}
            className="flex aspect-square items-center justify-center rounded-lg border border-dashed border-base-border text-ink-muted hover:border-accent-dim"
          >
            {isPending ? <Loader2 size={18} className="animate-spin" /> : <ImagePlus size={18} />}
          </button>
        </div>
        <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
        {uploadError && <p className="mt-2 text-xs text-accent">{uploadError}</p>}
      </div>
    </div>
  );
}
