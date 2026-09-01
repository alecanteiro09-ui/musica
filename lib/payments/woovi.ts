import type { CardCharge, CreateCardChargeInput, CreatePixChargeInput, PaymentProvider, PixCharge } from "./provider";

const WOOVI_API_BASE = "https://api.woovi.com/api/v1";

/**
 * Integração real com a API Pix da Woovi (REST direto, sem SDK — evita fixar
 * uma versão de pacote que eu não posso verificar neste ambiente). Documentação:
 * https://developers.woovi.com — confirme o payload/headers exatos contra a
 * doc atual antes de ir pra produção, especialmente a validação do webhook
 * (WOOVI_WEBHOOK_SECRET), que a Woovi pode ter mudado desde a escrita disto.
 */
export const wooviProvider: PaymentProvider = {
  async createPixCharge(input: CreatePixChargeInput): Promise<PixCharge> {
    const appId = process.env.WOOVI_APP_ID;
    if (!appId) throw new Error("WOOVI_APP_ID não configurado.");

    const res = await fetch(`${WOOVI_API_BASE}/charge`, {
      method: "POST",
      headers: {
        Authorization: appId,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        correlationID: input.correlationId,
        value: input.amountCents,
        comment: input.comment,
        customer: {
          name: input.customer.name,
          email: input.customer.email,
          taxID: input.customer.taxID,
          phone: input.customer.phone,
        },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Falha ao criar cobrança Woovi (${res.status}): ${body}`);
    }

    const data = await res.json();
    const charge = data.charge ?? data;
    return {
      chargeId: charge.globalID ?? charge.correlationID ?? input.correlationId,
      brCode: charge.brCode,
      qrCodeImageUrl: charge.qrCodeImage ?? charge.paymentLinkUrl,
    };
  },

  /**
   * Cartão via Woovi Parcelado — mesmo endpoint /charge, mas com
   * type: "PIX_CREDIT" e o objeto customer completo (a Woovi exige
   * CPF/CNPJ, telefone e endereço pra esse tipo, diferente do Pix puro,
   * que aceita bem menos dado). Doc: developers.woovi.com/en/docs/charge/
   * how-to-create-charge-woovi-parcelado — recurso precisa estar liberado
   * na conta Woovi antes de funcionar (pedido feito pelo painel deles).
   * Resposta traz um paymentLinkUrl: o cliente digita o cartão numa página
   * hospedada pela própria Woovi — nunca no nosso site.
   */
  async createCardCharge(input: CreateCardChargeInput): Promise<CardCharge> {
    const appId = process.env.WOOVI_APP_ID;
    if (!appId) throw new Error("WOOVI_APP_ID não configurado.");

    const res = await fetch(`${WOOVI_API_BASE}/charge`, {
      method: "POST",
      headers: {
        Authorization: appId,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        correlationID: input.correlationId,
        value: input.amountCents,
        comment: input.comment,
        type: "PIX_CREDIT",
        customer: {
          name: input.customer.name,
          email: input.customer.email,
          taxID: input.customer.taxID,
          phone: input.customer.phone,
          address: input.customer.address,
        },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Falha ao criar cobrança de cartão na Woovi (${res.status}): ${body}`);
    }

    const data = await res.json();
    const charge = data.charge ?? data;
    if (!charge.paymentLinkUrl) throw new Error(`Resposta sem paymentLinkUrl: ${JSON.stringify(data)}`);

    return {
      chargeId: charge.globalID ?? charge.correlationID ?? input.correlationId,
      paymentLinkUrl: charge.paymentLinkUrl,
    };
  },
};
