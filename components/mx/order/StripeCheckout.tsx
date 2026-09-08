"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { Loader2 } from "lucide-react";
import { createStripeCheckout, getPaymentStatus } from "@/lib/actions/payments";
import { trackEvent } from "@/lib/analytics/track";

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

/**
 * Equivalente MX de PixCharge.tsx (Brasil) — mas com Stripe: o formulário de
 * cartão da própria Stripe fica embutido aquí (ui_mode "embedded", via
 * <EmbeddedCheckout>), sin redirigir al comprador fuera del sitio. La
 * confirmación real sigue llegando por el webhook (lib/payments/confirm.ts);
 * este polling (getPaymentStatus) solo detecta cuándo refrescar la pantalla.
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
  const [error, setError] = useState<string | null>(null);
  const trackedPaymentInfo = useRef(false);

  const fetchClientSecret = useCallback(async () => {
    try {
      const { clientSecret } = await createStripeCheckout(buyerToken);
      if (!trackedPaymentInfo.current) {
        trackedPaymentInfo.current = true;
        trackEvent("AddPaymentInfo", {
          valueCents: priceCents,
          currency: "MXN",
          contentName: "Canción personalizada — Stripe",
          email: buyerEmail,
          externalId: buyerToken,
        });
      }
      return clientSecret;
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos abrir el pago ahora.");
      throw err;
    }
  }, [buyerToken, priceCents, buyerEmail]);

  useEffect(() => {
    const poll = setInterval(async () => {
      const { status } = await getPaymentStatus(buyerToken);
      if (status === "paid" || status === "delivered") {
        clearInterval(poll);
        router.refresh();
      }
    }, 3000);
    return () => clearInterval(poll);
  }, [buyerToken, router]);

  if (!stripePromise) {
    return <p className="mt-8 rounded-xl border border-accent bg-accent-soft p-4 text-center text-sm text-ink">No pudimos abrir el pago ahora. Intenta de nuevo en unos minutos.</p>;
  }

  if (error) {
    return <p className="mt-8 rounded-xl border border-accent bg-accent-soft p-4 text-center text-sm text-ink">{error}</p>;
  }

  return (
    <div className="mt-8 overflow-hidden rounded-xl border border-base-border bg-base-soft">
      <EmbeddedCheckoutProvider
        stripe={stripePromise}
        options={{
          fetchClientSecret,
          onComplete: () => router.refresh(),
        }}
      >
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
