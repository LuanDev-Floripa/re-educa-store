-- ============================================================
-- Migração 026: Configurações Gerais da Plataforma
-- Para: RE-EDUCA Store - Sistema de Reeducação de Estilo de Vida
-- Data: 2025-01-27
-- ============================================================
--
-- Cria tabela para configurações gerais da plataforma
-- Permite que administradores configurem a plataforma via interface
-- ============================================================

CREATE TABLE IF NOT EXISTS platform_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(255) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type VARCHAR(50) DEFAULT 'string' CHECK (setting_type IN ('string', 'number', 'boolean', 'json')),
    category VARCHAR(100) DEFAULT 'general',
    description TEXT,
    is_public BOOLEAN DEFAULT false, -- Se pode ser acessado sem autenticação
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_platform_settings_key ON platform_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_platform_settings_category ON platform_settings(category);

-- RLS Policies
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- Apenas administradores podem ver e editar configurações
CREATE POLICY "Admins can view settings"
    ON platform_settings FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can update settings"
    ON platform_settings FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can insert settings"
    ON platform_settings FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Configurações públicas podem ser lidas por qualquer usuário autenticado
CREATE POLICY "Public settings are readable"
    ON platform_settings FOR SELECT
    USING (is_public = true);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_platform_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_platform_settings_updated_at ON platform_settings;
CREATE TRIGGER trigger_update_platform_settings_updated_at
    BEFORE UPDATE ON platform_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_platform_settings_updated_at();

-- Inserir configurações padrão
INSERT INTO platform_settings (setting_key, setting_value, setting_type, category, description, is_public) VALUES
    ('platform_name', 'RE-EDUCA Store', 'string', 'general', 'Nome da plataforma', true),
    ('platform_description', 'Sistema de Reeducação de Estilo de Vida', 'string', 'general', 'Descrição da plataforma', true),
    ('maintenance_mode', 'false', 'boolean', 'system', 'Modo de manutenção', false),
    ('registration_enabled', 'true', 'boolean', 'system', 'Permitir novos cadastros', false),
    ('email_verification_required', 'true', 'boolean', 'system', 'Verificação de email obrigatória', false),
    ('default_shipping_cost', '15.00', 'number', 'shipping', 'Custo padrão de frete', false),
    ('free_shipping_threshold', '200.00', 'number', 'shipping', 'Valor mínimo para frete grátis', true),
    ('currency', 'BRL', 'string', 'general', 'Moeda padrão', true),
    ('currency_symbol', 'R$', 'string', 'general', 'Símbolo da moeda', true),
    ('support_email', 'suporte@re-educa.com', 'string', 'contact', 'Email de suporte', true),
    ('support_phone', '', 'string', 'contact', 'Telefone de suporte', false),
    ('social_facebook', '', 'string', 'social', 'URL do Facebook', true),
    ('social_instagram', '', 'string', 'social', 'URL do Instagram', true),
    ('social_twitter', '', 'string', 'social', 'URL do Twitter', true),
    ('max_upload_size_mb', '25', 'number', 'system', 'Tamanho máximo de upload em MB', false),
    ('session_timeout_minutes', '30', 'number', 'security', 'Timeout de sessão em minutos', false)
ON CONFLICT (setting_key) DO NOTHING;

COMMENT ON TABLE platform_settings IS 'Configurações gerais da plataforma gerenciáveis via interface administrativa';
COMMENT ON COLUMN platform_settings.setting_key IS 'Chave única da configuração';
COMMENT ON COLUMN platform_settings.setting_value IS 'Valor da configuração (armazenado como texto)';
COMMENT ON COLUMN platform_settings.setting_type IS 'Tipo do valor (string, number, boolean, json)';
COMMENT ON COLUMN platform_settings.category IS 'Categoria da configuração (general, system, shipping, contact, social, security)';
COMMENT ON COLUMN platform_settings.is_public IS 'Se a configuração pode ser acessada sem autenticação';
