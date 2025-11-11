-- ============================================================
-- Migração 028: Sistema de Histórico de Rastreamento
-- Para: RE-EDUCA Store - Sistema de Reeducação de Estilo de Vida
-- Data: 2025
-- ============================================================
--
-- Esta migração cria o sistema de histórico de rastreamento incluindo:
-- - Tabela de histórico de eventos de rastreamento
-- - Índices para performance
-- - Políticas RLS
-- ============================================================

-- ============================================================
-- 1. TABELA DE HISTÓRICO DE RASTREAMENTO
-- ============================================================

CREATE TABLE IF NOT EXISTS order_tracking_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    tracking_number TEXT NOT NULL,
    event_type TEXT NOT NULL, -- 'created', 'in_transit', 'out_for_delivery', 'delivered', 'exception', etc
    event_description TEXT NOT NULL,
    location TEXT, -- Local do evento (cidade, estado)
    event_date TIMESTAMP WITH TIME ZONE, -- Data do evento (da transportadora)
    carrier TEXT, -- Transportadora (correios, jadlog, etc)
    source TEXT DEFAULT 'manual', -- 'manual', 'api', 'webhook'
    metadata JSONB DEFAULT '{}'::jsonb, -- Dados adicionais do evento
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(order_id, tracking_number, event_type, event_date)
);

-- Índice para buscar histórico por pedido
CREATE INDEX IF NOT EXISTS idx_tracking_history_order ON order_tracking_history(order_id, created_at DESC);

-- Índice para buscar por código de rastreamento
CREATE INDEX IF NOT EXISTS idx_tracking_history_tracking ON order_tracking_history(tracking_number);

-- Índice para buscar por transportadora
CREATE INDEX IF NOT EXISTS idx_tracking_history_carrier ON order_tracking_history(carrier);

-- ============================================================
-- 2. POLÍTICAS RLS
-- ============================================================

-- Garantir que RLS está habilitado
ALTER TABLE order_tracking_history ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver histórico de seus próprios pedidos
DROP POLICY IF EXISTS "Users can view own tracking history" ON order_tracking_history;
CREATE POLICY "Users can view own tracking history" ON order_tracking_history
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = order_tracking_history.order_id 
            AND orders.user_id::text = auth.uid()::text
        )
    );

-- Política: Admins podem ver todo histórico
DROP POLICY IF EXISTS "Admins can view all tracking history" ON order_tracking_history;
CREATE POLICY "Admins can view all tracking history" ON order_tracking_history
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id::text = auth.uid()::text 
            AND users.role = 'admin'
        )
    );

-- Política: Sistema pode inserir histórico (via service)
DROP POLICY IF EXISTS "System can insert tracking history" ON order_tracking_history;
CREATE POLICY "System can insert tracking history" ON order_tracking_history
    FOR INSERT
    WITH CHECK (true); -- Permitir inserção via service (sem auth.uid())

-- Política: Admins podem inserir histórico manualmente
DROP POLICY IF EXISTS "Admins can insert tracking history" ON order_tracking_history;
CREATE POLICY "Admins can insert tracking history" ON order_tracking_history
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id::text = auth.uid()::text 
            AND users.role = 'admin'
        )
    );

-- ============================================================
-- 3. FUNÇÃO PARA LIMPAR HISTÓRICO ANTIGO (OPCIONAL)
-- ============================================================

-- Função para limpar histórico antigo (mais de 1 ano)
CREATE OR REPLACE FUNCTION cleanup_old_tracking_history()
RETURNS void AS $$
BEGIN
    DELETE FROM order_tracking_history
    WHERE created_at < NOW() - INTERVAL '1 year';
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 4. COMENTÁRIOS
-- ============================================================

COMMENT ON TABLE order_tracking_history IS 'Histórico de eventos de rastreamento de pedidos';
COMMENT ON COLUMN order_tracking_history.event_type IS 'Tipo de evento: created, in_transit, out_for_delivery, delivered, exception, etc';
COMMENT ON COLUMN order_tracking_history.source IS 'Origem do evento: manual (inserido manualmente), api (da API da transportadora), webhook (de webhook)';
