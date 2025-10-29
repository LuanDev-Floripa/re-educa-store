-- ============================================
-- RE-EDUCA - Popular Metas (Goals Templates)
-- ============================================
-- Este arquivo cria templates de metas que usuários podem escolher

-- Tabela para templates de metas (se não existir)
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

-- ============================================
-- METAS TEMPLATES
-- ============================================

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
('660e8400-e29b-41d4-a716-446655440044', 'perfectionist', 'Perfeccionista', 'Completar 5 metas com 100% de sucesso', 'desafio', 'epic', 300, 90, '{"type": "perfect_completion", "goals": 5, "success_rate": 100, "days": 90}', true),
('660e8400-e29b-41d4-a716-446655440045', 'ultimate_achiever', 'Realizador Supremo', 'Completar 20 metas em 6 meses', 'desafio', 'legendary', 500, 180, '{"type": "goal_achiever", "total_goals": 20, "days": 180}', true)

ON CONFLICT (id) DO NOTHING;

-- ============================================
-- VERIFICAÇÃO
-- ============================================
SELECT 
    category,
    difficulty,
    COUNT(*) as total_goals,
    AVG(points) as avg_points,
    AVG(duration_days) as avg_duration_days
FROM goal_templates 
WHERE is_active = true
GROUP BY category, difficulty
ORDER BY category, difficulty;