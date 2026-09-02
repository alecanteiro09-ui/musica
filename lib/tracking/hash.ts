import { createHash } from "crypto";

/**
 * SHA-256 normalizado (minúsculo, sem espaço nas pontas) — formato exato que
 * a Meta Conversions API e a TikTok Events API exigem pra casar dado
 * pessoal (e-mail, telefone, id externo) sem o provedor de anúncio nunca
 * ver o dado em texto puro.
 */
export function sha256(value: string | null | undefined): string | undefined {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return undefined;
  return createHash("sha256").update(normalized).digest("hex");
}

/** Telefone: mantém só dígitos (formato E.164 sem o "+") antes de hashear. */
export function sha256Phone(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const digits = value.replace(/\D/g, "");
  return digits ? sha256(digits) : undefined;
}
