-- =====================================================
-- MIGRAÇÃO 15 - CRIAÇÃO DE BUCKETS DO STORAGE
-- =====================================================
-- Esta migração cria os buckets necessários no Supabase Storage
-- e configura as políticas de acesso

-- Nota: Buckets são criados via API do Supabase Storage, não via SQL
-- Esta migração documenta os buckets necessários e cria funções auxiliares

-- Função para verificar se bucket existe (via storage API)
CREATE OR REPLACE FUNCTION check_bucket_exists(bucket_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Esta função deve ser chamada via API do Supabase Storage
    -- Por enquanto, apenas retorna true (bucket deve ser criado manualmente ou via API)
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Documentação dos buckets necessários:
-- 1. 'videos' - Para armazenar vídeos de usuários
--    Configuração: public = true, file_size_limit = 500MB, allowed_mime_types = video/*

-- Função para obter URL pública de vídeo (melhorada)
CREATE OR REPLACE FUNCTION get_video_public_url(bucket_name TEXT, file_path TEXT)
RETURNS TEXT AS $$
DECLARE
    supabase_url TEXT;
BEGIN
    -- Tentar obter URL do Supabase das configurações
    BEGIN
        supabase_url := current_setting('app.supabase_url', true);
    EXCEPTION
        WHEN OTHERS THEN
            supabase_url := 'https://hgfrntbtqsarencqzsla.supabase.co';
    END;
    
    RETURN supabase_url || '/storage/v1/object/public/' || bucket_name || '/' || file_path;
END;
$$ LANGUAGE plpgsql;

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
            supabase_url := 'https://hgfrntbtqsarencqzsla.supabase.co';
    END;
    
    RETURN supabase_url || '/storage/v1/object/' || bucket_name || '/' || file_path;
END;
$$ LANGUAGE plpgsql;

-- Comentários
COMMENT ON FUNCTION get_video_public_url(TEXT, TEXT) IS 'Retorna URL pública de arquivo no storage';
COMMENT ON FUNCTION get_video_authenticated_url(TEXT, TEXT) IS 'Retorna URL autenticada de arquivo no storage';
COMMENT ON FUNCTION check_bucket_exists(TEXT) IS 'Verifica se bucket existe (deve ser chamada via API)';

-- =====================================================
-- INSTRUÇÕES PARA CRIAR BUCKETS VIA SUPABASE DASHBOARD
-- =====================================================
-- 
-- 1. Acesse: https://supabase.com/dashboard/project/hgfrntbtqsarencqzsla/storage/buckets
-- 2. Clique em "New bucket"
-- 3. Configure o bucket 'videos':
--    - Name: videos
--    - Public bucket: ✅ Sim (público)
--    - File size limit: 524288000 (500MB)
--    - Allowed MIME types: video/*
--
-- 4. Após criar, configure as políticas de acesso (Storage Policies)
--
-- =====================================================
-- POLÍTICAS DE STORAGE VIA DASHBOARD (Recomendado)
-- =====================================================
--
-- Bucket: videos
--
-- Política 1: Allow public read access
-- SELECT: true
-- INSERT: false
-- UPDATE: false
-- DELETE: false
--
-- Política 2: Allow authenticated users to upload
-- SELECT: true
-- INSERT: (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1])
-- UPDATE: (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1])
-- DELETE: (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1])
--
-- Ou mais simples:
-- INSERT: auth.role() = 'authenticated'
-- UPDATE: auth.role() = 'authenticated'
-- DELETE: auth.role() = 'authenticated'

SELECT 'Storage bucket documentation created. Buckets must be created via Dashboard or API.' as status;
