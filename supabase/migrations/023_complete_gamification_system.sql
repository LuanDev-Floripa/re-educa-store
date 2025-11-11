-- ============================================================
-- Migração 023: Sistema Completo de Gamificação
-- Para: RE-EDUCA Store
-- Data: 2025
-- ============================================================
--
-- Adiciona tabelas para desafios, progresso de desafios,
-- recompensas e sistema de pontos completo
-- ============================================================

-- ============================================================
-- 1. TABELAS DE DESAFIOS
-- ============================================================

-- CHALLENGES TABLE (Templates de desafios)
CREATE TABLE IF NOT EXISTS challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('profile', 'calculator', 'food_diary', 'store', 'social', 'workout', 'video', 'custom')),
    points INTEGER DEFAULT 0,
    requirements JSONB, -- Ex: {"action": "complete_profile", "count": 1}
    duration_days INTEGER, -- Duração em dias (NULL = sem duração)
    is_active BOOLEAN DEFAULT true,
    is_recurring BOOLEAN DEFAULT false, -- Se pode ser completado múltiplas vezes
    difficulty TEXT DEFAULT 'easy' CHECK (difficulty IN ('easy', 'medium', 'hard', 'expert')),
    category TEXT,
    icon TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- USER_CHALLENGES TABLE (Progresso de desafios do usuário)
CREATE TABLE IF NOT EXISTS user_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
    progress INTEGER DEFAULT 0,
    target INTEGER DEFAULT 1,
    status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'expired', 'abandoned')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    points_earned INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, challenge_id, status) -- Um usuário pode ter apenas um desafio ativo por vez
);

-- ============================================================
-- 2. TABELAS DE RECOMPENSAS
-- ============================================================

-- REWARDS TABLE (Templates de recompensas)
CREATE TABLE IF NOT EXISTS rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('points', 'coupon', 'badge', 'product', 'discount', 'custom')),
    value JSONB, -- Valor da recompensa (ex: {"points": 100} ou {"coupon_code": "BONUS10"})
    cost_points INTEGER DEFAULT 0, -- Pontos necessários para reivindicar
    availability_limit INTEGER, -- Limite de disponibilidade (NULL = ilimitado)
    is_active BOOLEAN DEFAULT true,
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valid_until TIMESTAMP WITH TIME ZONE,
    icon TEXT,
    rarity TEXT DEFAULT 'common' CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- USER_REWARDS TABLE (Recompensas reivindicadas pelos usuários)
CREATE TABLE IF NOT EXISTS user_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reward_id UUID REFERENCES rewards(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'claimed' CHECK (status IN ('claimed', 'used', 'expired')),
    claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB, -- Dados adicionais (ex: código do cupom gerado)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 3. TABELA DE PONTOS DO USUÁRIO
-- ============================================================

-- USER_POINTS TABLE (Histórico de pontos do usuário)
CREATE TABLE IF NOT EXISTS user_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    points INTEGER NOT NULL,
    source TEXT NOT NULL, -- 'achievement', 'challenge', 'reward', 'purchase', 'referral', etc.
    source_id UUID, -- ID da origem (achievement_id, challenge_id, etc.)
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar coluna total_points na tabela users se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'total_points'
    ) THEN
        ALTER TABLE users ADD COLUMN total_points INTEGER DEFAULT 0;
    END IF;
END $$;

-- ============================================================
-- 4. ÍNDICES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_challenges_code ON challenges(code) WHERE code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_challenges_type ON challenges(type);
CREATE INDEX IF NOT EXISTS idx_challenges_active ON challenges(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_user_challenges_user ON user_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_challenges_challenge ON user_challenges(challenge_id);
CREATE INDEX IF NOT EXISTS idx_user_challenges_status ON user_challenges(status);
CREATE INDEX IF NOT EXISTS idx_user_challenges_user_status ON user_challenges(user_id, status);

CREATE INDEX IF NOT EXISTS idx_rewards_code ON rewards(code) WHERE code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_rewards_type ON rewards(type);
CREATE INDEX IF NOT EXISTS idx_rewards_active ON rewards(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_user_rewards_user ON user_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_user_rewards_reward ON user_rewards(reward_id);
CREATE INDEX IF NOT EXISTS idx_user_rewards_status ON user_rewards(status);

CREATE INDEX IF NOT EXISTS idx_user_points_user ON user_points(user_id);
CREATE INDEX IF NOT EXISTS idx_user_points_source ON user_points(source);
CREATE INDEX IF NOT EXISTS idx_user_points_created ON user_points(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_users_total_points ON users(total_points DESC);

-- ============================================================
-- 5. RLS (ROW LEVEL SECURITY)
-- ============================================================

ALTER TABLE IF EXISTS challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_points ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para challenges (públicos para leitura)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'challenges' AND policyname = 'Challenges are viewable by everyone') THEN
        CREATE POLICY "Challenges are viewable by everyone" ON challenges
            FOR SELECT USING (is_active = true);
    END IF;
END $$;

-- Políticas RLS para user_challenges
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_challenges' AND policyname = 'Users can view own challenges') THEN
        CREATE POLICY "Users can view own challenges" ON user_challenges
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_challenges' AND policyname = 'Users can manage own challenges') THEN
        CREATE POLICY "Users can manage own challenges" ON user_challenges
            FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;

-- Políticas RLS para rewards (públicos para leitura)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'rewards' AND policyname = 'Rewards are viewable by everyone') THEN
        CREATE POLICY "Rewards are viewable by everyone" ON rewards
            FOR SELECT USING (is_active = true AND (valid_until IS NULL OR valid_until > NOW()));
    END IF;
END $$;

-- Políticas RLS para user_rewards
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_rewards' AND policyname = 'Users can view own rewards') THEN
        CREATE POLICY "Users can view own rewards" ON user_rewards
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_rewards' AND policyname = 'Users can claim own rewards') THEN
        CREATE POLICY "Users can claim own rewards" ON user_rewards
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_rewards' AND policyname = 'Users can update own rewards') THEN
        CREATE POLICY "Users can update own rewards" ON user_rewards
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Políticas RLS para user_points
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_points' AND policyname = 'Users can view own points') THEN
        CREATE POLICY "Users can view own points" ON user_points
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

-- ============================================================
-- 6. FUNÇÕES E TRIGGERS
-- ============================================================

-- Função para atualizar total_points do usuário
CREATE OR REPLACE FUNCTION update_user_total_points()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE users
    SET total_points = (
        SELECT COALESCE(SUM(points), 0)
        FROM user_points
        WHERE user_id = NEW.user_id
    )
    WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar total_points quando pontos são adicionados
DROP TRIGGER IF EXISTS trigger_update_user_total_points ON user_points;
CREATE TRIGGER trigger_update_user_total_points
    AFTER INSERT OR UPDATE OR DELETE ON user_points
    FOR EACH ROW
    EXECUTE FUNCTION update_user_total_points();

-- Função para verificar e completar desafios automaticamente
CREATE OR REPLACE FUNCTION check_challenge_completion()
RETURNS TRIGGER AS $$
DECLARE
    challenge_record RECORD;
    user_challenge_record RECORD;
BEGIN
    -- Buscar desafios relacionados à atividade
    FOR challenge_record IN
        SELECT * FROM challenges
        WHERE is_active = true
        AND requirements->>'action' = NEW.activity_type
    LOOP
        -- Verificar se usuário já tem este desafio
        SELECT * INTO user_challenge_record
        FROM user_challenges
        WHERE user_id = NEW.user_id
        AND challenge_id = challenge_record.id
        AND status = 'in_progress'
        LIMIT 1;
        
        IF user_challenge_record IS NOT NULL THEN
            -- Atualizar progresso
            UPDATE user_challenges
            SET progress = progress + 1,
                updated_at = NOW()
            WHERE id = user_challenge_record.id;
            
            -- Verificar se completou
            IF (SELECT progress FROM user_challenges WHERE id = user_challenge_record.id) >= user_challenge_record.target THEN
                UPDATE user_challenges
                SET status = 'completed',
                    completed_at = NOW(),
                    points_earned = challenge_record.points,
                    updated_at = NOW()
                WHERE id = user_challenge_record.id;
                
                -- Adicionar pontos
                INSERT INTO user_points (user_id, points, source, source_id, description)
                VALUES (
                    NEW.user_id,
                    challenge_record.points,
                    'challenge',
                    challenge_record.id,
                    'Desafio completado: ' || challenge_record.name
                );
            END IF;
        END IF;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para verificar conclusão de desafios quando atividade é criada
DROP TRIGGER IF EXISTS trigger_check_challenge_completion ON user_activities;
CREATE TRIGGER trigger_check_challenge_completion
    AFTER INSERT ON user_activities
    FOR EACH ROW
    EXECUTE FUNCTION check_challenge_completion();

-- ============================================================
-- 7. DADOS INICIAIS
-- ============================================================

-- Inserir desafios padrão
INSERT INTO challenges (code, name, description, type, points, requirements, difficulty, category, icon, is_active) VALUES
('complete_profile', 'Complete seu Perfil', 'Complete todas as informações do seu perfil', 'profile', 50, '{"action": "profile_complete", "count": 1}', 'easy', 'profile', 'user-circle', true),
('first_calculation', 'Primeira Calculadora', 'Use qualquer calculadora pela primeira vez', 'calculator', 25, '{"action": "health_calculation", "count": 1}', 'easy', 'health', 'calculator', true),
('food_diary_week', 'Semana de Diário', 'Adicione alimentos ao diário por 7 dias consecutivos', 'food_diary', 100, '{"action": "food_diary_entry", "count": 7, "consecutive": true}', 'medium', 'nutrition', 'calendar', true),
('first_order', 'Primeira Compra', 'Realize sua primeira compra na loja', 'store', 200, '{"action": "order_created", "count": 1}', 'easy', 'ecommerce', 'shopping-cart', true),
('social_post', 'Primeiro Post', 'Faça seu primeiro post na rede social', 'social', 30, '{"action": "post_created", "count": 1}', 'easy', 'social', 'message-square', true),
('workout_week', 'Semana de Treinos', 'Complete 7 treinos em uma semana', 'workout', 150, '{"action": "workout_completed", "count": 7, "period": "week"}', 'medium', 'fitness', 'dumbbell', true),
('video_creator', 'Criador de Conteúdo', 'Faça upload de 5 vídeos', 'video', 100, '{"action": "video_uploaded", "count": 5}', 'medium', 'content', 'video', true),
('social_butterfly', 'Borboleta Social', 'Tenha 50 seguidores', 'social', 75, '{"action": "follower_count", "target": 50}', 'hard', 'social', 'users', true)
ON CONFLICT (code) DO NOTHING;

-- Inserir recompensas padrão
INSERT INTO rewards (code, name, description, type, value, cost_points, is_active, rarity, icon) VALUES
('points_100', '100 Pontos Bônus', 'Ganhe 100 pontos extras', 'points', '{"points": 100}', 500, true, 'common', 'coins'),
('coupon_10', 'Cupom 10% OFF', 'Desconto de 10% na próxima compra', 'coupon', '{"coupon_code": "BONUS10", "discount": 10}', 300, true, 'common', 'tag'),
('coupon_20', 'Cupom 20% OFF', 'Desconto de 20% na próxima compra', 'coupon', '{"coupon_code": "BONUS20", "discount": 20}', 600, true, 'uncommon', 'tag'),
('badge_early', 'Badge Early Adopter', 'Badge exclusivo para usuários iniciais', 'badge', '{"badge_name": "Early Adopter"}', 1000, true, 'rare', 'award'),
('points_500', '500 Pontos Bônus', 'Ganhe 500 pontos extras', 'points', '{"points": 500}', 2000, true, 'uncommon', 'coins')
ON CONFLICT (code) DO NOTHING;

COMMENT ON TABLE challenges IS 'Templates de desafios para gamificação';
COMMENT ON TABLE user_challenges IS 'Progresso de desafios dos usuários';
COMMENT ON TABLE rewards IS 'Templates de recompensas disponíveis';
COMMENT ON TABLE user_rewards IS 'Recompensas reivindicadas pelos usuários';
COMMENT ON TABLE user_points IS 'Histórico de pontos dos usuários';
