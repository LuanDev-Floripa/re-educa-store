-- ============================================================
-- Migra??o: Sistema Completo de Exerc?cios e Planos de Treino
-- Para: RE-EDUCA Store - Sistema de Reeduca??o de Estilo de Vida
-- ============================================================

-- Tabela de Exerc?cios (com 40+ exerc?cios pre-populados)
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

-- Tabela de Planos de Treino
CREATE TABLE IF NOT EXISTS workout_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
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

-- Tabela de Exerc?cios nos Planos de Treino
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

-- Tabela de Sess?es de Treino Semanal
CREATE TABLE IF NOT EXISTS weekly_workout_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
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

-- Tabela de Progresso dos Exerc?cios nas Sess?es
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
-- INSERIR 40+ EXERC?CIOS
-- ============================================================

-- EXERC?CIOS DE FOR?A (Strength)
INSERT INTO exercises (name, description, category, difficulty, muscle_groups, equipment, instructions, tips, sets, reps, rest_seconds) VALUES
-- Peito
('Supino Reto', 'Execu??o no banco horizontal com barra ou halteres', 'strength', 'intermediate', ARRAY['peitoral', 'tr?ceps', 'ombros'], ARRAY['banco', 'barra', 'halteres'], ARRAY['Deite-se no banco com os p?s apoiados', 'Segure a barra com pegada m?dia', 'Des?a at? quase tocar o peito', 'Empurre com for?a para cima'], ARRAY['Mantenha os ombros retra?dos', 'N?o arquear a lombar excessivamente', 'Controle o movimento'], 4, '8-12', 90),
('Supino Inclinado', 'Supino em banco inclinado a 30-45 graus', 'strength', 'intermediate', ARRAY['peitoral superior', 'ombros'], ARRAY['banco inclinado', 'halteres'], ARRAY['Ajuste o banco em 30-45 graus', 'Segure os halteres', 'Empurre para cima'], ARRAY['Foque no peitoral superior'], 3, '10-12', 60),
('Flex?o de Bra?o', 'Exerc?cio de peso corporal para peitoral', 'strength', 'beginner', ARRAY['peitoral', 'tr?ceps', 'ombros', 'core'], ARRAY['peso corporal'], ARRAY['Apoie m?os e p?s no ch?o', 'Mantenha corpo alinhado', 'Des?a at? quase tocar o ch?o', 'Empurre para cima'], ARRAY['Mantenha o core contra?do'], 3, '10-20', 60),
('Crucifixo', 'Exerc?cio de isolamento para peitoral', 'strength', 'intermediate', ARRAY['peitoral'], ARRAY['halteres', 'banco'], ARRAY['Deite-se no banco', 'Abra os bra?os lateralmente', 'Feche o movimento'], ARRAY['Controle a fase negativa'], 3, '12-15', 45),

-- Costas
('Barra Fixa', 'Exerc?cio completo para costas', 'strength', 'intermediate', ARRAY['costas', 'b?ceps'], ARRAY['barra'], ARRAY['Pegue a barra com pegada aberta', 'Puxe o corpo at? o queixo passar a barra', 'Des?a controladamente'], ARRAY['Evite balancear'], 3, '6-12', 90),
('Remada Curvada', 'Exerc?cio para desenvolvimento das costas', 'strength', 'intermediate', ARRAY['costas', 'b?ceps'], ARRAY['barra', 'halteres'], ARRAY['Incline o tronco para frente', 'Mantenha costas retas', 'Puxe a barra at? o abd?men'], ARRAY['Mantenha o core ativo'], 4, '8-10', 90),
('Puxada Frontal', 'Exerc?cio em m?quina para costas', 'strength', 'beginner', ARRAY['costas', 'b?ceps'], ARRAY['m?quina'], ARRAY['Sente-se na m?quina', 'Puxe a barra at? o peito', 'Controle a volta'], ARRAY['Varie a pegada'], 3, '10-12', 60),
('Remada Unilateral', 'Exerc?cio unilateral para costas', 'strength', 'intermediate', ARRAY['costas'], ARRAY['halteres', 'banco'], ARRAY['Apoie joelho e m?o no banco', 'Puxe o halter at? o quadril', 'Troque de lado'], ARRAY['Foque na contra??o'], 3, '10-12', 60),

-- Pernas
('Agachamento', 'Rei dos exerc?cios para pernas', 'strength', 'beginner', ARRAY['quadr?ceps', 'gl?teos', 'posterior'], ARRAY['peso corporal', 'barra'], ARRAY['P?s na largura dos ombros', 'Des?a at? coxas paralelas ao ch?o', 'Suba empurrando os calcanhares'], ARRAY['Mantenha joelhos alinhados', 'Coluna neutra'], 4, '10-15', 90),
('Agachamento com Salto', 'Exerc?cio pliom?trico', 'strength', 'intermediate', ARRAY['quadr?ceps', 'gl?teos'], ARRAY['peso corporal'], ARRAY['Agache profundamente', 'Exploda para cima', 'Aterre suavemente'], ARRAY['Controle o impacto'], 3, '8-12', 90),
('Leg Press', 'Exerc?cio para pernas em m?quina', 'strength', 'beginner', ARRAY['quadr?ceps', 'gl?teos'], ARRAY['m?quina'], ARRAY['Sente-se na m?quina', 'Coloque os p?s na plataforma', 'Empurre e retorne'], ARRAY['N?o trave os joelhos'], 3, '12-15', 60),
('Afundo', 'Exerc?cio unilateral para pernas', 'strength', 'intermediate', ARRAY['quadr?ceps', 'gl?teos'], ARRAY['peso corporal', 'halteres'], ARRAY['D? um passo grande ? frente', 'Des?a a perna traseira', 'Empurre para voltar'], ARRAY['Mantenha tronco ereto'], 3, '10-12 cada perna', 60),
('Eleva??o de Panturrilha', 'Exerc?cio para panturrilhas', 'strength', 'beginner', ARRAY['panturrilhas'], ARRAY['peso corporal', 'halteres'], ARRAY['Fique na ponta dos p?s', 'Levante os calcanhares', 'Des?a controladamente'], ARRAY['Fa?a o movimento completo'], 3, '15-20', 30),
('Extens?o de Pernas', 'Isolamento de quadr?ceps', 'strength', 'beginner', ARRAY['quadr?ceps'], ARRAY['m?quina'], ARRAY['Sente-se na m?quina', 'Estenda as pernas', 'Controle a volta'], ARRAY['N?o use impulso'], 3, '12-15', 45),

-- Ombros
('Desenvolvimento', 'Exerc?cio para ombros com barra', 'strength', 'intermediate', ARRAY['ombros', 'tr?ceps'], ARRAY['barra', 'halteres'], ARRAY['Pegue a barra na altura dos ombros', 'Empurre para cima', 'Des?a controladamente'], ARRAY['Mantenha core est?vel'], 3, '8-12', 90),
('Eleva??o Lateral', 'Isolamento de deltoides laterais', 'strength', 'beginner', ARRAY['ombros'], ARRAY['halteres'], ARRAY['Segure halteres ao lado', 'Levante at? altura dos ombros', 'Des?a controladamente'], ARRAY['N?o balance o corpo'], 3, '12-15', 45),
('Eleva??o Frontal', 'Isolamento de deltoides anteriores', 'strength', 'beginner', ARRAY['ombros'], ARRAY['halteres', 'barra'], ARRAY['Segure halteres ? frente', 'Levante at? altura dos ombros', 'Des?a'], ARRAY['Mantenha tronco reto'], 3, '12-15', 45),
('Crucifixo Invertido', 'Exerc?cio para deltoides posteriores', 'strength', 'intermediate', ARRAY['ombros', 'costas'], ARRAY['halteres'], ARRAY['Incline o tronco', 'Abra os bra?os', 'Contraia os ombros'], ARRAY['Controle o movimento'], 3, '12-15', 45),

-- Bra?os
('Rosca Direta', 'Exerc?cio cl?ssico para b?ceps', 'strength', 'beginner', ARRAY['b?ceps'], ARRAY['halteres', 'barra'], ARRAY['Segure os halteres', 'Flexione os cotovelos', 'Contraia o b?ceps', 'Des?a controladamente'], ARRAY['N?o balance o corpo'], 3, '10-12', 60),
('Tr?ceps Pulley', 'Exerc?cio para tr?ceps em m?quina', 'strength', 'beginner', ARRAY['tr?ceps'], ARRAY['m?quina'], ARRAY['Segure a barra', 'Estenda os bra?os', 'Mantenha cotovelos fixos'], ARRAY['N?o balance o corpo'], 3, '12-15', 60),
('Tr?ceps Testa', 'Exerc?cio deitado para tr?ceps', 'strength', 'intermediate', ARRAY['tr?ceps'], ARRAY['halteres', 'barra'], ARRAY['Deite-se no banco', 'Flexione cotovelos', 'Estenda os bra?os'], ARRAY['Mantenha cotovelos fixos'], 3, '10-12', 60),
('Rosca Martelo', 'Exerc?cio para b?ceps e antebra?os', 'strength', 'beginner', ARRAY['b?ceps', 'antebra?os'], ARRAY['halteres'], ARRAY['Segure halteres com pegada neutra', 'Flexione os cotovelos'], ARRAY['Mantenha pulso neutro'], 3, '10-12', 60),

-- Core
('Abdominal Reto', 'Exerc?cio b?sico para abdominais', 'core', 'beginner', ARRAY['abdominais'], ARRAY['peso corporal'], ARRAY['Deite-se de costas', 'Flexione os joelhos', 'Levante os ombros', 'Contraia o abd?men'], ARRAY['N?o puxe o pesco?o'], 3, '15-20', 30),
('Prancha', 'Exerc?cio isom?trico para core', 'core', 'beginner', ARRAY['core', 'ombros'], ARRAY['peso corporal'], ARRAY['Apoie antebra?os e p?s', 'Mantenha corpo alinhado', 'Segure a posi??o'], ARRAY['N?o deixe quadril cair'], 3, '30-60 segundos', 60),
('Abdominal Bicicleta', 'Exerc?cio rotacional para core', 'core', 'intermediate', ARRAY['abdominais', 'obl?quos'], ARRAY['peso corporal'], ARRAY['Deite-se de costas', 'Levante os ombros', 'Fa?a movimento de pedalar'], ARRAY['Controle o movimento'], 3, '15-20 cada lado', 45),
('Russian Twist', 'Exerc?cio rotacional com peso', 'core', 'intermediate', ARRAY['obl?quos', 'abdominais'], ARRAY['peso corporal', 'peso'], ARRAY['Sente-se com joelhos flexionados', 'Gire o tronco', 'Toque o ch?o ao lado'], ARRAY['Mantenha costas retas'], 3, '20 cada lado', 45),
('Eleva??o de Pernas', 'Exerc?cio avan?ado para core', 'core', 'advanced', ARRAY['abdominais inferiores'], ARRAY['peso corporal'], ARRAY['Deite-se de costas', 'Levante as pernas retas', 'Des?a controladamente'], ARRAY['Mantenha costas no ch?o'], 3, '10-15', 60),
('Prancha Lateral', 'Exerc?cio para obl?quos', 'core', 'intermediate', ARRAY['obl?quos', 'core'], ARRAY['peso corporal'], ARRAY['Deite-se de lado', 'Apoie antebra?o e p?s', 'Mantenha corpo alinhado'], ARRAY['N?o deixe quadril cair'], 3, '30-45 segundos cada lado', 45),

-- Cardio
('Corrida', 'Exerc?cio cardiovascular', 'cardio', 'beginner', ARRAY['pernas', 'cardiovascular'], ARRAY['nenhum'], ARRAY['Aque?a 5 minutos', 'Mantenha ritmo constante', 'Resfrie 5 minutos'], ARRAY['Use t?nis adequado'], 1, '20-30 minutos', 0),
('Ciclismo', 'Exerc?cio cardiovascular de baixo impacto', 'cardio', 'beginner', ARRAY['pernas', 'cardiovascular'], ARRAY['bicicleta'], ARRAY['Ajuste a altura do selim', 'Mantenha cad?ncia constante'], ARRAY['Use capacete'], 1, '30-45 minutos', 0),
('Burpee', 'Exerc?cio completo e intenso', 'hiit', 'intermediate', ARRAY['pernas', 'peitoral', 'ombros', 'core'], ARRAY['peso corporal'], ARRAY['Agache', 'Pule para tr?s em prancha', 'Fa?a flex?o', 'Pule para frente', 'Salte'], ARRAY['Mantenha bom ritmo'], 3, '10-15', 60),
('Jumping Jacks', 'Aquecimento e cardio', 'cardio', 'beginner', ARRAY['pernas', 'ombros', 'cardiovascular'], ARRAY['peso corporal'], ARRAY['Salte abrindo pernas e bra?os', 'Volte ? posi??o inicial'], ARRAY['Mantenha ritmo constante'], 3, '30-50', 45),
('Mountain Climber', 'Exerc?cio de alta intensidade', 'hiit', 'intermediate', ARRAY['core', 'pernas', 'ombros'], ARRAY['peso corporal'], ARRAY['Posi??o de flex?o', 'Alternando pernas', 'Mantenha core firme'], ARRAY['Mantenha ritmo'], 3, '20-30 cada perna', 45),
('Escalador', 'Varia??o do mountain climber', 'hiit', 'intermediate', ARRAY['core', 'pernas'], ARRAY['peso corporal'], ARRAY['Posi??o de prancha', 'Traga joelho ao peito', 'Alternando pernas'], ARRAY['Controle a velocidade'], 3, '20 cada perna', 45),

-- Flexibilidade
('Alongamento de Panturrilha', 'Alongamento para panturrilhas', 'flexibility', 'beginner', ARRAY['panturrilhas'], ARRAY['nenhum'], ARRAY['Mantenha perna esticada', 'Puxe o p? em dire??o ao corpo'], ARRAY['Sinta o alongamento'], 3, '30 segundos cada', 30),
('Alongamento de Quadr?ceps', 'Alongamento para parte frontal da coxa', 'flexibility', 'beginner', ARRAY['quadr?ceps'], ARRAY['nenhum'], ARRAY['Segure o p? atr?s', 'Puxe em dire??o ao gl?teo'], ARRAY['Mantenha joelhos juntos'], 3, '30 segundos cada', 30),
('Alongamento de Posterior', 'Alongamento para parte posterior da coxa', 'flexibility', 'beginner', ARRAY['posterior'], ARRAY['nenhum'], ARRAY['Sente-se no ch?o', 'Alcance os p?s', 'Mantenha pernas esticadas'], ARRAY['N?o force demais'], 3, '30-60 segundos', 30),
('Alongamento de Peitoral', 'Alongamento para peitoral', 'flexibility', 'beginner', ARRAY['peitoral', 'ombros'], ARRAY['parede'], ARRAY['Encoste bra?o na parede', 'Gire o corpo', 'Sinta o alongamento'], ARRAY['Mantenha ombro relaxado'], 3, '30 segundos cada', 30),

-- Yoga/Pilates
('Postura do Guerreiro', 'Postura de yoga para pernas', 'yoga', 'beginner', ARRAY['pernas', 'core'], ARRAY['nenhum'], ARRAY['D? passo largo', 'Gire p? da frente', 'Flexione joelho', 'Levante bra?os'], ARRAY['Mantenha joelho alinhado'], 3, '30-60 segundos cada lado', 30),
('Postura da Crian?a', 'Postura de relaxamento', 'yoga', 'beginner', ARRAY['costas', 'quadris'], ARRAY['nenhum'], ARRAY['Sente-se nos calcanhares', 'Incline tronco ? frente', 'Estenda bra?os'], ARRAY['Relaxe completamente'], 3, '60 segundos', 30),
('Ponte', 'Exerc?cio de gl?teos e core', 'pilates', 'beginner', ARRAY['gl?teos', 'core', 'posterior'], ARRAY['nenhum'], ARRAY['Deite-se de costas', 'Levante quadril', 'Contraia gl?teos'], ARRAY['Mantenha core ativo'], 3, '12-15', 45),
('Postura do Cachorro Olhando para Baixo', 'Postura cl?ssica de yoga', 'yoga', 'beginner', ARRAY['costas', 'ombros', 'posterior'], ARRAY['nenhum'], ARRAY['Posi??o de flex?o invertida', 'Forme tri?ngulo', 'Mantenha pernas retas'], ARRAY['Distribua peso igualmente'], 3, '30-60 segundos', 30);

-- ============================================================
-- ?NDICES PARA PERFORMANCE
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
-- POL?TICAS RLS (Row Level Security)
-- ============================================================

-- Exerc?cios s?o p?blicos (todos podem ver)
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Exercises are viewable by everyone" ON exercises FOR SELECT USING (true);

-- Planos de treino: usu?rios veem os pr?prios e os p?blicos
ALTER TABLE workout_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own workout plans" ON workout_plans
    FOR SELECT USING (auth.uid()::text = user_id::text OR is_public = true);
CREATE POLICY "Users can insert own workout plans" ON workout_plans
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "Users can update own workout plans" ON workout_plans
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Exerc?cios dos planos
ALTER TABLE workout_plan_exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage exercises in own plans" ON workout_plan_exercises
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM workout_plans 
            WHERE workout_plans.id = workout_plan_exercises.plan_id 
            AND workout_plans.user_id::text = auth.uid()::text
        )
    );

-- Sess?es semanais
ALTER TABLE weekly_workout_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own sessions" ON weekly_workout_sessions
    FOR ALL USING (auth.uid()::text = user_id::text);

-- Progresso das sess?es
ALTER TABLE session_exercise_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own session progress" ON session_exercise_progress
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM weekly_workout_sessions 
            WHERE weekly_workout_sessions.id = session_exercise_progress.session_id 
            AND weekly_workout_sessions.user_id::text = auth.uid()::text
        )
    );

-- ============================================================
-- COMENT?RIOS
-- ============================================================

COMMENT ON TABLE exercises IS 'Cat?logo de exerc?cios dispon?veis no sistema';
COMMENT ON TABLE workout_plans IS 'Planos de treino criados pelos usu?rios';
COMMENT ON TABLE workout_plan_exercises IS 'Exerc?cios inclu?dos em cada plano de treino';
COMMENT ON TABLE weekly_workout_sessions IS 'Sess?es de treino semanais agendadas e executadas';
COMMENT ON TABLE session_exercise_progress IS 'Progresso detalhado de cada exerc?cio em cada sess?o';
