-- Banco próprio da Evolution API (WhatsApp), no mesmo Postgres do sistema.
-- Só roda quando o volume do banco é criado do zero; num banco já existente, crie à mão:
--   docker compose exec db psql -U psystem -c 'CREATE DATABASE evolution'
CREATE DATABASE evolution;
