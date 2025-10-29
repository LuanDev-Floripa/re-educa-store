-- Adiciona campos title e description à tabela video_uploads
-- Para permitir metadados adicionais nos vídeos

ALTER TABLE video_uploads 
ADD COLUMN IF NOT EXISTS title VARCHAR(255),
ADD COLUMN IF NOT EXISTS description TEXT;

-- Comentários
COMMENT ON COLUMN video_uploads.title IS 'Título do vídeo fornecido pelo usuário';
COMMENT ON COLUMN video_uploads.description IS 'Descrição do vídeo fornecida pelo usuário';
