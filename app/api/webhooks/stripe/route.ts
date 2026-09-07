import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripeClient } from "@/lib/payments/stripe";
import { confirmPixPayment } from "@/lib/payments/confirm";

/**
 * Webhook de confirmação de pagamento Stripe (mercado México, app/mx) —
 * espelha app/api/webhooks/woovi/route.ts. Verifica a assinatura antes de
 * confiar em qualquer coisa no payload, pelo mesmo motivo: sem isso,
 * qualquer pessoa que soubesse essa URL poderia forjar "pagamento
 * confirmado" e liberar presente sem pagar.
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text().catch(() => "");
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    console.error("[webhook/stripe] assinatura ou STRIPE_WEBHOOK_SECRET ausente — requisição recusada");
    return NextResponse.json({ ok: false, reason: "missing signature" }, { status: 401 });
  }

  let event: Stripe.Event;
  try {
    event = stripeClient().webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("[webhook/stripe] assinatura inválida", err);
    return NextResponse.json({ ok: false, reason: "invalid signature" }, { status: 401 });
  }

  // Checamos payment_status === "paid" em vez de confiar só no tipo do
  // evento — checkout.session.completed também dispara pra um método de
  // pagamento assíncrono (ex: OXXO, hoje desativado) antes da confirmação
  // real. async_payment_succeeded fica escutado pelo mesmo motivo, pronto
  // pro dia em que um método assíncrono for reativado.
  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.payment_status !== "paid") return NextResponse.json({ ok: true });

    const correlationId = session.client_reference_id ?? (session.metadata?.correlationId as string | undefined);
    if (!correlationId) return NextResponse.json({ ok: true });

    try {
      await confirmPixPayment(correlationId, event);
    } catch (err) {
      console.error("[webhook/stripe] falha ao confirmar pagamento", err);
      // sempre responde 200 rápido — erro fica só no log, pra Stripe não
      // ficar reentregando o webhook indefinidamente por um bug nosso
    }
  }

  return NextResponse.json({ ok: true });
}
