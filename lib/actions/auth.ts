"use server";

import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/server";
import { getEmailProvider } from "@/lib/email/provider";

const SESSION_COOKIE = "vu_session";
const CODE_TTL_MINUTES = 10;
const SESSION_TTL_DAYS = 30;
const RESEND_COOLDOWN_SECONDS = 45;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/** Gera e manda por e-mail um código de 6 dígitos — ver aviso de segurança em 0002_login_codes.sql. */
export async function requestLoginCode(rawEmail: string): Promise<{ ok: boolean; error?: string }> {
  const email = normalizeEmail(rawEmail);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Digite um e-mail válido." };
  }

  const supabase = createAdminClient();

  const { data: recent } = await supabase
    .from("login_codes")
    .select("created_at")
    .eq("email", email)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (recent && Date.now() - new Date(recent.created_at).getTime() < RESEND_COOLDOWN_SECONDS * 1000) {
    return { ok: false, error: "Espera um instante antes de pedir outro código." };
  }

  const code = generateCode();
  const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000).toISOString();

  const { error: insertError } = await supabase.from("login_codes").insert({ email, code, expires_at: expiresAt });
  if (insertError) {
    console.error("[auth] falha ao salvar código de verificação", insertError);
    return { ok: false, error: "Não deu pra gerar o código agora. Tenta de novo." };
  }

  try {
    await getEmailProvider().sendLoginCode({ toEmail: email, code });
  } catch (err) {
    console.error("[auth] falha ao enviar código por e-mail", err);
    return { ok: false, error: "Não deu pra enviar o código agora. Tenta de novo em instantes." };
  }

  return { ok: true };
}

/** Confirma o código e abre uma sessão (cookie httpOnly) pra essa caixa de e-mail. */
export async function verifyLoginCode(rawEmail: string, rawCode: string): Promise<{ ok: boolean; error?: string }> {
  const email = normalizeEmail(rawEmail);
  const code = rawCode.trim();
  const supabase = createAdminClient();

  const { data: row } = await supabase
    .from("login_codes")
    .select("id, expires_at")
    .eq("email", email)
    .eq("code", code)
    .is("consumed_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!row || new Date(row.expires_at).getTime() < Date.now()) {
    return { ok: false, error: "Código inválido ou expirado. Pede um novo." };
  }

  await supabase.from("login_codes").update({ consumed_at: new Date().toISOString() }).eq("id", row.id);

  const sessionExpiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { data: session, error } = await supabase
    .from("login_sessions")
    .insert({ email, expires_at: sessionExpiresAt })
    .select("id")
    .single();

  if (error || !session) {
    console.error("[auth] falha ao criar sessão", error);
    return { ok: false, error: "Não deu pra entrar agora. Tenta de novo." };
  }

  cookies().set(SESSION_COOKIE, session.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_DAYS * 24 * 60 * 60,
  });

  return { ok: true };
}

async function getMySession(): Promise<{ email: string } | null> {
  const sessionId = cookies().get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;

  const supabase = createAdminClient();
  const { data } = await supabase.from("login_sessions").select("email, expires_at").eq("id", sessionId).maybeSingle();
  if (!data || new Date(data.expires_at).getTime() < Date.now()) return null;

  return { email: data.email };
}

export interface MyOrderSummary {
  buyerToken: string;
  giftToken: string | null;
  recipientNickname: string;
  status: string;
  createdAt: string;
}

/** null = ninguém logado nesta sessão (mostra o formulário de e-mail/código). */
export async function getMyOrders(): Promise<{ email: string; orders: MyOrderSummary[] } | null> {
  const session = await getMySession();
  if (!session) return null;

  const supabase = createAdminClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("buyer_token, gift_token, recipient_nickname, status, created_at")
    .eq("buyer_email", session.email)
    .order("created_at", { ascending: false });

  return {
    email: session.email,
    orders: (orders ?? []).map((o: any) => ({
      buyerToken: o.buyer_token,
      giftToken: o.status === "paid" || o.status === "delivered" ? o.gift_token : null,
      recipientNickname: o.recipient_nickname ?? "",
      status: o.status,
      createdAt: o.created_at,
    })),
  };
}

export async function logout(): Promise<void> {
  const sessionId = cookies().get(SESSION_COOKIE)?.value;
  if (sessionId) {
    const supabase = createAdminClient();
    await supabase.from("login_sessions").delete().eq("id", sessionId);
  }
  cookies().delete(SESSION_COOKIE);
}
