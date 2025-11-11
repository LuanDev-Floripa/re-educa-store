-- ============================================================
-- Migração 025: Sistema de Logs e Auditoria Administrativa
-- Para: RE-EDUCA Store - Sistema de Reeducação de Estilo de Vida
-- Data: 2025-01-27
-- ============================================================
--
-- Cria sistema completo de logs e auditoria para administradores
-- Inclui logs de atividades de usuários e eventos de segurança
-- ============================================================

-- Tabela de logs de atividades de usuários
CREATE TABLE IF NOT EXISTS admin_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    activity_type TEXT NOT NULL,
    activity_description TEXT,
    ip_address TEXT,
    user_agent TEXT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de logs de segurança
CREATE TABLE IF NOT EXISTS admin_security_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    event_description TEXT,
    severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    ip_address TEXT,
    user_agent TEXT,
    details JSONB,
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_user_id ON admin_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_activity_type ON admin_activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_created_at ON admin_activity_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_security_logs_user_id ON admin_security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_security_logs_event_type ON admin_security_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_admin_security_logs_severity ON admin_security_logs(severity);
CREATE INDEX IF NOT EXISTS idx_admin_security_logs_created_at ON admin_security_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_security_logs_resolved ON admin_security_logs(resolved);

-- RLS Policies
ALTER TABLE admin_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_security_logs ENABLE ROW LEVEL SECURITY;

-- Políticas: apenas administradores podem ver logs
CREATE POLICY "Admins can view activity logs"
    ON admin_activity_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can view security logs"
    ON admin_security_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

CREATE POLICY "System can insert activity logs"
    ON admin_activity_logs FOR INSERT
    WITH CHECK (true);

CREATE POLICY "System can insert security logs"
    ON admin_security_logs FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Admins can update security logs"
    ON admin_security_logs FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Função para limpar logs antigos (manter apenas últimos 90 dias)
CREATE OR REPLACE FUNCTION cleanup_old_logs()
RETURNS void AS $$
BEGIN
    DELETE FROM admin_activity_logs
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    DELETE FROM admin_security_logs
    WHERE created_at < NOW() - INTERVAL '90 days'
    AND resolved = true;
END;
$$ LANGUAGE plpgsql;

-- Comentários
COMMENT ON TABLE admin_activity_logs IS 'Logs de atividades de usuários para auditoria administrativa';
COMMENT ON TABLE admin_security_logs IS 'Logs de eventos de segurança para auditoria administrativa';
COMMENT ON FUNCTION cleanup_old_logs() IS 'Limpa logs antigos (manter apenas últimos 90 dias)';
