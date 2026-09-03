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
  1: (nickname) => `${nickname} ainda não ouviu a música que você começou`,
  2: (nickname) => `R$10 separados pra você terminar a música de ${nickname} 🎁`,
  3: (nickname) => `Última chance: desconto + quadro de graça pra ${nickname}`,
};

/**
 * Cada relação do wizard (ver components/wizard/Wizard.tsx) tem uma foto real
 * dela em public/images/occasions — reaproveita aqui como imagem de topo do
 * e-mail, escolhida pela relação de CADA pedido (não uma imagem genérica
 * igual pra todo mundo). Fallback pra quando não tem foto daquela relação
 * específica (irmã/irmão, neto/neta, família, amigo, pet, outro).
 */
const RELATIONSHIP_IMAGE_SLUG: Record<string, string> = {
  esposa: "esposa",
  marido: "marido",
  namorada: "namorados",
  namorado: "namorados",
  mãe: "mae",
  pai: "pai",
  avó: "avos",
  avô: "avos",
  filha: "filhos",
  filho: "filhos",
  amiga: "amiga",
};

function remarketingImageUrl(relationship: string): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://versounicogift.online";
  const slug = RELATIONSHIP_IMAGE_SLUG[relationship.trim().toLowerCase()] || "namorados";
  return `${siteUrl}/images/occasions/${slug}.jpg`;
}

/**
 * Corpo específico de cada estágio da sequência de carrinho abandonado.
 * Estágio 1 é reciprocidade pura (a letra grátis já existe, sem desconto,
 * sem pressão) — gatilho: já investiu, já é "seu". 2 empilha desconto real
 * + ancora o preço (mostra de/por) + garantia bem perto do botão (reduz
 * risco percebido, que é o que mais trava decisão de compra). 3 é a única
 * urgência de verdade da sequência: é literalmente o último e-mail, dito de
 * forma honesta — nunca contagem regressiva ou desconto forjado.
 */
function buildRemarketingBody(input: RemarketingEmailInput): { eyebrow: string; greeting: string; body: string; cta: string; priceLine?: string } {
  const name = input.recipientNickname || "essa pessoa";
  const hello = input.buyerName ? `Oi, ${input.buyerName}.` : "Oi.";

  if (input.stage === 1) {
    return {
      eyebrow: "sua letra já existe",
      greeting: `A música pra ${name} tá esperando você`,
      body: `${hello} A letra já foi escrita do jeito exato que você contou a história — isso não se perde, fica salva no seu link. Falta só um passo: ouvir o trecho cantado (é grátis) e decidir se quer a versão completa. Ninguém cobra nada de você até aí.`,
      cta: "Ouvir o trecho grátis",
    };
  }

  const discount = formatBRL(input.discountCents);
  if (input.stage === 2) {
    return {
      eyebrow: "desconto liberado",
      greeting: `Separei ${discount} pra você terminar a música de ${name}`,
      body: `${hello} Sei que a vida fica no meio do caminho — por isso já apliquei ${discount} de desconto direto no seu link, sem cupom pra digitar. E a compra continua protegida pela garantia de 7 dias: não curtiu, a gente devolve, sem perguntas.`,
      cta: `Terminar com ${discount} de desconto`,
    };
  }

  return {
    eyebrow: "último aviso",
    greeting: `É a última vez que te escrevo sobre isso, ${input.buyerName || "viu"}`,
    body: `Depois desse e-mail eu paro de te lembrar da música de ${name}. Enquanto isso não acontece, os ${discount} de desconto continuam valendo — e o quadro com a foto tratada por IA (upsell pago pra todo mundo) sai de graça também, só nessa última chance.`,
    cta: "Terminar com desconto + foto de graça",
  };
}

function buildRemarketingHtml(input: RemarketingEmailInput): string {
  const { eyebrow, greeting, body, cta } = buildRemarketingBody(input);
  const imageUrl = remarketingImageUrl(input.relationship);
  return `
<div style="background:#FBF7FA;padding:40px 16px;font-family:Georgia,'Times New Roman',serif;">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;text-align:center;">
    <img src="${imageUrl}" width="480" alt="" style="display:block;width:100%;height:220px;object-fit:cover;object-position:center 20%;" />
    <div style="padding:36px 32px 40px;">
      <p style="display:inline-block;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:bold;letter-spacing:0.08em;text-transform:uppercase;color:#FF7A54;background:#FFF1EC;border-radius:999px;padding:6px 14px;margin:0 0 18px;">
        ${eyebrow}
      </p>
      <h1 style="font-size:24px;line-height:1.3;color:#332A3D;margin:0 0 12px;font-weight:normal;font-style:italic;">
        ${greeting}
      </h1>
      <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#332A3D;margin:0 0 28px;text-align:left;">
        ${body}
      </p>
      <a href="${input.orderUrl}" style="display:inline-block;background:#FF7A54;color:#2B1810;font-family:Arial,Helvetica,sans-serif;font-weight:bold;font-size:15px;text-decoration:none;padding:14px 32px;border-radius:999px;">
        ${cta}
      </a>
      <p style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#9b8fa3;margin:16px 0 0;">
        Garantia de 7 dias · reembolso sem perguntas
      </p>
      <p style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#9b8fa3;margin:20px 0 0;word-break:break-all;">
        Ou copie o link: ${input.orderUrl}
      </p>
      <p style="font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#c2b8c7;margin:32px 0 0;border-top:1px solid #f0e8f0;padding-top:16px;">
        Verso Único — LVC DIGITAL LTDA · CNPJ 41.949.006/0001-97<br />
        Não quer mais receber esses lembretes? <a href="${input.unsubscribeUrl}" style="color:#9b8fa3;">Clique aqui pra parar</a>.
      </p>
    </div>
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
