"use client";

import { useEffect, useState } from "react";
import { Download, Loader2, Frame } from "lucide-react";
import { getPhotoPdfForOrder, getPhotoPdfOrderStatus } from "@/lib/actions/photoPdf";

const STAGE_LABEL: Record<string, string> = {
  paid: "Preparando sua foto de quadro...",
  generating: "A IA está deixando a foto linda...",
};

/**
 * Mostra o progresso/download da foto-quadro quando esse upsell foi
 * escolhido no checkout (ver CheckoutModal) — a decisão já foi tomada e paga
 * junto com a música, então aqui é só acompanhamento, sem botão de compra.
 */
export function PhotoPdfStatus({ buyerToken }: { buyerToken: string }) {
  const [photoPdfOrderId, setPhotoPdfOrderId] = useState<string | null | undefined>(undefined);
  const [status, setStatus] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPhotoPdfForOrder(buyerToken).then((row) => setPhotoPdfOrderId(row?.id ?? null));
  }, [buyerToken]);

  useEffect(() => {
    if (!photoPdfOrderId || pdfUrl) return;
    const poll = setInterval(async () => {
      const result = await getPhotoPdfOrderStatus(photoPdfOrderId);
      setStatus(result.status);
      if (result.status === "ready" && result.pdfUrl) {
        setPdfUrl(result.pdfUrl);
        clearInterval(poll);
      }
      if (result.status === "failed") {
        setError(result.error || "Não deu pra gerar a foto agora.");
        clearInterval(poll);
      }
    }, 2000);
    return () => clearInterval(poll);
  }, [photoPdfOrderId, pdfUrl]);

  if (!photoPdfOrderId) return null;

  return (
    <div className="mt-12 rounded-2xl border border-base-border bg-base-soft p-6 text-left">
      <div className="flex items-center gap-2 text-accent">
        <Frame size={18} />
        <p className="text-xs font-medium uppercase tracking-wide">foto de quadro</p>
      </div>

      {!pdfUrl && !error && (
        <div className="mt-4 flex items-center gap-2 text-sm text-ink-muted">
          <Loader2 size={16} className="animate-spin text-accent" />
          {STAGE_LABEL[status ?? ""] || "Preparando..."}
        </div>
      )}

      {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

      {pdfUrl && (
        <div className="mt-4 flex flex-col items-start gap-3">
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
