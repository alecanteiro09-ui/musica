-- Pagamento com cartão (Woovi Parcelado) devolve um link de checkout
-- hospedado pela Woovi, não um QR Pix — precisa de onde guardar isso.
alter table payments add column if not exists payment_link_url text;
alter table payments add column if not exists method text not null default 'pix' check (method in ('pix', 'card'));
