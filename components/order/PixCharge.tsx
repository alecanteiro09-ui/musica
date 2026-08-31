"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Loader2 } from "lucide-react";
import { createPixCharge, getPaymentStatus } from "@/lib/actions/payments";
import { formatBRL } from "@/lib/utils";

export function PixCharge({ buyerToken, priceCents }: { buyerToken: string; priceCents: number }) {
  const router = useRouter();
  const [charge, setCharge] = useState<{ brCode: string; qrCodeImageUrl: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    createPixCharge(buyerToken)
      .then(setCharge)
      .catch((err) => setError(err instanceof Error ? err.message : "Não deu pra gerar o Pix agora."));
  }, [buyerToken]);

  useEffect(() => {
    if (!charge) return;
    const poll = setInterval(async () => {
      const { status } = await getPaymentStatus(buyerToken);
      if (status === "paid" || status === "delivered") {
        clearInterval(poll);
        router.refresh();
      }
    }, 3000);
    return () => clearInterval(poll);
  }, [charge, buyerToken, router]);

  function copy() {
    if (!charge) return;
    navigator.clipboard.writeText(charge.brCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (error) {
    return <p className="mt-8 rounded-xl border border-accent bg-accent-soft p-4 text-center text-sm text-ink">{error}</p>;
  }

  if (!charge) {
    return (
      <div className="mt-8 flex items-center justify-center gap-2 rounded-xl border border-base-border bg-base-soft p-8 text-sm text-ink-muted">
        <Loader2 size={16} className="animate-spin" /> Gerando seu Pix...
      </div>
    );
  }

  return (
    <div className="mt-8 rounded-xl border border-base-border bg-base-soft p-6 text-center">
      <p className="text-sm text-ink-muted">Pague {formatBRL(priceCents)} com Pix — a música libera sozinha assim que cair.</p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={charge.qrCodeImageUrl} alt="QR Code Pix" className="mx-auto mt-4 h-56 w-56 rounded-lg bg-white p-2" />
      <button
        type="button"
        onClick={copy}
        className="mt-4 inline-flex items-center gap-2 rounded-full border border-base-border px-4 py-2 text-xs text-ink-muted hover:border-accent-dim"
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
        {copied ? "Copiado" : "Copiar código Pix"}
      </button>
      <p className="mt-4 flex items-center justify-center gap-2 text-xs text-ink-muted">
        <Loader2 size={12} className="animate-spin" /> Aguardando confirmação...
      </p>
    </div>
  );
}
