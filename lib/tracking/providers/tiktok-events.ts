import { sha256, sha256Phone } from "../hash";
import type { ServerTrackEventInput, TrackEventName } from "../provider";

const EVENTS_API_URL = "https://business-api.tiktok.com/open_api/v1.3/event/track/";

/** Nomenclatura padrão da TikTok difere da Meta pro evento de compra ("CompletePayment", não "Purchase"). */
const TIKTOK_EVENT_NAME: Record<TrackEventName, string> = {
  AddToCart: "AddToCart",
  AddPaymentInfo: "AddPaymentInfo",
  Purchase: "CompletePayment",
};

/**
 * TikTok Events API v1.3. Requer NEXT_PUBLIC_TIKTOK_PIXEL_ID (o "Pixel Code"
 * do TikTok Ads Manager) + TIKTOK_EVENTS_API_ACCESS_TOKEN (gerado em
 * Assets → Events → seu pixel → Configurar → Gerar token de acesso).
 * Sem as duas, não faz nada.
 *
 * event_id igual ao mandado pro ttq.track(...) no navegador é o que permite
 * a TikTok deduplicar o mesmo evento chegando pelos dois canais.
 */
export async function sendTikTokEvent(input: ServerTrackEventInput): Promise<void> {
  const pixelId = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID;
  const accessToken = process.env.TIKTOK_EVENTS_API_ACCESS_TOKEN;
  if (!pixelId || !accessToken) return;

  const body = {
    event_source: "web",
    event_source_id: pixelId,
    data: [
      {
        event: TIKTOK_EVENT_NAME[input.eventName],
        event_time: Math.floor(Date.now() / 1000),
        event_id: input.eventId,
        user: {
          email: sha256(input.email),
          phone: sha256Phone(input.phone),
          external_id: sha256(input.externalId),
          ip: input.clientIp || undefined,
          user_agent: input.userAgent || undefined,
          ttp: input.ttp || undefined,
        },
        page: { url: input.eventSourceUrl },
        properties: {
          content_type: "product",
          content_name: input.contentName || "Música personalizada",
          currency: input.currency || "BRL",
          value: input.valueCents != null ? (input.valueCents / 100).toFixed(2) : undefined,
        },
      },
    ],
  };

  try {
    const res = await fetch(EVENTS_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Access-Token": accessToken },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.error("[tracking/tiktok-events] resposta não-ok", input.eventName, await res.text().catch(() => ""));
    }
  } catch (err) {
    console.error("[tracking/tiktok-events] falha ao enviar evento", input.eventName, err);
  }
}
