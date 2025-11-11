-- ============================================================
-- Migração 003: Sistema de Loja Aprimorado
-- Para: RE-EDUCA Store - Sistema de Reeducação de Estilo de Vida
-- Data: 2025
-- ============================================================
--
-- Esta migração consolida:
-- - 27_enhance_products_store_system.sql
-- - 13_create_coupon_usage.sql
--
-- Adiciona campos para produtos de plataformas externas,
-- sistema de cupons completo e regras de frete
-- ============================================================

-- ============================================================
-- 1. ADICIONAR CAMPOS NA TABELA PRODUCTS
-- ============================================================

-- Tipo de produto: 'physical' (físico), 'digital' (digital)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS product_type VARCHAR(20) DEFAULT 'physical' 
CHECK (product_type IN ('physical', 'digital'));

-- Origem do produto: 'own' (próprio), 'hotmart', 'kiwifi', 'other'
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS product_source VARCHAR(20) DEFAULT 'own' 
CHECK (product_source IN ('own', 'hotmart', 'kiwifi', 'other'));

-- URL do produto na plataforma externa
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS platform_url TEXT;

-- ID do produto na plataforma externa
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS platform_product_id VARCHAR(255);

-- Chave de acesso para produtos digitais
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS digital_access_key TEXT;

-- Informações de envio (para produtos físicos)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS weight_kg DECIMAL(10,2);
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS dimensions_cm TEXT; -- formato: "LxAxP"
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS requires_shipping BOOLEAN DEFAULT true;

-- Frete grátis
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS free_shipping BOOLEAN DEFAULT false;

-- Preço original (para produtos com desconto)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS original_price DECIMAL(10,2);
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS discount_percentage DECIMAL(5,2) DEFAULT 0;

-- Marca/fabricante
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS brand VARCHAR(255);

-- SKU (código do produto)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'sku'
    ) THEN
        ALTER TABLE products ADD COLUMN sku VARCHAR(100);
        CREATE UNIQUE INDEX IF NOT EXISTS idx_products_sku ON products(sku) WHERE sku IS NOT NULL;
    END IF;
END $$;

-- Tags para busca
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Rating e reviews
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 0;
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS reviews_count INTEGER DEFAULT 0;

-- Estoque
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS in_stock BOOLEAN DEFAULT true;

-- ============================================================
-- 2. ADICIONAR CAMPOS NA TABELA ORDERS
-- ============================================================

-- Endereço de entrega
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS shipping_address JSONB;

-- Método de pagamento
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);

-- ID da transação de pagamento
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(255);

-- Status de pagamento
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending' 
CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded'));

-- Código de rastreamento
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(255);

-- Previsão de entrega
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS estimated_delivery DATE;

-- Cupom aplicado
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(50);
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS shipping_cost DECIMAL(10,2) DEFAULT 0;

-- Status estendido
ALTER TABLE orders 
DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders 
ADD CONSTRAINT orders_status_check 
CHECK (status IN ('pending', 'processing', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded'));

-- ============================================================
-- 3. GARANTIR CAMPOS NA TABELA DE CUPONS (já criada em 001)
-- ============================================================

-- Garantir que todos os campos necessários existem (já devem estar em 001, mas garantimos aqui)
ALTER TABLE coupons 
ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE coupons 
ADD COLUMN IF NOT EXISTS min_order_value DECIMAL(10,2) DEFAULT 0;
ALTER TABLE coupons 
ADD COLUMN IF NOT EXISTS max_discount_amount DECIMAL(10,2);
ALTER TABLE coupons 
ADD COLUMN IF NOT EXISTS usage_limit INTEGER;
ALTER TABLE coupons 
ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0;
ALTER TABLE coupons 
ADD COLUMN IF NOT EXISTS valid_from TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE coupons 
ADD COLUMN IF NOT EXISTS valid_until TIMESTAMPTZ;
ALTER TABLE coupons 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Renomear campos antigos se ainda existirem (compatibilidade com migrações antigas)
DO $$ 
BEGIN
    -- Se existir min_purchase mas não min_order_value
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'coupons' AND column_name = 'min_purchase'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'coupons' AND column_name = 'min_order_value'
    ) THEN
        ALTER TABLE coupons RENAME COLUMN min_purchase TO min_order_value;
    END IF;
    
    -- Se existir max_uses mas não usage_limit
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'coupons' AND column_name = 'max_uses'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'coupons' AND column_name = 'usage_limit'
    ) THEN
        ALTER TABLE coupons RENAME COLUMN max_uses TO usage_limit;
    END IF;
    
    -- Se existir uses_count mas não usage_count (já deve ser o mesmo)
    -- Não precisa renomear
    
    -- Se existir expires_at mas não valid_until
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'coupons' AND column_name = 'expires_at'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'coupons' AND column_name = 'valid_until'
    ) THEN
        ALTER TABLE coupons RENAME COLUMN expires_at TO valid_until;
    END IF;
END $$;

-- Índices para cupons
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(is_active, valid_from, valid_until);

-- ============================================================
-- 4. TABELA DE USO DE CUPONS (COUPON USAGE)
-- ============================================================

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
DROP POLICY IF EXISTS "Users can view their own coupon usage" ON coupon_usage;
CREATE POLICY "Users can view their own coupon usage" ON coupon_usage
    FOR SELECT USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can create their own coupon usage" ON coupon_usage;
CREATE POLICY "Users can create their own coupon usage" ON coupon_usage
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Admins can view all coupon usage" ON coupon_usage;
CREATE POLICY "Admins can view all coupon usage" ON coupon_usage
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id::text = auth.uid()::text 
            AND users.role = 'admin'
        )
    );

-- ============================================================
-- 5. TABELA DE CÁLCULO DE FRETE
-- ============================================================

CREATE TABLE IF NOT EXISTS shipping_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    min_order_value DECIMAL(10,2) DEFAULT 0,
    max_order_value DECIMAL(10,2),
    shipping_cost DECIMAL(10,2) NOT NULL,
    free_shipping_threshold DECIMAL(10,2),
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0, -- Prioridade (maior = primeiro)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Regra padrão: Frete grátis acima de R$ 200
INSERT INTO shipping_rules (name, description, min_order_value, shipping_cost, free_shipping_threshold, is_active, priority)
SELECT 'Frete Padrão', 'Frete padrão para todo o Brasil', 0, 15.00, 200.00, true, 1
WHERE NOT EXISTS (
    SELECT 1 FROM shipping_rules WHERE name = 'Frete Padrão'
);

-- Índices para shipping_rules
CREATE INDEX IF NOT EXISTS idx_shipping_rules_active ON shipping_rules(is_active, priority) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_shipping_rules_priority ON shipping_rules(priority DESC);

-- ============================================================
-- 6. COMENTÁRIOS E DOCUMENTAÇÃO
-- ============================================================

COMMENT ON COLUMN products.product_type IS 'Tipo: physical (físico) ou digital';
COMMENT ON COLUMN products.product_source IS 'Origem: own (próprio), hotmart, kiwifi, other';
COMMENT ON COLUMN products.platform_url IS 'URL do produto na plataforma externa';
COMMENT ON COLUMN products.platform_product_id IS 'ID do produto na plataforma externa';
COMMENT ON COLUMN products.digital_access_key IS 'Chave de acesso para produtos digitais';
COMMENT ON COLUMN products.requires_shipping IS 'Produto físico requer envio';
COMMENT ON COLUMN orders.shipping_address IS 'Endereço de entrega em formato JSON';
COMMENT ON COLUMN orders.payment_method IS 'Método de pagamento: credit_card, pix, boleto, etc.';
COMMENT ON COLUMN orders.tracking_number IS 'Código de rastreamento dos Correios/transportadora';
COMMENT ON TABLE coupon_usage IS 'Rastreia o uso de cupons de desconto pelos usuários';
COMMENT ON TABLE shipping_rules IS 'Regras de cálculo de frete baseadas em valor do pedido';

SELECT 'Migração 003: Sistema de loja aprimorado criado com sucesso!' as status;
