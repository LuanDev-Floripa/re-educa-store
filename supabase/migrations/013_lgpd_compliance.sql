-- ============================================================
-- Migração 013: Compliance LGPD
-- Para: RE-EDUCA Store - Sistema de Reeducação de Estilo de Vida
-- Data: 2025
-- ============================================================
--
-- Esta migração consolida:
-- - 11_create_exports_tables.sql
-- - 19_lgpd_compliance.sql
--
-- Cria tabelas para compliance LGPD: consentimentos, auditoria,
-- exportações e exclusões
-- ============================================================

CREATE TABLE IF NOT EXISTS user_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    consent_type TEXT NOT NULL,
    granted BOOLEAN NOT NULL DEFAULT false,
    granted_at TIMESTAMP WITH TIME ZONE,
    revoked_at TIMESTAMP WITH TIME ZONE,
    ip_address TEXT,
    user_agent TEXT,
    consent_text TEXT,
    version TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, consent_type)
);

CREATE TABLE IF NOT EXISTS data_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    accessed_user_id UUID,
    access_type TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID,
    accessed_by TEXT,
    ip_address TEXT,
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_exports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'Exportação de Dados',
    format TEXT CHECK (format IN ('json', 'csv', 'pdf', 'xlsx')) NOT NULL DEFAULT 'json',
    status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'expired')) DEFAULT 'pending',
    data_types TEXT[],
    file_url TEXT,
    file_size BIGINT,
    error_message TEXT,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scheduled_exports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    format TEXT CHECK (format IN ('json', 'csv', 'pdf', 'xlsx')) NOT NULL DEFAULT 'json',
    frequency TEXT CHECK (frequency IN ('daily', 'weekly', 'monthly', 'custom')) NOT NULL,
    data_types TEXT[] NOT NULL,
    enabled BOOLEAN DEFAULT true,
    next_run TIMESTAMP WITH TIME ZONE NOT NULL,
    last_run TIMESTAMP WITH TIME ZONE,
    last_run_status TEXT CHECK (last_run_status IN ('success', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_deletions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    deletion_type TEXT NOT NULL CHECK (deletion_type IN ('full', 'partial', 'anonymize')),
    reason TEXT,
    anonymized_data JSONB,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    requested_by UUID REFERENCES users(id) ON DELETE SET NULL,
    ip_address TEXT,
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_consents_user_id ON user_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_consents_type ON user_consents(consent_type);
CREATE INDEX IF NOT EXISTS idx_data_access_logs_user_id ON data_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_data_access_logs_accessed_user_id ON data_access_logs(accessed_user_id);
CREATE INDEX IF NOT EXISTS idx_data_access_logs_created_at ON data_access_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_exports_user ON user_exports(user_id);
CREATE INDEX IF NOT EXISTS idx_user_exports_status ON user_exports(status);
CREATE INDEX IF NOT EXISTS idx_user_exports_expires_at ON user_exports(expires_at);
CREATE INDEX IF NOT EXISTS idx_scheduled_exports_user ON scheduled_exports(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_exports_next_run ON scheduled_exports(next_run);
CREATE INDEX IF NOT EXISTS idx_user_deletions_user_id ON user_deletions(user_id);

ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_deletions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own consents" ON user_consents;
CREATE POLICY "Users can view own consents" ON user_consents
    FOR SELECT USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can manage own consents" ON user_consents;
CREATE POLICY "Users can manage own consents" ON user_consents
    FOR ALL USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can view own access logs" ON data_access_logs;
CREATE POLICY "Users can view own access logs" ON data_access_logs
    FOR SELECT USING (auth.uid()::text = user_id::text OR auth.uid()::text = accessed_user_id::text);

DROP POLICY IF EXISTS "System can insert access logs" ON data_access_logs;
CREATE POLICY "System can insert access logs" ON data_access_logs
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view their own exports" ON user_exports;
CREATE POLICY "Users can view their own exports" ON user_exports
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own exports" ON user_exports;
CREATE POLICY "Users can create their own exports" ON user_exports
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own scheduled exports" ON scheduled_exports;
CREATE POLICY "Users can view their own scheduled exports" ON scheduled_exports
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own deletion records" ON user_deletions;
CREATE POLICY "Users can view own deletion records" ON user_deletions
    FOR SELECT USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "System can insert deletion records" ON user_deletions;
CREATE POLICY "System can insert deletion records" ON user_deletions
    FOR INSERT WITH CHECK (true);

COMMENT ON TABLE user_consents IS 'Armazena consentimentos LGPD dos usuários';
COMMENT ON TABLE data_access_logs IS 'Logs de auditoria de acesso a dados pessoais';
COMMENT ON TABLE user_exports IS 'Histórico de exportações de dados LGPD';
COMMENT ON TABLE user_deletions IS 'Registro de exclusões e anonimizações de dados';

SELECT 'Migração 013: Compliance LGPD criado com sucesso!' as status;
