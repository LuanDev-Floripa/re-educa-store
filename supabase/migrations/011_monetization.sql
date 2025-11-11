-- ============================================================
-- Migração 011: Sistema de Monetização e Verificação
-- Para: RE-EDUCA Store - Sistema de Reeducação de Estilo de Vida
-- Data: 2025
-- ============================================================
--
-- Esta migração consolida:
-- - 10_create_monetization_tables.sql
--
-- Cria tabelas de assinaturas, transações e verificações de conta
-- ============================================================

CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscriber_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan TEXT CHECK (plan IN ('basic', 'premium', 'enterprise')) NOT NULL DEFAULT 'basic',
    price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    status TEXT CHECK (status IN ('active', 'cancelled', 'expired', 'pending')) DEFAULT 'pending',
    next_billing TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    cancelled_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(subscriber_id, creator_id)
);

CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('tip_received', 'tip_sent', 'subscription_payment', 'subscription_received', 'coin_purchase', 'gift_sent', 'gift_received', 'withdrawal', 'deposit', 'refund')) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    description TEXT,
    status TEXT CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')) DEFAULT 'pending',
    related_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    related_post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS account_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category TEXT CHECK (category IN ('fitness', 'nutrition', 'wellness', 'coach', 'influencer', 'professional')) NOT NULL,
    status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'expired')) DEFAULT 'pending',
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    rejection_reason TEXT,
    documents JSONB,
    social_media JSONB,
    achievements TEXT[],
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_subscriber ON subscriptions(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_creator ON subscriptions(creator_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_account_verifications_user ON account_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_account_verifications_status ON account_verifications(status);
CREATE INDEX IF NOT EXISTS idx_account_verifications_category ON account_verifications(category);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own subscriptions" ON subscriptions;
CREATE POLICY "Users can view their own subscriptions" ON subscriptions
    FOR SELECT USING (auth.uid() = subscriber_id OR auth.uid() = creator_id);

DROP POLICY IF EXISTS "Users can create subscriptions" ON subscriptions;
CREATE POLICY "Users can create subscriptions" ON subscriptions
    FOR INSERT WITH CHECK (auth.uid() = subscriber_id);

DROP POLICY IF EXISTS "Users can view their own transactions" ON transactions;
CREATE POLICY "Users can view their own transactions" ON transactions
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create transactions" ON transactions;
CREATE POLICY "Users can create transactions" ON transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own verifications" ON account_verifications;
CREATE POLICY "Users can view their own verifications" ON account_verifications
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all verifications" ON account_verifications;
CREATE POLICY "Admins can view all verifications" ON account_verifications
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid()::uuid AND users.role = 'admin')
    );

DROP POLICY IF EXISTS "Users can create their own verifications" ON account_verifications;
CREATE POLICY "Users can create their own verifications" ON account_verifications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

SELECT 'Migração 011: Sistema de monetização criado com sucesso!' as status;
