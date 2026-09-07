"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Loader2, ExternalLink } from "lucide-react";
import { formatMXN } from "@/lib/utils";
import { createStripeCheckout, getPaymentStatus } from "@/lib/actions/payments";
import { trackEvent } from "@/lib/analytics/track";

/**
 * Equivalente MX de PixCharge.tsx (Brasil) — mas o fluxo é bem mais simples:
 * a Stripe Checkout hospedada já resolve o cartão sem precisar de um
 * formulário próprio de dados extras (diferente da Woovi Parcelado). O
 * comprador sai do site, paga lá, e volta pra essa mesma página, que
 * detecta a confirmação pelo mesmo polling (getPaymentStatus).
 */
export function StripeCheckout({
  buyerToken,
  priceCents,
  buyerEmail,
}: {
  buyerToken: string;
  priceCents: number;
  buyerEmail?: string;
}) {
  const router = useRouter();
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    createStripeCheckout(buyerToken)
      .then(({ checkoutUrl }) => {
        setCheckoutUrl(checkoutUrl);
        trackEvent("AddPaymentInfo", {
          valueCents: priceCents,
          currency: "MXN",
          contentName: "Canción personalizada — Stripe",
          email: buyerEmail,
          externalId: buyerToken,
        });
        window.location.href = checkoutUrl;
      })
      .catch((err) => setError(err instanceof Error ? err.message : "No pudimos abrir el pago ahora."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buyerToken]);

  useEffect(() => {
    if (!checkoutUrl) return;
    const poll = setInterval(async () => {
      const { status } = await getPaymentStatus(buyerToken);
      if (status === "paid" || status === "delivered") {
        clearInterval(poll);
        router.refresh();
      }
    }, 3000);
    return () => clearInterval(poll);
  }, [checkoutUrl, buyerToken, router]);

  if (error) {
    return <p className="mt-8 rounded-xl border border-accent bg-accent-soft p-4 text-center text-sm text-ink">{error}</p>;
  }

  if (!checkoutUrl) {
    return (
      <div className="mt-8 flex items-center justify-center gap-2 rounded-xl border border-base-border bg-base-soft p-8 text-sm text-ink-muted">
        <Loader2 size={16} className="animate-spin" /> Abriendo el pago seguro...
      </div>
    );
  }

  return (
    <div className="mt-8 flex flex-col items-center gap-4 rounded-xl border border-base-border bg-base-soft p-6 text-center">
      <CreditCard size={28} className="text-accent" />
      <p className="text-sm text-ink">Abrimos el pago seguro de Stripe en esta pestaña.</p>
      <p className="text-xs text-ink-muted">En cuanto confirme el pago de {formatMXN(priceCents)}, esta pantalla se libera sola.</p>
      <a href={checkoutUrl} className="flex items-center gap-1 text-xs text-accent hover:underline">
        <ExternalLink size={12} /> Reabrir el pago
      </a>
      <p className="flex items-center gap-2 text-xs text-ink-muted">
        <Loader2 size={12} className="animate-spin" /> Esperando confirmación...
      </p>
    </div>
  );
}
