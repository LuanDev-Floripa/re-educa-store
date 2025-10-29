-- =====================================================
-- TABELA DE USO DE CUPONS (COUPON USAGE)
-- =====================================================

-- Tabela para rastrear uso de cupons
CREATE TABLE IF NOT EXISTS coupon_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    discount_value DECIMAL(10, 2) NOT NULL,
    discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    order_value DECIMAL(10, 2) NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(coupon_id, user_id, order_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_coupon_usage_coupon ON coupon_usage(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_user ON coupon_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_order ON coupon_usage(order_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_used_at ON coupon_usage(used_at DESC);

-- RLS (Row Level Security)
ALTER TABLE coupon_usage ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view their own coupon usage" ON coupon_usage
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create their own coupon usage" ON coupon_usage
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Admins podem ver todos os usos
CREATE POLICY "Admins can view all coupon usage" ON coupon_usage
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid()::uuid 
            AND users.role = 'admin'
        )
    );

-- Comentários
COMMENT ON TABLE coupon_usage IS 'Rastreia o uso de cupons de desconto pelos usuários';
COMMENT ON COLUMN coupon_usage.discount_value IS 'Valor do desconto aplicado';
COMMENT ON COLUMN coupon_usage.discount_amount IS 'Valor do desconto aplicado (alias)';
COMMENT ON COLUMN coupon_usage.order_value IS 'Valor total do pedido antes do desconto';
