import type { EmailProvider } from "../provider";

/**
 * Resend (resend.com) via REST API direta — sem SDK, mesmo padrão usado nos
 * outros provedores do projeto (menos uma dependência pra manter).
 *
 * Requer um domínio verificado em resend.com/domains pra `EMAIL_FROM` poder
 * usar esse domínio; sem verificar, a conta só consegue mandar pro próprio
 * e-mail do dono da conta (modo sandbox), útil pra testar mas não pra
 * produção.
 */
function fromAddress(): string {
  return process.env.EMAIL_FROM || "Verso Único <onboarding@resend.dev>";
}

function buildHtml(input: { buyerName: string; recipientNickname: string; giftUrl: string }): string {
  return `
<div style="background:#FBF7FA;padding:40px 16px;font-family:Georgia,'Times New Roman',serif;">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;padding:40px 32px;text-align:center;">
    <p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:#FF7A54;margin:0 0 16px;">Verso Único</p>
    <h1 style="font-size:26px;line-height:1.3;color:#332A3D;margin:0 0 12px;font-weight:normal;font-style:italic;">
      A música pra ${input.recipientNickname} está pronta
    </h1>
    <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#332A3D;margin:0 0 28px;">
      Oi, ${input.buyerName}! Seu presente foi liberado — a página com a música completa,
      a letra em karaokê e o QR Code pra compartilhar já está no ar.
    </p>
    <a href="${input.giftUrl}" style="display:inline-block;background:#FF7A54;color:#2B1810;font-family:Arial,Helvetica,sans-serif;font-weight:bold;font-size:15px;text-decoration:none;padding:14px 32px;border-radius:999px;">
      Ver o presente
    </a>
    <p style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#9b8fa3;margin:28px 0 0;word-break:break-all;">
      Ou copie o link: ${input.giftUrl}
    </p>
  </div>
</div>`.trim();
}

export const resendEmailProvider: EmailProvider = {
  async sendGiftReadyEmail(input) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY não configurado.");

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: fromAddress(),
        to: input.toEmail,
        subject: `A música pra ${input.recipientNickname} está pronta 🎁`,
        html: buildHtml(input),
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Falha ao enviar e-mail via Resend (${res.status}): ${body}`);
    }
  },
};
