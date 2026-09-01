-- Campos opcionais adicionados ao wizard: clima emocional da música e
-- outros nomes que a pessoa queira citados na letra (ex: filhos, netos).
alter table orders add column if not exists mood text;
alter table orders add column if not exists names_to_include text;
