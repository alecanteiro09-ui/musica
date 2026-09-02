"use client";

export type TrackEventName = "PageView" | "AddToCart" | "AddPaymentInfo" | "Purchase";

export interface TrackEventParams {
  valueCents?: number;
  currency?: string;
  contentName?: string;
  email?: string | null;
  phone?: string | null;
  /** Identificador estável do comprador (usamos o buyer_token do pedido). */
  externalId?: string | null;
  /**
   * Fixo (ex: "purchase_<orderId>") pra deduplicar entre o pixel do
   * navegador e o repasse server-side — e pra não contar a mesma compra
   * duas vezes se a pessoa atualizar a página de sucesso. Sem isso, gera um
   * id aleatório novo a cada chamada.
   */
  eventId?: string;
}

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    ttq?: {
      track: (event: string, data?: Record<string, unknown>) => void;
      identify: (data: Record<string, unknown>) => void;
      page: () => void;
    };
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

/** Nomenclatura padrão da TikTok difere da Meta pro evento de compra. */
const TIKTOK_EVENT_NAME: Record<TrackEventName, string> = {
  PageView: "PageView",
  AddToCart: "AddToCart",
  AddPaymentInfo: "AddPaymentInfo",
  Purchase: "CompletePayment",
};

/** Cada ação do Google Ads tem seu próprio rótulo de conversão — sem o rótulo daquele evento configurado, não dispara conversão pra ele (mas o pixel de PageView/remarketing continua funcionando normalmente). */
const GOOGLE_ADS_LABEL_ENV: Partial<Record<TrackEventName, string | undefined>> = {
  AddToCart: process.env.NEXT_PUBLIC_GOOGLE_ADS_LABEL_ADD_TO_CART,
  AddPaymentInfo: process.env.NEXT_PUBLIC_GOOGLE_ADS_LABEL_ADD_PAYMENT_INFO,
  Purchase: process.env.NEXT_PUBLIC_GOOGLE_ADS_LABEL_PURCHASE,
};

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

/**
 * Passa e-mail/telefone/id externo pro Advanced Matching da Meta e da
 * TikTok — melhora a taxa de correspondência de conversão (mais assertivo)
 * sem expor o dado em texto puro: os dois SDKs hasheiam no navegador antes
 * de mandar. Chamado automaticamente pelo trackEvent() quando algum desses
 * dados está disponível — não precisa chamar à parte.
 */
function identifyUser(input: { email?: string | null; phone?: string | null; externalId?: string | null }) {
  if (typeof window === "undefined") return;
  if (!input.email && !input.phone && !input.externalId) return;

  const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  if (metaPixelId && window.fbq) {
    window.fbq("init", metaPixelId, {
      em: input.email || undefined,
      ph: input.phone || undefined,
      external_id: input.externalId || undefined,
    });
  }

  if (process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID && window.ttq) {
    window.ttq.identify({
      email: input.email || undefined,
      phone_number: input.phone || undefined,
      external_id: input.externalId || undefined,
    });
  }
}

/**
 * Dispara um evento padrão nos 3 canais configurados de uma vez: pixel no
 * navegador (Meta, TikTok, Google Ads) + repasse server-side (Meta CAPI +
 * TikTok Events API, via /api/track) usando o MESMO event_id. É esse par
 * com o id igual que permite Meta/TikTok deduplicar o mesmo evento vindo
 * dos dois canais e, ainda assim, contar o que o navegador sozinho
 * perderia — ad blocker, Safari ITP, aba fechada antes do pixel carregar.
 * Isso é o que torna os dados "assertivos": nenhum evento de funil depende
 * só do navegador.
 *
 * Sem os IDs/tokens configurados nas env vars, cada chamada é um no-op
 * silencioso — a estrutura já fica pronta pra ativar sozinha assim que as
 * credenciais forem preenchidas no Vercel, sem tocar em código.
 */
export function trackEvent(name: TrackEventName, params: TrackEventParams = {}): void {
  if (typeof window === "undefined") return;

  identifyUser({ email: params.email, phone: params.phone, externalId: params.externalId });

  const eventId = params.eventId || uuid();
  const url = window.location.href;
  const valueReais = params.valueCents != null ? params.valueCents / 100 : undefined;
  const currency = params.currency || "BRL";

  // Meta Pixel
  if (process.env.NEXT_PUBLIC_META_PIXEL_ID && window.fbq) {
    window.fbq(
      "track",
      name,
      {
        value: valueReais,
        currency,
        content_name: params.contentName,
        content_type: "product",
      },
      { eventID: eventId }
    );
  }

  // TikTok Pixel — PageView usa o método próprio ttq.page(), não ttq.track().
  if (process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID && window.ttq) {
    if (name === "PageView") {
      window.ttq.page();
    } else {
      window.ttq.track(TIKTOK_EVENT_NAME[name], {
        value: valueReais,
        currency,
        content_name: params.contentName,
        content_type: "product",
        event_id: eventId,
      });
    }
  }

  // Google Ads
  const adsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
  if (adsId && window.gtag) {
    if (name === "PageView") {
      // A navegação client-side do App Router não recarrega a página, então
      // o page_view automático do gtag('config', ...) (que só roda 1x, no
      // carregamento inicial do script) não é suficiente sozinho.
      window.gtag("event", "page_view", { page_location: url });
    } else {
      const label = GOOGLE_ADS_LABEL_ENV[name];
      if (label) {
        // Enhanced Conversions: manda o dado do usuário antes da conversão
        // pra melhorar o match, seguindo o padrão oficial da Google.
        if (params.email || params.phone) {
          window.gtag("set", "user_data", {
            email: params.email || undefined,
            phone_number: params.phone || undefined,
          });
        }
        window.gtag("event", "conversion", {
          send_to: `${adsId}/${label}`,
          value: valueReais,
          currency,
          // transaction_id é o mecanismo nativo do Google Ads pra não
          // contar a mesma conversão duas vezes (ex: página de sucesso
          // atualizada) — por isso reaproveita o mesmo eventId.
          transaction_id: eventId,
        });
      }
    }
  }

  // Server-side (Meta CAPI + TikTok Events API) — não dispara pra PageView,
  // que é evento de alto volume e baixo valor pra medir do servidor; os
  // eventos de funil (AddToCart/AddPaymentInfo/Purchase) sim, porque são
  // os que realmente alimentam a otimização de anúncio.
  if (name !== "PageView") {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        eventName: name,
        eventId,
        url,
        email: params.email || undefined,
        phone: params.phone || undefined,
        externalId: params.externalId || undefined,
        valueCents: params.valueCents,
        currency,
        contentName: params.contentName,
        ttclid: getCookie("ttclid"),
      }),
    }).catch(() => {});
  }
}
