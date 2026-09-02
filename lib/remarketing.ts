import { createAdminClient } from "@/lib/supabase/server";
import { getEmailProvider } from "@/lib/email/provider";

const STAGE_DAYS: Record<1 | 2 | 3, number> = { 1: 1, 2: 3, 3: 7 };
const STAGE_2_DISCOUNT_CENTS = 1000;
const TERMINAL_STATUSES = ["paid", "delivered", "failed", "expired"];

export interface RemarketingSweepResult {
  scanned: number;
  sent: number;
  failed: number;
}

/**
 * Varre pedidos "abandonados" (têm e-mail, nunca chegaram a pagar) e manda o
 * próximo e-mail da sequência pra quem já passou do prazo daquele estágio —
 * um por vez, mesmo que o cron rode atrasado (nunca pula estágio). Chamado
 * pelo cron diário (app/api/cron/remarketing/route.ts), nunca pelo browser.
 */
export async function runRemarketingSweep(): Promise<RemarketingSweepResult> {
  const supabase = createAdminClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const { data: candidates, error } = await supabase
    .from("orders")
    .select("id, buyer_token, buyer_email, buyer_name, recipient_nickname, remarketing_stage, discount_cents, created_at")
    .not("buyer_email", "is", null)
    .eq("marketing_opt_out", false)
    .lt("remarketing_stage", 3)
    .not("status", "in", `(${TERMINAL_STATUSES.join(",")})`);

  if (error || !candidates) {
    console.error("[remarketing] falha ao buscar pedidos", error);
    return { scanned: 0, sent: 0, failed: 0 };
  }

  let sent = 0;
  let failed = 0;
  const now = Date.now();

  for (const order of candidates) {
    const daysSinceCreated = (now - new Date(order.created_at).getTime()) / (1000 * 60 * 60 * 24);
    const nextStage = (order.remarketing_stage + 1) as 1 | 2 | 3;
    if (daysSinceCreated < STAGE_DAYS[nextStage]) continue;

    try {
      const updates: Record<string, unknown> = {
        remarketing_stage: nextStage,
        remarketing_last_sent_at: new Date().toISOString(),
      };

      let discountCents = order.discount_cents;
      const freePhoto = nextStage === 3;
      if (nextStage >= 2) {
        discountCents = order.discount_cents || STAGE_2_DISCOUNT_CENTS;
        updates.discount_cents = discountCents;
      }
      if (freePhoto) updates.promo_free_photo = true;

      await getEmailProvider().sendRemarketingEmail({
        toEmail: order.buyer_email!,
        buyerName: order.buyer_name || "",
        recipientNickname: order.recipient_nickname || "",
        orderUrl: `${siteUrl}/pedido/${order.buyer_token}`,
        unsubscribeUrl: `${siteUrl}/api/unsubscribe?token=${order.buyer_token}`,
        stage: nextStage,
        discountCents,
        freePhoto,
      });

      await supabase.from("orders").update(updates).eq("id", order.id);
      sent++;
    } catch (err) {
      console.error("[remarketing] falha ao processar pedido", { orderId: order.id, err });
      failed++;
    }
  }

  return { scanned: candidates.length, sent, failed };
}
