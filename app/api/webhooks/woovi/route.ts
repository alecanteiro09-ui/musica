import { NextRequest, NextResponse } from "next/server";
import { confirmPixPayment } from "@/lib/payments/confirm";

/**
 * Webhook de confirmação de pagamento Pix da Woovi. Único Route Handler do
 * projeto — um webhook é um ponto de entrada HTTP externo de verdade, não dá
 * pra ser uma Server Action.
 *
 * TODO antes de produção: confirmar o mecanismo exato de autenticação do
 * webhook na documentação atual da Woovi (https://developers.woovi.com) —
 * normalmente um header com o WOOVI_WEBHOOK_SECRET configurado no painel —
 * e validar aqui antes de confiar no payload.
 */
export async function POST(req: NextRequest) {
  const payload = await req.json().catch(() => null);
  if (!payload) return NextResponse.json({ ok: false }, { status: 400 });

  const correlationId: string | undefined = payload?.charge?.correlationID ?? payload?.correlationID;
  if (!correlationId) return NextResponse.json({ ok: false, reason: "missing correlationID" }, { status: 400 });

  try {
    await confirmPixPayment(correlationId, payload);
  } catch (err) {
    console.error("[webhook/woovi] falha ao confirmar pagamento", err);
    // sempre responde 200 rápido — erro fica só no log, pra Woovi não
    // ficar reentregando o webhook indefinidamente por um bug nosso
  }

  return NextResponse.json({ ok: true });
}
