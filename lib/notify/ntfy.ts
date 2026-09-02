import { createAdminClient } from "@/lib/supabase/server";

const NTFY_SERVER = process.env.NTFY_SERVER || "https://ntfy.sh";
const NTFY_TOPIC = process.env.NTFY_TOPIC;

/**
 * Notificação push pro celular a cada venda confirmada, via ntfy (app grátis,
 * sem conta — só assina o mesmo tópico no app). Usa o formato de publicação
 * em JSON do ntfy em vez de headers HTTP porque título/mensagem têm acento
 * (headers HTTP não são seguros pra UTF-8; o body JSON é).
 * Só dispara se NTFY_TOPIC estiver configurado; nunca derruba a confirmação
 * do pagamento se a notificação falhar (mesmo padrão do e-mail de presente).
 */
export async function sendSaleNotificationSafely(orderId: string, amountCents: number, method: string | null) {
  if (!NTFY_TOPIC) return;
  try {
    const supabase = createAdminClient();
    const { data: order } = await supabase
      .from("orders")
      .select("recipient_nickname, wants_photo_pdf, wants_custom_voice")
      .eq("id", orderId)
      .single();

    const price = (amountCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    const lines = [`Valor: ${price}`, `Pagamento: ${method === "card" ? "Cartão" : "Pix"}`];
    if (order?.wants_custom_voice) lines.push("Com voz clonada");
    if (order?.wants_photo_pdf) lines.push("Com quadro em PDF");

    await fetch(NTFY_SERVER, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic: NTFY_TOPIC,
        title: `Nova venda — ${order?.recipient_nickname || "presente"}`,
        message: lines.join("\n"),
        tags: ["moneybag"],
        priority: 4,
      }),
    });
  } catch (err) {
    console.error("[ntfy] falha ao enviar notificação de venda", { orderId, err });
  }
}
