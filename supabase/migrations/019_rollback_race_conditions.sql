-- Rollback Migration: Reverter Race Conditions Fix
-- 
-- ✅ CORRIGIDO: Script de rollback para migration 017
-- Uso: Execute este script se precisar reverter as mudanças de race conditions
--
-- AVISO: Isso removerá as proteções de race conditions. Use apenas em emergências.

BEGIN;

-- Remover funções criadas
DROP FUNCTION IF EXISTS create_order_atomic(UUID, JSONB, JSONB);
DROP FUNCTION IF EXISTS update_product_stock(UUID, INTEGER);

-- Remover constraint de estoque (se necessário)
-- ALTER TABLE products DROP CONSTRAINT IF EXISTS check_stock_non_negative;

-- Nota: Os dados já criados não serão afetados
-- Apenas as funções e proteções serão removidas

COMMIT;
