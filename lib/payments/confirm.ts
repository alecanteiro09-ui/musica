import { createAdminClient } from "@/lib/supabase/server";

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

  return { ok: true, alreadyConfirmed: false };
}
