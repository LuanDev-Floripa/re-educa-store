-- =============================================
-- RE-EDUCA Store v2.0.0 - AI Configuration Schema
-- Tabela para armazenar configurações de IA de forma segura
-- =============================================

-- Tabela para configurações de IA
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
    
    -- Constraints
    CONSTRAINT unique_provider_service UNIQUE (provider, service_name),
    CONSTRAINT valid_temperature CHECK (temperature >= 0.0 AND temperature <= 2.0),
    CONSTRAINT valid_max_tokens CHECK (max_tokens > 0 AND max_tokens <= 100000)
);

-- Tabela para logs de rotação de chaves de IA
CREATE TABLE IF NOT EXISTS ai_key_rotation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_config_id UUID NOT NULL REFERENCES ai_configurations(id) ON DELETE CASCADE,
    old_api_key_encrypted TEXT NOT NULL,
    new_api_key_encrypted TEXT NOT NULL,
    rotated_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    rotated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reason TEXT DEFAULT 'manual_rotation' CHECK (reason IN ('manual_rotation', 'automatic_rotation', 'security_rotation', 'expired_key')),
    test_result JSONB DEFAULT '{}',
    notes TEXT,
    
    -- Constraints
    CONSTRAINT valid_rotation_reason CHECK (reason IN ('manual_rotation', 'automatic_rotation', 'security_rotation', 'expired_key'))
);

-- Índices para otimização
CREATE INDEX IF NOT EXISTS idx_ai_config_provider ON ai_configurations(provider);
CREATE INDEX IF NOT EXISTS idx_ai_config_service ON ai_configurations(service_name);
CREATE INDEX IF NOT EXISTS idx_ai_config_active ON ai_configurations(is_active);
CREATE INDEX IF NOT EXISTS idx_ai_config_default ON ai_configurations(is_default);
CREATE INDEX IF NOT EXISTS idx_ai_config_created_by ON ai_configurations(created_by);

CREATE INDEX IF NOT EXISTS idx_ai_rotation_original_config_id ON ai_key_rotation_logs(original_config_id);
CREATE INDEX IF NOT EXISTS idx_ai_rotation_rotated_at ON ai_key_rotation_logs(rotated_at);
CREATE INDEX IF NOT EXISTS idx_ai_rotation_rotated_by ON ai_key_rotation_logs(rotated_by);
CREATE INDEX IF NOT EXISTS idx_ai_rotation_reason ON ai_key_rotation_logs(reason);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_ai_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_ai_config_updated_at
    BEFORE UPDATE ON ai_configurations
    FOR EACH ROW
    EXECUTE FUNCTION update_ai_config_updated_at();

-- RLS (Row Level Security) - Apenas admins podem gerenciar configurações de IA
ALTER TABLE ai_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_key_rotation_logs ENABLE ROW LEVEL SECURITY;

-- Política para ai_configurations - apenas admins
CREATE POLICY "Only admins can manage AI configurations" ON ai_configurations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Política para ai_key_rotation_logs - apenas admins
CREATE POLICY "Only admins can view AI rotation logs" ON ai_key_rotation_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Comentários para documentação
COMMENT ON TABLE ai_configurations IS 'Configurações de provedores de IA com chaves criptografadas';
COMMENT ON TABLE ai_key_rotation_logs IS 'Logs de rotação de chaves de IA para auditoria';
COMMENT ON COLUMN ai_configurations.api_key_encrypted IS 'Chave API criptografada para segurança';
COMMENT ON COLUMN ai_configurations.usage_count IS 'Contador de uso da configuração';
COMMENT ON COLUMN ai_key_rotation_logs.test_result IS 'Resultado dos testes após rotação da chave';