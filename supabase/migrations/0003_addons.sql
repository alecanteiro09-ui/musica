-- ========== VOICE CLONE (upsell: música cantada com a voz do cliente) ==========
-- Fluxo real testado contra a API da Suno via Kie.ai (mesmo provedor de
-- lib/ai/providers/real-music.ts): a pessoa manda uma amostra cantando,
-- recebe uma frase de validação gerada na hora, grava essa frase, e só
-- então a voz vira reutilizável (voice_id) pra cantar a letra do pedido.
alter table orders add column if not exists wants_custom_voice boolean not null default false;
alter table orders add column if not exists voice_status text not null default 'none'
  check (voice_status in ('none', 'sample_submitted', 'awaiting_phrase', 'awaiting_reading', 'processing', 'ready', 'failed'));
alter table orders add column if not exists voice_task_id text;
alter table orders add column if not exists voice_id text;
alter table orders add column if not exists voice_error text;

-- ========== PHOTO PDF (upsell: foto profissional por IA pra imprimir/emoldurar) ==========
-- Compra separada da música, feita DEPOIS do pagamento principal (na tela
-- de sucesso, depois que a pessoa já subiu foto) — por isso tem seu próprio
-- ciclo de pagamento (payments.correlation_id no formato "photopdf:<id>",
-- ver lib/payments/confirm.ts) em vez de reaproveitar orders.status.
create table if not exists photo_pdf_orders (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  frame_size text not null,
  source_photo_url text not null,
  status text not null default 'pending_payment'
    check (status in ('pending_payment', 'paid', 'generating', 'ready', 'failed')),
  amount_cents int not null,
  generated_image_url text,
  pdf_path text,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_photo_pdf_orders_order_id on photo_pdf_orders (order_id);

alter table photo_pdf_orders enable row level security;
create policy "admin_all_photo_pdf_orders" on photo_pdf_orders for all using (is_admin()) with check (is_admin());

-- ========== STORAGE ==========
-- "voice-samples": gravações brutas do cliente (dado sensível — nunca
-- público; a Kie.ai busca o áudio via signed URL de curta duração, mesmo
-- padrão já usado pro bucket "tracks").
-- "addons": foto tratada pela IA + PDF final do upsell de quadro — também
-- privado, entregue só por signed URL/e-mail, nunca link público direto.
insert into storage.buckets (id, name, public) values ('voice-samples', 'voice-samples', false) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('addons', 'addons', false) on conflict (id) do nothing;

create policy "admin_write_addon_storage" on storage.objects for all using (
  bucket_id in ('voice-samples', 'addons') and is_admin()
) with check (
  bucket_id in ('voice-samples', 'addons') and is_admin()
);
