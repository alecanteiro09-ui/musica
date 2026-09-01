import QRCode from "qrcode";
import type { CardCharge, CreateCardChargeInput, CreatePixChargeInput, PaymentProvider, PixCharge } from "./provider";
import { confirmPixPayment } from "./confirm";

const MOCK_CONFIRM_AFTER_MS = 5000;

/**
 * Provedor de desenvolvimento: fabrica uma cobrança falsa e se
 * auto-confirma sozinho depois de alguns segundos, escrevendo direto no
 * banco como se o webhook da Woovi tivesse chegado. Existe pra validar o
 * fluxo "pagou → desbloqueou sozinho" (polling do frontend + confirm.ts)
 * sem precisar de conta na Woovi nem de túnel (ngrok) em desenvolvimento.
 * O setTimeout só é confiável em `npm run dev` (processo Node persistente);
 * não use este provedor numa function serverless real — é só pra dev local.
 */
export const mockPaymentProvider: PaymentProvider = {
  async createPixCharge(input: CreatePixChargeInput): Promise<PixCharge> {
    const brCode = `00020126MOCKPIXNAODEVEIRARPARAPROD${input.correlationId}5204000053039865802BR`;
    const qrCodeImageUrl = await QRCode.toDataURL(brCode, { margin: 1, width: 320 });

    setTimeout(() => {
      confirmPixPayment(input.correlationId, { mock: true, confirmedAt: new Date().toISOString() }).catch((err) =>
        console.error("[mock-payment] falha ao auto-confirmar", err)
      );
    }, MOCK_CONFIRM_AFTER_MS);

    return {
      chargeId: `mock_${input.correlationId}`,
      brCode,
      qrCodeImageUrl,
    };
  },

  async createCardCharge(input: CreateCardChargeInput): Promise<CardCharge> {
    setTimeout(() => {
      confirmPixPayment(input.correlationId, { mock: true, method: "card", confirmedAt: new Date().toISOString() }).catch((err) =>
        console.error("[mock-payment] falha ao auto-confirmar cartão", err)
      );
    }, MOCK_CONFIRM_AFTER_MS);

    const html = `<html><body style="font-family:sans-serif;padding:40px;text-align:center"><h1>Checkout de cartão simulado</h1><p>Nenhuma cobrança real — confirma sozinho em alguns segundos.</p></body></html>`;
    return {
      chargeId: `mock_${input.correlationId}`,
      paymentLinkUrl: `data:text/html,${encodeURIComponent(html)}`,
    };
  },
};
