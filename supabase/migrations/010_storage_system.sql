-- ============================================================
-- Migração 010: Sistema de Storage e Buckets
-- Para: RE-EDUCA Store - Sistema de Reeducação de Estilo de Vida
-- Data: 2025
-- ============================================================
--
-- Esta migração consolida:
-- - 08_supabase_storage_policies.sql
-- - 15_create_storage_buckets.sql
-- - 22_create_post_media_buckets.sql
-- - 23_create_avatars_bucket.sql
--
-- Cria funções auxiliares para gerenciamento de storage
-- NOTA: Buckets devem ser criados via Dashboard ou CLI
-- ============================================================

-- ============================================================
-- 1. FUNÇÕES PARA VÍDEOS
-- ============================================================

-- Função para obter URL pública de vídeo
CREATE OR REPLACE FUNCTION get_video_url(video_path TEXT)
RETURNS TEXT AS $$
DECLARE
    supabase_url TEXT;
BEGIN
    BEGIN
        supabase_url := current_setting('app.supabase_url', true);
    EXCEPTION
        WHEN OTHERS THEN
            -- Fallback: usar variável de ambiente ou configuração padrão
            -- NOTA: Em produção, configure app.supabase_url via ALTER DATABASE
            supabase_url := COALESCE(
                current_setting('app.supabase_url', true),
                'https://hgfrntbtqsarencqzsla.supabase.co'  -- Fallback temporário
            );
    END;
    RETURN supabase_url || '/storage/v1/object/public/videos/' || video_path;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se usuário pode acessar vídeo
CREATE OR REPLACE FUNCTION can_access_video(video_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    video_owner UUID;
BEGIN
    SELECT vu.user_id INTO video_owner
    FROM video_uploads vu
    WHERE vu.id = video_id;
    
    RETURN video_owner IS NULL OR video_owner = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter URL pública de vídeo (melhorada)
CREATE OR REPLACE FUNCTION get_video_public_url(bucket_name TEXT, file_path TEXT)
RETURNS TEXT AS $$
DECLARE
    supabase_url TEXT;
BEGIN
    BEGIN
        supabase_url := current_setting('app.supabase_url', true);
    EXCEPTION
        WHEN OTHERS THEN
            -- Fallback: usar variável de ambiente ou configuração padrão
            -- NOTA: Em produção, configure app.supabase_url via ALTER DATABASE
            supabase_url := COALESCE(
                current_setting('app.supabase_url', true),
                'https://hgfrntbtqsarencqzsla.supabase.co'  -- Fallback temporário
            );
    END;
    
    RETURN supabase_url || '/storage/v1/object/public/' || bucket_name || '/' || file_path;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter URL autenticada de vídeo
CREATE OR REPLACE FUNCTION get_video_authenticated_url(bucket_name TEXT, file_path TEXT)
RETURNS TEXT AS $$
DECLARE
    supabase_url TEXT;
BEGIN
    BEGIN
        supabase_url := current_setting('app.supabase_url', true);
    EXCEPTION
        WHEN OTHERS THEN
            -- Fallback: usar variável de ambiente ou configuração padrão
            -- NOTA: Em produção, configure app.supabase_url via ALTER DATABASE
            supabase_url := COALESCE(
                current_setting('app.supabase_url', true),
                'https://hgfrntbtqsarencqzsla.supabase.co'  -- Fallback temporário
            );
    END;
    
    RETURN supabase_url || '/storage/v1/object/' || bucket_name || '/' || file_path;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 2. FUNÇÕES PARA MÍDIA DE POSTS
-- ============================================================

-- Função para obter URL pública de mídia de post
CREATE OR REPLACE FUNCTION get_post_media_url(bucket_name TEXT, file_path TEXT)
RETURNS TEXT AS $$
DECLARE
    supabase_url TEXT;
BEGIN
    BEGIN
        supabase_url := current_setting('app.supabase_url', true);
    EXCEPTION
        WHEN OTHERS THEN
            -- Fallback: usar variável de ambiente ou configuração padrão
            -- NOTA: Em produção, configure app.supabase_url via ALTER DATABASE
            supabase_url := COALESCE(
                current_setting('app.supabase_url', true),
                'https://hgfrntbtqsarencqzsla.supabase.co'  -- Fallback temporário
            );
    END;

    RETURN supabase_url || '/storage/v1/object/public/' || bucket_name || '/' || file_path;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se URL é de imagem
CREATE OR REPLACE FUNCTION is_image_url(url TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN url ~* '\.(jpg|jpeg|png|webp|gif)(\?|$)' OR url LIKE '%post-images%';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Função para verificar se URL é de vídeo
CREATE OR REPLACE FUNCTION is_video_url(url TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN url ~* '\.(mp4|webm|ogg|mov|avi)(\?|$)' OR url LIKE '%post-videos%';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Função para extrair nome do bucket de uma URL de mídia
CREATE OR REPLACE FUNCTION extract_bucket_from_url(url TEXT)
RETURNS TEXT AS $$
BEGIN
    IF url LIKE '%post-images%' THEN
        RETURN 'post-images';
    ELSIF url LIKE '%post-videos%' THEN
        RETURN 'post-videos';
    ELSIF url LIKE '%avatars%' THEN
        RETURN 'avatars';
    ELSIF url LIKE '%videos%' THEN
        RETURN 'videos';
    ELSE
        RETURN NULL;
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================
-- 3. FUNÇÕES PARA AVATARS
-- ============================================================

-- Função para obter URL pública de avatar
CREATE OR REPLACE FUNCTION get_avatar_url(file_path TEXT)
RETURNS TEXT AS $$
DECLARE
    supabase_url TEXT;
BEGIN
    BEGIN
        supabase_url := current_setting('app.supabase_url', true);
    EXCEPTION
        WHEN OTHERS THEN
            -- Fallback: usar variável de ambiente ou configuração padrão
            -- NOTA: Em produção, configure app.supabase_url via ALTER DATABASE
            supabase_url := COALESCE(
                current_setting('app.supabase_url', true),
                'https://hgfrntbtqsarencqzsla.supabase.co'  -- Fallback temporário
            );
    END;

    RETURN supabase_url || '/storage/v1/object/public/avatars/' || file_path;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para validar URL de avatar
CREATE OR REPLACE FUNCTION is_valid_avatar_url(url TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN url LIKE '%avatars%' 
        AND (url ~* '\.(jpg|jpeg|png|webp|gif)(\?|$)' OR url ~* '/storage/v1/object/public/avatars/');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================
-- 4. TRIGGERS PARA ESTATÍSTICAS
-- ============================================================

-- Trigger para atualizar estatísticas quando vídeo é deletado
CREATE OR REPLACE FUNCTION update_video_stats_on_delete()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE users 
    SET video_count = COALESCE(video_count, 0) - 1
    WHERE id = OLD.user_id;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_video_stats_on_delete ON video_uploads;
CREATE TRIGGER trigger_update_video_stats_on_delete
    AFTER DELETE ON video_uploads
    FOR EACH ROW
    EXECUTE FUNCTION update_video_stats_on_delete();

-- Trigger para atualizar estatísticas quando vídeo é criado
CREATE OR REPLACE FUNCTION update_video_stats_on_insert()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE users 
    SET video_count = COALESCE(video_count, 0) + 1
    WHERE id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_video_stats_on_insert ON video_uploads;
CREATE TRIGGER trigger_update_video_stats_on_insert
    AFTER INSERT ON video_uploads
    FOR EACH ROW
    EXECUTE FUNCTION update_video_stats_on_insert();

-- ============================================================
-- 5. COMENTÁRIOS
-- ============================================================

COMMENT ON FUNCTION get_video_url(TEXT) IS 'Retorna URL pública de um vídeo no Supabase Storage';
COMMENT ON FUNCTION can_access_video(UUID, UUID) IS 'Verifica se usuário pode acessar um vídeo específico';
COMMENT ON FUNCTION get_video_public_url(TEXT, TEXT) IS 'Retorna URL pública de arquivo no storage';
COMMENT ON FUNCTION get_video_authenticated_url(TEXT, TEXT) IS 'Retorna URL autenticada de arquivo no storage';
COMMENT ON FUNCTION get_post_media_url(TEXT, TEXT) IS 'Retorna URL pública de mídia de post no Supabase Storage';
COMMENT ON FUNCTION is_image_url(TEXT) IS 'Verifica se uma URL é de uma imagem baseado na extensão ou bucket';
COMMENT ON FUNCTION is_video_url(TEXT) IS 'Verifica se uma URL é de um vídeo baseado na extensão ou bucket';
COMMENT ON FUNCTION extract_bucket_from_url(TEXT) IS 'Extrai o nome do bucket de uma URL de storage';
COMMENT ON FUNCTION get_avatar_url(TEXT) IS 'Retorna URL pública de avatar no Supabase Storage';
COMMENT ON FUNCTION is_valid_avatar_url(TEXT) IS 'Valida se uma URL é um avatar válido';
-- COMMENT ON FUNCTION check_bucket_exists(TEXT) IS 'Verifica se bucket existe (deve ser chamada via API)' -- Função não criada, apenas documentada;

-- ============================================================
-- 6. INSTRUÇÕES PARA CRIAR BUCKETS
-- ============================================================

-- NOTA IMPORTANTE:
-- Os buckets não podem ser criados diretamente via SQL.
-- Eles devem ser criados via Dashboard do Supabase ou API.
--
-- BUCKETS NECESSÁRIOS:
-- 1. 'videos' - Vídeos gerais (500MB, video/*)
-- 2. 'post-images' - Imagens de posts (10MB, image/*)
-- 3. 'post-videos' - Vídeos de posts (50MB, video/*)
-- 4. 'avatars' - Fotos de perfil (5MB, image/*)
--
-- Consulte a documentação completa em 22_create_post_media_buckets.sql
-- e 23_create_avatars_bucket.sql para instruções detalhadas.

SELECT 'Migração 010: Funções de storage criadas. Crie os buckets via Dashboard ou CLI.' as status;
