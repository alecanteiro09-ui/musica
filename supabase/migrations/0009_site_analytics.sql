-- Analytics de visitante pro painel /admin (dados de quem entra no site +
-- mapa de calor de clique/rolagem). Sem RLS pública de propósito, igual ao
-- resto do schema: só o cliente admin/service-role (createAdminClient())
-- escreve/lê aqui, nunca o navegador direto — ver app/api/site-analytics.
create table if not exists page_views (
  id uuid primary key,
  visitor_id text not null,
  session_id text not null,
  path text not null,
  referrer text,
  utm jsonb,
  device_type text not null default 'desktop',
  viewport_w int,
  viewport_h int,
  doc_height int,
  -- % da altura do documento que a pessoa rolou (0-100). Junto com
  -- scroll_dwell_ms abaixo é o que responde "onde as pessoas param e saem".
  max_scroll_pct smallint not null default 0,
  time_on_page_ms int not null default 0,
  -- Tempo de permanência por faixa de 10% da página: {"0": 1200, "10": 3400, ...}.
  scroll_dwell_ms jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists page_views_path_idx on page_views (path);
create index if not exists page_views_created_at_idx on page_views (created_at);
create index if not exists page_views_visitor_idx on page_views (visitor_id);

-- Pontos de clique pro mapa de calor. x_pct/y_pct são relativos (posição /
-- tamanho da tela e da página inteira), pra cliques de qualquer resolução
-- caírem no mesmo mapa. path duplicado aqui (em vez de só via join com
-- page_views) porque a query do heatmap sempre filtra por página primeiro.
create table if not exists page_clicks (
  id uuid primary key default gen_random_uuid(),
  page_view_id uuid not null references page_views(id) on delete cascade,
  path text not null,
  device_type text not null default 'desktop',
  x_pct numeric(5,2) not null,
  y_pct numeric(5,2) not null,
  created_at timestamptz not null default now()
);
create index if not exists page_clicks_path_idx on page_clicks (path);

-- RLS habilitado sem nenhuma policy: bloqueia anon/authenticated por
-- completo (a anon key é pública, embutida no bundle do navegador — sem
-- isso, qualquer um leria os dados de visitante pela API REST). Só o
-- service-role (createAdminClient(), nunca usado no navegador) tem acesso —
-- mesmo padrão do resto do schema deste projeto.
alter table page_views enable row level security;
alter table page_clicks enable row level security;
