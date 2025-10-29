-- =====================================================
-- TABELA DE DIÁRIO ALIMENTAR (FOOD DIARY ENTRIES)
-- =====================================================
-- Esta tabela é usada para análise preditiva e pode ser
-- um alias ou extensão de nutrition_logs

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

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_food_diary_user ON food_diary_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_food_diary_consumed ON food_diary_entries(consumed_at DESC);
CREATE INDEX IF NOT EXISTS idx_food_diary_user_consumed ON food_diary_entries(user_id, consumed_at DESC);
CREATE INDEX IF NOT EXISTS idx_food_diary_meal_type ON food_diary_entries(meal_type);

-- RLS (Row Level Security)
ALTER TABLE food_diary_entries ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view their own food diary entries" ON food_diary_entries
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own food diary entries" ON food_diary_entries
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own food diary entries" ON food_diary_entries
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own food diary entries" ON food_diary_entries
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_food_diary_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_food_diary_updated_at
    BEFORE UPDATE ON food_diary_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_food_diary_updated_at();

-- Comentários
COMMENT ON TABLE food_diary_entries IS 'Diário alimentar detalhado dos usuários para análise preditiva';
COMMENT ON COLUMN food_diary_entries.consumed_at IS 'Data e hora em que o alimento foi consumido';
