-- ============================================================
-- Migração 022: Sistema de Alertas de Estoque
-- Para: RE-EDUCA Store - Sistema de Reeducação de Estilo de Vida
-- Data: 2025
-- ============================================================
--
-- Esta migração cria o sistema de alertas de estoque incluindo:
-- - Tabela de configurações de alertas
-- - Tabela de histórico de alertas enviados
-- - Índices para performance
-- ============================================================

-- ============================================================
-- 1. TABELA DE CONFIGURAÇÕES DE ALERTAS
-- ============================================================

CREATE TABLE IF NOT EXISTS inventory_alert_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    threshold INTEGER NOT NULL DEFAULT 10,
    enabled BOOLEAN DEFAULT true,
    notify_email TEXT[] DEFAULT ARRAY[]::TEXT[],
    notify_admins BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id)
);

-- Índice para buscar alertas ativos
CREATE INDEX IF NOT EXISTS idx_inventory_alert_settings_enabled ON inventory_alert_settings(enabled) WHERE enabled = true;

-- Índice para buscar por produto
CREATE INDEX IF NOT EXISTS idx_inventory_alert_settings_product ON inventory_alert_settings(product_id);

-- ============================================================
-- 2. TABELA DE HISTÓRICO DE ALERTAS
-- ============================================================

CREATE TABLE IF NOT EXISTS inventory_alert_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    threshold INTEGER NOT NULL,
    stock_quantity INTEGER NOT NULL,
    alert_type TEXT DEFAULT 'low_stock' CHECK (alert_type IN ('low_stock', 'out_of_stock', 'critical')),
    notified_emails TEXT[],
    notified_admins BOOLEAN DEFAULT false,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    is_resolved BOOLEAN DEFAULT false
);

-- Índice para buscar alertas recentes
CREATE INDEX IF NOT EXISTS idx_inventory_alert_history_sent ON inventory_alert_history(sent_at DESC);

-- Índice para buscar alertas não resolvidos
CREATE INDEX IF NOT EXISTS idx_inventory_alert_history_resolved ON inventory_alert_history(is_resolved) WHERE is_resolved = false;

-- Índice para buscar por produto
CREATE INDEX IF NOT EXISTS idx_inventory_alert_history_product ON inventory_alert_history(product_id);

-- ============================================================
-- 3. RLS PARA ALERTAS
-- ============================================================

-- Configurações de alerta: apenas admins podem gerenciar
ALTER TABLE inventory_alert_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage alert settings" ON inventory_alert_settings
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id::text = auth.uid()::text 
            AND users.role = 'admin'
        )
    );

-- Histórico de alertas: apenas admins podem ver
ALTER TABLE inventory_alert_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view alert history" ON inventory_alert_history
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id::text = auth.uid()::text 
            AND users.role = 'admin'
        )
    );

-- ============================================================
-- 4. FUNÇÃO PARA MARCAR ALERTA COMO RESOLVIDO
-- ============================================================

CREATE OR REPLACE FUNCTION resolve_inventory_alert(alert_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE inventory_alert_history
    SET 
        is_resolved = true,
        resolved_at = NOW()
    WHERE id = alert_id AND is_resolved = false;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION resolve_inventory_alert(UUID) IS 'Marca um alerta de estoque como resolvido. Retorna true se o alerta foi encontrado e atualizado, false caso contrário.';
