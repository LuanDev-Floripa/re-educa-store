-- ============================================================
-- Migração 007: Sistema de Exercícios e Planos de Treino
-- Para: RE-EDUCA Store - Sistema de Reeducação de Estilo de Vida
-- Data: 2025
-- ============================================================
--
-- Esta migração consolida:
-- - 16_create_workout_system.sql (com FKs já incluídas)
--
-- Cria sistema completo de exercícios, planos de treino e progresso
-- ============================================================

-- ============================================================
-- 1. TABELA DE EXERCÍCIOS (com 40+ exercícios pre-populados)
-- ============================================================

CREATE TABLE IF NOT EXISTS exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL CHECK (category IN ('strength', 'cardio', 'flexibility', 'core', 'balance', 'hiit', 'yoga', 'pilates')),
    difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    muscle_groups TEXT[] DEFAULT ARRAY[]::TEXT[],
    equipment TEXT[] DEFAULT ARRAY[]::TEXT[],
    instructions TEXT[] DEFAULT ARRAY[]::TEXT[],
    tips TEXT[] DEFAULT ARRAY[]::TEXT[],
    sets INTEGER DEFAULT 3,
    reps TEXT DEFAULT '10-12',
    duration_minutes INTEGER,
    calories_per_minute DECIMAL(4,2),
    rest_seconds INTEGER DEFAULT 60,
    image_url TEXT,
    video_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. TABELAS DE PLANOS DE TREINO
-- ============================================================

CREATE TABLE IF NOT EXISTS workout_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    goal TEXT CHECK (goal IN ('weight_loss', 'muscle_gain', 'endurance', 'strength', 'general_fitness', 'flexibility')),
    difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    duration_weeks INTEGER DEFAULT 4,
    workouts_per_week INTEGER DEFAULT 3,
    is_active BOOLEAN DEFAULT true,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workout_plan_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES workout_plans(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    day_of_week INTEGER CHECK (day_of_week >= 1 AND day_of_week <= 7), -- 1=Segunda, 7=Domingo
    order_in_workout INTEGER DEFAULT 1,
    sets INTEGER,
    reps TEXT,
    rest_seconds INTEGER,
    duration_minutes INTEGER,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS weekly_workout_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES workout_plans(id) ON DELETE SET NULL,
    week_number INTEGER NOT NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 1 AND day_of_week <= 7),
    scheduled_date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('scheduled', 'in_progress', 'completed', 'skipped')) DEFAULT 'scheduled',
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    duration_minutes INTEGER,
    exercises_completed INTEGER DEFAULT 0,
    total_exercises INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS session_exercise_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES weekly_workout_sessions(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    sets_completed INTEGER DEFAULT 0,
    reps_completed TEXT,
    weight_kg DECIMAL(5,2),
    duration_minutes INTEGER,
    rest_taken_seconds INTEGER,
    completed BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. INSERIR 40+ EXERCÍCIOS
-- ============================================================

-- EXERCÍCIOS DE FORÇA (Strength)
INSERT INTO exercises (name, description, category, difficulty, muscle_groups, equipment, instructions, tips, sets, reps, rest_seconds) VALUES
-- Peito
('Supino Reto', 'Execução no banco horizontal com barra ou halteres', 'strength', 'intermediate', ARRAY['peitoral', 'tríceps', 'ombros'], ARRAY['banco', 'barra', 'halteres'], ARRAY['Deite-se no banco com os pés apoiados', 'Segure a barra com pegada média', 'Desça até quase tocar o peito', 'Empurre com força para cima'], ARRAY['Mantenha os ombros retraídos', 'Não arquear a lombar excessivamente', 'Controle o movimento'], 4, '8-12', 90),
('Supino Inclinado', 'Supino em banco inclinado a 30-45 graus', 'strength', 'intermediate', ARRAY['peitoral superior', 'ombros'], ARRAY['banco inclinado', 'halteres'], ARRAY['Ajuste o banco em 30-45 graus', 'Segure os halteres', 'Empurre para cima'], ARRAY['Foque no peitoral superior'], 3, '10-12', 60),
('Flexão de Braço', 'Exercício de peso corporal para peitoral', 'strength', 'beginner', ARRAY['peitoral', 'tríceps', 'ombros', 'core'], ARRAY['peso corporal'], ARRAY['Apoie mãos e pés no chão', 'Mantenha corpo alinhado', 'Desça até quase tocar o chão', 'Empurre para cima'], ARRAY['Mantenha o core contraído'], 3, '10-20', 60),
('Crucifixo', 'Exercício de isolamento para peitoral', 'strength', 'intermediate', ARRAY['peitoral'], ARRAY['halteres', 'banco'], ARRAY['Deite-se no banco', 'Abra os braços lateralmente', 'Feche o movimento'], ARRAY['Controle a fase negativa'], 3, '12-15', 45),

-- Costas
('Barra Fixa', 'Exercício completo para costas', 'strength', 'intermediate', ARRAY['costas', 'bíceps'], ARRAY['barra'], ARRAY['Pegue a barra com pegada aberta', 'Puxe o corpo até o queixo passar a barra', 'Desça controladamente'], ARRAY['Evite balancear'], 3, '6-12', 90),
('Remada Curvada', 'Exercício para desenvolvimento das costas', 'strength', 'intermediate', ARRAY['costas', 'bíceps'], ARRAY['barra', 'halteres'], ARRAY['Incline o tronco para frente', 'Mantenha costas retas', 'Puxe a barra até o abdômen'], ARRAY['Mantenha o core ativo'], 4, '8-10', 90),
('Puxada Frontal', 'Exercício em máquina para costas', 'strength', 'beginner', ARRAY['costas', 'bíceps'], ARRAY['máquina'], ARRAY['Sente-se na máquina', 'Puxe a barra até o peito', 'Controle a volta'], ARRAY['Varie a pegada'], 3, '10-12', 60),
('Remada Unilateral', 'Exercício unilateral para costas', 'strength', 'intermediate', ARRAY['costas'], ARRAY['halteres', 'banco'], ARRAY['Apoie joelho e mão no banco', 'Puxe o halter até o quadril', 'Troque de lado'], ARRAY['Foque na contração'], 3, '10-12', 60),

-- Pernas
('Agachamento', 'Rei dos exercícios para pernas', 'strength', 'beginner', ARRAY['quadríceps', 'glúteos', 'posterior'], ARRAY['peso corporal', 'barra'], ARRAY['Pés na largura dos ombros', 'Desça até coxas paralelas ao chão', 'Suba empurrando os calcanhares'], ARRAY['Mantenha joelhos alinhados', 'Coluna neutra'], 4, '10-15', 90),
('Agachamento com Salto', 'Exercício pliométrico', 'strength', 'intermediate', ARRAY['quadríceps', 'glúteos'], ARRAY['peso corporal'], ARRAY['Agache profundamente', 'Exploda para cima', 'Aterre suavemente'], ARRAY['Controle o impacto'], 3, '8-12', 90),
('Leg Press', 'Exercício para pernas em máquina', 'strength', 'beginner', ARRAY['quadríceps', 'glúteos'], ARRAY['máquina'], ARRAY['Sente-se na máquina', 'Coloque os pés na plataforma', 'Empurre e retorne'], ARRAY['Não trave os joelhos'], 3, '12-15', 60),
('Afundo', 'Exercício unilateral para pernas', 'strength', 'intermediate', ARRAY['quadríceps', 'glúteos'], ARRAY['peso corporal', 'halteres'], ARRAY['Dê um passo grande à frente', 'Desça a perna traseira', 'Empurre para voltar'], ARRAY['Mantenha tronco ereto'], 3, '10-12 cada perna', 60),
('Elevação de Panturrilha', 'Exercício para panturrilhas', 'strength', 'beginner', ARRAY['panturrilhas'], ARRAY['peso corporal', 'halteres'], ARRAY['Fique na ponta dos pés', 'Levante os calcanhares', 'Desça controladamente'], ARRAY['Faça o movimento completo'], 3, '15-20', 30),
('Extensão de Pernas', 'Isolamento de quadríceps', 'strength', 'beginner', ARRAY['quadríceps'], ARRAY['máquina'], ARRAY['Sente-se na máquina', 'Estenda as pernas', 'Controle a volta'], ARRAY['Não use impulso'], 3, '12-15', 45),

-- Ombros
('Desenvolvimento', 'Exercício para ombros com barra', 'strength', 'intermediate', ARRAY['ombros', 'tríceps'], ARRAY['barra', 'halteres'], ARRAY['Pegue a barra na altura dos ombros', 'Empurre para cima', 'Desça controladamente'], ARRAY['Mantenha core estável'], 3, '8-12', 90),
('Elevação Lateral', 'Isolamento de deltoides laterais', 'strength', 'beginner', ARRAY['ombros'], ARRAY['halteres'], ARRAY['Segure halteres ao lado', 'Levante até altura dos ombros', 'Desça controladamente'], ARRAY['Não balance o corpo'], 3, '12-15', 45),
('Elevação Frontal', 'Isolamento de deltoides anteriores', 'strength', 'beginner', ARRAY['ombros'], ARRAY['halteres', 'barra'], ARRAY['Segure halteres à frente', 'Levante até altura dos ombros', 'Desça'], ARRAY['Mantenha tronco reto'], 3, '12-15', 45),
('Crucifixo Invertido', 'Exercício para deltoides posteriores', 'strength', 'intermediate', ARRAY['ombros', 'costas'], ARRAY['halteres'], ARRAY['Incline o tronco', 'Abra os braços', 'Contraia os ombros'], ARRAY['Controle o movimento'], 3, '12-15', 45),

-- Braços
('Rosca Direta', 'Exercício clássico para bíceps', 'strength', 'beginner', ARRAY['bíceps'], ARRAY['halteres', 'barra'], ARRAY['Segure os halteres', 'Flexione os cotovelos', 'Contraia o bíceps', 'Desça controladamente'], ARRAY['Não balance o corpo'], 3, '10-12', 60),
('Tríceps Pulley', 'Exercício para tríceps em máquina', 'strength', 'beginner', ARRAY['tríceps'], ARRAY['máquina'], ARRAY['Segure a barra', 'Estenda os braços', 'Mantenha cotovelos fixos'], ARRAY['Não balance o corpo'], 3, '12-15', 60),
('Tríceps Testa', 'Exercício deitado para tríceps', 'strength', 'intermediate', ARRAY['tríceps'], ARRAY['halteres', 'barra'], ARRAY['Deite-se no banco', 'Flexione cotovelos', 'Estenda os braços'], ARRAY['Mantenha cotovelos fixos'], 3, '10-12', 60),
('Rosca Martelo', 'Exercício para bíceps e antebraços', 'strength', 'beginner', ARRAY['bíceps', 'antebraços'], ARRAY['halteres'], ARRAY['Segure halteres com pegada neutra', 'Flexione os cotovelos'], ARRAY['Mantenha pulso neutro'], 3, '10-12', 60),

-- Core
('Abdominal Reto', 'Exercício básico para abdominais', 'core', 'beginner', ARRAY['abdominais'], ARRAY['peso corporal'], ARRAY['Deite-se de costas', 'Flexione os joelhos', 'Levante os ombros', 'Contraia o abdômen'], ARRAY['Não puxe o pescoço'], 3, '15-20', 30),
('Prancha', 'Exercício isométrico para core', 'core', 'beginner', ARRAY['core', 'ombros'], ARRAY['peso corporal'], ARRAY['Apoie antebraços e pés', 'Mantenha corpo alinhado', 'Segure a posição'], ARRAY['Não deixe quadril cair'], 3, '30-60 segundos', 60),
('Abdominal Bicicleta', 'Exercício rotacional para core', 'core', 'intermediate', ARRAY['abdominais', 'oblíquos'], ARRAY['peso corporal'], ARRAY['Deite-se de costas', 'Levante os ombros', 'Faça movimento de pedalar'], ARRAY['Controle o movimento'], 3, '15-20 cada lado', 45),
('Russian Twist', 'Exercício rotacional com peso', 'core', 'intermediate', ARRAY['oblíquos', 'abdominais'], ARRAY['peso corporal', 'peso'], ARRAY['Sente-se com joelhos flexionados', 'Gire o tronco', 'Toque o chão ao lado'], ARRAY['Mantenha costas retas'], 3, '20 cada lado', 45),
('Elevação de Pernas', 'Exercício avançado para core', 'core', 'advanced', ARRAY['abdominais inferiores'], ARRAY['peso corporal'], ARRAY['Deite-se de costas', 'Levante as pernas retas', 'Desça controladamente'], ARRAY['Mantenha costas no chão'], 3, '10-15', 60),
('Prancha Lateral', 'Exercício para oblíquos', 'core', 'intermediate', ARRAY['oblíquos', 'core'], ARRAY['peso corporal'], ARRAY['Deite-se de lado', 'Apoie antebraço e pés', 'Mantenha corpo alinhado'], ARRAY['Não deixe quadril cair'], 3, '30-45 segundos cada lado', 45),

-- Cardio
('Corrida', 'Exercício cardiovascular', 'cardio', 'beginner', ARRAY['pernas', 'cardiovascular'], ARRAY['nenhum'], ARRAY['Aqueça 5 minutos', 'Mantenha ritmo constante', 'Resfrie 5 minutos'], ARRAY['Use tênis adequado'], 1, '20-30 minutos', 0),
('Ciclismo', 'Exercício cardiovascular de baixo impacto', 'cardio', 'beginner', ARRAY['pernas', 'cardiovascular'], ARRAY['bicicleta'], ARRAY['Ajuste a altura do selim', 'Mantenha cadência constante'], ARRAY['Use capacete'], 1, '30-45 minutos', 0),
('Burpee', 'Exercício completo e intenso', 'hiit', 'intermediate', ARRAY['pernas', 'peitoral', 'ombros', 'core'], ARRAY['peso corporal'], ARRAY['Agache', 'Pule para trás em prancha', 'Faça flexão', 'Pule para frente', 'Salte'], ARRAY['Mantenha bom ritmo'], 3, '10-15', 60),
('Jumping Jacks', 'Aquecimento e cardio', 'cardio', 'beginner', ARRAY['pernas', 'ombros', 'cardiovascular'], ARRAY['peso corporal'], ARRAY['Salte abrindo pernas e braços', 'Volte à posição inicial'], ARRAY['Mantenha ritmo constante'], 3, '30-50', 45),
('Mountain Climber', 'Exercício de alta intensidade', 'hiit', 'intermediate', ARRAY['core', 'pernas', 'ombros'], ARRAY['peso corporal'], ARRAY['Posição de flexão', 'Alternando pernas', 'Mantenha core firme'], ARRAY['Mantenha ritmo'], 3, '20-30 cada perna', 45),
('Escalador', 'Variação do mountain climber', 'hiit', 'intermediate', ARRAY['core', 'pernas'], ARRAY['peso corporal'], ARRAY['Posição de prancha', 'Traga joelho ao peito', 'Alternando pernas'], ARRAY['Controle a velocidade'], 3, '20 cada perna', 45),

-- Flexibilidade
('Alongamento de Panturrilha', 'Alongamento para panturrilhas', 'flexibility', 'beginner', ARRAY['panturrilhas'], ARRAY['nenhum'], ARRAY['Mantenha perna esticada', 'Puxe o pé em direção ao corpo'], ARRAY['Sinta o alongamento'], 3, '30 segundos cada', 30),
('Alongamento de Quadríceps', 'Alongamento para parte frontal da coxa', 'flexibility', 'beginner', ARRAY['quadríceps'], ARRAY['nenhum'], ARRAY['Segure o pé atrás', 'Puxe em direção ao glúteo'], ARRAY['Mantenha joelhos juntos'], 3, '30 segundos cada', 30),
('Alongamento de Posterior', 'Alongamento para parte posterior da coxa', 'flexibility', 'beginner', ARRAY['posterior'], ARRAY['nenhum'], ARRAY['Sente-se no chão', 'Alcance os pés', 'Mantenha pernas esticadas'], ARRAY['Não force demais'], 3, '30-60 segundos', 30),
('Alongamento de Peitoral', 'Alongamento para peitoral', 'flexibility', 'beginner', ARRAY['peitoral', 'ombros'], ARRAY['parede'], ARRAY['Encoste braço na parede', 'Gire o corpo', 'Sinta o alongamento'], ARRAY['Mantenha ombro relaxado'], 3, '30 segundos cada', 30),

-- Yoga/Pilates
('Postura do Guerreiro', 'Postura de yoga para pernas', 'yoga', 'beginner', ARRAY['pernas', 'core'], ARRAY['nenhum'], ARRAY['Dê passo largo', 'Gire pé da frente', 'Flexione joelho', 'Levante braços'], ARRAY['Mantenha joelho alinhado'], 3, '30-60 segundos cada lado', 30),
('Postura da Criança', 'Postura de relaxamento', 'yoga', 'beginner', ARRAY['costas', 'quadris'], ARRAY['nenhum'], ARRAY['Sente-se nos calcanhares', 'Incline tronco à frente', 'Estenda braços'], ARRAY['Relaxe completamente'], 3, '60 segundos', 30),
('Ponte', 'Exercício de glúteos e core', 'pilates', 'beginner', ARRAY['glúteos', 'core', 'posterior'], ARRAY['nenhum'], ARRAY['Deite-se de costas', 'Levante quadril', 'Contraia glúteos'], ARRAY['Mantenha core ativo'], 3, '12-15', 45),
('Postura do Cachorro Olhando para Baixo', 'Postura clássica de yoga', 'yoga', 'beginner', ARRAY['costas', 'ombros', 'posterior'], ARRAY['nenhum'], ARRAY['Posição de flexão invertida', 'Forme triângulo', 'Mantenha pernas retas'], ARRAY['Distribua peso igualmente'], 3, '30-60 segundos', 30);

-- ============================================================
-- 4. ÍNDICES PARA PERFORMANCE
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_exercises_category ON exercises(category);
CREATE INDEX IF NOT EXISTS idx_exercises_difficulty ON exercises(difficulty);
CREATE INDEX IF NOT EXISTS idx_exercises_muscle_groups ON exercises USING GIN(muscle_groups);
CREATE INDEX IF NOT EXISTS idx_workout_plans_user ON workout_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_plans_active ON workout_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_plan_exercises_plan ON workout_plan_exercises(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_exercises_day ON workout_plan_exercises(day_of_week);
CREATE INDEX IF NOT EXISTS idx_weekly_sessions_user ON weekly_workout_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_sessions_plan ON weekly_workout_sessions(plan_id);
CREATE INDEX IF NOT EXISTS idx_weekly_sessions_date ON weekly_workout_sessions(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_session_progress_session ON session_exercise_progress(session_id);

-- ============================================================
-- 5. POLÍTICAS RLS (Row Level Security)
-- ============================================================

-- Exercícios são públicos (todos podem ver)
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Exercises are viewable by everyone" ON exercises;
CREATE POLICY "Exercises are viewable by everyone" ON exercises FOR SELECT USING (true);

-- Planos de treino: usuários veem os próprios e os públicos
ALTER TABLE workout_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own workout plans" ON workout_plans;
CREATE POLICY "Users can view own workout plans" ON workout_plans
    FOR SELECT USING (auth.uid()::text = user_id::text OR is_public = true);

DROP POLICY IF EXISTS "Users can insert own workout plans" ON workout_plans;
CREATE POLICY "Users can insert own workout plans" ON workout_plans
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can update own workout plans" ON workout_plans;
CREATE POLICY "Users can update own workout plans" ON workout_plans
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Exercícios dos planos
ALTER TABLE workout_plan_exercises ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage exercises in own plans" ON workout_plan_exercises;
CREATE POLICY "Users can manage exercises in own plans" ON workout_plan_exercises
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM workout_plans 
            WHERE workout_plans.id = workout_plan_exercises.plan_id 
            AND workout_plans.user_id::text = auth.uid()::text
        )
    );

-- Sessões semanais
ALTER TABLE weekly_workout_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own sessions" ON weekly_workout_sessions;
CREATE POLICY "Users can manage own sessions" ON weekly_workout_sessions
    FOR ALL USING (auth.uid()::text = user_id::text);

-- Progresso das sessões
ALTER TABLE session_exercise_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own session progress" ON session_exercise_progress;
CREATE POLICY "Users can manage own session progress" ON session_exercise_progress
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM weekly_workout_sessions 
            WHERE weekly_workout_sessions.id = session_exercise_progress.session_id 
            AND weekly_workout_sessions.user_id::text = auth.uid()::text
        )
    );

-- ============================================================
-- 6. COMENTÁRIOS
-- ============================================================

COMMENT ON TABLE exercises IS 'Catálogo de exercícios disponíveis no sistema';
COMMENT ON TABLE workout_plans IS 'Planos de treino criados pelos usuários';
COMMENT ON TABLE workout_plan_exercises IS 'Exercícios incluídos em cada plano de treino';
COMMENT ON TABLE weekly_workout_sessions IS 'Sessões de treino semanais agendadas e executadas';
COMMENT ON TABLE session_exercise_progress IS 'Progresso detalhado de cada exercício em cada sessão';

SELECT 'Migração 007: Sistema de exercícios criado com sucesso!' as status;
