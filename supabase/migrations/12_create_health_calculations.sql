-- ============================================================
-- Migração: Tabelas de Cálculos de Saúde e Histórico
-- Para: RE-EDUCA Store - Sistema de Reeducação de Estilo de Vida
-- ============================================================

-- Tabela geral de cálculos de saúde
CREATE TABLE IF NOT EXISTS health_calculations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    calculation_type TEXT NOT NULL CHECK (calculation_type IN ('bmi', 'calories', 'hydration', 'body_fat')),
    input_data JSONB NOT NULL,
    result_data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Histórico de IMC (para predições)
CREATE TABLE IF NOT EXISTS imc_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
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
    user_id UUID NOT NULL,
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
    user_id UUID NOT NULL,
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
    user_id UUID NOT NULL,
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
    user_id UUID NOT NULL,
    exercise_name TEXT,
    duration_minutes INTEGER CHECK (duration_minutes > 0),
    calories_burned DECIMAL(6,2),
    intensity TEXT CHECK (intensity IN ('low', 'moderate', 'high', 'very_high')) DEFAULT 'moderate',
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES PARA PERFORMANCE
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

-- ============================================================
-- POLÍTICAS RLS (Row Level Security)
-- ============================================================

-- Habilitar RLS nas tabelas
ALTER TABLE health_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE imc_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE calories_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE hydration_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_fat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver apenas seus próprios dados
CREATE POLICY "Users can view own health_calculations" ON health_calculations
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own health_calculations" ON health_calculations
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Aplicar mesmas políticas para outras tabelas
CREATE POLICY "Users can view own imc_history" ON imc_history
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own imc_history" ON imc_history
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view own calories_history" ON calories_history
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own calories_history" ON calories_history
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view own hydration_history" ON hydration_history
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own hydration_history" ON hydration_history
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view own body_fat_history" ON body_fat_history
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own body_fat_history" ON body_fat_history
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view own workout_sessions" ON workout_sessions
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own workout_sessions" ON workout_sessions
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- ============================================================
-- COMENTÁRIOS
-- ============================================================

COMMENT ON TABLE health_calculations IS 'Tabela geral para armazenar todos os cálculos de saúde realizados pelos usuários';
COMMENT ON TABLE imc_history IS 'Histórico temporal de IMC para análises preditivas';
COMMENT ON TABLE calories_history IS 'Histórico de necessidades calóricas calculadas';
COMMENT ON TABLE hydration_history IS 'Histórico de necessidades de hidratação';
COMMENT ON TABLE body_fat_history IS 'Histórico de percentual de gordura corporal';
COMMENT ON TABLE workout_sessions IS 'Sessões de treino dos usuários para análise de atividade';
