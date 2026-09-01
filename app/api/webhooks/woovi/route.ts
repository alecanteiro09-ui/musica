import { NextRequest, NextResponse } from "next/server";
import { confirmPixPayment } from "@/lib/payments/confirm";
import { verifyWooviSignature } from "@/lib/payments/verify-woovi-signature";

/**
 * Webhook de confirmação de pagamento (Pix e cartão via Woovi Parcelado).
 * Único Route Handler do projeto — um webhook é um ponto de entrada HTTP
 * externo de verdade, não dá pra ser uma Server Action.
 *
 * Verifica a assinatura (header x-webhook-signature) antes de confiar em
 * qualquer coisa no payload — sem isso, qualquer pessoa que soubesse essa
 * URL poderia forjar "pagamento confirmado" e liberar presente sem pagar.
 * Precisa ler o corpo como texto CRU pra verificar (não dá pra usar
 * req.json() direto, senão perde os bytes exatos que foram assinados).
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text().catch(() => null);
  if (!rawBody) return NextResponse.json({ ok: false }, { status: 400 });

  const signature = req.headers.get("x-webhook-signature");
  if (!verifyWooviSignature(rawBody, signature)) {
    console.error("[webhook/woovi] assinatura inválida ou ausente — requisição recusada");
    return NextResponse.json({ ok: false, reason: "invalid signature" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: false, reason: "invalid json" }, { status: 400 });
  }

  const correlationId: string | undefined =
    (payload as any)?.charge?.correlationID ?? (payload as any)?.correlationID;
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
