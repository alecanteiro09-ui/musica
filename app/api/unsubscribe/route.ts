import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

const CONFIRMATION_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8" /><title>Descadastro — Verso Único</title></head>
<body style="background:#FBF7FA;font-family:Arial,Helvetica,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0;">
  <div style="max-width:420px;text-align:center;padding:32px;">
    <h1 style="font-size:20px;color:#332A3D;">Pronto — você não vai mais receber esses e-mails.</h1>
    <p style="color:#6b5f72;font-size:14px;">Se um dia mudar de ideia, é só voltar pro link do seu pedido normalmente.</p>
  </div>
</body>
</html>`;

const CONFIRMATION_HTML_ES = `<!DOCTYPE html>
<html lang="es-MX">
<head><meta charset="utf-8" /><title>Cancelar suscripción — Verso Único</title></head>
<body style="background:#FBF7FA;font-family:Arial,Helvetica,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0;">
  <div style="max-width:420px;text-align:center;padding:32px;">
    <h1 style="font-size:20px;color:#332A3D;">Listo — ya no recibirás estos correos.</h1>
    <p style="color:#6b5f72;font-size:14px;">Si algún día cambias de opinión, solo vuelve al enlace de tu pedido normalmente.</p>
  </div>
</body>
</html>`;

/**
 * Descadastro de 1 clique dos e-mails de remarketing — link vai no rodapé de
 * todo e-mail promocional (ver lib/email/providers/resend-email.ts). Mesmo
 * modelo de confiança usado no resto do app: token na URL, sem exigir login.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  let isMx = false;
  if (token) {
    const supabase = createAdminClient();
    const { data } = await supabase.from("orders").select("currency").eq("buyer_token", token).maybeSingle();
    isMx = data?.currency === "MXN";
    await supabase.from("orders").update({ marketing_opt_out: true }).eq("buyer_token", token);
  }

  return new NextResponse(isMx ? CONFIRMATION_HTML_ES : CONFIRMATION_HTML, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
