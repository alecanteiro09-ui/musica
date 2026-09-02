import type { EmailProvider, RemarketingEmailInput } from "../provider";
import { formatBRL } from "@/lib/utils";

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
      ${input.buyerName ? `Oi, ${input.buyerName}! ` : ""}O presente foi liberado — a página com a música completa,
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

function buildLoginCodeHtml(input: { code: string }): string {
  return `
<div style="background:#FBF7FA;padding:40px 16px;font-family:Georgia,'Times New Roman',serif;">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;padding:40px 32px;text-align:center;">
    <p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:#FF7A54;margin:0 0 16px;">Verso Único</p>
    <h1 style="font-size:24px;line-height:1.3;color:#332A3D;margin:0 0 12px;font-weight:normal;font-style:italic;">
      Seu código de acesso
    </h1>
    <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#332A3D;margin:0 0 24px;">
      Digite este código na página "Minhas músicas" pra ver todos os seus pedidos. Ele vale por 10 minutos.
    </p>
    <p style="font-family:Arial,Helvetica,sans-serif;font-size:36px;font-weight:bold;letter-spacing:0.15em;color:#332A3D;background:#FBF7FA;border-radius:12px;padding:16px 0;margin:0;">
      ${input.code}
    </p>
    <p style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#9b8fa3;margin:24px 0 0;">
      Não pediu esse código? Pode ignorar este e-mail.
    </p>
  </div>
</div>`.trim();
}

function buildPhotoPdfHtml(input: { buyerName: string; recipientNickname: string; pdfUrl: string }): string {
  return `
<div style="background:#FBF7FA;padding:40px 16px;font-family:Georgia,'Times New Roman',serif;">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;padding:40px 32px;text-align:center;">
    <p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:#FF7A54;margin:0 0 16px;">Verso Único</p>
    <h1 style="font-size:26px;line-height:1.3;color:#332A3D;margin:0 0 12px;font-weight:normal;font-style:italic;">
      Sua foto de quadro está pronta
    </h1>
    <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#332A3D;margin:0 0 28px;">
      ${input.buyerName ? `Oi, ${input.buyerName}! ` : ""}A foto de ${input.recipientNickname || "vocês"}, tratada e no tamanho certo
      pra imprimir e emoldurar, já está pronta em PDF.
    </p>
    <a href="${input.pdfUrl}" style="display:inline-block;background:#FF7A54;color:#2B1810;font-family:Arial,Helvetica,sans-serif;font-weight:bold;font-size:15px;text-decoration:none;padding:14px 32px;border-radius:999px;">
      Baixar o PDF
    </a>
    <p style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#9b8fa3;margin:28px 0 0;word-break:break-all;">
      Ou copie o link: ${input.pdfUrl}
    </p>
  </div>
</div>`.trim();
}

const REMARKETING_SUBJECTS: Record<1 | 2 | 3, (nickname: string) => string> = {
  1: (nickname) => `A letra da música de ${nickname} ainda tá esperando você`,
  2: (nickname) => `Separei R$10 pra você terminar a música de ${nickname}`,
  3: () => `Por hoje: o quadro de foto sai de graça`,
};

/**
 * Corpo específico de cada estágio da sequência de carrinho abandonado.
 * Estágio 1 é reciprocidade pura (a letra grátis já existe, sem desconto,
 * sem pressão). 2 e 3 empilham oferta real (desconto em dinheiro, depois
 * +foto grátis) — nunca desconto falso/contagem regressiva forjada.
 */
function buildRemarketingBody(input: RemarketingEmailInput): { greeting: string; body: string; cta: string } {
  const name = input.recipientNickname || "essa pessoa";
  const hello = input.buyerName ? `Oi, ${input.buyerName}. ` : "Oi. ";

  if (input.stage === 1) {
    return {
      greeting: `A letra pra ${name} já está pronta`,
      body: `${hello}Você começou a música pra ${name} e a letra já foi escrita, do jeito que você contou — ela tá salva, esperando por você no mesmo link de sempre. Não precisa decidir nada agora: você só paga depois de ouvir um trecho cantado.`,
      cta: "Continuar de onde parei",
    };
  }

  const discount = formatBRL(input.discountCents);
  if (input.stage === 2) {
    return {
      greeting: `${discount} de desconto separados pra você`,
      body: `${hello}Sei que a vida fica no meio do caminho. Separei ${discount} de desconto pra você terminar a música de ${name} — já aplicado automaticamente no seu link, sem cupom pra digitar. E continua valendo a garantia: 7 dias, reembolso sem perguntas.`,
      cta: `Terminar com ${discount} de desconto`,
    };
  }

  return {
    greeting: "Essa é a última vez que te escrevo sobre isso",
    body: `${hello}Ainda dá pra terminar a música de ${name} com os ${discount} de desconto — e, só até você usar o link, o quadro com a foto tratada por IA sai de graça também (era um upsell pago). Depois desse e-mail, paro de te lembrar.`,
    cta: `Terminar com desconto + foto de graça`,
  };
}

function buildRemarketingHtml(input: RemarketingEmailInput): string {
  const { greeting, body, cta } = buildRemarketingBody(input);
  return `
<div style="background:#FBF7FA;padding:40px 16px;font-family:Georgia,'Times New Roman',serif;">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;padding:40px 32px;text-align:center;">
    <p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:#FF7A54;margin:0 0 16px;">Verso Único</p>
    <h1 style="font-size:24px;line-height:1.3;color:#332A3D;margin:0 0 12px;font-weight:normal;font-style:italic;">
      ${greeting}
    </h1>
    <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#332A3D;margin:0 0 28px;">
      ${body}
    </p>
    <a href="${input.orderUrl}" style="display:inline-block;background:#FF7A54;color:#2B1810;font-family:Arial,Helvetica,sans-serif;font-weight:bold;font-size:15px;text-decoration:none;padding:14px 32px;border-radius:999px;">
      ${cta}
    </a>
    <p style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#9b8fa3;margin:28px 0 0;word-break:break-all;">
      Ou copie o link: ${input.orderUrl}
    </p>
    <p style="font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#c2b8c7;margin:32px 0 0;border-top:1px solid #f0e8f0;padding-top:16px;">
      Verso Único — LVC DIGITAL LTDA · CNPJ 41.949.006/0001-97<br />
      Não quer mais receber esses lembretes? <a href="${input.unsubscribeUrl}" style="color:#9b8fa3;">Clique aqui pra parar</a>.
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

  async sendLoginCode(input) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY não configurado.");

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: fromAddress(),
        to: input.toEmail,
        subject: `${input.code} é o seu código de acesso — Verso Único`,
        html: buildLoginCodeHtml(input),
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Falha ao enviar e-mail via Resend (${res.status}): ${body}`);
    }
  },

  async sendPhotoPdfReadyEmail(input) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY não configurado.");

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: fromAddress(),
        to: input.toEmail,
        subject: `Sua foto de quadro está pronta 🖼️`,
        html: buildPhotoPdfHtml(input),
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Falha ao enviar e-mail via Resend (${res.status}): ${body}`);
    }
  },

  async sendRemarketingEmail(input) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY não configurado.");

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: fromAddress(),
        to: input.toEmail,
        subject: REMARKETING_SUBJECTS[input.stage](input.recipientNickname || "alguém especial"),
        html: buildRemarketingHtml(input),
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Falha ao enviar e-mail via Resend (${res.status}): ${body}`);
    }
  },
};
