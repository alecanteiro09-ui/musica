-- O upsell de foto-quadro passa a ser escolhido no PRÓPRIO checkout (popup
-- de pagamento), no mesmo Pix da música — não é mais uma compra separada
-- depois do pagamento. Esses campos guardam a escolha feita no checkout,
-- antes de existir a linha em photo_pdf_orders (que só é criada quando o
-- pagamento principal confirma — ver lib/payments/confirm.ts).
alter table orders add column if not exists wants_photo_pdf boolean not null default false;
alter table orders add column if not exists photo_pdf_frame_size text;
alter table orders add column if not exists photo_pdf_source_url text;
