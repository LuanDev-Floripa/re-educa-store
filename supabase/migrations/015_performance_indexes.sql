-- ============================================================
-- Migração 015: Índices para Performance
-- Para: RE-EDUCA Store - Sistema de Reeducação de Estilo de Vida
-- Data: 2025
-- ============================================================
--
-- Esta migração consolida:
-- - 18_add_performance_indexes.sql
--
-- Adiciona índices para otimizar queries frequentes
-- ============================================================

-- Índices adicionais para cálculos de saúde (se ainda não existirem)
CREATE INDEX IF NOT EXISTS idx_imc_calculations_user_created ON imc_calculations(user_id, created_at DESC);
-- Tabela calories_history não existe, usar calories_history
CREATE INDEX IF NOT EXISTS idx_calories_history_user_created ON calories_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_biological_age_user_created ON biological_age_calculations(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_metabolism_user_created ON metabolism_calculations(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sleep_user_created ON sleep_calculations(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stress_user_created ON stress_calculations(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hydration_user_created ON hydration_calculations(user_id, created_at DESC);

-- Índices para food_diary_entries (ajustar coluna se necessário)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'food_diary_entries' AND column_name = 'consumed_at') THEN
        CREATE INDEX IF NOT EXISTS idx_food_diary_entry_date ON food_diary_entries(consumed_at);
        CREATE INDEX IF NOT EXISTS idx_food_diary_user_date ON food_diary_entries(user_id, consumed_at DESC);
    END IF;
END $$;

-- Índices para products (se ainda não existirem)
CREATE INDEX IF NOT EXISTS idx_products_rating ON products(rating DESC);
-- CREATE INDEX IF NOT EXISTS idx_products_sales_count ON products(sales_count DESC) WHERE sales_count IS NOT NULL -- Coluna sales_count não existe;
CREATE INDEX IF NOT EXISTS idx_products_active_stock ON products(is_active, in_stock) WHERE is_active = true AND in_stock = true;

-- Índices para orders (se ainda não existirem)
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders(status, created_at DESC);

-- Índices para exercises (se ainda não existirem)
CREATE INDEX IF NOT EXISTS idx_exercises_category_difficulty ON exercises(category, difficulty);

-- Índices para posts (se ainda não existirem)
CREATE INDEX IF NOT EXISTS idx_posts_user_created ON posts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_type ON posts(post_type);

-- Índices para reactions (se ainda não existirem)
CREATE INDEX IF NOT EXISTS idx_reactions_post_user ON reactions(post_id, user_id);

-- Índices para workout_sessions (se ainda não existirem)
CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_created ON workout_sessions(user_id, created_at DESC);

-- Índices para user_activities (se ainda não existirem)
CREATE INDEX IF NOT EXISTS idx_user_activities_user_created ON user_activities(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activities_type ON user_activities(activity_type);

SELECT 'Migração 015: Índices de performance criados com sucesso!' as status;
