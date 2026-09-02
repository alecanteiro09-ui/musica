import type { EmailProvider } from "../provider";

export const mockEmailProvider: EmailProvider = {
  async sendGiftReadyEmail(input) {
    console.log("[email/mock] presente liberado — e-mail simulado (sem envio real)", {
      to: input.toEmail,
      recipient: input.recipientNickname,
      giftUrl: input.giftUrl,
    });
  },
  async sendLoginCode(input) {
    console.log("[email/mock] código de verificação — e-mail simulado (sem envio real)", {
      to: input.toEmail,
      code: input.code,
    });
  },
  async sendPhotoPdfReadyEmail(input) {
    console.log("[email/mock] foto de quadro pronta — e-mail simulado (sem envio real)", {
      to: input.toEmail,
      recipient: input.recipientNickname,
      pdfUrl: input.pdfUrl,
    });
  },
  async sendRemarketingEmail(input) {
    console.log(`[email/mock] remarketing estágio ${input.stage} — e-mail simulado (sem envio real)`, {
      to: input.toEmail,
      recipient: input.recipientNickname,
      discountCents: input.discountCents,
      freePhoto: input.freePhoto,
    });
  },
};
