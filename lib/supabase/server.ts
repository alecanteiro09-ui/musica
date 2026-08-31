import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cliente Supabase para Server Components / Route Handlers.
 * Usa a anon key + cookies de sessão (não é usado para ler dados de pedido —
 * ver createAdminClient() abaixo e a nota de RLS default-deny no schema).
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // chamado a partir de um Server Component sem permissão de escrita — ignorar
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {
            // idem
          }
        },
      },
    }
  );
}

/**
 * Cliente admin (service role). Todo o acesso a pedidos passa por aqui —
 * não há RLS pública neste projeto (comprador não tem sessão, só um token na
 * URL), então a checagem de "esse token pode ver esse pedido?" é feita em
 * código de aplicação (ver lib/actions/orders.ts), nunca por policy pública.
 * USO EXCLUSIVO em Server Actions / Route Handlers, NUNCA no browser.
 */
export function createAdminClient() {
  const { createClient: createRawClient } = require("@supabase/supabase-js");
  return createRawClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
