-- ============================================================
-- Migração 021: Sistema Completo de Reviews de Produtos
-- Para: RE-EDUCA Store - Sistema de Reeducação de Estilo de Vida
-- Data: 2025
-- ============================================================
--
-- Esta migração completa o sistema de reviews adicionando:
-- - Campos faltantes na tabela reviews
-- - Índices para performance
-- - Políticas RLS atualizadas
-- - Função para atualizar rating do produto automaticamente
-- ============================================================

-- ============================================================
-- 1. ADICIONAR CAMPOS FALTANTES NA TABELA REVIEWS
-- ============================================================

-- Título da avaliação
ALTER TABLE reviews 
ADD COLUMN IF NOT EXISTS title TEXT;

-- Pontos positivos
ALTER TABLE reviews 
ADD COLUMN IF NOT EXISTS pros TEXT;

-- Pontos negativos
ALTER TABLE reviews 
ADD COLUMN IF NOT EXISTS cons TEXT;

-- Se o usuário comprou o produto (verificado)
ALTER TABLE reviews 
ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;

-- Contador de "útil"
ALTER TABLE reviews 
ADD COLUMN IF NOT EXISTS helpful_count INTEGER DEFAULT 0;

-- Contador de "não útil"
ALTER TABLE reviews 
ADD COLUMN IF NOT EXISTS not_helpful_count INTEGER DEFAULT 0;

-- Imagens da avaliação (array de URLs)
ALTER TABLE reviews 
ADD COLUMN IF NOT EXISTS images TEXT[];

-- Data de atualização
ALTER TABLE reviews 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- ============================================================
-- 2. ÍNDICES PARA PERFORMANCE
-- ============================================================

-- Índice para buscar reviews por produto e ordenar por data
CREATE INDEX IF NOT EXISTS idx_reviews_product_created ON reviews(product_id, created_at DESC);

-- Índice para buscar reviews por usuário
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);

-- Índice para buscar reviews verificadas
CREATE INDEX IF NOT EXISTS idx_reviews_verified ON reviews(verified) WHERE verified = true;

-- Índice para buscar reviews por rating
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(product_id, rating);

-- Índice composto para ordenação por útil
CREATE INDEX IF NOT EXISTS idx_reviews_helpful ON reviews(product_id, helpful_count DESC);

-- ============================================================
-- 3. FUNÇÃO PARA ATUALIZAR RATING DO PRODUTO
-- ============================================================

-- Função que calcula e atualiza o rating médio e contagem de reviews do produto
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
    -- Calcular rating médio e contagem de reviews
    UPDATE products
    SET 
        rating = (
            SELECT COALESCE(AVG(rating), 0)
            FROM reviews
            WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
        ),
        reviews_count = (
            SELECT COUNT(*)
            FROM reviews
            WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
        ),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.product_id, OLD.product_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar rating quando review é criado
DROP TRIGGER IF EXISTS trigger_update_product_rating_insert ON reviews;
CREATE TRIGGER trigger_update_product_rating_insert
    AFTER INSERT ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_product_rating();

-- Trigger para atualizar rating quando review é atualizado
DROP TRIGGER IF EXISTS trigger_update_product_rating_update ON reviews;
CREATE TRIGGER trigger_update_product_rating_update
    AFTER UPDATE ON reviews
    FOR EACH ROW
    WHEN (OLD.rating IS DISTINCT FROM NEW.rating)
    EXECUTE FUNCTION update_product_rating();

-- Trigger para atualizar rating quando review é deletado
DROP TRIGGER IF EXISTS trigger_update_product_rating_delete ON reviews;
CREATE TRIGGER trigger_update_product_rating_delete
    AFTER DELETE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_product_rating();

-- ============================================================
-- 4. ATUALIZAR POLÍTICAS RLS
-- ============================================================

-- Garantir que RLS está habilitado
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver todas as reviews (público)
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON reviews;
CREATE POLICY "Reviews are viewable by everyone" ON reviews
    FOR SELECT
    USING (true);

-- Política: Usuários autenticados podem criar reviews
DROP POLICY IF EXISTS "Users can create reviews" ON reviews;
CREATE POLICY "Users can create reviews" ON reviews
    FOR INSERT
    WITH CHECK (auth.uid()::text = user_id::text);

-- Política: Usuários podem editar suas próprias reviews
DROP POLICY IF EXISTS "Users can update own reviews" ON reviews;
CREATE POLICY "Users can update own reviews" ON reviews
    FOR UPDATE
    USING (auth.uid()::text = user_id::text)
    WITH CHECK (auth.uid()::text = user_id::text);

-- Política: Usuários podem deletar suas próprias reviews
DROP POLICY IF EXISTS "Users can delete own reviews" ON reviews;
CREATE POLICY "Users can delete own reviews" ON reviews
    FOR DELETE
    USING (auth.uid()::text = user_id::text);

-- Política: Admins podem fazer tudo
DROP POLICY IF EXISTS "Admins can manage all reviews" ON reviews;
CREATE POLICY "Admins can manage all reviews" ON reviews
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id::text = auth.uid()::text 
            AND users.role = 'admin'
        )
    );

-- ============================================================
-- 5. TABELA PARA VOTOS DE "ÚTIL" (OPCIONAL - para evitar duplicação)
-- ============================================================

-- Tabela para rastrear quem votou em qual review como útil/não útil
CREATE TABLE IF NOT EXISTS review_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    is_helpful BOOLEAN NOT NULL, -- true = útil, false = não útil
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(review_id, user_id)
);

-- Índice para buscar votos por review
CREATE INDEX IF NOT EXISTS idx_review_votes_review ON review_votes(review_id);

-- Índice para buscar votos por usuário
CREATE INDEX IF NOT EXISTS idx_review_votes_user ON review_votes(user_id);

-- RLS para review_votes
ALTER TABLE review_votes ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver todos os votos
CREATE POLICY "Review votes are viewable by everyone" ON review_votes
    FOR SELECT
    USING (true);

-- Política: Usuários autenticados podem votar
CREATE POLICY "Users can vote on reviews" ON review_votes
    FOR INSERT
    WITH CHECK (auth.uid()::text = user_id::text);

-- Política: Usuários podem atualizar seus próprios votos
CREATE POLICY "Users can update own votes" ON review_votes
    FOR UPDATE
    USING (auth.uid()::text = user_id::text)
    WITH CHECK (auth.uid()::text = user_id::text);

-- Política: Usuários podem deletar seus próprios votos
CREATE POLICY "Users can delete own votes" ON review_votes
    FOR DELETE
    USING (auth.uid()::text = user_id::text);

-- ============================================================
-- 6. FUNÇÃO PARA ATUALIZAR CONTADORES DE "ÚTIL"
-- ============================================================

-- Função que atualiza helpful_count e not_helpful_count quando há voto
CREATE OR REPLACE FUNCTION update_review_helpful_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Atualizar contadores baseado nos votos
    UPDATE reviews
    SET 
        helpful_count = (
            SELECT COUNT(*)
            FROM review_votes
            WHERE review_id = COALESCE(NEW.review_id, OLD.review_id)
            AND is_helpful = true
        ),
        not_helpful_count = (
            SELECT COUNT(*)
            FROM review_votes
            WHERE review_id = COALESCE(NEW.review_id, OLD.review_id)
            AND is_helpful = false
        ),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.review_id, OLD.review_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar contadores quando voto é criado
DROP TRIGGER IF EXISTS trigger_update_review_helpful_insert ON review_votes;
CREATE TRIGGER trigger_update_review_helpful_insert
    AFTER INSERT ON review_votes
    FOR EACH ROW
    EXECUTE FUNCTION update_review_helpful_count();

-- Trigger para atualizar contadores quando voto é atualizado
DROP TRIGGER IF EXISTS trigger_update_review_helpful_update ON review_votes;
CREATE TRIGGER trigger_update_review_helpful_update
    AFTER UPDATE ON review_votes
    FOR EACH ROW
    WHEN (OLD.is_helpful IS DISTINCT FROM NEW.is_helpful)
    EXECUTE FUNCTION update_review_helpful_count();

-- Trigger para atualizar contadores quando voto é deletado
DROP TRIGGER IF EXISTS trigger_update_review_helpful_delete ON review_votes;
CREATE TRIGGER trigger_update_review_helpful_delete
    AFTER DELETE ON review_votes
    FOR EACH ROW
    EXECUTE FUNCTION update_review_helpful_count();
