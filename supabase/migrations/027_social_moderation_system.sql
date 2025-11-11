-- ============================================================
-- Migração 027: Sistema de Moderação Social
-- Para: RE-EDUCA Store - Sistema de Reeducação de Estilo de Vida
-- Data: 2025-01-27
-- ============================================================
--
-- Cria sistema completo de moderação social incluindo:
-- - Reports de posts, comentários e usuários
-- - Banimento de usuários
-- - Histórico de moderação
-- ============================================================

-- Tabela de Reports
CREATE TABLE IF NOT EXISTS social_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reported_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    report_type TEXT NOT NULL CHECK (report_type IN ('spam', 'harassment', 'inappropriate', 'fake', 'other')),
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected', 'resolved')),
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    resolution_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Usuários Banidos
CREATE TABLE IF NOT EXISTS banned_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    banned_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    ban_type TEXT DEFAULT 'temporary' CHECK (ban_type IN ('temporary', 'permanent')),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Tabela de Histórico de Moderação
CREATE TABLE IF NOT EXISTS moderation_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    moderator_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    action_type TEXT NOT NULL CHECK (action_type IN ('post_deleted', 'post_hidden', 'comment_deleted', 'user_banned', 'user_unbanned', 'report_resolved', 'content_approved')),
    target_type TEXT NOT NULL CHECK (target_type IN ('post', 'comment', 'user', 'report')),
    target_id UUID NOT NULL,
    reason TEXT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_social_reports_status ON social_reports(status);
CREATE INDEX IF NOT EXISTS idx_social_reports_post_id ON social_reports(post_id);
CREATE INDEX IF NOT EXISTS idx_social_reports_reported_user_id ON social_reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_social_reports_created_at ON social_reports(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_banned_users_user_id ON banned_users(user_id);
CREATE INDEX IF NOT EXISTS idx_banned_users_is_active ON banned_users(is_active);
CREATE INDEX IF NOT EXISTS idx_banned_users_expires_at ON banned_users(expires_at);

CREATE INDEX IF NOT EXISTS idx_moderation_history_moderator_id ON moderation_history(moderator_id);
CREATE INDEX IF NOT EXISTS idx_moderation_history_target ON moderation_history(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_moderation_history_created_at ON moderation_history(created_at DESC);

-- RLS Policies
ALTER TABLE social_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE banned_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_history ENABLE ROW LEVEL SECURITY;

-- Políticas para social_reports
CREATE POLICY "Users can create reports"
    ON social_reports FOR INSERT
    WITH CHECK (auth.uid()::text = reporter_id::text);

CREATE POLICY "Admins can view all reports"
    ON social_reports FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id::text = auth.uid()::text
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Users can view their own reports"
    ON social_reports FOR SELECT
    USING (auth.uid()::text = reporter_id::text);

CREATE POLICY "Admins can update reports"
    ON social_reports FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id::text = auth.uid()::text
            AND users.role = 'admin'
        )
    );

-- Políticas para banned_users
CREATE POLICY "Admins can view banned users"
    ON banned_users FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id::text = auth.uid()::text
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can manage banned users"
    ON banned_users FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id::text = auth.uid()::text
            AND users.role = 'admin'
        )
    );

-- Políticas para moderation_history
CREATE POLICY "Admins can view moderation history"
    ON moderation_history FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id::text = auth.uid()::text
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can create moderation history"
    ON moderation_history FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id::text = auth.uid()::text
            AND users.role = 'admin'
        )
    );

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_social_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_social_reports_updated_at ON social_reports;
CREATE TRIGGER trigger_update_social_reports_updated_at
    BEFORE UPDATE ON social_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_social_reports_updated_at();

CREATE OR REPLACE FUNCTION update_banned_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_banned_users_updated_at ON banned_users;
CREATE TRIGGER trigger_update_banned_users_updated_at
    BEFORE UPDATE ON banned_users
    FOR EACH ROW
    EXECUTE FUNCTION update_banned_users_updated_at();

-- Função para verificar se usuário está banido
CREATE OR REPLACE FUNCTION is_user_banned(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM banned_users
        WHERE user_id = user_uuid
        AND is_active = true
        AND (ban_type = 'permanent' OR expires_at > NOW())
    );
END;
$$ LANGUAGE plpgsql;

-- Comentários
COMMENT ON TABLE social_reports IS 'Reports de conteúdo e usuários na rede social';
COMMENT ON TABLE banned_users IS 'Usuários banidos da plataforma';
COMMENT ON TABLE moderation_history IS 'Histórico de ações de moderação';
COMMENT ON FUNCTION is_user_banned(UUID) IS 'Verifica se um usuário está banido';
