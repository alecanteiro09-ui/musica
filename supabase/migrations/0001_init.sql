create extension if not exists "pgcrypto";

-- ========== ORDERS (entidade central: um pedido = um presente) ==========
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),

  -- token privado: retoma o checkout do próprio comprador (nunca compartilhar)
  buyer_token uuid not null unique default gen_random_uuid(),
  -- token público: só passa a funcionar quando status in ('paid','delivered')
  gift_token uuid not null unique default gen_random_uuid(),

  buyer_email text,
  buyer_name text,

  relationship text,
  recipient_nickname text,
  occasion text,
  genre text,
  voice_preference text check (voice_preference in ('masculina', 'feminina', 'dupla')),
  story text,
  fun_detail text,
  chorus_hint text,

  status text not null default 'draft'
    check (status in ('draft', 'lyric_generated', 'song_generating', 'preview_ready', 'paid', 'delivered', 'failed', 'expired')),

  price_cents int not null,
  currency text not null default 'BRL',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_orders_buyer_token on orders (buyer_token);
create index if not exists idx_orders_gift_token on orders (gift_token);
create index if not exists idx_orders_status on orders (status);

-- ========== ORDER_LYRICS (histórico append-only: opções de refrão + letra completa) ==========
create table if not exists order_lyrics (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  kind text not null check (kind in ('chorus_option', 'full_lyric')),
  version int not null default 1,
  content text not null, -- texto com tags: [Verse 1] ... [Chorus] ... [Bridge] ...
  is_selected boolean not null default false, -- chorus_option: qual foi escolhido
  is_current boolean not null default true,    -- full_lyric: versão mais recente
  source text not null default 'ai' check (source in ('ai', 'user_edited')),
  created_at timestamptz not null default now()
);
create index if not exists idx_order_lyrics_order_id on order_lyrics (order_id);

-- ========== ORDER_TRACKS (gerações de áudio — 2 versões cantadas por pedido) ==========
create table if not exists order_tracks (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  provider text not null,
  provider_job_id text,
  variant text not null check (variant in ('take_1', 'take_2')),
  status text not null default 'queued' check (status in ('queued', 'processing', 'ready', 'failed')),
  full_audio_path text,       -- caminho no bucket privado "tracks"
  duration_seconds numeric,
  word_timestamps jsonb,      -- [{word,start,end}], real ou interpolado por linha
  created_at timestamptz not null default now()
);
create index if not exists idx_order_tracks_order_id on order_tracks (order_id);

-- ========== ORDER_PHOTOS ==========
create table if not exists order_photos (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  image_url text not null,    -- no bucket público "photos"
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_order_photos_order_id on order_photos (order_id);

-- ========== PAYMENTS (cobranças Pix via Woovi, ou provedor mock) ==========
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  provider text not null default 'woovi',
  correlation_id text not null unique, -- chave de idempotência enviada ao provedor (= orders.id)
  charge_id text,
  status text not null default 'created' check (status in ('created', 'pix_generated', 'confirmed', 'expired', 'failed')),
  amount_cents int not null,
  pix_qrcode_image_url text,
  pix_copy_paste text,
  raw_webhook_payload jsonb,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_payments_order_id on payments (order_id);
create index if not exists idx_payments_correlation_id on payments (correlation_id);

-- ========== ADMIN ==========
create table if not exists admin_users (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now()
);

create or replace function is_admin() returns boolean as $$
  select exists (select 1 from admin_users where id = auth.uid());
$$ language sql stable security definer;

-- ========== ROW LEVEL SECURITY ==========
-- Default-deny: não há comprador autenticado neste produto (acesso é via
-- buyer_token/gift_token na URL, não login), então NENHUMA policy pública é
-- criada aqui. Se existisse uma policy pública de select nessas tabelas,
-- qualquer pessoa poderia enumerar todos os pedidos pagos de todo mundo.
-- Toda leitura de comprador/presente passa por Server Actions/Components
-- usando createAdminClient() (lib/supabase/server.ts) com checagem manual de
-- token + status no código da aplicação — nunca confiando em RLS pública.
alter table orders enable row level security;
alter table order_lyrics enable row level security;
alter table order_tracks enable row level security;
alter table order_photos enable row level security;
alter table payments enable row level security;
alter table admin_users enable row level security;

create policy "admin_all_orders" on orders for all using (is_admin()) with check (is_admin());
create policy "admin_all_order_lyrics" on order_lyrics for all using (is_admin()) with check (is_admin());
create policy "admin_all_order_tracks" on order_tracks for all using (is_admin()) with check (is_admin());
create policy "admin_all_order_photos" on order_photos for all using (is_admin()) with check (is_admin());
create policy "admin_all_payments" on payments for all using (is_admin()) with check (is_admin());
create policy "admin_reads_self" on admin_users for select using (id = auth.uid());

-- ========== STORAGE ==========
insert into storage.buckets (id, name, public) values ('photos', 'photos', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('tracks', 'tracks', false) on conflict (id) do nothing;

create policy "public_read_photos" on storage.objects for select using (bucket_id = 'photos');
create policy "admin_write_storage" on storage.objects for all using (
  bucket_id in ('photos', 'tracks') and is_admin()
) with check (
  bucket_id in ('photos', 'tracks') and is_admin()
);
-- bucket "tracks": sem policy pública de leitura — o MP3 e o áudio de preview só
-- saem via signed URL mintada no servidor, depois de checar token + status.
