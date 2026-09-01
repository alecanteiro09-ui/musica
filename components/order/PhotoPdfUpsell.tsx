"use client";

import { useEffect, useState } from "react";
import { Frame, Download, Check, Loader2, Copy } from "lucide-react";
import { createPhotoPdfOrder, getPhotoPdfOrderStatus } from "@/lib/actions/photoPdf";
import { FRAME_SIZES, type FrameSizeKey } from "@/lib/frameSizes";
import { PHOTO_PDF_ADDON_CENTS } from "@/lib/pricing";
import { formatBRL } from "@/lib/utils";

const STAGE_LABEL: Record<string, string> = {
  paid: "Preparando a foto...",
  generating: "A IA está deixando a foto linda...",
};

export function PhotoPdfUpsell({ buyerToken, photos }: { buyerToken: string; photos: { id: string; image_url: string }[] }) {
  const [frameSize, setFrameSize] = useState<FrameSizeKey>("20x30");
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(photos[0]?.image_url ?? null);
  const [charge, setCharge] = useState<{ photoPdfOrderId: string; brCode: string; qrCodeImageUrl: string } | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!charge || pdfUrl) return;
    const poll = setInterval(async () => {
      const result = await getPhotoPdfOrderStatus(charge.photoPdfOrderId);
      setStatus(result.status);
      if (result.status === "ready" && result.pdfUrl) {
        setPdfUrl(result.pdfUrl);
        clearInterval(poll);
      }
      if (result.status === "failed") {
        setError(result.error || "Não deu pra gerar a foto agora.");
        clearInterval(poll);
      }
    }, 3000);
    return () => clearInterval(poll);
  }, [charge, pdfUrl]);

  if (photos.length === 0) {
    return null;
  }

  async function handleBuy() {
    if (!selectedPhoto) return;
    setLoading(true);
    setError(null);
    const result = await createPhotoPdfOrder(buyerToken, frameSize, selectedPhoto);
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setCharge(result);
    setStatus("pending_payment");
  }

  function copyCode() {
    if (!charge) return;
    navigator.clipboard.writeText(charge.brCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mt-12 rounded-2xl border border-base-border bg-base-soft p-6 text-left">
      <div className="flex items-center gap-2 text-accent">
        <Frame size={18} />
        <p className="text-xs font-medium uppercase tracking-wide">upsell</p>
      </div>
      <h2 className="mt-2 font-display text-lg italic text-ink">Quer essa foto pronta pra emoldurar?</h2>
      <p className="mt-1 text-sm text-ink-muted">
        A gente trata a foto com IA pra ficar com cara de estúdio profissional e monta um PDF exatamente no tamanho do
        quadro que você escolher. Chega no seu e-mail também.
      </p>

      {!charge && (
        <>
          <div className="mt-4 grid grid-cols-4 gap-2">
            {photos.map((p) => (
              // eslint-disable-next-line @next/next/no-img-element
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedPhoto(p.image_url)}
                className={`overflow-hidden rounded-lg border-2 ${selectedPhoto === p.image_url ? "border-accent" : "border-transparent"}`}
              >
                <img src={p.image_url} alt="" className="aspect-square object-cover" />
              </button>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {(Object.keys(FRAME_SIZES) as FrameSizeKey[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setFrameSize(key)}
                className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                  frameSize === key ? "border-accent bg-accent text-on-accent" : "border-base-border text-ink-muted hover:border-accent-dim"
                }`}
              >
                {FRAME_SIZES[key].label}
              </button>
            ))}
          </div>

          {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

          <button
            type="button"
            onClick={handleBuy}
            disabled={loading || !selectedPhoto}
            className="mt-5 flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-medium text-on-accent transition-transform hover:scale-[1.02] hover:bg-accent-dim active:scale-[0.98] disabled:opacity-60"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Quero a foto — {formatBRL(PHOTO_PDF_ADDON_CENTS)}
          </button>
        </>
      )}

      {charge && !pdfUrl && !error && (
        <div className="mt-5 flex flex-col items-center rounded-xl border border-base-border bg-base p-5 text-center">
          {status && status !== "pending_payment" ? (
            <div className="flex items-center gap-2 py-4 text-sm text-ink-muted">
              <Loader2 size={16} className="animate-spin text-accent" />
              {STAGE_LABEL[status] || "Preparando..."}
            </div>
          ) : (
            <>
              <p className="text-sm text-ink-muted">Pague {formatBRL(PHOTO_PDF_ADDON_CENTS)} com Pix pra liberar</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={charge.qrCodeImageUrl} alt="QR Code Pix" className="mx-auto mt-3 h-40 w-40 rounded-lg bg-white p-2" />
              <button type="button" onClick={copyCode} className="mt-3 flex items-center gap-2 rounded-full border border-base-border px-4 py-2 text-xs text-ink-muted hover:border-accent-dim">
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Copiado" : "Copiar código Pix"}
              </button>
              <p className="mt-3 flex items-center gap-2 text-xs text-ink-muted">
                <Loader2 size={12} className="animate-spin" /> Aguardando pagamento...
              </p>
            </>
          )}
        </div>
      )}

      {error && (
        <p className="mt-4 text-sm text-red-500">{error}</p>
      )}

      {pdfUrl && (
        <div className="mt-5 flex flex-col items-center gap-3 rounded-xl border border-success/30 bg-success/10 p-5 text-center">
          <p className="text-sm font-medium text-success">Sua foto está pronta! Também mandamos por e-mail.</p>
          <a
            href={pdfUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-medium text-on-accent transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <Download size={16} /> Baixar o PDF
          </a>
        </div>
      )}
    </div>
  );
}
