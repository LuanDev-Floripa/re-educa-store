-- ============================================================
-- Migração 19: Compliance LGPD
-- Para: RE-EDUCA Store - Sistema de Reeducação de Estilo de Vida
-- Data: 2025-01-27
-- ============================================================
--
-- Esta migração cria tabelas e estruturas para compliance LGPD:
-- - Consentimentos de usuários
-- - Auditoria de acesso a dados pessoais
-- - Logs de exportação e exclusão de dados
--

-- ============================================================
-- CONSENTIMENTOS LGPD
-- ============================================================

CREATE TABLE IF NOT EXISTS user_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    consent_type TEXT NOT NULL, -- 'data_collection', 'marketing', 'analytics', 'cookies'
    granted BOOLEAN NOT NULL DEFAULT false,
    granted_at TIMESTAMP WITH TIME ZONE,
    revoked_at TIMESTAMP WITH TIME ZONE,
    ip_address TEXT,
    user_agent TEXT,
    consent_text TEXT, -- Texto do consentimento aceito
    version TEXT, -- Versão da política quando foi aceito
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, consent_type)
);

CREATE INDEX IF NOT EXISTS idx_user_consents_user_id ON user_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_consents_type ON user_consents(consent_type);
CREATE INDEX IF NOT EXISTS idx_user_consents_granted ON user_consents(granted);

-- ============================================================
-- AUDITORIA DE ACESSO A DADOS PESSOAIS
-- ============================================================

CREATE TABLE IF NOT EXISTS data_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    accessed_user_id UUID, -- ID do usuário cujos dados foram acessados (pode ser o mesmo ou outro para admins)
    access_type TEXT NOT NULL, -- 'view', 'export', 'modify', 'delete', 'anonymize'
    resource_type TEXT NOT NULL, -- 'profile', 'health_data', 'orders', 'activities', etc.
    resource_id UUID, -- ID do recurso acessado
    accessed_by TEXT, -- 'user', 'admin', 'system', 'api'
    ip_address TEXT,
    user_agent TEXT,
    metadata JSONB, -- Dados adicionais sobre o acesso
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_data_access_logs_user_id ON data_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_data_access_logs_accessed_user_id ON data_access_logs(accessed_user_id);
CREATE INDEX IF NOT EXISTS idx_data_access_logs_type ON data_access_logs(access_type);
CREATE INDEX IF NOT EXISTS idx_data_access_logs_created_at ON data_access_logs(created_at DESC);

-- ============================================================
-- EXPORTAÇÕES DE DADOS
-- ============================================================

-- Tabela já existe? Verificar antes de criar
CREATE TABLE IF NOT EXISTS user_exports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'Exportação de Dados',
    format TEXT NOT NULL DEFAULT 'json' CHECK (format IN ('json', 'csv', 'pdf')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'expired')),
    data_types JSONB, -- ['all'] ou ['profile', 'health_data', 'orders', etc.]
    file_url TEXT,
    file_size BIGINT,
    expires_at TIMESTAMP WITH TIME ZONE,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_exports_user_id ON user_exports(user_id);
CREATE INDEX IF NOT EXISTS idx_user_exports_status ON user_exports(status);
CREATE INDEX IF NOT EXISTS idx_user_exports_expires_at ON user_exports(expires_at);

-- ============================================================
-- EXCLUSÕES E ANONIMIZAÇÕES
-- ============================================================

CREATE TABLE IF NOT EXISTS user_deletions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL, -- Não referencia users pois o usuário será deletado
    deletion_type TEXT NOT NULL CHECK (deletion_type IN ('full', 'partial', 'anonymize')),
    reason TEXT,
    anonymized_data JSONB, -- Dados anonimizados mantidos para estatísticas
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    requested_by UUID REFERENCES users(id) ON DELETE SET NULL,
    ip_address TEXT,
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_deletions_user_id ON user_deletions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_deletions_type ON user_deletions(deletion_type);
CREATE INDEX IF NOT EXISTS idx_user_deletions_deleted_at ON user_deletions(deleted_at DESC);

-- ============================================================
-- COMENTÁRIOS
-- ============================================================

COMMENT ON TABLE user_consents IS 'Armazena consentimentos LGPD dos usuários';
COMMENT ON TABLE data_access_logs IS 'Logs de auditoria de acesso a dados pessoais';
COMMENT ON TABLE user_exports IS 'Histórico de exportações de dados LGPD';
COMMENT ON TABLE user_deletions IS 'Registro de exclusões e anonimizações de dados';
