-- Rollback Migration: Reverter Webhook Idempotency
-- 
-- ✅ CORRIGIDO: Script de rollback para migration 018
-- Uso: Execute este script se precisar reverter as mudanças de idempotência
--
-- AVISO: Isso removerá a proteção contra duplicação de webhooks. Use apenas em emergências.

BEGIN;

-- Remover funções criadas
DROP FUNCTION IF EXISTS is_webhook_processed(TEXT, TEXT);
DROP FUNCTION IF EXISTS register_webhook_processed(TEXT, TEXT, TEXT, UUID, TEXT, JSONB);

-- Remover tabela
DROP TABLE IF EXISTS processed_webhooks;

-- Nota: Os dados de webhooks processados serão perdidos
-- Certifique-se de ter backup antes de executar

COMMIT;
