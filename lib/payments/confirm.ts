import { createAdminClient } from "@/lib/supabase/server";
import { getEmailProvider } from "@/lib/email/provider";
import { PHOTO_PDF_ADDON_CENTS } from "@/lib/pricing";
import { sendSaleNotificationSafely } from "@/lib/notify/ntfy";

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
    .select("id, order_id, status, amount_cents, method")
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

  await createPhotoPdfOrderIfRequested(payment.order_id);
  await sendGiftReadyEmailSafely(payment.order_id);
  await sendSaleNotificationSafely(payment.order_id, payment.amount_cents, payment.method);

  return { ok: true, alreadyConfirmed: false };
}

/**
 * O upsell de foto-quadro é escolhido no popup de checkout e paga junto no
 * mesmo Pix (ver lib/actions/orders.ts:setPhotoPdfSelection) — por isso a
 * linha em photo_pdf_orders só nasce aqui, já em status "paid", pronta pra
 * o polling da tela de sucesso (lib/actions/photoPdf.ts) pegar e gerar.
 */
async function createPhotoPdfOrderIfRequested(orderId: string) {
  const supabase = createAdminClient();
  const { data: order } = await supabase
    .from("orders")
    .select("wants_photo_pdf, photo_pdf_frame_size, photo_pdf_source_url")
    .eq("id", orderId)
    .single();

  if (!order?.wants_photo_pdf || !order.photo_pdf_frame_size || !order.photo_pdf_source_url) return;

  const { data: existing } = await supabase.from("photo_pdf_orders").select("id").eq("order_id", orderId).maybeSingle();
  if (existing) return;

  await supabase.from("photo_pdf_orders").insert({
    order_id: orderId,
    frame_size: order.photo_pdf_frame_size,
    source_photo_url: order.photo_pdf_source_url,
    status: "paid",
    amount_cents: PHOTO_PDF_ADDON_CENTS,
  });
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
