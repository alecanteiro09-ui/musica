"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { getPaymentProvider } from "@/lib/payments/provider";
import { getOrderByBuyerToken } from "./orders";
import type { OrderStatus } from "@/types";

/** Cria (ou reaproveita) a cobrança Pix do pedido. Chamado quando o comprador chega no paywall. */
export async function createPixCharge(buyerToken: string): Promise<{ brCode: string; qrCodeImageUrl: string }> {
  const bundle = await getOrderByBuyerToken(buyerToken);
  if (!bundle) throw new Error("Pedido não encontrado.");
  const { order } = bundle;
  if (order.status !== "preview_ready") throw new Error("Este pedido ainda não está pronto para pagamento.");

  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("payments")
    .select("*")
    .eq("order_id", order.id)
    .in("status", ["created", "pix_generated"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing?.pix_copy_paste && existing?.pix_qrcode_image_url) {
    return { brCode: existing.pix_copy_paste, qrCodeImageUrl: existing.pix_qrcode_image_url };
  }

  const correlationId = order.id;
  const charge = await getPaymentProvider().createPixCharge({
    orderId: order.id,
    correlationId,
    amountCents: order.price_cents,
    comment: `Verso Único — presente para ${order.recipient_nickname ?? "alguém especial"}`,
    customer: {
      name: order.buyer_name ?? "Comprador",
      email: order.buyer_email ?? "",
    },
  });

  await supabase.from("payments").upsert(
    {
      order_id: order.id,
      provider: process.env.PAYMENT_PROVIDER || (process.env.WOOVI_APP_ID ? "woovi" : "mock"),
      correlation_id: correlationId,
      charge_id: charge.chargeId,
      status: "pix_generated",
      amount_cents: order.price_cents,
      pix_qrcode_image_url: charge.qrCodeImageUrl,
      pix_copy_paste: charge.brCode,
    },
    { onConflict: "correlation_id" }
  );

  return { brCode: charge.brCode, qrCodeImageUrl: charge.qrCodeImageUrl };
}

/** Usado pelo polling do frontend enquanto o QR Pix está na tela. */
export async function getPaymentStatus(buyerToken: string): Promise<{ status: OrderStatus }> {
  const bundle = await getOrderByBuyerToken(buyerToken);
  if (!bundle) throw new Error("Pedido não encontrado.");
  return { status: bundle.order.status };
}
