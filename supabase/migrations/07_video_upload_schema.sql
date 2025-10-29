-- Migração para sistema de upload de vídeo
-- Cria tabelas para gerenciar vídeos, visualizações e analytics

-- Tabela de uploads de vídeo
CREATE TABLE IF NOT EXISTS video_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    video_url TEXT NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    stream_id UUID REFERENCES live_streams(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'uploaded' CHECK (status IN ('uploading', 'uploaded', 'processing', 'ready', 'error')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de visualizações de vídeo
CREATE TABLE IF NOT EXISTS video_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID NOT NULL REFERENCES video_uploads(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    view_duration INTEGER DEFAULT 0, -- em segundos
    completion_rate DECIMAL(5,2) DEFAULT 0, -- porcentagem de conclusão
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de likes de vídeo
CREATE TABLE IF NOT EXISTS video_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID NOT NULL REFERENCES video_uploads(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(video_id, user_id)
);

-- Tabela de comentários de vídeo
CREATE TABLE IF NOT EXISTS video_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID NOT NULL REFERENCES video_uploads(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    parent_id UUID REFERENCES video_comments(id) ON DELETE CASCADE,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de compartilhamentos de vídeo
CREATE TABLE IF NOT EXISTS video_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID NOT NULL REFERENCES video_uploads(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL, -- 'facebook', 'twitter', 'instagram', 'whatsapp', 'copy_link'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_video_uploads_user_id ON video_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_video_uploads_stream_id ON video_uploads(stream_id);
CREATE INDEX IF NOT EXISTS idx_video_uploads_status ON video_uploads(status);
CREATE INDEX IF NOT EXISTS idx_video_uploads_created_at ON video_uploads(created_at);

CREATE INDEX IF NOT EXISTS idx_video_views_video_id ON video_views(video_id);
CREATE INDEX IF NOT EXISTS idx_video_views_user_id ON video_views(user_id);
CREATE INDEX IF NOT EXISTS idx_video_views_created_at ON video_views(created_at);

CREATE INDEX IF NOT EXISTS idx_video_likes_video_id ON video_likes(video_id);
CREATE INDEX IF NOT EXISTS idx_video_likes_user_id ON video_likes(user_id);

CREATE INDEX IF NOT EXISTS idx_video_comments_video_id ON video_comments(video_id);
CREATE INDEX IF NOT EXISTS idx_video_comments_user_id ON video_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_video_comments_parent_id ON video_comments(parent_id);

CREATE INDEX IF NOT EXISTS idx_video_shares_video_id ON video_shares(video_id);
CREATE INDEX IF NOT EXISTS idx_video_shares_user_id ON video_shares(user_id);

-- RLS (Row Level Security)
ALTER TABLE video_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_shares ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para video_uploads
CREATE POLICY "Users can view their own videos" ON video_uploads
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view public videos" ON video_uploads
    FOR SELECT USING (status = 'ready');

CREATE POLICY "Users can insert their own videos" ON video_uploads
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own videos" ON video_uploads
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own videos" ON video_uploads
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para video_views
CREATE POLICY "Users can view video views" ON video_views
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own views" ON video_views
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas RLS para video_likes
CREATE POLICY "Users can view video likes" ON video_likes
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own likes" ON video_likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes" ON video_likes
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para video_comments
CREATE POLICY "Users can view video comments" ON video_comments
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own comments" ON video_comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" ON video_comments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON video_comments
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para video_shares
CREATE POLICY "Users can view video shares" ON video_shares
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own shares" ON video_shares
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Funções para analytics de vídeo
CREATE OR REPLACE FUNCTION get_video_stats(video_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_views', COALESCE(views.total_views, 0),
        'unique_viewers', COALESCE(views.unique_viewers, 0),
        'avg_duration', COALESCE(views.avg_duration, 0),
        'total_likes', COALESCE(likes.total_likes, 0),
        'total_comments', COALESCE(comments.total_comments, 0),
        'total_shares', COALESCE(shares.total_shares, 0),
        'completion_rate', COALESCE(views.completion_rate, 0)
    ) INTO result
    FROM (
        SELECT 
            COUNT(*) as total_views,
            COUNT(DISTINCT user_id) as unique_viewers,
            AVG(view_duration) as avg_duration,
            AVG(completion_rate) as completion_rate
        FROM video_views 
        WHERE video_id = video_uuid
    ) views
    CROSS JOIN (
        SELECT COUNT(*) as total_likes
        FROM video_likes 
        WHERE video_id = video_uuid
    ) likes
    CROSS JOIN (
        SELECT COUNT(*) as total_comments
        FROM video_comments 
        WHERE video_id = video_uuid
    ) comments
    CROSS JOIN (
        SELECT COUNT(*) as total_shares
        FROM video_shares 
        WHERE video_id = video_uuid
    ) shares;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Função para obter vídeos populares
CREATE OR REPLACE FUNCTION get_popular_videos(
    category_filter VARCHAR DEFAULT NULL,
    limit_count INTEGER DEFAULT 20,
    offset_count INTEGER DEFAULT 0
)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_agg(
        json_build_object(
            'id', v.id,
            'user_id', v.user_id,
            'filename', v.filename,
            'video_url', v.video_url,
            'content_type', v.content_type,
            'file_size', v.file_size,
            'status', v.status,
            'created_at', v.created_at,
            'stats', get_video_stats(v.id),
            'user', json_build_object(
                'id', u.id,
                'username', u.username,
                'full_name', u.full_name,
                'avatar_url', u.avatar_url,
                'is_verified', u.is_verified
            )
        )
    ) INTO result
    FROM video_uploads v
    JOIN users u ON v.user_id = u.id
    WHERE v.status = 'ready'
    AND (category_filter IS NULL OR v.content_type LIKE '%' || category_filter || '%')
    ORDER BY (
        SELECT COUNT(*) FROM video_views WHERE video_id = v.id
    ) DESC, v.created_at DESC
    LIMIT limit_count OFFSET offset_count;
    
    RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql;

-- Função para atualizar contador de likes
CREATE OR REPLACE FUNCTION update_video_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE video_uploads 
        SET updated_at = NOW()
        WHERE id = NEW.video_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE video_uploads 
        SET updated_at = NOW()
        WHERE id = OLD.video_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar contador de likes
CREATE TRIGGER update_video_likes_count_trigger
    AFTER INSERT OR DELETE ON video_likes
    FOR EACH ROW
    EXECUTE FUNCTION update_video_likes_count();

-- Função para atualizar contador de comentários
CREATE OR REPLACE FUNCTION update_video_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE video_uploads 
        SET updated_at = NOW()
        WHERE id = NEW.video_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE video_uploads 
        SET updated_at = NOW()
        WHERE id = OLD.video_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar contador de comentários
CREATE TRIGGER update_video_comments_count_trigger
    AFTER INSERT OR DELETE ON video_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_video_comments_count();

-- Comentários das tabelas
COMMENT ON TABLE video_uploads IS 'Armazena metadados de vídeos enviados pelos usuários';
COMMENT ON TABLE video_views IS 'Registra visualizações de vídeos pelos usuários';
COMMENT ON TABLE video_likes IS 'Registra curtidas de vídeos pelos usuários';
COMMENT ON TABLE video_comments IS 'Armazena comentários em vídeos';
COMMENT ON TABLE video_shares IS 'Registra compartilhamentos de vídeos';

COMMENT ON COLUMN video_uploads.status IS 'Status do processamento do vídeo';
COMMENT ON COLUMN video_views.view_duration IS 'Duração da visualização em segundos';
COMMENT ON COLUMN video_views.completion_rate IS 'Taxa de conclusão da visualização (0-100)';
COMMENT ON COLUMN video_comments.parent_id IS 'ID do comentário pai (para respostas)';
COMMENT ON COLUMN video_shares.platform IS 'Plataforma onde o vídeo foi compartilhado';
