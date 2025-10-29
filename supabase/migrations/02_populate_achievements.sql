-- ============================================
-- RE-EDUCA - Popular Conquistas (Achievements)
-- ============================================
-- Este arquivo popula achievements templates para gamificação

-- Limpar achievements existentes (apenas templates, não do usuário)
-- DELETE FROM user_achievements WHERE user_id IS NULL;

-- ============================================
-- ACHIEVEMENTS TEMPLATES
-- Estes serão usados para criar conquistas quando usuários completarem ações
-- ============================================

-- Conquistas de Primeiros Passos
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

-- ============================================
-- VERIFICAÇÃO
-- ============================================
SELECT 
    category,
    COUNT(*) as total_achievements,
    SUM(CASE WHEN rarity = 'common' THEN 1 ELSE 0 END) as common,
    SUM(CASE WHEN rarity = 'uncommon' THEN 1 ELSE 0 END) as uncommon,
    SUM(CASE WHEN rarity = 'rare' THEN 1 ELSE 0 END) as rare,
    SUM(CASE WHEN rarity = 'epic' THEN 1 ELSE 0 END) as epic,
    SUM(CASE WHEN rarity = 'legendary' THEN 1 ELSE 0 END) as legendary
FROM achievements 
WHERE is_active = true
GROUP BY category
ORDER BY category;