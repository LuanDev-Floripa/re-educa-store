-- ============================================================
-- Migração 002: Dados Base (Templates e Seed Data)
-- Para: RE-EDUCA Store - Sistema de Reeducação de Estilo de Vida
-- Data: 2025
-- ============================================================
--
-- Esta migração consolida:
-- - 02_populate_achievements.sql
-- - 03_populate_goals.sql
-- - 04_populate_coupons.sql
--
-- Popula dados iniciais: achievements, goal_templates e coupons
-- ============================================================

-- ============================================================
-- 1. POPULAR ACHIEVEMENTS TEMPLATES
-- ============================================================

-- Conquistas de Primeiros Passos
-- Adicionar coluna requirements se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'achievements' AND column_name = 'requirements'
    ) THEN
        ALTER TABLE achievements ADD COLUMN requirements JSONB;
    END IF;
END $$;

INSERT INTO achievements (id, code, title, description, category, rarity, points, icon, requirements, is_active, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'first_login', 'Primeiro Acesso', 'Faça seu primeiro login na plataforma', 'inicio', 'common', 10, 'user-check', '{"action": "login", "count": 1}', true, NOW()),
('550e8400-e29b-41d4-a716-446655440002', 'profile_complete', 'Perfil Completo', 'Complete 100% do seu perfil', 'inicio', 'common', 25, 'user-circle', '{"action": "profile_completion", "percentage": 100}', true, NOW()),
('550e8400-e29b-41d4-a716-446655440003', 'first_calculation', 'Primeiro Cálculo', 'Use uma calculadora de saúde pela primeira vez', 'inicio', 'common', 15, 'calculator', '{"action": "health_calculation", "count": 1}', true, NOW()),
('550e8400-e29b-41d4-a716-446655440004', 'welcome_badge', 'Bem-vindo!', 'Complete o tutorial de boas-vindas', 'inicio', 'common', 20, 'star', '{"action": "tutorial_complete", "tutorial": "welcome"}', true, NOW()),

-- Conquistas de E-commerce
('550e8400-e29b-41d4-a716-446655440005', 'first_purchase', 'Primeira Compra', 'Realize sua primeira compra', 'ecommerce', 'common', 50, 'shopping-cart', '{"action": "purchase", "count": 1}', true, NOW()),
('550e8400-e29b-41d4-a716-446655440006', 'big_spender', 'Gastador', 'Gaste mais de R$ 500 em compras', 'ecommerce', 'rare', 100, 'credit-card', '{"action": "total_spent", "amount": 500}', true, NOW()),
('550e8400-e29b-41d4-a716-446655440007', 'loyal_customer', 'Cliente Fiel', 'Faça 10 compras', 'ecommerce', 'uncommon', 75, 'heart', '{"action": "purchase", "count": 10}', true, NOW()),
('550e8400-e29b-41d4-a716-446655440008', 'review_master', 'Mestre das Avaliações', 'Avalie 5 produtos', 'ecommerce', 'common', 30, 'star', '{"action": "product_review", "count": 5}', true, NOW()),

-- Conquistas de Saúde
('550e8400-e29b-41d4-a716-446655440009', 'health_explorer', 'Explorador da Saúde', 'Use 5 calculadoras diferentes', 'saude', 'common', 40, 'activity', '{"action": "health_tools", "unique_tools": 5}', true, NOW()),
('550e8400-e29b-41d4-a716-446655440010', 'bmi_expert', 'Especialista em IMC', 'Calcule seu IMC 10 vezes', 'saude', 'uncommon', 35, 'trending-up', '{"action": "bmi_calculation", "count": 10}', true, NOW()),
('550e8400-e29b-41d4-a716-446655440011', 'hydration_hero', 'Herói da Hidratação', 'Use a calculadora de hidratação 7 dias seguidos', 'saude', 'rare', 60, 'droplet', '{"action": "hydration_streak", "days": 7}', true, NOW()),
('550e8400-e29b-41d4-a716-446655440012', 'sleep_tracker', 'Rastreador do Sono', 'Registre seu sono por 14 dias', 'saude', 'uncommon', 50, 'moon', '{"action": "sleep_log", "days": 14}', true, NOW()),

-- Conquistas de Gamificação
('550e8400-e29b-41d4-a716-446655440013', 'point_collector', 'Coletor de Pontos', 'Acumule 1000 pontos', 'gamificacao', 'common', 0, 'coins', '{"action": "points_earned", "total": 1000}', true, NOW()),
('550e8400-e29b-41d4-a716-446655440014', 'streak_master', 'Mestre da Sequência', 'Mantenha uma sequência de 30 dias', 'gamificacao', 'epic', 200, 'flame', '{"action": "daily_streak", "days": 30}', true, NOW()),
('550e8400-e29b-41d4-a716-446655440015', 'achievement_hunter', 'Caçador de Conquistas', 'Desbloqueie 20 conquistas', 'gamificacao', 'rare', 150, 'trophy', '{"action": "achievements_unlocked", "count": 20}', true, NOW()),
('550e8400-e29b-41d4-a716-446655440016', 'level_up', 'Subiu de Nível', 'Alcance o nível 10', 'gamificacao', 'uncommon', 100, 'award', '{"action": "level_reached", "level": 10}', true, NOW()),

-- Conquistas de IA
('550e8400-e29b-41d4-a716-446655440017', 'ai_chat_user', 'Usuário de IA', 'Use o chat de IA pela primeira vez', 'ia', 'common', 25, 'bot', '{"action": "ai_chat", "count": 1}', true, NOW()),
('550e8400-e29b-41d4-a716-446655440018', 'ai_explorer', 'Explorador de IA', 'Faça 50 perguntas para a IA', 'ia', 'uncommon', 75, 'brain', '{"action": "ai_questions", "count": 50}', true, NOW()),
('550e8400-e29b-41d4-a716-446655440019', 'image_analyzer', 'Analisador de Imagens', 'Use a análise de imagens 5 vezes', 'ia', 'common', 40, 'camera', '{"action": "image_analysis", "count": 5}', true, NOW()),

-- Conquistas de Comunidade
('550e8400-e29b-41d4-a716-446655440020', 'first_comment', 'Primeiro Comentário', 'Comente em um post do blog', 'comunidade', 'common', 15, 'message-circle', '{"action": "blog_comment", "count": 1}', true, NOW()),
('550e8400-e29b-41d4-a716-446655440021', 'blog_reader', 'Leitor do Blog', 'Leia 10 posts do blog', 'comunidade', 'common', 30, 'book-open', '{"action": "blog_read", "count": 10}', true, NOW()),
('550e8400-e29b-41d4-a716-446655440022', 'social_butterfly', 'Borboleta Social', 'Interaja 25 vezes na comunidade', 'comunidade', 'uncommon', 60, 'users', '{"action": "community_interaction", "count": 25}', true, NOW()),

-- Conquistas de Metas
('550e8400-e29b-41d4-a716-446655440023', 'goal_setter', 'Definidor de Metas', 'Defina sua primeira meta', 'metas', 'common', 20, 'target', '{"action": "goal_created", "count": 1}', true, NOW()),
('550e8400-e29b-41d4-a716-446655440024', 'goal_achiever', 'Realizador de Metas', 'Complete 5 metas', 'metas', 'uncommon', 80, 'check-circle', '{"action": "goals_completed", "count": 5}', true, NOW()),
('550e8400-e29b-41d4-a716-446655440025', 'ambitious_planner', 'Planejador Ambicioso', 'Defina 10 metas diferentes', 'metas', 'rare', 120, 'calendar', '{"action": "goals_created", "count": 10}', true, NOW()),

-- Conquistas de Configurações
('550e8400-e29b-41d4-a716-446655440026', 'customizer', 'Personalizador', 'Personalize suas configurações', 'configuracao', 'common', 15, 'settings', '{"action": "settings_updated", "count": 1}', true, NOW()),
('550e8400-e29b-41d4-a716-446655440027', 'notification_manager', 'Gerenciador de Notificações', 'Configure suas notificações', 'configuracao', 'common', 20, 'bell', '{"action": "notifications_configured"}', true, NOW()),

-- Conquistas Especiais
('550e8400-e29b-41d4-a716-446655440028', 'early_adopter', 'Adotante Antecipado', 'Use a plataforma nos primeiros 30 dias', 'especial', 'epic', 300, 'rocket', '{"action": "early_user", "days_since_signup": 30}', true, NOW()),
('550e8400-e29b-41d4-a716-446655440029', 'power_user', 'Usuário Poderoso', 'Use a plataforma por 100 dias', 'especial', 'legendary', 500, 'zap', '{"action": "platform_usage", "days": 100}', true, NOW()),
('550e8400-e29b-41d4-a716-446655440030', 'completionist', 'Completista', 'Desbloqueie todas as conquistas básicas', 'especial', 'legendary', 1000, 'crown', '{"action": "all_basic_achievements"}', true, NOW())

ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 2. CRIAR E POPULAR GOAL_TEMPLATES
-- ============================================================

CREATE TABLE IF NOT EXISTS goal_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
    points INTEGER DEFAULT 0,
    duration_days INTEGER,
    requirements JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar colunas faltantes em goal_templates se não existirem
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'goal_templates' AND column_name = 'code'
    ) THEN
        ALTER TABLE goal_templates ADD COLUMN code TEXT;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'goal_templates' AND column_name = 'requirements'
    ) THEN
        ALTER TABLE goal_templates ADD COLUMN requirements JSONB;
    END IF;
END $$;

-- Metas de Saúde
INSERT INTO goal_templates (id, code, title, description, category, difficulty, points, duration_days, requirements, is_active) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'lose_weight', 'Perder Peso', 'Perder 5kg em 3 meses', 'saude', 'medium', 100, 90, '{"type": "weight_loss", "target_kg": 5, "timeframe_days": 90}', true),
('660e8400-e29b-41d4-a716-446655440002', 'gain_muscle', 'Ganhar Massa Muscular', 'Ganhar 3kg de massa muscular em 6 meses', 'saude', 'hard', 150, 180, '{"type": "muscle_gain", "target_kg": 3, "timeframe_days": 180}', true),
('660e8400-e29b-41d4-a716-446655440003', 'improve_bmi', 'Melhorar IMC', 'Alcançar IMC ideal (18.5-24.9)', 'saude', 'medium', 80, 120, '{"type": "bmi_improvement", "target_range": [18.5, 24.9]}', true),
('660e8400-e29b-41d4-a716-446655440004', 'drink_water', 'Hidratação Diária', 'Beber 2L de água por dia por 30 dias', 'saude', 'easy', 50, 30, '{"type": "daily_habit", "action": "water_intake", "target_liters": 2, "days": 30}', true),
('660e8400-e29b-41d4-a716-446655440005', 'sleep_better', 'Melhorar o Sono', 'Dormir 7-8 horas por noite por 2 semanas', 'saude', 'medium', 60, 14, '{"type": "sleep_improvement", "target_hours": [7, 8], "days": 14}', true),

-- Metas de Exercícios
('660e8400-e29b-41d4-a716-446655440006', 'daily_walk', 'Caminhada Diária', 'Caminhar 30 minutos por dia por 21 dias', 'exercicio', 'easy', 40, 21, '{"type": "daily_exercise", "activity": "walking", "duration_minutes": 30, "days": 21}', true),
('660e8400-e29b-41d4-a716-446655440007', 'gym_regular', 'Academia Regular', 'Ir à academia 3x por semana por 2 meses', 'exercicio', 'medium', 120, 60, '{"type": "gym_attendance", "times_per_week": 3, "weeks": 8}', true),
('660e8400-e29b-41d4-a716-446655440008', 'run_5k', 'Correr 5K', 'Completar uma corrida de 5km', 'exercicio', 'medium', 80, 30, '{"type": "running_goal", "distance_km": 5, "timeframe_days": 30}', true),
('660e8400-e29b-41d4-a716-446655440009', 'yoga_streak', 'Sequência de Yoga', 'Praticar yoga por 14 dias seguidos', 'exercicio', 'easy', 70, 14, '{"type": "yoga_streak", "days": 14}', true),
('660e8400-e29b-41d4-a716-446655440010', 'strength_training', 'Treino de Força', 'Fazer treino de força 2x por semana por 6 semanas', 'exercicio', 'medium', 100, 42, '{"type": "strength_training", "times_per_week": 2, "weeks": 6}', true),

-- Metas de Nutrição
('660e8400-e29b-41d4-a716-446655440011', 'eat_vegetables', 'Mais Vegetais', 'Comer 5 porções de vegetais por dia por 30 dias', 'nutricao', 'easy', 60, 30, '{"type": "vegetable_intake", "portions_per_day": 5, "days": 30}', true),
('660e8400-e29b-41d4-a716-446655440012', 'reduce_sugar', 'Reduzir Açúcar', 'Reduzir açúcar refinado por 21 dias', 'nutricao', 'medium', 80, 21, '{"type": "sugar_reduction", "days": 21}', true),
('660e8400-e29b-41d4-a716-446655440013', 'meal_prep', 'Preparar Refeições', 'Fazer meal prep 1x por semana por 1 mês', 'nutricao', 'medium', 70, 30, '{"type": "meal_prep", "times_per_week": 1, "weeks": 4}', true),
('660e8400-e29b-41d4-a716-446655440014', 'protein_intake', 'Proteína Diária', 'Consumir 1g de proteína por kg de peso por 30 dias', 'nutricao', 'medium', 90, 30, '{"type": "protein_intake", "grams_per_kg": 1, "days": 30}', true),
('660e8400-e29b-41d4-a716-446655440015', 'no_fast_food', 'Sem Fast Food', 'Evitar fast food por 2 semanas', 'nutricao', 'easy', 50, 14, '{"type": "avoid_fast_food", "days": 14}', true),

-- Metas de Bem-estar Mental
('660e8400-e29b-41d4-a716-446655440016', 'meditation', 'Meditação Diária', 'Meditar 10 minutos por dia por 21 dias', 'bem_estar', 'easy', 60, 21, '{"type": "meditation", "minutes_per_day": 10, "days": 21}', true),
('660e8400-e29b-41d4-a716-446655440017', 'stress_management', 'Gerenciar Estresse', 'Praticar técnicas de relaxamento por 30 dias', 'bem_estar', 'medium', 80, 30, '{"type": "stress_management", "days": 30}', true),
('660e8400-e29b-41d4-a716-446655440018', 'gratitude_journal', 'Diário de Gratidão', 'Escrever 3 coisas pelas quais é grato por 30 dias', 'bem_estar', 'easy', 50, 30, '{"type": "gratitude_journal", "items_per_day": 3, "days": 30}', true),
('660e8400-e29b-41d4-a716-446655440019', 'digital_detox', 'Detox Digital', 'Reduzir tempo de tela por 1 semana', 'bem_estar', 'medium', 70, 7, '{"type": "digital_detox", "days": 7}', true),
('660e8400-e29b-41d4-a716-446655440020', 'social_connection', 'Conexão Social', 'Conectar-se com amigos/família 2x por semana por 1 mês', 'bem_estar', 'easy', 60, 30, '{"type": "social_connection", "times_per_week": 2, "weeks": 4}', true),

-- Metas de Produtividade
('660e8400-e29b-41d4-a716-446655440021', 'morning_routine', 'Rotina Matinal', 'Estabelecer rotina matinal por 21 dias', 'produtividade', 'medium', 70, 21, '{"type": "morning_routine", "days": 21}', true),
('660e8400-e29b-41d4-a716-446655440022', 'read_books', 'Ler Livros', 'Ler 1 livro por mês por 3 meses', 'produtividade', 'easy', 90, 90, '{"type": "reading", "books_per_month": 1, "months": 3}', true),
('660e8400-e29b-41d4-a716-446655440023', 'learn_skill', 'Aprender Nova Habilidade', 'Dedicar 1 hora por dia para aprender algo novo por 30 dias', 'produtividade', 'medium', 100, 30, '{"type": "skill_learning", "hours_per_day": 1, "days": 30}', true),
('660e8400-e29b-41d4-a716-446655440024', 'time_management', 'Gestão de Tempo', 'Usar técnica Pomodoro por 2 semanas', 'produtividade', 'easy', 50, 14, '{"type": "pomodoro_technique", "days": 14}', true),
('660e8400-e29b-41d4-a716-446655440025', 'goal_tracking', 'Acompanhar Metas', 'Revisar e ajustar metas semanalmente por 1 mês', 'produtividade', 'easy', 60, 30, '{"type": "goal_review", "frequency": "weekly", "weeks": 4}', true),

-- Metas de E-commerce
('660e8400-e29b-41d4-a716-446655440026', 'smart_shopping', 'Compras Inteligentes', 'Pesquisar preços antes de comprar por 1 mês', 'ecommerce', 'easy', 40, 30, '{"type": "price_research", "days": 30}', true),
('660e8400-e29b-41d4-a716-446655440027', 'budget_control', 'Controle de Orçamento', 'Manter orçamento de compras por 2 meses', 'ecommerce', 'medium', 80, 60, '{"type": "budget_control", "months": 2}', true),
('660e8400-e29b-41d4-a716-446655440028', 'review_products', 'Avaliar Produtos', 'Avaliar 5 produtos comprados', 'ecommerce', 'easy', 50, 30, '{"type": "product_reviews", "count": 5, "days": 30}', true),
('660e8400-e29b-41d4-a716-446655440029', 'wishlist_management', 'Gerenciar Lista de Desejos', 'Manter lista de desejos organizada por 1 mês', 'ecommerce', 'easy', 30, 30, '{"type": "wishlist_management", "days": 30}', true),
('660e8400-e29b-41d4-a716-446655440030', 'loyalty_program', 'Programa de Fidelidade', 'Acumular 1000 pontos de fidelidade', 'ecommerce', 'medium', 100, 90, '{"type": "loyalty_points", "target_points": 1000, "days": 90}', true),

-- Metas de Tecnologia
('660e8400-e29b-41d4-a716-446655440031', 'app_usage', 'Usar App Diariamente', 'Usar o app RE-EDUCA por 30 dias seguidos', 'tecnologia', 'easy', 80, 30, '{"type": "app_usage", "days": 30}', true),
('660e8400-e29b-41d4-a716-446655440032', 'data_tracking', 'Rastrear Dados', 'Registrar dados de saúde por 2 semanas', 'tecnologia', 'easy', 60, 14, '{"type": "health_data_tracking", "days": 14}', true),
('660e8400-e29b-41d4-a716-446655440033', 'ai_interaction', 'Interagir com IA', 'Usar recursos de IA 10 vezes por 1 mês', 'tecnologia', 'easy', 70, 30, '{"type": "ai_usage", "count": 10, "days": 30}', true),
('660e8400-e29b-41d4-a716-446655440034', 'sync_devices', 'Sincronizar Dispositivos', 'Conectar 2 dispositivos diferentes', 'tecnologia', 'easy', 40, 7, '{"type": "device_sync", "device_count": 2, "days": 7}', true),
('660e8400-e29b-41d4-a716-446655440035', 'backup_data', 'Backup de Dados', 'Fazer backup dos dados importantes', 'tecnologia', 'easy', 30, 1, '{"type": "data_backup"}', true),

-- Metas de Comunidade
('660e8400-e29b-41d4-a716-446655440036', 'share_progress', 'Compartilhar Progresso', 'Compartilhar progresso 5 vezes por 1 mês', 'comunidade', 'easy', 50, 30, '{"type": "progress_sharing", "count": 5, "days": 30}', true),
('660e8400-e29b-41d4-a716-446655440037', 'help_others', 'Ajudar Outros', 'Responder 10 perguntas na comunidade', 'comunidade', 'medium', 80, 60, '{"type": "community_help", "answers": 10, "days": 60}', true),
('660e8400-e29b-41d4-a716-446655440038', 'blog_engagement', 'Engajamento no Blog', 'Comentar em 5 posts do blog por 1 mês', 'comunidade', 'easy', 60, 30, '{"type": "blog_engagement", "comments": 5, "days": 30}', true),
('660e8400-e29b-41d4-a716-446655440039', 'create_content', 'Criar Conteúdo', 'Criar 3 posts na comunidade por 2 meses', 'comunidade', 'medium', 100, 60, '{"type": "content_creation", "posts": 3, "days": 60}', true),
('660e8400-e29b-41d4-a716-446655440040', 'mentor_someone', 'Mentorar Alguém', 'Ajudar um usuário iniciante por 1 mês', 'comunidade', 'hard', 150, 30, '{"type": "mentoring", "days": 30}', true),

-- Metas de Desafio
('660e8400-e29b-41d4-a716-446655440041', '30_day_challenge', 'Desafio 30 Dias', 'Completar qualquer desafio de 30 dias', 'desafio', 'medium', 120, 30, '{"type": "30_day_challenge", "days": 30}', true),
('660e8400-e29b-41d4-a716-446655440042', 'streak_master', 'Mestre da Sequência', 'Manter qualquer sequência por 60 dias', 'desafio', 'hard', 200, 60, '{"type": "streak_master", "days": 60}', true),
('660e8400-e29b-41d4-a716-446655440043', 'multi_goal', 'Múltiplas Metas', 'Trabalhar em 3 metas simultaneamente por 1 mês', 'desafio', 'hard', 180, 30, '{"type": "multiple_goals", "goal_count": 3, "days": 30}', true),
('660e8400-e29b-41d4-a716-446655440044', 'perfectionist', 'Perfeccionista', 'Completar 5 metas com 100% de sucesso', 'desafio', 'hard', 300, 90, '{"type": "perfect_completion", "goals": 5, "success_rate": 100, "days": 90}', true),
('660e8400-e29b-41d4-a716-446655440045', 'ultimate_achiever', 'Realizador Supremo', 'Completar 20 metas em 6 meses', 'desafio', 'hard', 500, 180, '{"type": "goal_achiever", "total_goals": 20, "days": 180}', true)

ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 3. POPULAR CUPONS PROMOCIONAIS
-- ============================================================

-- Garantir que todas as colunas necessárias existem em coupons
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'coupons' AND column_name = 'description') THEN
        ALTER TABLE coupons ADD COLUMN description TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'coupons' AND column_name = 'min_order_value') THEN
        ALTER TABLE coupons ADD COLUMN min_order_value DECIMAL(10,2) DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'coupons' AND column_name = 'max_discount_amount') THEN
        ALTER TABLE coupons ADD COLUMN max_discount_amount DECIMAL(10,2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'coupons' AND column_name = 'usage_limit') THEN
        ALTER TABLE coupons ADD COLUMN usage_limit INTEGER;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'coupons' AND column_name = 'valid_until') THEN
        ALTER TABLE coupons ADD COLUMN valid_until TIMESTAMPTZ;
    END IF;
END $$;

-- Cupons de Boas-vindas
INSERT INTO coupons (id, code, description, discount_type, discount_value, min_order_value, max_discount_amount, usage_limit, valid_until, is_active) VALUES
('770e8400-e29b-41d4-a716-446655440001', 'BEMVINDO10', '10% de desconto para novos usuários', 'percentage', 10.00, 50.00, 20.00, 1000, NOW() + INTERVAL '1 year', true),
('770e8400-e29b-41d4-a716-446655440002', 'PRIMEIRA15', '15% de desconto na primeira compra', 'percentage', 15.00, 100.00, 50.00, 500, NOW() + INTERVAL '6 months', true),
('770e8400-e29b-41d4-a716-446655440003', 'WELCOME20', 'R$ 20 de desconto para compras acima de R$ 150', 'fixed', 20.00, 150.00, NULL, 200, NOW() + INTERVAL '3 months', true),

-- Cupons Sazonais
('770e8400-e29b-41d4-a716-446655440004', 'VERAO25', '25% de desconto para produtos de verão', 'percentage', 25.00, 80.00, 100.00, 300, NOW() + INTERVAL '2 months', true),
('770e8400-e29b-41d4-a716-446655440005', 'BLACKFRIDAY', '40% de desconto na Black Friday', 'percentage', 40.00, 200.00, 200.00, 100, NOW() + INTERVAL '1 month', true),
('770e8400-e29b-41d4-a716-446655440006', 'NATAL30', '30% de desconto para presentes de Natal', 'percentage', 30.00, 120.00, 150.00, 400, NOW() + INTERVAL '3 months', true),
('770e8400-e29b-41d4-a716-446655440007', 'ANO_NOVO', 'R$ 50 de desconto para começar o ano bem', 'fixed', 50.00, 300.00, NULL, 150, NOW() + INTERVAL '2 months', true),

-- Cupons de Fidelidade
('770e8400-e29b-41d4-a716-446655440008', 'FIDELIDADE', '5% de desconto para clientes fiéis', 'percentage', 5.00, 0.00, NULL, NULL, NOW() + INTERVAL '1 year', true),
('770e8400-e29b-41d4-a716-446655440009', 'VIP10', '10% de desconto para membros VIP', 'percentage', 10.00, 0.00, NULL, NULL, NOW() + INTERVAL '1 year', true),
('770e8400-e29b-41d4-a716-446655440010', 'GOLD15', '15% de desconto para membros Gold', 'percentage', 15.00, 0.00, NULL, NULL, NOW() + INTERVAL '1 year', true),

-- Cupons de Produtos Específicos
('770e8400-e29b-41d4-a716-446655440011', 'SUPLEMENTOS20', '20% de desconto em suplementos', 'percentage', 20.00, 100.00, 80.00, 200, NOW() + INTERVAL '6 months', true),
('770e8400-e29b-41d4-a716-446655440012', 'VITAMINAS', 'R$ 15 de desconto em vitaminas', 'fixed', 15.00, 80.00, NULL, 300, NOW() + INTERVAL '4 months', true),
('770e8400-e29b-41d4-a716-446655440013', 'PROTEINA', '25% de desconto em proteínas', 'percentage', 25.00, 120.00, 100.00, 150, NOW() + INTERVAL '3 months', true),
('770e8400-e29b-41d4-a716-446655440014', 'FITNESS', 'R$ 30 de desconto em equipamentos fitness', 'fixed', 30.00, 200.00, NULL, 100, NOW() + INTERVAL '5 months', true),

-- Cupons de Frete
('770e8400-e29b-41d4-a716-446655440015', 'FRETEGRATIS', 'Frete grátis para compras acima de R$ 150', 'fixed', 15.00, 150.00, 15.00, 500, NOW() + INTERVAL '1 year', true),
('770e8400-e29b-41d4-a716-446655440016', 'ENTREGA', 'R$ 10 de desconto no frete', 'fixed', 10.00, 50.00, 10.00, 1000, NOW() + INTERVAL '6 months', true),

-- Cupons de Quantidade
('770e8400-e29b-41d4-a716-446655440017', 'LEVE3PAGUE2', 'Leve 3 e pague 2 (33% de desconto)', 'percentage', 33.33, 0.00, NULL, 100, NOW() + INTERVAL '2 months', true),
('770e8400-e29b-41d4-a716-446655440018', 'COMPREMAIS', '10% de desconto em compras acima de R$ 300', 'percentage', 10.00, 300.00, 50.00, 200, NOW() + INTERVAL '4 months', true),

-- Cupons de Tempo Limitado
('770e8400-e29b-41d4-a716-446655440019', 'FLASH50', '50% de desconto por tempo limitado', 'percentage', 50.00, 200.00, 200.00, 50, NOW() + INTERVAL '7 days', true),
('770e8400-e29b-41d4-a716-446655440020', 'URGENTE', 'R$ 100 de desconto - Últimas unidades', 'fixed', 100.00, 500.00, NULL, 25, NOW() + INTERVAL '3 days', true)

ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 4. FUNÇÃO PARA VALIDAR CUPOM
-- ============================================================

CREATE OR REPLACE FUNCTION validate_coupon(
    coupon_code TEXT,
    order_value DECIMAL(10,2),
    user_id UUID DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    coupon_record RECORD;
    discount_amount DECIMAL(10,2);
    result JSONB;
BEGIN
    -- Buscar cupom
    SELECT * INTO coupon_record
    FROM coupons 
    WHERE code = coupon_code 
    AND is_active = true
    AND (valid_until IS NULL OR valid_until > NOW())
    AND (usage_limit IS NULL OR usage_count < usage_limit);
    
    -- Verificar se cupom existe
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'valid', false,
            'error', 'Cupom não encontrado ou inválido'
        );
    END IF;
    
    -- Verificar valor mínimo
    IF order_value < coupon_record.min_order_value THEN
        RETURN jsonb_build_object(
            'valid', false,
            'error', 'Valor mínimo não atingido',
            'min_value', coupon_record.min_order_value
        );
    END IF;
    
    -- Calcular desconto
    IF coupon_record.discount_type = 'percentage' THEN
        discount_amount := (order_value * coupon_record.discount_value) / 100;
        -- Aplicar desconto máximo se definido
        IF coupon_record.max_discount_amount IS NOT NULL AND discount_amount > coupon_record.max_discount_amount THEN
            discount_amount := coupon_record.max_discount_amount;
        END IF;
    ELSE
        discount_amount := coupon_record.discount_value;
    END IF;
    
    -- Retornar resultado
    RETURN jsonb_build_object(
        'valid', true,
        'discount_amount', discount_amount,
        'final_value', order_value - discount_amount,
        'coupon_id', coupon_record.id,
        'description', coupon_record.description
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 5. COMENTÁRIOS
-- ============================================================

COMMENT ON TABLE goal_templates IS 'Templates de metas que usuários podem escolher';
COMMENT ON FUNCTION validate_coupon(TEXT, DECIMAL, UUID) IS 'Valida e calcula desconto de um cupom. Retorna JSONB com valid, discount_amount, final_value ou error.';

SELECT 'Migração 002: Dados base populados com sucesso!' as status;
