-- ============================================================
-- Migração 18: Índices para Performance
-- Para: RE-EDUCA Store - Sistema de Reeducação de Estilo de Vida
-- Data: 2025-01-27
-- ============================================================
--
-- Esta migração adiciona índices para otimizar queries frequentes
-- e prevenir problemas de performance (N+1 queries)
--

-- ============================================================
-- ÍNDICES PARA TABELAS DE SAÚDE
-- ============================================================

-- Índices para imc_calculations
CREATE INDEX IF NOT EXISTS idx_imc_calculations_user_id ON imc_calculations(user_id);
CREATE INDEX IF NOT EXISTS idx_imc_calculations_created_at ON imc_calculations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_imc_calculations_user_created ON imc_calculations(user_id, created_at DESC);

-- Índices para calorie_calculations
CREATE INDEX IF NOT EXISTS idx_calorie_calculations_user_id ON calorie_calculations(user_id);
CREATE INDEX IF NOT EXISTS idx_calorie_calculations_created_at ON calorie_calculations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_calorie_calculations_user_created ON calorie_calculations(user_id, created_at DESC);

-- Índices para biological_age_calculations
CREATE INDEX IF NOT EXISTS idx_biological_age_user_id ON biological_age_calculations(user_id);
CREATE INDEX IF NOT EXISTS idx_biological_age_created_at ON biological_age_calculations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_biological_age_user_created ON biological_age_calculations(user_id, created_at DESC);

-- Índices para metabolism_calculations
CREATE INDEX IF NOT EXISTS idx_metabolism_user_id ON metabolism_calculations(user_id);
CREATE INDEX IF NOT EXISTS idx_metabolism_created_at ON metabolism_calculations(created_at DESC);

-- Índices para sleep_calculations
CREATE INDEX IF NOT EXISTS idx_sleep_user_id ON sleep_calculations(user_id);
CREATE INDEX IF NOT EXISTS idx_sleep_created_at ON sleep_calculations(created_at DESC);

-- Índices para stress_calculations
CREATE INDEX IF NOT EXISTS idx_stress_user_id ON stress_calculations(user_id);
CREATE INDEX IF NOT EXISTS idx_stress_created_at ON stress_calculations(created_at DESC);

-- Índices para hydration_calculations
CREATE INDEX IF NOT EXISTS idx_hydration_user_id ON hydration_calculations(user_id);
CREATE INDEX IF NOT EXISTS idx_hydration_created_at ON hydration_calculations(created_at DESC);

-- ============================================================
-- ÍNDICES PARA FOOD DIARY E EXERCISE ENTRIES
-- ============================================================

-- Índices para food_diary_entries
CREATE INDEX IF NOT EXISTS idx_food_diary_user_id ON food_diary_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_food_diary_entry_date ON food_diary_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_food_diary_user_date ON food_diary_entries(user_id, entry_date);

-- Índices para exercise_entries
CREATE INDEX IF NOT EXISTS idx_exercise_entries_user_id ON exercise_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_exercise_entries_entry_date ON exercise_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_exercise_entries_user_date ON exercise_entries(user_id, entry_date);

-- ============================================================
-- ÍNDICES PARA PRODUTOS
-- ============================================================

-- Índices para products
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_in_stock ON products(in_stock) WHERE in_stock = true;
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_rating ON products(rating DESC);
CREATE INDEX IF NOT EXISTS idx_products_sales_count ON products(sales_count DESC);
CREATE INDEX IF NOT EXISTS idx_products_active_stock ON products(is_active, in_stock) WHERE is_active = true AND in_stock = true;

-- ============================================================
-- ÍNDICES PARA PEDIDOS
-- ============================================================

-- Índices para orders
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_user_created ON orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders(status, created_at DESC);

-- ============================================================
-- ÍNDICES PARA USUÁRIOS
-- ============================================================

-- Índices para users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- ============================================================
-- ÍNDICES PARA EXERCÍCIOS
-- ============================================================

-- Índices para exercises
CREATE INDEX IF NOT EXISTS idx_exercises_category ON exercises(category);
CREATE INDEX IF NOT EXISTS idx_exercises_difficulty ON exercises(difficulty);
CREATE INDEX IF NOT EXISTS idx_exercises_category_difficulty ON exercises(category, difficulty);

-- ============================================================
-- ÍNDICES PARA SOCIAL (Posts, Comments, etc.)
-- ============================================================

-- Índices para posts
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_user_created ON posts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_type ON posts(post_type);

-- Índices para comments
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- Índices para reactions
CREATE INDEX IF NOT EXISTS idx_reactions_post_id ON reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user_id ON reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_reactions_post_user ON reactions(post_id, user_id);

-- ============================================================
-- ÍNDICES PARA WORKOUT SESSIONS
-- ============================================================

-- Índices para workout_sessions
CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_id ON workout_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_created_at ON workout_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_created ON workout_sessions(user_id, created_at DESC);

-- ============================================================
-- ÍNDICES PARA USER ACTIVITIES
-- ============================================================

-- Índices para user_activities
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON user_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activities_user_created ON user_activities(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activities_type ON user_activities(activity_type);

-- ============================================================
-- COMENTÁRIOS
-- ============================================================

-- Estes índices melhoram significativamente a performance de:
-- - Queries de histórico por usuário
-- - Buscas paginadas
-- - Filtros por data
-- - Joins entre tabelas
--
-- IMPORTANTE: Índices compostos (user_id, created_at) são especialmente
-- eficientes para queries que filtram por usuário e ordenam por data.