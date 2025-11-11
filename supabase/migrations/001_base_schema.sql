-- ============================================================
-- Migração 001: Schema Base do Sistema
-- Para: RE-EDUCA Store - Sistema de Reeducação de Estilo de Vida
-- Data: 2025
-- ============================================================
--
-- Esta migração consolida:
-- - 00_setup_and_rls.sql
-- - 01_initial_schema.sql
-- - 01_5_achievements_table.sql
--
-- Cria todas as tabelas base do sistema e configura RLS
-- ============================================================

-- ============================================================
-- 1. TABELAS BASE
-- ============================================================

-- USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category TEXT,
    stock_quantity INTEGER DEFAULT 0,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    total DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ORDER_ITEMS TABLE
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CART_ITEMS TABLE
CREATE TABLE IF NOT EXISTS cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- USER_ACTIVITIES TABLE
CREATE TABLE IF NOT EXISTS user_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL,
    title TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- USER_ACHIEVEMENTS TABLE
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    rarity TEXT DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
    points INTEGER DEFAULT 10,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- USER_GOALS TABLE
CREATE TABLE IF NOT EXISTS user_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    target INTEGER NOT NULL,
    progress INTEGER DEFAULT 0,
    icon TEXT,
    color TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- EXERCISE_LOGS TABLE
CREATE TABLE IF NOT EXISTS exercise_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    exercise_name TEXT NOT NULL,
    duration_minutes INTEGER,
    calories_burned INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- NUTRITION_LOGS TABLE
CREATE TABLE IF NOT EXISTS nutrition_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    calories DECIMAL(10,2),
    protein DECIMAL(10,2),
    carbs DECIMAL(10,2),
    fat DECIMAL(10,2),
    water_ml INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- FAVORITES TABLE
CREATE TABLE IF NOT EXISTS favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- REVIEWS TABLE
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    stripe_payment_id TEXT,
    amount DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- COUPONS TABLE (versão básica - será expandida em 003_store_system.sql)
CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value DECIMAL(10,2) NOT NULL,
    min_order_value DECIMAL(10,2) DEFAULT 0,
    max_discount_amount DECIMAL(10,2),
    usage_limit INTEGER,
    usage_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ACHIEVEMENTS TABLE (Templates de conquistas)
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

-- ============================================================
-- 2. ÍNDICES BASE
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_cart_user ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_user ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
-- Adicionar coluna code se não existir (compatibilidade com tabelas antigas)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'achievements' AND column_name = 'code'
    ) THEN
        ALTER TABLE achievements ADD COLUMN code TEXT UNIQUE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_achievements_code ON achievements(code) WHERE code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_achievements_category ON achievements(category);
CREATE INDEX IF NOT EXISTS idx_achievements_active ON achievements(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_achievements_rarity ON achievements(rarity);

-- ============================================================
-- 3. RLS (ROW LEVEL SECURITY)
-- ============================================================

-- Habilitar RLS nas tabelas base
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
ALTER TABLE IF EXISTS achievements ENABLE ROW LEVEL SECURITY;

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

-- Políticas RLS para achievements (públicos para leitura)
DROP POLICY IF EXISTS "Achievements are viewable by everyone" ON achievements;
CREATE POLICY "Achievements are viewable by everyone" ON achievements
    FOR SELECT USING (is_active = true);

-- ============================================================
-- 4. COMENTÁRIOS
-- ============================================================

COMMENT ON TABLE users IS 'Usuários do sistema';
COMMENT ON TABLE products IS 'Produtos da loja';
COMMENT ON TABLE orders IS 'Pedidos realizados';
COMMENT ON TABLE order_items IS 'Itens de cada pedido';
COMMENT ON TABLE cart_items IS 'Itens no carrinho de compras';
COMMENT ON TABLE achievements IS 'Templates de conquistas para gamificação';

SELECT 'Migração 001: Schema base criado com sucesso!' as status;
