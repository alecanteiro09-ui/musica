-- Funil de remarketing por e-mail (carrinho abandonado): o pedido já tem
-- buyer_email desde o fim do wizard (createDraftOrder), antes de qualquer
-- pagamento — então "abandonado" é só um pedido com e-mail que nunca chega
-- a paid/delivered. Essas colunas rastreiam onde cada pedido está nessa
-- sequência e guardam a oferta (desconto/foto grátis) já concedida.
alter table orders add column if not exists remarketing_stage int not null default 0
  check (remarketing_stage between 0 and 3);
alter table orders add column if not exists remarketing_last_sent_at timestamptz;
alter table orders add column if not exists marketing_opt_out boolean not null default false;
alter table orders add column if not exists discount_cents int not null default 0;
alter table orders add column if not exists promo_free_photo boolean not null default false;
