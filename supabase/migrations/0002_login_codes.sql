-- ========== LOGIN CODES ("Minhas músicas" sem senha) ==========
-- Não existe conta/senha nesse produto — acesso normal é via buyer_token/
-- gift_token na URL (ver aviso de RLS em 0001_init.sql). Pra alguém revisitar
-- TODOS os próprios pedidos a partir só do e-mail, sem abrir brecha pra
-- alguém ver pedido de outra pessoa só por saber o e-mail dela, a gente
-- manda um código de 6 dígitos pro e-mail informado e só libera a sessão
-- depois de confirmar que quem está pedindo tem acesso àquela caixa de
-- entrada — mesmo padrão de "verificação por e-mail" que a maioria dos
-- produtos sem login usa.
create table if not exists login_codes (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  code text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_login_codes_email on login_codes (email);

-- ========== LOGIN SESSIONS (cookie httpOnly emitido após o código confirmado) ==========
create table if not exists login_sessions (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_login_sessions_email on login_sessions (email);

alter table login_codes enable row level security;
alter table login_sessions enable row level security;

-- Mesma convenção do resto do projeto: default-deny, sem policy pública —
-- toda leitura/escrita passa por Server Actions com createAdminClient()
-- (ver lib/actions/auth.ts), nunca direto do cliente.
create policy "admin_all_login_codes" on login_codes for all using (is_admin()) with check (is_admin());
create policy "admin_all_login_sessions" on login_sessions for all using (is_admin()) with check (is_admin());
