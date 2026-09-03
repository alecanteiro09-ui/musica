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
  /** Usado só pra montar o event_id de Purchase (purchase_<orderId>) — precisa ser fixo pra deduplicar entre o pixel do navegador e o repasse server-side já feito pelo webhook (lib/payments/confirm.ts) e pra não contar a mesma compra 2x se essa tela recarregar. */
  orderId: string;
  buyerToken: string;
  giftToken: string;
  /** Valor de fato pago (já com desconto e upsell de foto, se houver). */
  priceCents: number;
  buyerEmail: string | null;
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

  // Purchase também é disparado server-side pelo webhook da Woovi assim que
  // o pagamento confirma (lib/payments/confirm.ts) — esse aqui é o pixel do
  // navegador, com o MESMO event_id, pra Meta/TikTok deduplicarem os dois.
  // Fica em dobro de propósito: o servidor garante que a compra é contada
  // mesmo que a pessoa nunca abra essa tela (ex: pagou e fechou a aba); o
  // pixel do navegador garante a melhor janela de atribuição possível
  // quando ela abre.
  useEffect(() => {
    trackEvent("Purchase", {
      eventId: `purchase_${orderId}`,
      valueCents: priceCents,
      contentName: "Música personalizada",
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

      <div className="mt-12 rounded-2xl border-2 border-accent-soft bg-accent-soft/40 p-6 text-left">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-bold uppercase tracking-wide text-on-accent">
          <Sparkles size={13} />
          Recomendado
        </span>
        <h2 className="mt-3 font-display text-xl italic text-ink">Deixa com a foto de vocês</h2>
        <p className="mt-1.5 text-sm text-ink-muted">
          Até 12 fotos — elas viram o fundo da página do presente, atrás da música e da letra em karaokê. Sem
          foto nenhuma, a gente usa uma imagem genérica combinando com o tipo de relação — mas fica bem mais
          especial com a foto de verdade.
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
              <Loader2 size={18} className="animate-spin" /> Enviando foto...
            </>
          ) : (
            <>
              <ImagePlus size={18} /> {photos.length > 0 ? "Adicionar outra foto" : "Adicionar foto agora"}
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
