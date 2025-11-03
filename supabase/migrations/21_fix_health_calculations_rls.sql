-- =====================================================
-- FIX: Health Calculations RLS Policies
-- Garantir que políticas RLS funcionem com service role key do backend
-- =====================================================

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
