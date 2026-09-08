import Stripe from "stripe";

/**
 * Integração Stripe — mercado México (app/mx). Não substitui a Woovi/Pix do
 * Brasil (lib/payments/provider.ts): os dois fluxos convivem lado a lado,
 * cada um usado só pelo seu mercado.
 *
 * Só cartão por enquanto — OXXO exige que a conta Stripe tenha endereço
 * comercial no México (a nossa é registrada no Brasil, então a opção nem
 * aparece pra habilitar no dashboard). Se abrir uma conta MX no futuro, dá
 * pra voltar `payment_method_types` pra `["card", "oxxo"]`.
 *
 * Checkout hospedado pela própria Stripe (mesma filosofia da Woovi Parcelado
 * — o número do cartão nunca passa pelo nosso servidor). O comprador é
 * redirecionado pra lá e volta pro nosso site depois de pagar (ou cancelar).
 */
export function stripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY não configurado.");
  return new Stripe(key);
}

export interface CreateStripeCheckoutInput {
  orderId: string;
  correlationId: string;
  amountCents: number;
  description: string;
  customerEmail?: string;
  returnUrl: string;
}

export interface StripeCheckout {
  clientSecret: string;
  sessionId: string;
}

export const stripeProvider = {
  /**
   * ui_mode "embedded" — a Checkout roda dentro de um iframe na nossa
   * própria página (via <EmbeddedCheckout>), sem redirecionar o comprador
   * pra fora do site. Por isso usa return_url (a Stripe volta pra cá depois
   * de pagar) em vez de success_url/cancel_url, que são só do modo "hosted".
   */
  async createCheckoutSession(input: CreateStripeCheckoutInput): Promise<StripeCheckout> {
    const session = await stripeClient().checkout.sessions.create({
      mode: "payment",
      ui_mode: "embedded",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "mxn",
            unit_amount: input.amountCents,
            product_data: { name: input.description },
          },
          quantity: 1,
        },
      ],
      customer_email: input.customerEmail || undefined,
      // client_reference_id é o mesmo correlationId (= order.id) usado pela
      // Woovi — assim o webhook chama a MESMA confirmPixPayment() dos dois
      // fluxos, sem precisar de um caminho de confirmação duplicado.
      client_reference_id: input.correlationId,
      metadata: { correlationId: input.correlationId, orderId: input.orderId },
      return_url: input.returnUrl,
    });

    if (!session.client_secret) throw new Error(`Stripe não devolveu client_secret: ${JSON.stringify(session)}`);
    return { clientSecret: session.client_secret, sessionId: session.id };
  },
};
