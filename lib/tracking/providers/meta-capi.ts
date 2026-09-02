import { sha256, sha256Phone } from "../hash";
import type { ServerTrackEventInput } from "../provider";

const GRAPH_API_VERSION = "v21.0";

function arr(value: string | undefined): string[] | undefined {
  return value ? [value] : undefined;
}

/**
 * Meta Conversions API (Graph API). Requer NEXT_PUBLIC_META_PIXEL_ID (o
 * mesmo ID usado no pixel do navegador) + META_CONVERSIONS_API_TOKEN
 * (gerado em Gerenciador de Eventos → Configurações → Conversions API).
 * Sem as duas, não faz nada — deixa a estrutura pronta pra quando o ID/token
 * chegarem, sem precisar tocar em código.
 *
 * event_id igual ao mandado pro fbq('track', ...) no navegador é o que
 * permite a Meta deduplicar o mesmo evento chegando pelos dois canais.
 */
export async function sendMetaCapiEvent(input: ServerTrackEventInput): Promise<void> {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const accessToken = process.env.META_CONVERSIONS_API_TOKEN;
  if (!pixelId || !accessToken) return;

  const body = {
    data: [
      {
        event_name: input.eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: input.eventId,
        event_source_url: input.eventSourceUrl,
        action_source: "website",
        user_data: {
          client_ip_address: input.clientIp || undefined,
          client_user_agent: input.userAgent || undefined,
          fbp: input.fbp || undefined,
          fbc: input.fbc || undefined,
          em: arr(sha256(input.email)),
          ph: arr(sha256Phone(input.phone)),
          external_id: arr(sha256(input.externalId)),
        },
        custom_data: {
          currency: input.currency || "BRL",
          value: input.valueCents != null ? input.valueCents / 100 : undefined,
          content_name: input.contentName || "Música personalizada",
          content_type: "product",
        },
      },
    ],
    ...(process.env.META_TEST_EVENT_CODE ? { test_event_code: process.env.META_TEST_EVENT_CODE } : {}),
  };

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${pixelId}/events?access_token=${accessToken}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );
    if (!res.ok) {
      console.error("[tracking/meta-capi] resposta não-ok", input.eventName, await res.text().catch(() => ""));
    }
  } catch (err) {
    console.error("[tracking/meta-capi] falha ao enviar evento", input.eventName, err);
  }
}
