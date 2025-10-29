-- ============================================
-- RE-EDUCA - Popular Cupons Ativos
-- ============================================
-- Este arquivo cria cupons promocionais ativos

-- Verificar se tabela existe
CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed')) NOT NULL,
    discount_value DECIMAL(10,2) NOT NULL,
    min_order_value DECIMAL(10,2) DEFAULT 0,
    max_discount DECIMAL(10,2),
    usage_limit INTEGER,
    used_count INTEGER DEFAULT 0,
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valid_until TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- CUPONS PROMOCIONAIS
-- ============================================

-- Cupons de Boas-vindas
INSERT INTO coupons (id, code, description, discount_type, discount_value, min_order_value, max_discount, usage_limit, valid_until, is_active) VALUES
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

-- ============================================
-- FUNÇÃO PARA VALIDAR CUPOM
-- ============================================
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
    AND (usage_limit IS NULL OR used_count < usage_limit);
    
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
        IF coupon_record.max_discount IS NOT NULL AND discount_amount > coupon_record.max_discount THEN
            discount_amount := coupon_record.max_discount;
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

-- ============================================
-- VERIFICAÇÃO
-- ============================================
SELECT 
    code,
    description,
    discount_type,
    discount_value,
    min_order_value,
    usage_limit,
    used_count,
    valid_until,
    is_active
FROM coupons 
WHERE is_active = true
ORDER BY created_at DESC;