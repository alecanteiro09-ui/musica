import type { Order, WizardAnswers } from "@/types";

/**
 * Reconstrói as respostas do wizard a partir das colunas do pedido — usado
 * quando uma etapa seguinte precisa reprocessar tudo com a IA. Fica fora de
 * lib/actions/*.ts de propósito: um arquivo com "use server" só pode
 * exportar funções async (viram endpoints RPC), e esta é síncrona.
 */
export function orderToWizardAnswers(order: Order): WizardAnswers {
  return {
    relationship: order.relationship ?? "",
    nickname: order.recipient_nickname ?? "",
    occasion: order.occasion ?? "",
    genre: order.genre ?? "",
    voicePreference: order.voice_preference ?? "feminina",
    story: order.story ?? "",
    funDetail: order.fun_detail ?? "",
    chorusHint: order.chorus_hint ?? "",
    buyerName: order.buyer_name ?? "",
    buyerEmail: order.buyer_email ?? "",
  };
}
