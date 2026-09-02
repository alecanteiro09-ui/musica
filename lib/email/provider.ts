import { mockEmailProvider } from "./providers/mock-email";
import { resendEmailProvider } from "./providers/resend-email";

export interface GiftReadyEmailInput {
  toEmail: string;
  buyerName: string;
  recipientNickname: string;
  giftUrl: string;
}

export interface LoginCodeEmailInput {
  toEmail: string;
  code: string;
}

export interface PhotoPdfReadyEmailInput {
  toEmail: string;
  buyerName: string;
  recipientNickname: string;
  pdfUrl: string;
}

/** Sequência de carrinho abandonado — ver lib/actions/remarketing.ts. */
export interface RemarketingEmailInput {
  toEmail: string;
  buyerName: string;
  recipientNickname: string;
  orderUrl: string;
  unsubscribeUrl: string;
  stage: 1 | 2 | 3;
  /** Em centavos. 0 no estágio 1 — só nos estágios 2 e 3 tem desconto. */
  discountCents: number;
  /** true só no estágio 3 (última mensagem, empilha com o desconto). */
  freePhoto: boolean;
}

export interface EmailProvider {
  sendGiftReadyEmail(input: GiftReadyEmailInput): Promise<void>;
  sendLoginCode(input: LoginCodeEmailInput): Promise<void>;
  sendPhotoPdfReadyEmail(input: PhotoPdfReadyEmailInput): Promise<void>;
  sendRemarketingEmail(input: RemarketingEmailInput): Promise<void>;
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
