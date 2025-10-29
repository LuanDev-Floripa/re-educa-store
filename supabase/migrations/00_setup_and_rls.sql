-- =====================================================
-- MIGRAÇÃO 00 - SETUP INICIAL E RLS PARA TABELAS BASE
-- =====================================================
-- Esta migração deve ser executada ANTES da 01
-- Adiciona RLS e políticas para tabelas da migração 01

-- Habilitar RLS nas tabelas base (da migração 01)
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS exercise_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS nutrition_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS coupons ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para users
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'Users can view all users') THEN
        CREATE POLICY "Users can view all users" ON users
            FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'Users can update own profile') THEN
        CREATE POLICY "Users can update own profile" ON users
            FOR UPDATE USING (auth.uid()::uuid = id);
    END IF;
END $$;

-- Políticas RLS para products (públicos)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'products' AND policyname = 'Products are viewable by everyone') THEN
        CREATE POLICY "Products are viewable by everyone" ON products
            FOR SELECT USING (is_active = true);
    END IF;
END $$;

-- Políticas RLS para orders
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'orders' AND policyname = 'Users can view own orders') THEN
        CREATE POLICY "Users can view own orders" ON orders
            FOR SELECT USING (auth.uid()::uuid = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'orders' AND policyname = 'Users can create own orders') THEN
        CREATE POLICY "Users can create own orders" ON orders
            FOR INSERT WITH CHECK (auth.uid()::uuid = user_id);
    END IF;
END $$;

-- Políticas RLS para order_items
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'order_items' AND policyname = 'Users can view own order items') THEN
        CREATE POLICY "Users can view own order items" ON order_items
            FOR SELECT USING (
                EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()::uuid)
            );
    END IF;
END $$;

-- Políticas RLS para cart_items
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'cart_items' AND policyname = 'Users can manage own cart') THEN
        CREATE POLICY "Users can manage own cart" ON cart_items
            FOR ALL USING (auth.uid()::uuid = user_id);
    END IF;
END $$;

-- Políticas RLS para user_activities
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_activities' AND policyname = 'Users can view own activities') THEN
        CREATE POLICY "Users can view own activities" ON user_activities
            FOR SELECT USING (auth.uid()::uuid = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_activities' AND policyname = 'Users can insert own activities') THEN
        CREATE POLICY "Users can insert own activities" ON user_activities
            FOR INSERT WITH CHECK (auth.uid()::uuid = user_id);
    END IF;
END $$;

-- Políticas RLS para user_achievements
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_achievements' AND policyname = 'Users can view own achievements') THEN
        CREATE POLICY "Users can view own achievements" ON user_achievements
            FOR SELECT USING (auth.uid()::uuid = user_id);
    END IF;
END $$;

-- Políticas RLS para user_goals
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_goals' AND policyname = 'Users can manage own goals') THEN
        CREATE POLICY "Users can manage own goals" ON user_goals
            FOR ALL USING (auth.uid()::uuid = user_id);
    END IF;
END $$;

-- Políticas RLS para exercise_logs
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'exercise_logs' AND policyname = 'Users can manage own exercise logs') THEN
        CREATE POLICY "Users can manage own exercise logs" ON exercise_logs
            FOR ALL USING (auth.uid()::uuid = user_id);
    END IF;
END $$;

-- Políticas RLS para nutrition_logs
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'nutrition_logs' AND policyname = 'Users can manage own nutrition logs') THEN
        CREATE POLICY "Users can manage own nutrition logs" ON nutrition_logs
            FOR ALL USING (auth.uid()::uuid = user_id);
    END IF;
END $$;

-- Políticas RLS para favorites
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'favorites' AND policyname = 'Users can manage own favorites') THEN
        CREATE POLICY "Users can manage own favorites" ON favorites
            FOR ALL USING (auth.uid()::uuid = user_id);
    END IF;
END $$;

-- Políticas RLS para reviews
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'reviews' AND policyname = 'Reviews are viewable by everyone') THEN
        CREATE POLICY "Reviews are viewable by everyone" ON reviews
            FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'reviews' AND policyname = 'Users can create reviews') THEN
        CREATE POLICY "Users can create reviews" ON reviews
            FOR INSERT WITH CHECK (auth.uid()::uuid = user_id);
    END IF;
END $$;

-- Políticas RLS para payments
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'payments' AND policyname = 'Users can view own payments') THEN
        CREATE POLICY "Users can view own payments" ON payments
            FOR SELECT USING (
                EXISTS (SELECT 1 FROM orders WHERE orders.id = payments.order_id AND orders.user_id = auth.uid()::uuid)
            );
    END IF;
END $$;

-- Políticas RLS para coupons (públicos para leitura)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'coupons' AND policyname = 'Coupons are viewable by everyone') THEN
        CREATE POLICY "Coupons are viewable by everyone" ON coupons
            FOR SELECT USING (is_active = true);
    END IF;
END $$;

SELECT 'RLS policies for base tables created successfully!' as status;
