-- Configuração de políticas RLS para Supabase Storage
-- Bucket: videos

-- Função para obter URL pública de vídeo
CREATE OR REPLACE FUNCTION get_video_url(video_path TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN 'https://' || current_setting('app.supabase_url') || '/storage/v1/object/public/videos/' || video_path;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se usuário pode acessar vídeo
CREATE OR REPLACE FUNCTION can_access_video(video_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    video_owner UUID;
BEGIN
    -- Verificar se o vídeo existe e obter o dono
    SELECT vu.user_id INTO video_owner
    FROM video_uploads vu
    WHERE vu.id = video_id;
    
    -- Retornar true se o vídeo não existe (erro será tratado na aplicação)
    -- ou se o usuário é o dono
    RETURN video_owner IS NULL OR video_owner = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para atualizar estatísticas quando vídeo é deletado
CREATE OR REPLACE FUNCTION update_video_stats_on_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- Atualizar contadores de vídeos do usuário
    UPDATE users 
    SET video_count = video_count - 1
    WHERE id = OLD.user_id;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_video_stats_on_delete
    AFTER DELETE ON video_uploads
    FOR EACH ROW
    EXECUTE FUNCTION update_video_stats_on_delete();

-- Trigger para atualizar estatísticas quando vídeo é criado
CREATE OR REPLACE FUNCTION update_video_stats_on_insert()
RETURNS TRIGGER AS $$
BEGIN
    -- Atualizar contadores de vídeos do usuário
    UPDATE users 
    SET video_count = COALESCE(video_count, 0) + 1
    WHERE id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_video_stats_on_insert
    AFTER INSERT ON video_uploads
    FOR EACH ROW
    EXECUTE FUNCTION update_video_stats_on_insert();

-- Índices para performance nas tabelas do projeto
CREATE INDEX IF NOT EXISTS idx_video_uploads_user_id ON video_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_video_uploads_status ON video_uploads(status);

-- Comentários para documentação
COMMENT ON FUNCTION get_video_url(TEXT) IS 'Retorna URL pública de um vídeo no Supabase Storage';
COMMENT ON FUNCTION can_access_video(UUID, UUID) IS 'Verifica se usuário pode acessar um vídeo específico';
