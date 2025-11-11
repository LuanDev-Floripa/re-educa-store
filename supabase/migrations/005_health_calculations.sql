-- ============================================================
-- Migração 005: Cálculos de Saúde e Histórico
-- Para: RE-EDUCA Store - Sistema de Reeducação de Estilo de Vida
-- Data: 2025
-- ============================================================
--
-- Esta migração consolida:
-- - 12_create_health_calculations.sql
-- - 14_create_food_diary_entries.sql
-- - 17_create_additional_health_calculations.sql
--
-- Cria todas as tabelas de cálculos de saúde e histórico
-- ============================================================

-- ============================================================
-- 1. TABELAS GERAIS DE CÁLCULOS DE SAÚDE
-- ============================================================

-- Tabela geral de cálculos de saúde
CREATE TABLE IF NOT EXISTS health_calculations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    calculation_type TEXT NOT NULL CHECK (calculation_type IN ('bmi', 'calories', 'hydration', 'body_fat')),
    input_data JSONB NOT NULL,
    result_data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Histórico de IMC (para predições)
CREATE TABLE IF NOT EXISTS imc_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    weight DECIMAL(5,2) NOT NULL CHECK (weight > 0),
    height DECIMAL(5,2) NOT NULL CHECK (height > 0),
    imc_value DECIMAL(4,1) NOT NULL CHECK (imc_value > 0),
    category TEXT NOT NULL,
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Histórico de Calorias
CREATE TABLE IF NOT EXISTS calories_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    age INTEGER CHECK (age > 0),
    gender TEXT CHECK (gender IN ('male', 'female')),
    height_cm DECIMAL(5,2) CHECK (height_cm > 0),
    weight_kg DECIMAL(5,2) CHECK (weight_kg > 0),
    activity_level TEXT CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
    bmr DECIMAL(8,2),
    daily_calories DECIMAL(8,2),
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Histórico de Hidratação
CREATE TABLE IF NOT EXISTS hydration_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    weight_kg DECIMAL(5,2) CHECK (weight_kg > 0),
    activity_level TEXT CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
    climate TEXT CHECK (climate IN ('cold', 'temperate', 'hot', 'very_hot')),
    total_water_ml INTEGER CHECK (total_water_ml > 0),
    total_water_liters DECIMAL(5,2) CHECK (total_water_liters > 0),
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Histórico de Gordura Corporal
CREATE TABLE IF NOT EXISTS body_fat_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    age INTEGER CHECK (age > 0),
    gender TEXT CHECK (gender IN ('male', 'female')),
    height_cm DECIMAL(5,2) CHECK (height_cm > 0),
    weight_kg DECIMAL(5,2) CHECK (weight_kg > 0),
    waist_cm DECIMAL(5,2) CHECK (waist_cm > 0),
    neck_cm DECIMAL(5,2) CHECK (neck_cm > 0),
    body_fat_percentage DECIMAL(4,1) CHECK (body_fat_percentage >= 0 AND body_fat_percentage <= 100),
    category TEXT NOT NULL,
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Sessões de Treino (para activity trend)
CREATE TABLE IF NOT EXISTS workout_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exercise_name TEXT,
    duration_minutes INTEGER CHECK (duration_minutes > 0),
    calories_burned DECIMAL(6,2),
    intensity TEXT CHECK (intensity IN ('low', 'moderate', 'high', 'very_high')) DEFAULT 'moderate',
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. TABELAS ADICIONAIS DE CÁLCULOS (compatibilidade com código)
-- ============================================================

-- Tabela: biological_age_calculations
CREATE TABLE IF NOT EXISTS biological_age_calculations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    chronological_age INTEGER NOT NULL CHECK (chronological_age > 0 AND chronological_age <= 150),
    biological_age DECIMAL(5,2) NOT NULL,
    age_difference DECIMAL(5,2) NOT NULL,
    classification TEXT NOT NULL CHECK (classification IN ('excellent', 'good', 'average', 'poor', 'critical')),
    score DECIMAL(5,2) CHECK (score >= 0 AND score <= 100),
    factors JSONB DEFAULT '{}'::jsonb,
    recommendations JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela: metabolism_calculations
CREATE TABLE IF NOT EXISTS metabolism_calculations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    age INTEGER CHECK (age > 0 AND age <= 150),
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    weight DECIMAL(5,2) CHECK (weight > 0),
    height DECIMAL(5,2) CHECK (height > 0),
    activity_level TEXT CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
    bmr DECIMAL(8,2) CHECK (bmr > 0),
    tdee DECIMAL(8,2) CHECK (tdee > 0),
    metabolism_type TEXT,
    recommendations JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela: sleep_calculations
CREATE TABLE IF NOT EXISTS sleep_calculations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    age INTEGER CHECK (age > 0 AND age <= 150),
    sleep_duration DECIMAL(4,2) CHECK (sleep_duration >= 0 AND sleep_duration <= 24),
    sleep_quality TEXT CHECK (sleep_quality IN ('excellent', 'good', 'fair', 'poor')),
    bedtime TIME,
    wake_time TIME,
    sleep_efficiency DECIMAL(5,2) CHECK (sleep_efficiency >= 0 AND sleep_efficiency <= 100),
    recommendations JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela: stress_calculations
CREATE TABLE IF NOT EXISTS stress_calculations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stress_level TEXT CHECK (stress_level IN ('low', 'moderate', 'high', 'very_high', 'critical')),
    stress_score DECIMAL(5,2) CHECK (stress_score >= 0 AND stress_score <= 100),
    stress_factors JSONB DEFAULT '[]'::jsonb,
    coping_strategies JSONB DEFAULT '[]'::jsonb,
    recommendations JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela: hydration_calculations (compatibilidade com código)
CREATE TABLE IF NOT EXISTS hydration_calculations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    weight DECIMAL(5,2) CHECK (weight > 0),
    age INTEGER CHECK (age > 0 AND age <= 150),
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    activity_level TEXT CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
    climate TEXT CHECK (climate IN ('cold', 'temperate', 'hot', 'very_hot')),
    exercise_duration INTEGER DEFAULT 0 CHECK (exercise_duration >= 0),
    exercise_intensity TEXT CHECK (exercise_intensity IN ('low', 'moderate', 'high', 'very_high')),
    health_conditions JSONB DEFAULT '[]'::jsonb,
    total_intake DECIMAL(6,2) CHECK (total_intake >= 0),
    water_intake DECIMAL(6,2) CHECK (water_intake >= 0),
    other_fluids DECIMAL(6,2) CHECK (other_fluids >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela: imc_calculations (compatibilidade com código)
CREATE TABLE IF NOT EXISTS imc_calculations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    weight DECIMAL(5,2) NOT NULL CHECK (weight > 0),
    height DECIMAL(5,2) NOT NULL CHECK (height > 0),
    imc DECIMAL(4,1) NOT NULL CHECK (imc > 0),
    classification TEXT NOT NULL,
    color TEXT,
    recommendations JSONB DEFAULT '[]'::jsonb,
    weight_range JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. TABELA DE DIÁRIO ALIMENTAR
-- ============================================================

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

-- ============================================================
-- 4. ÍNDICES PARA PERFORMANCE
-- ============================================================

-- Índices para health_calculations
CREATE INDEX IF NOT EXISTS idx_health_calc_user ON health_calculations(user_id);
CREATE INDEX IF NOT EXISTS idx_health_calc_type ON health_calculations(calculation_type);
CREATE INDEX IF NOT EXISTS idx_health_calc_created ON health_calculations(created_at);
CREATE INDEX IF NOT EXISTS idx_health_calc_user_type ON health_calculations(user_id, calculation_type);

-- Índices para imc_history
CREATE INDEX IF NOT EXISTS idx_imc_user ON imc_history(user_id);
CREATE INDEX IF NOT EXISTS idx_imc_created ON imc_history(calculated_at);
CREATE INDEX IF NOT EXISTS idx_imc_user_created ON imc_history(user_id, calculated_at DESC);

-- Índices para calories_history
CREATE INDEX IF NOT EXISTS idx_calories_user ON calories_history(user_id);
CREATE INDEX IF NOT EXISTS idx_calories_created ON calories_history(calculated_at);

-- Índices para hydration_history
CREATE INDEX IF NOT EXISTS idx_hydration_user ON hydration_history(user_id);
CREATE INDEX IF NOT EXISTS idx_hydration_created ON hydration_history(calculated_at);

-- Índices para body_fat_history
CREATE INDEX IF NOT EXISTS idx_body_fat_user ON body_fat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_body_fat_created ON body_fat_history(calculated_at);

-- Índices para workout_sessions
CREATE INDEX IF NOT EXISTS idx_workout_user ON workout_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_completed ON workout_sessions(completed_at);
CREATE INDEX IF NOT EXISTS idx_workout_user_completed ON workout_sessions(user_id, completed_at DESC);

-- Índices para tabelas adicionais
CREATE INDEX IF NOT EXISTS idx_biological_age_user ON biological_age_calculations(user_id);
CREATE INDEX IF NOT EXISTS idx_biological_age_created ON biological_age_calculations(created_at);
CREATE INDEX IF NOT EXISTS idx_biological_age_user_created ON biological_age_calculations(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_metabolism_user ON metabolism_calculations(user_id);
CREATE INDEX IF NOT EXISTS idx_metabolism_created ON metabolism_calculations(created_at);
CREATE INDEX IF NOT EXISTS idx_metabolism_user_created ON metabolism_calculations(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sleep_user ON sleep_calculations(user_id);
CREATE INDEX IF NOT EXISTS idx_sleep_created ON sleep_calculations(created_at);
CREATE INDEX IF NOT EXISTS idx_sleep_user_created ON sleep_calculations(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_stress_user ON stress_calculations(user_id);
CREATE INDEX IF NOT EXISTS idx_stress_created ON stress_calculations(created_at);
CREATE INDEX IF NOT EXISTS idx_stress_user_created ON stress_calculations(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_hydration_calc_user ON hydration_calculations(user_id);
CREATE INDEX IF NOT EXISTS idx_hydration_calc_created ON hydration_calculations(created_at);
CREATE INDEX IF NOT EXISTS idx_hydration_calc_user_created ON hydration_calculations(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_imc_calc_user ON imc_calculations(user_id);
CREATE INDEX IF NOT EXISTS idx_imc_calc_created ON imc_calculations(created_at);
CREATE INDEX IF NOT EXISTS idx_imc_calc_user_created ON imc_calculations(user_id, created_at DESC);

-- Índices para food_diary_entries
CREATE INDEX IF NOT EXISTS idx_food_diary_user ON food_diary_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_food_diary_consumed ON food_diary_entries(consumed_at DESC);
CREATE INDEX IF NOT EXISTS idx_food_diary_user_consumed ON food_diary_entries(user_id, consumed_at DESC);
CREATE INDEX IF NOT EXISTS idx_food_diary_meal_type ON food_diary_entries(meal_type);

-- ============================================================
-- 5. POLÍTICAS RLS (Row Level Security)
-- ============================================================

-- Habilitar RLS nas tabelas
ALTER TABLE health_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE imc_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE calories_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE hydration_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_fat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE biological_age_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE metabolism_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sleep_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE stress_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE hydration_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE imc_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_diary_entries ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (serão ajustadas em 006_health_fixes para service role)
DROP POLICY IF EXISTS "Users can view own health_calculations" ON health_calculations;
DROP POLICY IF EXISTS "Users can view own health_calculations" ON health_calculations;
CREATE POLICY "Users can view own health_calculations" ON health_calculations
    FOR SELECT USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can insert own health_calculations" ON health_calculations;
CREATE POLICY "Users can insert own health_calculations" ON health_calculations
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Aplicar mesmas políticas para outras tabelas
DROP POLICY IF EXISTS "Users can view own imc_history" ON imc_history;
CREATE POLICY "Users can view own imc_history" ON imc_history
    FOR SELECT USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can insert own imc_history" ON imc_history;
CREATE POLICY "Users can insert own imc_history" ON imc_history
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can view own calories_history" ON calories_history;
CREATE POLICY "Users can view own calories_history" ON calories_history
    FOR SELECT USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can insert own calories_history" ON calories_history;
CREATE POLICY "Users can insert own calories_history" ON calories_history
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can view own hydration_history" ON hydration_history;
CREATE POLICY "Users can view own hydration_history" ON hydration_history
    FOR SELECT USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can insert own hydration_history" ON hydration_history;
CREATE POLICY "Users can insert own hydration_history" ON hydration_history
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can view own body_fat_history" ON body_fat_history;
CREATE POLICY "Users can view own body_fat_history" ON body_fat_history
    FOR SELECT USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can insert own body_fat_history" ON body_fat_history;
CREATE POLICY "Users can insert own body_fat_history" ON body_fat_history
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can view own workout_sessions" ON workout_sessions;
CREATE POLICY "Users can view own workout_sessions" ON workout_sessions
    FOR SELECT USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can insert own workout_sessions" ON workout_sessions;
CREATE POLICY "Users can insert own workout_sessions" ON workout_sessions
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Políticas para tabelas adicionais
DROP POLICY IF EXISTS "Users can view own biological_age_calculations" ON biological_age_calculations;
CREATE POLICY "Users can view own biological_age_calculations" ON biological_age_calculations
    FOR SELECT USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can insert own biological_age_calculations" ON biological_age_calculations;
CREATE POLICY "Users can insert own biological_age_calculations" ON biological_age_calculations
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can view own metabolism_calculations" ON metabolism_calculations;
CREATE POLICY "Users can view own metabolism_calculations" ON metabolism_calculations
    FOR SELECT USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can insert own metabolism_calculations" ON metabolism_calculations;
CREATE POLICY "Users can insert own metabolism_calculations" ON metabolism_calculations
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can view own sleep_calculations" ON sleep_calculations;
CREATE POLICY "Users can view own sleep_calculations" ON sleep_calculations
    FOR SELECT USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can insert own sleep_calculations" ON sleep_calculations;
CREATE POLICY "Users can insert own sleep_calculations" ON sleep_calculations
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can view own stress_calculations" ON stress_calculations;
CREATE POLICY "Users can view own stress_calculations" ON stress_calculations
    FOR SELECT USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can insert own stress_calculations" ON stress_calculations;
CREATE POLICY "Users can insert own stress_calculations" ON stress_calculations
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can view own hydration_calculations" ON hydration_calculations;
CREATE POLICY "Users can view own hydration_calculations" ON hydration_calculations
    FOR SELECT USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can insert own hydration_calculations" ON hydration_calculations;
CREATE POLICY "Users can insert own hydration_calculations" ON hydration_calculations
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can view own imc_calculations" ON imc_calculations;
CREATE POLICY "Users can view own imc_calculations" ON imc_calculations
    FOR SELECT USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can insert own imc_calculations" ON imc_calculations;
CREATE POLICY "Users can insert own imc_calculations" ON imc_calculations
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Políticas para food_diary_entries
DROP POLICY IF EXISTS "Users can view their own food diary entries" ON food_diary_entries;
CREATE POLICY "Users can view their own food diary entries" ON food_diary_entries
    FOR SELECT USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can insert their own food diary entries" ON food_diary_entries;
CREATE POLICY "Users can insert their own food diary entries" ON food_diary_entries
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can update their own food diary entries" ON food_diary_entries;
CREATE POLICY "Users can update their own food diary entries" ON food_diary_entries
    FOR UPDATE USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can delete their own food diary entries" ON food_diary_entries;
CREATE POLICY "Users can delete their own food diary entries" ON food_diary_entries
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- ============================================================
-- 6. TRIGGERS
-- ============================================================

-- Trigger para atualizar updated_at em food_diary_entries
CREATE OR REPLACE FUNCTION update_food_diary_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_food_diary_updated_at ON food_diary_entries;
CREATE TRIGGER trigger_update_food_diary_updated_at
    BEFORE UPDATE ON food_diary_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_food_diary_updated_at();

-- ============================================================
-- 7. COMENTÁRIOS
-- ============================================================

COMMENT ON TABLE health_calculations IS 'Tabela geral para armazenar todos os cálculos de saúde realizados pelos usuários';
COMMENT ON TABLE imc_history IS 'Histórico temporal de IMC para análises preditivas';
COMMENT ON TABLE calories_history IS 'Histórico de necessidades calóricas calculadas';
COMMENT ON TABLE hydration_history IS 'Histórico de necessidades de hidratação';
COMMENT ON TABLE body_fat_history IS 'Histórico de percentual de gordura corporal';
COMMENT ON TABLE workout_sessions IS 'Sessões de treino dos usuários para análise de atividade';
COMMENT ON TABLE biological_age_calculations IS 'Cálculos de idade biológica baseados em múltiplos fatores de saúde';
COMMENT ON TABLE metabolism_calculations IS 'Cálculos de metabolismo (BMR e TDEE) dos usuários';
COMMENT ON TABLE sleep_calculations IS 'Cálculos e análises de qualidade do sono';
COMMENT ON TABLE stress_calculations IS 'Cálculos e análises de níveis de estresse';
COMMENT ON TABLE hydration_calculations IS 'Cálculos de necessidades de hidratação (compatível com código)';
COMMENT ON TABLE imc_calculations IS 'Cálculos de IMC (compatível com código, complementa imc_history)';
COMMENT ON TABLE food_diary_entries IS 'Diário alimentar detalhado dos usuários para análise preditiva';

SELECT 'Migração 005: Cálculos de saúde criados com sucesso!' as status;
