-- ============================================================
-- Migração 17: Tabelas Adicionais de Cálculos de Saúde
-- Para: RE-EDUCA Store - Sistema de Reeducação de Estilo de Vida
-- Data: 2025-01-27
-- ============================================================
-- 
-- Esta migração cria as tabelas faltantes para cálculos de saúde:
-- - biological_age_calculations
-- - metabolism_calculations
-- - sleep_calculations
-- - stress_calculations
-- - hydration_calculations
-- - imc_calculations (compatibilidade com código existente)
--
-- Nota: hydration_history já existe, mas o código usa hydration_calculations
-- Nota: imc_history já existe, mas o código usa imc_calculations
-- ============================================================

-- ============================================================
-- Tabela: biological_age_calculations
-- ============================================================
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

-- ============================================================
-- Tabela: metabolism_calculations
-- ============================================================
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

-- ============================================================
-- Tabela: sleep_calculations
-- ============================================================
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

-- ============================================================
-- Tabela: stress_calculations
-- ============================================================
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

-- ============================================================
-- Tabela: hydration_calculations
-- ============================================================
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

-- ============================================================
-- Tabela: imc_calculations (compatibilidade com código)
-- ============================================================
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
-- ÍNDICES PARA PERFORMANCE
-- ============================================================

-- Índices para biological_age_calculations
CREATE INDEX IF NOT EXISTS idx_biological_age_user ON biological_age_calculations(user_id);
CREATE INDEX IF NOT EXISTS idx_biological_age_created ON biological_age_calculations(created_at);
CREATE INDEX IF NOT EXISTS idx_biological_age_user_created ON biological_age_calculations(user_id, created_at DESC);

-- Índices para metabolism_calculations
CREATE INDEX IF NOT EXISTS idx_metabolism_user ON metabolism_calculations(user_id);
CREATE INDEX IF NOT EXISTS idx_metabolism_created ON metabolism_calculations(created_at);
CREATE INDEX IF NOT EXISTS idx_metabolism_user_created ON metabolism_calculations(user_id, created_at DESC);

-- Índices para sleep_calculations
CREATE INDEX IF NOT EXISTS idx_sleep_user ON sleep_calculations(user_id);
CREATE INDEX IF NOT EXISTS idx_sleep_created ON sleep_calculations(created_at);
CREATE INDEX IF NOT EXISTS idx_sleep_user_created ON sleep_calculations(user_id, created_at DESC);

-- Índices para stress_calculations
CREATE INDEX IF NOT EXISTS idx_stress_user ON stress_calculations(user_id);
CREATE INDEX IF NOT EXISTS idx_stress_created ON stress_calculations(created_at);
CREATE INDEX IF NOT EXISTS idx_stress_user_created ON stress_calculations(user_id, created_at DESC);

-- Índices para hydration_calculations
CREATE INDEX IF NOT EXISTS idx_hydration_calc_user ON hydration_calculations(user_id);
CREATE INDEX IF NOT EXISTS idx_hydration_calc_created ON hydration_calculations(created_at);
CREATE INDEX IF NOT EXISTS idx_hydration_calc_user_created ON hydration_calculations(user_id, created_at DESC);

-- Índices para imc_calculations
CREATE INDEX IF NOT EXISTS idx_imc_calc_user ON imc_calculations(user_id);
CREATE INDEX IF NOT EXISTS idx_imc_calc_created ON imc_calculations(created_at);
CREATE INDEX IF NOT EXISTS idx_imc_calc_user_created ON imc_calculations(user_id, created_at DESC);

-- ============================================================
-- POLÍTICAS RLS (Row Level Security)
-- ============================================================

-- Habilitar RLS nas tabelas
ALTER TABLE biological_age_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE metabolism_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sleep_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE stress_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE hydration_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE imc_calculations ENABLE ROW LEVEL SECURITY;

-- Políticas para biological_age_calculations
CREATE POLICY "Users can view own biological_age_calculations" ON biological_age_calculations
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own biological_age_calculations" ON biological_age_calculations
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Políticas para metabolism_calculations
CREATE POLICY "Users can view own metabolism_calculations" ON metabolism_calculations
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own metabolism_calculations" ON metabolism_calculations
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Políticas para sleep_calculations
CREATE POLICY "Users can view own sleep_calculations" ON sleep_calculations
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own sleep_calculations" ON sleep_calculations
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Políticas para stress_calculations
CREATE POLICY "Users can view own stress_calculations" ON stress_calculations
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own stress_calculations" ON stress_calculations
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Políticas para hydration_calculations
CREATE POLICY "Users can view own hydration_calculations" ON hydration_calculations
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own hydration_calculations" ON hydration_calculations
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Políticas para imc_calculations
CREATE POLICY "Users can view own imc_calculations" ON imc_calculations
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own imc_calculations" ON imc_calculations
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- ============================================================
-- COMENTÁRIOS
-- ============================================================

COMMENT ON TABLE biological_age_calculations IS 'Cálculos de idade biológica baseados em múltiplos fatores de saúde';
COMMENT ON TABLE metabolism_calculations IS 'Cálculos de metabolismo (BMR e TDEE) dos usuários';
COMMENT ON TABLE sleep_calculations IS 'Cálculos e análises de qualidade do sono';
COMMENT ON TABLE stress_calculations IS 'Cálculos e análises de níveis de estresse';
COMMENT ON TABLE hydration_calculations IS 'Cálculos de necessidades de hidratação (compatível com código)';
COMMENT ON TABLE imc_calculations IS 'Cálculos de IMC (compatível com código, complementa imc_history)';
