-- ============================================================
-- Migração 024: Suporte a Anexos em Mensagens Diretas
-- Para: RE-EDUCA Store - Sistema de Reeducação de Estilo de Vida
-- Data: 2025
-- ============================================================
--
-- Adiciona suporte para anexos (arquivos, imagens, vídeos) em mensagens diretas
-- ============================================================

-- Adicionar coluna para URL do anexo
ALTER TABLE direct_messages 
ADD COLUMN IF NOT EXISTS attachment_url TEXT;

-- Adicionar coluna para tipo de anexo
ALTER TABLE direct_messages 
ADD COLUMN IF NOT EXISTS attachment_type VARCHAR(50) 
CHECK (attachment_type IS NULL OR attachment_type IN ('image', 'video', 'document', 'audio'));

-- Adicionar coluna para nome do arquivo
ALTER TABLE direct_messages 
ADD COLUMN IF NOT EXISTS attachment_filename VARCHAR(255);

-- Adicionar coluna para tamanho do arquivo (em bytes)
ALTER TABLE direct_messages 
ADD COLUMN IF NOT EXISTS attachment_size INTEGER;

-- Índice para busca por mensagens com anexos
CREATE INDEX IF NOT EXISTS idx_direct_messages_attachments 
ON direct_messages(attachment_url) 
WHERE attachment_url IS NOT NULL;

-- Comentário
COMMENT ON COLUMN direct_messages.attachment_url IS 'URL do anexo armazenado no Supabase Storage';
COMMENT ON COLUMN direct_messages.attachment_type IS 'Tipo do anexo: image, video, document, audio';
COMMENT ON COLUMN direct_messages.attachment_filename IS 'Nome original do arquivo anexado';
COMMENT ON COLUMN direct_messages.attachment_size IS 'Tamanho do arquivo em bytes';
