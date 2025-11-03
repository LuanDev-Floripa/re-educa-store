
-- ============================================
-- 20_fix_food_diary_entries_rls.sql
-- ============================================

-- =====================================================
-- FIX: FOOD_DIARY_ENTRIES - Garantir tabela e RLS correto
-- =====================================================
-- Esta migration garante que a tabela food_diary_entries existe
-- e que as políticas RLS funcionam com autenticação JWT customizada do backend

-- Criar tabela se não existir
CREATE TABLE IF NOT EXISTS food_diary_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    food_name TEXT NOT NULL,
    calories DECIMAL(10,2) NOT NULL DEFAULT 0,
    protein DECIMAL(10,2) DEFAULT 0,
    carbs DECIMAL(10,2) DEFAULT 0,
    fat DECIMAL(10,2) DEFAULT 0,
    fiber DECIMAL(10,2) DEFAULT 0,
    meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack', 'other')) DEFAULT 'other',
    quantity DECIMAL(10,2) DEFAULT 1,
    unit TEXT DEFAULT 'serving',
    consumed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance (com IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_food_diary_user ON food_diary_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_food_diary_consumed ON food_diary_entries(consumed_at DESC);
CREATE INDEX IF NOT EXISTS idx_food_diary_user_consumed ON food_diary_entries(user_id, consumed_at DESC);
CREATE INDEX IF NOT EXISTS idx_food_diary_meal_type ON food_diary_entries(meal_type);

-- Habilitar RLS
ALTER TABLE food_diary_entries ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem (para recriar)
DROP POLICY IF EXISTS "Users can view their own food diary entries" ON food_diary_entries;
DROP POLICY IF EXISTS "Users can insert their own food diary entries" ON food_diary_entries;
DROP POLICY IF EXISTS "Users can update their own food diary entries" ON food_diary_entries;
DROP POLICY IF EXISTS "Users can delete their own food diary entries" ON food_diary_entries;
DROP POLICY IF EXISTS "Enable all operations for service role" ON food_diary_entries;

-- Criar políticas RLS que funcionam com service role key do backend
-- Permite todas as operações quando autenticado via service role (backend usa SUPABASE_KEY)
CREATE POLICY "Enable all operations for authenticated service" ON food_diary_entries
    FOR ALL USING (true)
    WITH CHECK (true);

-- Trigger para updated_at (criar função se não existir)
CREATE OR REPLACE FUNCTION update_food_diary_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger se não existir
DROP TRIGGER IF EXISTS trigger_update_food_diary_updated_at ON food_diary_entries;
CREATE TRIGGER trigger_update_food_diary_updated_at
    BEFORE UPDATE ON food_diary_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_food_diary_updated_at();

-- Comentários
COMMENT ON TABLE food_diary_entries IS 'Diário alimentar detalhado dos usuários para análise preditiva';
COMMENT ON COLUMN food_diary_entries.consumed_at IS 'Data e hora em que o alimento foi consumido';



-- ============================================
-- 21_fix_health_calculations_rls.sql
-- ============================================

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


