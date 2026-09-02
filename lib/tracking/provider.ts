import { sendMetaCapiEvent } from "./providers/meta-capi";
import { sendTikTokEvent } from "./providers/tiktok-events";

/** Eventos de funil rastreados server-side (Meta CAPI + TikTok Events API). PageView fica só no pixel do navegador — ver lib/analytics/track.ts. */
export type TrackEventName = "AddToCart" | "AddPaymentInfo" | "Purchase";

export interface ServerTrackEventInput {
  eventName: TrackEventName;
  /** Precisa ser o MESMO id usado na chamada do pixel no navegador, pra Meta/TikTok deduplicarem o mesmo evento vindo dos dois canais. */
  eventId: string;
  eventSourceUrl: string;
  clientIp?: string | null;
  userAgent?: string | null;
  /** Cookie _fbp (sempre presente se o pixel da Meta já rodou no navegador). */
  fbp?: string | null;
  /** Cookie _fbc (só existe se a visita veio de um clique em anúncio da Meta). */
  fbc?: string | null;
  /** Cookie _ttp, setado automaticamente pelo pixel da TikTok. */
  ttp?: string | null;
  /** Parâmetro ttclid da URL, quando a visita vem de um clique em anúncio da TikTok. */
  ttclid?: string | null;
  email?: string | null;
  phone?: string | null;
  /** Identificador estável do comprador (usamos o buyer_token do pedido). */
  externalId?: string | null;
  valueCents?: number;
  currency?: string;
  contentName?: string;
}

/**
 * Dispara o evento pros provedores server-side configurados. Cada provedor
 * só age se tiver as próprias credenciais nas env vars — sem elas, é um
 * no-op silencioso (mesmo padrão do EmailProvider/PaymentProvider deste
 * projeto: falta de configuração nunca derruba o fluxo principal).
 *
 * Google Ads fica de fora daqui de propósito: não existe uma API
 * server-to-server simples por token como a da Meta/TikTok — o caminho
 * oficial mais simples e robusto é o Enhanced Conversions via gtag, no
 * navegador (ver lib/analytics/track.ts). Rastreamento server-side de
 * verdade pro Google Ads exigiria OAuth2 + developer token aprovado pela
 * Google + Customer ID da conta — configuração própria, mais pesada, que só
 * vale a pena montar quando/se o volume justificar.
 */
export async function trackServerEvent(input: ServerTrackEventInput): Promise<void> {
  await Promise.allSettled([sendMetaCapiEvent(input), sendTikTokEvent(input)]);
}
