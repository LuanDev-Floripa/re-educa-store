-- ============================================================
-- Migração 012: Configurações de IA
-- Para: RE-EDUCA Store - Sistema de Reeducação de Estilo de Vida
-- Data: 2025
-- ============================================================
--
-- Esta migração consolida:
-- - 09_ai_configurations_schema.sql
--
-- Cria tabelas para configurações de IA com chaves criptografadas
-- ============================================================

CREATE TABLE IF NOT EXISTS ai_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider VARCHAR(50) NOT NULL CHECK (provider IN ('gemini', 'perplexity', 'openai', 'claude')),
    service_name VARCHAR(100) NOT NULL,
    api_key_encrypted TEXT NOT NULL,
    api_endpoint TEXT,
    model_name VARCHAR(100),
    max_tokens INTEGER DEFAULT 1000,
    temperature DECIMAL(3,2) DEFAULT 0.7,
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    usage_limit INTEGER,
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_provider_service UNIQUE (provider, service_name),
    CONSTRAINT valid_temperature CHECK (temperature >= 0.0 AND temperature <= 2.0),
    CONSTRAINT valid_max_tokens CHECK (max_tokens > 0 AND max_tokens <= 100000)
);

CREATE TABLE IF NOT EXISTS ai_key_rotation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_config_id UUID NOT NULL REFERENCES ai_configurations(id) ON DELETE CASCADE,
    old_api_key_encrypted TEXT NOT NULL,
    new_api_key_encrypted TEXT NOT NULL,
    rotated_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    rotated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reason TEXT DEFAULT 'manual_rotation' CHECK (reason IN ('manual_rotation', 'automatic_rotation', 'security_rotation', 'expired_key')),
    test_result JSONB DEFAULT '{}',
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_ai_config_provider ON ai_configurations(provider);
CREATE INDEX IF NOT EXISTS idx_ai_config_service ON ai_configurations(service_name);
CREATE INDEX IF NOT EXISTS idx_ai_config_active ON ai_configurations(is_active);
CREATE INDEX IF NOT EXISTS idx_ai_config_default ON ai_configurations(is_default);
CREATE INDEX IF NOT EXISTS idx_ai_config_created_by ON ai_configurations(created_by);
CREATE INDEX IF NOT EXISTS idx_ai_rotation_original_config_id ON ai_key_rotation_logs(original_config_id);
CREATE INDEX IF NOT EXISTS idx_ai_rotation_rotated_at ON ai_key_rotation_logs(rotated_at);

CREATE OR REPLACE FUNCTION update_ai_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_ai_config_updated_at ON ai_configurations;
CREATE TRIGGER trigger_update_ai_config_updated_at
    BEFORE UPDATE ON ai_configurations
    FOR EACH ROW
    EXECUTE FUNCTION update_ai_config_updated_at();

ALTER TABLE ai_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_key_rotation_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Only admins can manage AI configurations" ON ai_configurations;
CREATE POLICY "Only admins can manage AI configurations" ON ai_configurations
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
    );

DROP POLICY IF EXISTS "Only admins can view AI rotation logs" ON ai_key_rotation_logs;
CREATE POLICY "Only admins can view AI rotation logs" ON ai_key_rotation_logs
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
    );

COMMENT ON TABLE ai_configurations IS 'Configurações de provedores de IA com chaves criptografadas';
COMMENT ON TABLE ai_key_rotation_logs IS 'Logs de rotação de chaves de IA para auditoria';

SELECT 'Migração 012: Configurações de IA criadas com sucesso!' as status;
