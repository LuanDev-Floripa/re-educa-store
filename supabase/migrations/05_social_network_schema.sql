-- =====================================================
-- REDE SOCIAL RE-EDUCA - SCHEMA COMPLETO
-- =====================================================

-- 1. TABELA DE POSTS
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    post_type TEXT CHECK (post_type IN ('text', 'image', 'video', 'achievement', 'workout', 'meal', 'progress')) DEFAULT 'text',
    media_urls TEXT[], -- Array de URLs de mídia
    hashtags TEXT[], -- Array de hashtags
    mentions UUID[], -- Array de user_ids mencionados
    is_public BOOLEAN DEFAULT true,
    is_pinned BOOLEAN DEFAULT false,
    parent_post_id UUID REFERENCES posts(id) ON DELETE CASCADE, -- Para reposts
    location TEXT, -- Localização do post
    mood TEXT CHECK (mood IN ('happy', 'motivated', 'tired', 'excited', 'grateful', 'focused', 'relaxed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABELA DE COMENTÁRIOS
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE, -- Para respostas
    is_edited BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABELA DE REAÇÕES (Curtidas, etc.)
CREATE TABLE IF NOT EXISTS reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reaction_type TEXT CHECK (reaction_type IN ('like', 'love', 'laugh', 'wow', 'sad', 'angry', 'support', 'motivate')) DEFAULT 'like',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, user_id, reaction_type),
    UNIQUE(comment_id, user_id, reaction_type),
    CHECK ((post_id IS NOT NULL AND comment_id IS NULL) OR (post_id IS NULL AND comment_id IS NOT NULL))
);

-- 4. TABELA DE SEGUIDORES
CREATE TABLE IF NOT EXISTS follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(follower_id, following_id),
    CHECK (follower_id != following_id)
);

-- 5. TABELA DE NOTIFICAÇÕES
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    from_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('like', 'comment', 'follow', 'mention', 'reaction', 'achievement', 'challenge')) NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB, -- Dados adicionais (post_id, etc.)
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. TABELA DE COMPARTILHAMENTOS
CREATE TABLE IF NOT EXISTS shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    share_type TEXT CHECK (share_type IN ('repost', 'quote', 'story')) DEFAULT 'repost',
    comment TEXT, -- Para quote posts
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, user_id, share_type)
);

-- 7. TABELA DE HASHTAGS
CREATE TABLE IF NOT EXISTS hashtags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. TABELA DE RELACIONAMENTOS POST-HASHTAG
CREATE TABLE IF NOT EXISTS post_hashtags (
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    hashtag_id UUID NOT NULL REFERENCES hashtags(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, hashtag_id)
);

-- 9. TABELA DE SAVED POSTS (Salvos)
CREATE TABLE IF NOT EXISTS saved_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, post_id)
);

-- 10. TABELA DE BLOQUEIOS
CREATE TABLE IF NOT EXISTS blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blocker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blocked_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(blocker_id, blocked_id),
    CHECK (blocker_id != blocked_id)
);

-- 11. TABELA DE GRUPOS/COMUNIDADES
CREATE TABLE IF NOT EXISTS groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_public BOOLEAN DEFAULT true,
    member_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. TABELA DE MEMBROS DE GRUPOS
CREATE TABLE IF NOT EXISTS group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('admin', 'moderator', 'member')) DEFAULT 'member',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

-- 13. TABELA DE POSTS DE GRUPOS
CREATE TABLE IF NOT EXISTS group_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(group_id, post_id)
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para posts
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_type ON posts(post_type);
CREATE INDEX IF NOT EXISTS idx_posts_public ON posts(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_posts_hashtags ON posts USING GIN(hashtags);

-- Índices para comentários
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- Índices para reações
CREATE INDEX IF NOT EXISTS idx_reactions_post_id ON reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_reactions_comment_id ON reactions(comment_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user_id ON reactions(user_id);

-- Índices para follows
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);

-- Índices para notificações
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Índices para shares
CREATE INDEX IF NOT EXISTS idx_shares_post_id ON shares(post_id);
CREATE INDEX IF NOT EXISTS idx_shares_user_id ON shares(user_id);

-- =====================================================
-- FUNÇÕES E TRIGGERS
-- =====================================================

-- Função para atualizar contadores
CREATE OR REPLACE FUNCTION update_post_counters()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Atualizar contador de reações
        IF NEW.post_id IS NOT NULL THEN
            UPDATE posts 
            SET updated_at = NOW() 
            WHERE id = NEW.post_id;
        END IF;
        
        -- Atualizar contador de comentários
        IF NEW.comment_id IS NOT NULL THEN
            UPDATE posts 
            SET updated_at = NOW() 
            WHERE id = (SELECT post_id FROM comments WHERE id = NEW.comment_id);
        END IF;
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Atualizar contador de reações
        IF OLD.post_id IS NOT NULL THEN
            UPDATE posts 
            SET updated_at = NOW() 
            WHERE id = OLD.post_id;
        END IF;
        
        -- Atualizar contador de comentários
        IF OLD.comment_id IS NOT NULL THEN
            UPDATE posts 
            SET updated_at = NOW() 
            WHERE id = (SELECT post_id FROM comments WHERE id = OLD.comment_id);
        END IF;
        
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar contadores
CREATE TRIGGER trigger_update_post_counters_reactions
    AFTER INSERT OR DELETE ON reactions
    FOR EACH ROW EXECUTE FUNCTION update_post_counters();

-- Função para criar notificações automáticas
CREATE OR REPLACE FUNCTION create_notification()
RETURNS TRIGGER AS $$
DECLARE
    post_owner_id UUID;
    comment_owner_id UUID;
BEGIN
    -- Notificação para curtidas em posts
    IF TG_TABLE_NAME = 'reactions' AND NEW.post_id IS NOT NULL THEN
        SELECT user_id INTO post_owner_id FROM posts WHERE id = NEW.post_id;
        IF post_owner_id != NEW.user_id THEN
            INSERT INTO notifications (user_id, from_user_id, type, title, message, data)
            VALUES (post_owner_id, NEW.user_id, 'like', 'Nova curtida!', 'Alguém curtiu seu post', 
                   json_build_object('post_id', NEW.post_id, 'reaction_type', NEW.reaction_type));
        END IF;
    END IF;
    
    -- Notificação para curtidas em comentários
    IF TG_TABLE_NAME = 'reactions' AND NEW.comment_id IS NOT NULL THEN
        SELECT user_id INTO comment_owner_id FROM comments WHERE id = NEW.comment_id;
        IF comment_owner_id != NEW.user_id THEN
            INSERT INTO notifications (user_id, from_user_id, type, title, message, data)
            VALUES (comment_owner_id, NEW.user_id, 'reaction', 'Nova reação!', 'Alguém reagiu ao seu comentário', 
                   json_build_object('comment_id', NEW.comment_id, 'reaction_type', NEW.reaction_type));
        END IF;
    END IF;
    
    -- Notificação para comentários
    IF TG_TABLE_NAME = 'comments' THEN
        SELECT user_id INTO post_owner_id FROM posts WHERE id = NEW.post_id;
        IF post_owner_id != NEW.user_id THEN
            INSERT INTO notifications (user_id, from_user_id, type, title, message, data)
            VALUES (post_owner_id, NEW.user_id, 'comment', 'Novo comentário!', 'Alguém comentou no seu post', 
                   json_build_object('post_id', NEW.post_id, 'comment_id', NEW.id));
        END IF;
    END IF;
    
    -- Notificação para novos seguidores
    IF TG_TABLE_NAME = 'follows' THEN
        INSERT INTO notifications (user_id, from_user_id, type, title, message, data)
        VALUES (NEW.following_id, NEW.follower_id, 'follow', 'Novo seguidor!', 'Alguém começou a te seguir', 
               json_build_object('follower_id', NEW.follower_id));
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para notificações
CREATE TRIGGER trigger_notifications_reactions
    AFTER INSERT ON reactions
    FOR EACH ROW EXECUTE FUNCTION create_notification();

CREATE TRIGGER trigger_notifications_comments
    AFTER INSERT ON comments
    FOR EACH ROW EXECUTE FUNCTION create_notification();

CREATE TRIGGER trigger_notifications_follows
    AFTER INSERT ON follows
    FOR EACH ROW EXECUTE FUNCTION create_notification();

-- =====================================================
-- RLS (ROW LEVEL SECURITY)
-- =====================================================

-- Habilitar RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;

-- Políticas para posts
CREATE POLICY "Posts são visíveis para todos" ON posts
    FOR SELECT USING (is_public = true);

CREATE POLICY "Usuários podem ver seus próprios posts" ON posts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar posts" ON posts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem editar seus posts" ON posts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus posts" ON posts
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para comentários
CREATE POLICY "Comentários são visíveis para todos" ON comments
    FOR SELECT USING (true);

CREATE POLICY "Usuários podem criar comentários" ON comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem editar seus comentários" ON comments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus comentários" ON comments
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para reações
CREATE POLICY "Reações são visíveis para todos" ON reactions
    FOR SELECT USING (true);

CREATE POLICY "Usuários podem reagir" ON reactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem remover suas reações" ON reactions
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para follows
CREATE POLICY "Follows são visíveis para todos" ON follows
    FOR SELECT USING (true);

CREATE POLICY "Usuários podem seguir outros" ON follows
    FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Usuários podem parar de seguir" ON follows
    FOR DELETE USING (auth.uid() = follower_id);

-- Políticas para notificações
CREATE POLICY "Usuários podem ver suas notificações" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Sistema pode criar notificações" ON notifications
    FOR INSERT WITH CHECK (true);

-- Políticas para shares
CREATE POLICY "Shares são visíveis para todos" ON shares
    FOR SELECT USING (true);

CREATE POLICY "Usuários podem compartilhar" ON shares
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas para saved_posts
CREATE POLICY "Usuários podem ver seus posts salvos" ON saved_posts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem salvar posts" ON saved_posts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem remover posts salvos" ON saved_posts
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- DADOS INICIAIS
-- =====================================================

-- Inserir hashtags populares
INSERT INTO hashtags (name, usage_count) VALUES 
    ('#saude', 0),
    ('#fitness', 0),
    ('#motivacao', 0),
    ('#progresso', 0),
    ('#treino', 0),
    ('#alimentacao', 0),
    ('#bemestar', 0),
    ('#metas', 0),
    ('#reduca', 0),
    ('#comunidade', 0)
ON CONFLICT (name) DO NOTHING;