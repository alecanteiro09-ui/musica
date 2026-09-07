/**
 * Preço base + addons opcionais. Tudo em centavos, mesma unidade que
 * orders.price_cents / payments.amount_cents. Valores default combinam com
 * o que o cliente pediu: R$38,99 normal, R$59,99 com clonagem de voz
 * (+R$21,00), R$9,99 pela foto de quadro em PDF.
 */
export const BASE_PRICE_CENTS = Number(process.env.GIFT_PRICE_CENTS ?? 3899);
export const VOICE_CLONE_ADDON_CENTS = Number(process.env.VOICE_CLONE_ADDON_CENTS ?? 2100);
export const PHOTO_PDF_ADDON_CENTS = Number(process.env.PHOTO_PDF_ADDON_CENTS ?? 999);

/**
 * Preços do mercado México (app/mx), em centavos de MXN. 159,99 MXN de
 * base — abaixo até da ponta mais barata de UMA música avulsa de mariachi
 * de rua em Garibaldi/CDMX (150–250 MXN, pesquisa de mercado 2026).
 */
export const BASE_PRICE_CENTS_MX = Number(process.env.GIFT_PRICE_CENTS_MX ?? 15999);
export const VOICE_CLONE_ADDON_CENTS_MX = Number(process.env.VOICE_CLONE_ADDON_CENTS_MX ?? 14000);
export const PHOTO_PDF_ADDON_CENTS_MX = Number(process.env.PHOTO_PDF_ADDON_CENTS_MX ?? 7999);

export function computeOrderPriceCents(wantsCustomVoice: boolean, market: "br" | "mx" = "br"): number {
  if (market === "mx") return BASE_PRICE_CENTS_MX + (wantsCustomVoice ? VOICE_CLONE_ADDON_CENTS_MX : 0);
  return BASE_PRICE_CENTS + (wantsCustomVoice ? VOICE_CLONE_ADDON_CENTS : 0);
}

/** Aplica o desconto de remarketing (lib/remarketing.ts) — nunca deixa o preço negativo. */
export function applyDiscount(baseCents: number, discountCents: number): number {
  return Math.max(0, baseCents - discountCents);
}
