import { mockEmailProvider } from "./providers/mock-email";
import { resendEmailProvider } from "./providers/resend-email";

export interface GiftReadyEmailInput {
  toEmail: string;
  buyerName: string;
  recipientNickname: string;
  giftUrl: string;
}

export interface EmailProvider {
  sendGiftReadyEmail(input: GiftReadyEmailInput): Promise<void>;
}

/**
 * Seleciona o provedor por env var. Sem EMAIL_PROVIDER e sem RESEND_API_KEY,
 * cai no mock — só loga no console (ver lib/email/providers/mock-email.ts).
 * A entrega principal do presente já acontece na hora, na própria tela
 * (UnlockedSuccess); este e-mail é um backup pra quem fechar a aba antes de
 * salvar o link.
 */
export function getEmailProvider(): EmailProvider {
  const forced = process.env.EMAIL_PROVIDER;
  if (forced === "mock") return mockEmailProvider;
  if (forced === "resend") return resendEmailProvider;
  return process.env.RESEND_API_KEY ? resendEmailProvider : mockEmailProvider;
}
