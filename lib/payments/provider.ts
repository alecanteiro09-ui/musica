import { wooviProvider } from "./woovi";
import { mockPaymentProvider } from "./mock";

export interface PixCustomer {
  name: string;
  email: string;
  taxID?: string;
  phone?: string;
}

export interface CreatePixChargeInput {
  orderId: string;
  correlationId: string;
  amountCents: number;
  comment: string;
  customer: PixCustomer;
}

export interface PixCharge {
  chargeId: string;
  /** "Pix copia e cola" */
  brCode: string;
  qrCodeImageUrl: string;
}

export interface PaymentProvider {
  createPixCharge(input: CreatePixChargeInput): Promise<PixCharge>;
}

/**
 * Seleciona o provedor por env var. Sem PAYMENT_PROVIDER e sem WOOVI_APP_ID,
 * cai no mock — que fabrica uma cobrança falsa e se auto-confirma sozinho
 * depois de alguns segundos, simulando o webhook (ver lib/payments/mock.ts).
 * Isso permite testar o desbloqueio automático do presente sem conta na
 * Woovi e sem expor um túnel (ngrok) localmente.
 */
export function getPaymentProvider(): PaymentProvider {
  const forced = process.env.PAYMENT_PROVIDER;
  if (forced === "mock") return mockPaymentProvider;
  if (forced === "woovi") return wooviProvider;
  return process.env.WOOVI_APP_ID ? wooviProvider : mockPaymentProvider;
}
