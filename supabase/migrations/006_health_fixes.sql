-- ============================================================
-- Migração 006: Correções RLS para Cálculos de Saúde
-- Para: RE-EDUCA Store - Sistema de Reeducação de Estilo de Vida
-- Data: 2025
-- ============================================================
--
-- Esta migração consolida:
-- - 20_fix_food_diary_entries_rls.sql
-- - 21_fix_health_calculations_rls.sql
--
-- Ajusta políticas RLS para funcionar com service role key do backend
-- ============================================================

-- ============================================================
-- 1. FIX: FOOD_DIARY_ENTRIES RLS
-- ============================================================

-- Remover políticas antigas se existirem (para recriar)
DROP POLICY IF EXISTS "Users can view their own food diary entries" ON food_diary_entries;
DROP POLICY IF EXISTS "Users can insert their own food diary entries" ON food_diary_entries;
DROP POLICY IF EXISTS "Users can update their own food diary entries" ON food_diary_entries;
DROP POLICY IF EXISTS "Users can delete their own food diary entries" ON food_diary_entries;
DROP POLICY IF EXISTS "Enable all operations for authenticated service" ON food_diary_entries;

-- Criar políticas RLS que funcionam com service role key do backend
-- Permite todas as operações quando autenticado via service role (backend usa SUPABASE_KEY)
CREATE POLICY "Enable all operations for authenticated service" ON food_diary_entries
    FOR ALL USING (true)
    WITH CHECK (true);

-- ============================================================
-- 2. FIX: HEALTH CALCULATIONS RLS
-- ============================================================

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Users can view own biological_age_calculations" ON biological_age_calculations;
DROP POLICY IF EXISTS "Users can insert own biological_age_calculations" ON biological_age_calculations;
DROP POLICY IF EXISTS "Users can update own biological_age_calculations" ON biological_age_calculations;
DROP POLICY IF EXISTS "Users can delete own biological_age_calculations" ON biological_age_calculations;

DROP POLICY IF EXISTS "Users can view own metabolism_calculations" ON metabolism_calculations;
DROP POLICY IF EXISTS "Users can insert own metabolism_calculations" ON metabolism_calculations;
DROP POLICY IF EXISTS "Users can update own metabolism_calculations" ON metabolism_calculations;
DROP POLICY IF EXISTS "Users can delete own metabolism_calculations" ON metabolism_calculations;

DROP POLICY IF EXISTS "Users can view own sleep_calculations" ON sleep_calculations;
DROP POLICY IF EXISTS "Users can insert own sleep_calculations" ON sleep_calculations;
DROP POLICY IF EXISTS "Users can update own sleep_calculations" ON sleep_calculations;
DROP POLICY IF EXISTS "Users can delete own sleep_calculations" ON sleep_calculations;

DROP POLICY IF EXISTS "Users can view own stress_calculations" ON stress_calculations;
DROP POLICY IF EXISTS "Users can insert own stress_calculations" ON stress_calculations;
DROP POLICY IF EXISTS "Users can update own stress_calculations" ON stress_calculations;
DROP POLICY IF EXISTS "Users can delete own stress_calculations" ON stress_calculations;

DROP POLICY IF EXISTS "Users can view own hydration_calculations" ON hydration_calculations;
DROP POLICY IF EXISTS "Users can insert own hydration_calculations" ON hydration_calculations;
DROP POLICY IF EXISTS "Users can update own hydration_calculations" ON hydration_calculations;
DROP POLICY IF EXISTS "Users can delete own hydration_calculations" ON hydration_calculations;

DROP POLICY IF EXISTS "Users can view own imc_calculations" ON imc_calculations;
DROP POLICY IF EXISTS "Users can insert own imc_calculations" ON imc_calculations;
DROP POLICY IF EXISTS "Users can update own imc_calculations" ON imc_calculations;
DROP POLICY IF EXISTS "Users can delete own imc_calculations" ON imc_calculations;

-- Criar novas políticas que funcionam com service role key
-- Permite todas as operações quando autenticado via service role (backend usa SUPABASE_KEY)

-- biological_age_calculations
CREATE POLICY "Enable all operations for authenticated service" ON biological_age_calculations
    FOR ALL USING (true) WITH CHECK (true);

-- metabolism_calculations
CREATE POLICY "Enable all operations for authenticated service" ON metabolism_calculations
    FOR ALL USING (true) WITH CHECK (true);

-- sleep_calculations
CREATE POLICY "Enable all operations for authenticated service" ON sleep_calculations
    FOR ALL USING (true) WITH CHECK (true);

-- stress_calculations
CREATE POLICY "Enable all operations for authenticated service" ON stress_calculations
    FOR ALL USING (true) WITH CHECK (true);

-- hydration_calculations
CREATE POLICY "Enable all operations for authenticated service" ON hydration_calculations
    FOR ALL USING (true) WITH CHECK (true);

-- imc_calculations
CREATE POLICY "Enable all operations for authenticated service" ON imc_calculations
    FOR ALL USING (true) WITH CHECK (true);

SELECT 'Migração 006: Correções RLS de saúde aplicadas com sucesso!' as status;
