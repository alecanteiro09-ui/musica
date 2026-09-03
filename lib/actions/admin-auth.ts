"use server";

import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const SESSION_COOKIE = "vu_admin";
const SESSION_TTL_DAYS = 30;

/**
 * Só existe um admin (o dono do site), então em vez do fluxo de código por
 * e-mail usado pros compradores (lib/actions/auth.ts), é senha única +
 * cookie assinado — sem tabela nova no banco. O segredo do HMAC é a própria
 * ADMIN_PASSWORD: não precisa de mais uma env var só pra isso.
 */
function sign(expiresAt: number): string {
  return createHmac("sha256", process.env.ADMIN_PASSWORD || "")
    .update(String(expiresAt))
    .digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export async function adminLogin(password: string): Promise<{ ok: boolean; error?: string }> {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return { ok: false, error: "ADMIN_PASSWORD não configurada nas env vars." };
  }
  if (!password || !safeEqual(password, expected)) {
    return { ok: false, error: "Senha incorreta." };
  }

  const expiresAt = Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;
  const token = `${expiresAt}.${sign(expiresAt)}`;

  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_DAYS * 24 * 60 * 60,
  });

  return { ok: true };
}

export async function isAdminAuthed(): Promise<boolean> {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) return false;

  const cookie = cookies().get(SESSION_COOKIE)?.value;
  if (!cookie) return false;

  const [expiresAtRaw, signature] = cookie.split(".");
  const expiresAt = Number(expiresAtRaw);
  if (!expiresAt || !signature || Date.now() > expiresAt) return false;

  try {
    return safeEqual(signature, sign(expiresAt));
  } catch {
    return false;
  }
}

export async function adminLogout(): Promise<void> {
  cookies().delete(SESSION_COOKIE);
}
