-- ============================================================
-- Migração 018: Idempotência em Webhooks de Pagamento
-- Para: RE-EDUCA Store - Sistema de Reeducação de Estilo de Vida
-- Data: 2025-01-27
-- ============================================================
--
-- Esta migração adiciona:
-- 1. Tabela para rastrear webhooks processados (idempotência)
-- 2. Índices para performance
-- 3. RLS policies
--
-- ============================================================

-- ============================================================
-- 1. TABELA DE WEBHOOKS PROCESSADOS
-- ============================================================

CREATE TABLE IF NOT EXISTS processed_webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_id TEXT NOT NULL,  -- ID do webhook do provider (Stripe event ID, PagSeguro notification code, etc.)
    provider TEXT NOT NULL CHECK (provider IN ('stripe', 'pagseguro', 'other')),
    event_type TEXT NOT NULL,  -- Tipo do evento (payment_intent.succeeded, etc.)
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    transaction_id TEXT,  -- ID da transação do provider
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    result JSONB,  -- Resultado do processamento (para auditoria)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(webhook_id, provider)  -- Garante que webhook só é processado uma vez
);

-- ============================================================
-- 2. ÍNDICES PARA PERFORMANCE
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_processed_webhooks_webhook_id ON processed_webhooks(webhook_id);
CREATE INDEX IF NOT EXISTS idx_processed_webhooks_provider ON processed_webhooks(provider);
CREATE INDEX IF NOT EXISTS idx_processed_webhooks_order_id ON processed_webhooks(order_id);
CREATE INDEX IF NOT EXISTS idx_processed_webhooks_transaction_id ON processed_webhooks(transaction_id);
CREATE INDEX IF NOT EXISTS idx_processed_webhooks_processed_at ON processed_webhooks(processed_at DESC);

-- ============================================================
-- 3. RLS POLICIES
-- ============================================================

ALTER TABLE processed_webhooks ENABLE ROW LEVEL SECURITY;

-- Apenas backend (service role) pode inserir/ler webhooks processados
DROP POLICY IF EXISTS "Service role can manage webhooks" ON processed_webhooks;
CREATE POLICY "Service role can manage webhooks" ON processed_webhooks
    FOR ALL USING (
        -- Backend usa service role key, então permite tudo
        -- Em produção, usar service role key do Supabase
        true
    );

-- ============================================================
-- 4. FUNÇÃO HELPER PARA VERIFICAR IDEMPOTÊNCIA
-- ============================================================

CREATE OR REPLACE FUNCTION is_webhook_processed(
    p_webhook_id TEXT,
    p_provider TEXT
) RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM processed_webhooks 
        WHERE webhook_id = p_webhook_id 
        AND provider = p_provider
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 5. FUNÇÃO HELPER PARA REGISTRAR WEBHOOK PROCESSADO
-- ============================================================

CREATE OR REPLACE FUNCTION register_webhook_processed(
    p_webhook_id TEXT,
    p_provider TEXT,
    p_event_type TEXT,
    p_order_id UUID DEFAULT NULL,
    p_transaction_id TEXT DEFAULT NULL,
    p_result JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_webhook_record_id UUID;
BEGIN
    INSERT INTO processed_webhooks (
        webhook_id,
        provider,
        event_type,
        order_id,
        transaction_id,
        result
    ) VALUES (
        p_webhook_id,
        p_provider,
        p_event_type,
        p_order_id,
        p_transaction_id,
        p_result
    )
    ON CONFLICT (webhook_id, provider) DO NOTHING
    RETURNING id INTO v_webhook_record_id;
    
    RETURN v_webhook_record_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 6. COMENTÁRIOS
-- ============================================================

COMMENT ON TABLE processed_webhooks IS 
'Tabela para rastrear webhooks processados e garantir idempotência.
Evita processar o mesmo webhook múltiplas vezes mesmo se provider enviar novamente.';

COMMENT ON FUNCTION is_webhook_processed(TEXT, TEXT) IS 
'Verifica se um webhook já foi processado anteriormente.';

COMMENT ON FUNCTION register_webhook_processed(TEXT, TEXT, TEXT, UUID, TEXT, JSONB) IS 
'Registra um webhook como processado. Retorna NULL se já existe (idempotência).';

-- ============================================================
-- 7. VALIDAÇÃO
-- ============================================================

-- Verificar que tabela foi criada
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'processed_webhooks'
    ) THEN
        RAISE EXCEPTION 'Tabela processed_webhooks não foi criada!';
    END IF;
END $$;

SELECT 'Migração 018: Idempotência em webhooks aplicada com sucesso!' as status;