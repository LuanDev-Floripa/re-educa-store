-- =====================================================
-- TABELAS DE EXPORTAÇÃO DE DADOS
-- =====================================================

-- TABELA DE EXPORTAÇÕES DE DADOS
CREATE TABLE IF NOT EXISTS user_exports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    format TEXT CHECK (format IN ('json', 'csv', 'pdf', 'xlsx')) NOT NULL DEFAULT 'json',
    status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
    data_types TEXT[] NOT NULL, -- ['profile', 'exercises', 'goals', 'achievements', 'health', 'all']
    file_url TEXT, -- URL do arquivo gerado no Supabase Storage
    file_size BIGINT, -- Tamanho em bytes
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days')
);

-- TABELA DE EXPORTAÇÕES AGENDADAS
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

-- ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_user_exports_user ON user_exports(user_id);
CREATE INDEX IF NOT EXISTS idx_user_exports_status ON user_exports(status);
CREATE INDEX IF NOT EXISTS idx_user_exports_created ON user_exports(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_scheduled_exports_user ON scheduled_exports(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_exports_enabled ON scheduled_exports(enabled);
CREATE INDEX IF NOT EXISTS idx_scheduled_exports_next_run ON scheduled_exports(next_run);

-- RLS POLICIES
ALTER TABLE user_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own exports" ON user_exports
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own exports" ON user_exports
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own exports" ON user_exports
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own scheduled exports" ON scheduled_exports
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own scheduled exports" ON scheduled_exports
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scheduled exports" ON scheduled_exports
    FOR UPDATE USING (auth.uid() = user_id);