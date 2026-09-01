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
  const rawBody = (await req.text().catch(() => "")) ?? "";

  // A Woovi manda um ping vazio (sem corpo, sem assinatura) só pra testar se
  // a URL responde, no momento em que o webhook é cadastrado no painel deles
  // — não é um evento de verdade, então aceita sem exigir nada. Rejeitar
  // isso com erro impedia até de CADASTRAR o webhook (confirmado testando).
  if (!rawBody.trim()) return NextResponse.json({ ok: true });

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
  // Evento assinado mas sem correlationID (ex: outro tipo de evento que não
  // pedimos) — não é erro nosso, só não tem o que fazer com ele.
  if (!correlationId) return NextResponse.json({ ok: true });

  try {
    await confirmPixPayment(correlationId, payload);
  } catch (err) {
    console.error("[webhook/woovi] falha ao confirmar pagamento", err);
    // sempre responde 200 rápido — erro fica só no log, pra Woovi não
    // ficar reentregando o webhook indefinidamente por um bug nosso
  }

  return NextResponse.json({ ok: true });
}
