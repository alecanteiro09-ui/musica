import crypto from "crypto";

/**
 * Chave pública FIXA da Woovi (a mesma pra todo mundo — não é um segredo da
 * nossa conta) usada pra verificar a assinatura de cada webhook recebido.
 * Sem essa checagem, qualquer pessoa que descobrisse a URL do webhook
 * poderia forjar um "pagamento confirmado" e liberar presente sem pagar.
 * Fonte: https://developers.woovi.com/docs/webhook/seguranca/webhook-signature-validation
 * (confirmada em duas fontes — developers.woovi.com e developers.openpix.com.br —
 * e validada estruturalmente: decodifica pra uma chave RSA pública válida).
 */
const WOOVI_WEBHOOK_PUBLIC_KEY_BASE64 =
  "LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUlHZk1BMEdDU3FHU0liM0RRRUJBUVVBQTRHTkFEQ0JpUUtCZ1FDLytOdElranpldnZxRCtJM01NdjNiTFhEdApwdnhCalk0QnNSclNkY2EzcnRBd01jUllZdnhTbmQ3amFnVkxwY3RNaU94UU84aWVVQ0tMU1dIcHNNQWpPL3paCldNS2Jxb0c4TU5waS91M2ZwNnp6MG1jSENPU3FZc1BVVUcxOWJ1VzhiaXM1WloySVpnQk9iV1NwVHZKMGNuajYKSEtCQUE4MkpsbitsR3dTMU13SURBUUFCCi0tLS0tRU5EIFBVQkxJQyBLRVktLS0tLQo=";

/**
 * Verifica o header `x-webhook-signature` (RSA + SHA-256, base64) contra o
 * corpo CRU da requisição — precisa ser o texto exato recebido, antes de
 * qualquer JSON.parse/stringify, senão a assinatura nunca bate.
 */
export function verifyWooviSignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!signatureHeader) return false;
  try {
    const publicKey = Buffer.from(WOOVI_WEBHOOK_PUBLIC_KEY_BASE64, "base64").toString("ascii");
    const verifier = crypto.createVerify("sha256");
    verifier.write(rawBody);
    verifier.end();
    return verifier.verify(publicKey, signatureHeader, "base64");
  } catch (err) {
    console.error("[woovi] falha ao verificar assinatura do webhook", err);
    return false;
  }
}
