/**
 * Preço base + addons opcionais. Tudo em centavos, mesma unidade que
 * orders.price_cents / payments.amount_cents. Valores default combinam com
 * o que o cliente pediu: R$38,99 normal, R$59,99 com clonagem de voz
 * (+R$21,00), R$9,99 pela foto de quadro em PDF.
 */
export const BASE_PRICE_CENTS = Number(process.env.GIFT_PRICE_CENTS ?? 3899);
export const VOICE_CLONE_ADDON_CENTS = Number(process.env.VOICE_CLONE_ADDON_CENTS ?? 2100);
export const PHOTO_PDF_ADDON_CENTS = Number(process.env.PHOTO_PDF_ADDON_CENTS ?? 999);

export function computeOrderPriceCents(wantsCustomVoice: boolean): number {
  return BASE_PRICE_CENTS + (wantsCustomVoice ? VOICE_CLONE_ADDON_CENTS : 0);
}
