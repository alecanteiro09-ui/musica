import { createAdminClient } from "@/lib/supabase/server";
import { getEmailProvider } from "@/lib/email/provider";

/**
 * Confirma um pagamento Pix e libera o pedido. Chamado tanto pelo webhook
 * real da Woovi (app/api/webhooks/woovi/route.ts) quanto pelo provedor mock
 * (lib/payments/mock.ts, que se auto-confirma em dev) — mesma lógica nos
 * dois casos, pra não haver dois caminhos de "o que significa pago".
 * Idempotente: chamar duas vezes para a mesma cobrança não duplica efeito.
 */
export async function confirmPixPayment(correlationId: string, rawPayload: unknown) {
  const supabase = createAdminClient();

  const { data: payment } = await supabase
    .from("payments")
    .select("id, order_id, status")
    .eq("correlation_id", correlationId)
    .single();

  if (!payment) return { ok: false, reason: "payment_not_found" as const };
  if (payment.status === "confirmed") return { ok: true, alreadyConfirmed: true };

  await supabase
    .from("payments")
    .update({
      status: "confirmed",
      paid_at: new Date().toISOString(),
      raw_webhook_payload: rawPayload,
      updated_at: new Date().toISOString(),
    })
    .eq("id", payment.id);

  // Addon comprado separadamente da música (ver lib/actions/photoPdf.ts) —
  // correlation_id vem no formato "photopdf:<photo_pdf_orders.id>", nunca
  // toca orders.status, que já está em paid/delivered nesse ponto.
  if (correlationId.startsWith("photopdf:")) {
    const photoPdfOrderId = correlationId.slice("photopdf:".length);
    await supabase
      .from("photo_pdf_orders")
      .update({ status: "paid", updated_at: new Date().toISOString() })
      .eq("id", photoPdfOrderId)
      .eq("status", "pending_payment");
    return { ok: true, alreadyConfirmed: false };
  }

  // preview_ready -> paid -> delivered: sem trabalho assíncrono de verdade
  // entre os dois hoje (as faixas já foram geradas antes do pagamento), mas
  // manter os dois passos deixa a máquina de estados pronta pro dia em que
  // "delivered" passar a depender de algo mais (ex. pós-processamento).
  await supabase
    .from("orders")
    .update({ status: "paid", updated_at: new Date().toISOString() })
    .eq("id", payment.order_id)
    .eq("status", "preview_ready");

  await supabase
    .from("orders")
    .update({ status: "delivered", updated_at: new Date().toISOString() })
    .eq("id", payment.order_id)
    .eq("status", "paid");

  await sendGiftReadyEmailSafely(payment.order_id);

  return { ok: true, alreadyConfirmed: false };
}

/**
 * E-mail é só um backup — a entrega principal já acontece na hora, na tela
 * (UnlockedSuccess). Se o envio falhar (chave inválida, provedor fora do
 * ar), o pagamento já foi confirmado e o pedido já foi liberado; não faz
 * sentido derrubar a confirmação por causa disso, só logamos o erro.
 */
async function sendGiftReadyEmailSafely(orderId: string) {
  try {
    const supabase = createAdminClient();
    const { data: order } = await supabase
      .from("orders")
      .select("buyer_email, buyer_name, recipient_nickname, gift_token")
      .eq("id", orderId)
      .single();

    if (!order?.buyer_email) return;

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    await getEmailProvider().sendGiftReadyEmail({
      toEmail: order.buyer_email,
      buyerName: order.buyer_name || "",
      recipientNickname: order.recipient_nickname || "",
      giftUrl: `${siteUrl}/g/${order.gift_token}`,
    });
  } catch (err) {
    console.error("[email] falha ao enviar e-mail de presente liberado", { orderId, err });
  }
}
