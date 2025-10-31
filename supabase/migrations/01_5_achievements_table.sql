-- =====================================================
-- TABELA DE ACHIEVEMENTS TEMPLATES
-- =====================================================
-- Esta tabela armazena templates de conquistas
-- que são usados para criar user_achievements

CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    rarity TEXT DEFAULT 'common' CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
    points INTEGER DEFAULT 10,
    icon TEXT,
    requirements JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
-- Verificar se a coluna code existe antes de criar índice
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'achievements' AND column_name = 'code'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_achievements_code ON achievements(code);
    END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_achievements_category ON achievements(category);
CREATE INDEX IF NOT EXISTS idx_achievements_active ON achievements(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_achievements_rarity ON achievements(rarity);

-- RLS
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- Políticas: Achievements são públicos para leitura
CREATE POLICY "Achievements are viewable by everyone" ON achievements
    FOR SELECT USING (is_active = true);

SELECT 'Achievements table created successfully!' as status;
