-- Guarda o taskId da geração de imagem (Nano Banana via Kie.ai) enquanto o
-- pedido de foto-quadro está em "generating" — mesmo padrão de
-- order_tracks.provider_job_id, só que não cabia prever no 0003.
alter table photo_pdf_orders add column if not exists image_task_id text;
