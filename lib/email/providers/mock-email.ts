import type { EmailProvider } from "../provider";

export const mockEmailProvider: EmailProvider = {
  async sendGiftReadyEmail(input) {
    console.log("[email/mock] presente liberado — e-mail simulado (sem envio real)", {
      to: input.toEmail,
      recipient: input.recipientNickname,
      giftUrl: input.giftUrl,
    });
  },
};
