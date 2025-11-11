-- ============================================================
-- Migração 004: Rede Social Completa
-- Para: RE-EDUCA Store - Sistema de Reeducação de Estilo de Vida
-- Data: 2025
-- ============================================================
--
-- Esta migração consolida:
-- - 05_social_network_schema.sql
-- - 26_create_groups.sql (groups consolidado aqui)
-- - 25_create_direct_messages.sql (direct_messages consolidado aqui)
--
-- Cria toda a estrutura da rede social: posts, comentários, reações,
-- follows, notificações, hashtags, grupos, mensagens diretas
-- ============================================================

-- ============================================================
-- 1. TABELAS DE REDE SOCIAL (POSTS, COMENTÁRIOS, REAÇÕES, etc.)
-- ============================================================

-- TABELA DE POSTS
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

-- TABELA DE COMENTÁRIOS
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

-- TABELA DE REAÇÕES (Curtidas, etc.)
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

-- TABELA DE SEGUIDORES
CREATE TABLE IF NOT EXISTS follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(follower_id, following_id),
    CHECK (follower_id != following_id)
);

-- TABELA DE NOTIFICAÇÕES
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

-- TABELA DE COMPARTILHAMENTOS
CREATE TABLE IF NOT EXISTS shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    share_type TEXT CHECK (share_type IN ('repost', 'quote', 'story')) DEFAULT 'repost',
    comment TEXT, -- Para quote posts
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, user_id, share_type)
);

-- TABELA DE HASHTAGS
CREATE TABLE IF NOT EXISTS hashtags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABELA DE RELACIONAMENTOS POST-HASHTAG
CREATE TABLE IF NOT EXISTS post_hashtags (
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    hashtag_id UUID NOT NULL REFERENCES hashtags(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, hashtag_id)
);

-- TABELA DE SAVED POSTS (Salvos)
CREATE TABLE IF NOT EXISTS saved_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, post_id)
);

-- TABELA DE BLOQUEIOS
CREATE TABLE IF NOT EXISTS blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blocker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blocked_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(blocker_id, blocked_id),
    CHECK (blocker_id != blocked_id)
);

-- ============================================================
-- 2. TABELAS DE GRUPOS (consolidado de 26_create_groups.sql)
-- ============================================================

-- Tabela de Grupos (usando creator_id, não owner_id)
-- Adicionar compatibilidade: migrar de owner_id para creator_id e adicionar colunas faltantes
DO $$
BEGIN
    -- Adicionar creator_id se não existir
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'groups' AND column_name = 'owner_id'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'groups' AND column_name = 'creator_id'
    ) THEN
        ALTER TABLE groups ADD COLUMN creator_id UUID;
        UPDATE groups SET creator_id = owner_id WHERE creator_id IS NULL;
        ALTER TABLE groups ALTER COLUMN creator_id SET NOT NULL;
        -- Alterar FK para usar users(id) ao invés de auth.users(id)
        ALTER TABLE groups DROP CONSTRAINT IF EXISTS groups_owner_id_fkey;
        ALTER TABLE groups ADD CONSTRAINT groups_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
    
    -- Adicionar colunas faltantes
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'groups' AND column_name = 'privacy') THEN
        ALTER TABLE groups ADD COLUMN privacy TEXT CHECK (privacy IN ('public', 'private', 'closed')) DEFAULT 'public';
        -- Migrar is_public para privacy
        UPDATE groups SET privacy = CASE WHEN is_public THEN 'public' ELSE 'private' END WHERE privacy IS NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'groups' AND column_name = 'avatar_url') THEN
        ALTER TABLE groups ADD COLUMN avatar_url TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'groups' AND column_name = 'cover_url') THEN
        ALTER TABLE groups ADD COLUMN cover_url TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'groups' AND column_name = 'members_count') THEN
        ALTER TABLE groups ADD COLUMN members_count INTEGER DEFAULT 0;
        -- Migrar member_count para members_count
        UPDATE groups SET members_count = COALESCE(member_count, 0) WHERE members_count IS NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'groups' AND column_name = 'posts_count') THEN
        ALTER TABLE groups ADD COLUMN posts_count INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'groups' AND column_name = 'rules') THEN
        ALTER TABLE groups ADD COLUMN rules TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'groups' AND column_name = 'tags') THEN
        ALTER TABLE groups ADD COLUMN tags TEXT[];
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'groups' AND column_name = 'category') THEN
        ALTER TABLE groups ADD COLUMN category TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'groups' AND column_name = 'is_active') THEN
        ALTER TABLE groups ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    privacy TEXT CHECK (privacy IN ('public', 'private', 'closed')) DEFAULT 'public',
    category TEXT,
    avatar_url TEXT,
    cover_url TEXT,
    members_count INTEGER DEFAULT 0,
    posts_count INTEGER DEFAULT 0,
    rules TEXT,
    tags TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Membros de Grupos
CREATE TABLE IF NOT EXISTS group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('member', 'admin', 'moderator')) DEFAULT 'member',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

-- Tabela de Posts de Grupos
CREATE TABLE IF NOT EXISTS group_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(group_id, post_id)
);

-- ============================================================
-- 3. TABELA DE MENSAGENS DIRETAS (consolidado de 25_create_direct_messages.sql)
-- ============================================================

CREATE TABLE IF NOT EXISTS direct_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraint: não pode enviar mensagem para si mesmo
    CONSTRAINT check_sender_recipient CHECK (sender_id != recipient_id)
);

-- ============================================================
-- 4. ÍNDICES PARA PERFORMANCE
-- ============================================================

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

-- Índices para grupos
CREATE INDEX IF NOT EXISTS idx_groups_creator ON groups(creator_id);
CREATE INDEX IF NOT EXISTS idx_groups_privacy ON groups(privacy);
CREATE INDEX IF NOT EXISTS idx_groups_category ON groups(category);
CREATE INDEX IF NOT EXISTS idx_groups_active ON groups(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_role ON group_members(role);
CREATE INDEX IF NOT EXISTS idx_group_members_user_group ON group_members(user_id, group_id);
CREATE INDEX IF NOT EXISTS idx_group_posts_group_id ON group_posts(group_id);
CREATE INDEX IF NOT EXISTS idx_group_posts_post_id ON group_posts(post_id);
CREATE INDEX IF NOT EXISTS idx_group_posts_group_post ON group_posts(group_id, post_id);

-- Índices para mensagens diretas
CREATE INDEX IF NOT EXISTS idx_direct_messages_sender ON direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_recipient ON direct_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_created ON direct_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_direct_messages_conversation ON direct_messages(sender_id, recipient_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_unread ON direct_messages(recipient_id, read_at) WHERE read_at IS NULL;

-- Índices para blocks, hashtags, post_hashtags, saved_posts
CREATE INDEX IF NOT EXISTS idx_blocks_blocker_id ON blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked_id ON blocks(blocked_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocker_blocked ON blocks(blocker_id, blocked_id);
CREATE INDEX IF NOT EXISTS idx_hashtags_name ON hashtags(name);
CREATE INDEX IF NOT EXISTS idx_hashtags_usage_count ON hashtags(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_post_hashtags_post_id ON post_hashtags(post_id);
CREATE INDEX IF NOT EXISTS idx_post_hashtags_hashtag_id ON post_hashtags(hashtag_id);
CREATE INDEX IF NOT EXISTS idx_post_hashtags_post_hashtag ON post_hashtags(post_id, hashtag_id);
CREATE INDEX IF NOT EXISTS idx_saved_posts_user_id ON saved_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_posts_post_id ON saved_posts(post_id);
CREATE INDEX IF NOT EXISTS idx_saved_posts_user_post ON saved_posts(user_id, post_id);

-- ============================================================
-- 5. FUNÇÕES E TRIGGERS
-- ============================================================

-- Função para atualizar contadores
CREATE OR REPLACE FUNCTION update_post_counters()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.post_id IS NOT NULL THEN
            UPDATE posts SET updated_at = NOW() WHERE id = NEW.post_id;
        END IF;
        
        IF NEW.comment_id IS NOT NULL THEN
            UPDATE posts SET updated_at = NOW() 
            WHERE id = (SELECT post_id FROM comments WHERE id = NEW.comment_id);
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.post_id IS NOT NULL THEN
            UPDATE posts SET updated_at = NOW() WHERE id = OLD.post_id;
        END IF;
        
        IF OLD.comment_id IS NOT NULL THEN
            UPDATE posts SET updated_at = NOW() 
            WHERE id = (SELECT post_id FROM comments WHERE id = OLD.comment_id);
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar contadores
DROP TRIGGER IF EXISTS trigger_update_post_counters_reactions ON reactions;
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
DROP TRIGGER IF EXISTS trigger_notifications_reactions ON reactions;
CREATE TRIGGER trigger_notifications_reactions
    AFTER INSERT ON reactions
    FOR EACH ROW EXECUTE FUNCTION create_notification();

DROP TRIGGER IF EXISTS trigger_notifications_comments ON comments;
CREATE TRIGGER trigger_notifications_comments
    AFTER INSERT ON comments
    FOR EACH ROW EXECUTE FUNCTION create_notification();

DROP TRIGGER IF EXISTS trigger_notifications_follows ON follows;
CREATE TRIGGER trigger_notifications_follows
    AFTER INSERT ON follows
    FOR EACH ROW EXECUTE FUNCTION create_notification();

-- Trigger para atualizar updated_at em grupos
CREATE OR REPLACE FUNCTION update_groups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_groups_updated_at ON groups;
CREATE TRIGGER trigger_update_groups_updated_at
    BEFORE UPDATE ON groups
    FOR EACH ROW
    EXECUTE FUNCTION update_groups_updated_at();

-- Trigger para atualizar members_count
CREATE OR REPLACE FUNCTION update_group_members_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE groups SET members_count = members_count + 1 WHERE id = NEW.group_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE groups SET members_count = GREATEST(members_count - 1, 0) WHERE id = OLD.group_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_group_members_count ON group_members;
CREATE TRIGGER trigger_update_group_members_count
    AFTER INSERT OR DELETE ON group_members
    FOR EACH ROW
    EXECUTE FUNCTION update_group_members_count();

-- Trigger para atualizar updated_at em direct_messages
CREATE OR REPLACE FUNCTION update_direct_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_direct_messages_updated_at ON direct_messages;
CREATE TRIGGER trigger_update_direct_messages_updated_at
    BEFORE UPDATE ON direct_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_direct_messages_updated_at();

-- ============================================================
-- 6. RLS (ROW LEVEL SECURITY)
-- ============================================================

-- Habilitar RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

-- Políticas para posts
DROP POLICY IF EXISTS "Posts são visíveis para todos" ON posts;
CREATE POLICY "Posts são visíveis para todos" ON posts
    FOR SELECT USING (is_public = true);

DROP POLICY IF EXISTS "Usuários podem ver seus próprios posts" ON posts;
CREATE POLICY "Usuários podem ver seus próprios posts" ON posts
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem criar posts" ON posts;
CREATE POLICY "Usuários podem criar posts" ON posts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem editar seus posts" ON posts;
CREATE POLICY "Usuários podem editar seus posts" ON posts
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem deletar seus posts" ON posts;
CREATE POLICY "Usuários podem deletar seus posts" ON posts
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para comentários
DROP POLICY IF EXISTS "Comentários são visíveis para todos" ON comments;
CREATE POLICY "Comentários são visíveis para todos" ON comments
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Usuários podem criar comentários" ON comments;
CREATE POLICY "Usuários podem criar comentários" ON comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem editar seus comentários" ON comments;
CREATE POLICY "Usuários podem editar seus comentários" ON comments
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem deletar seus comentários" ON comments;
CREATE POLICY "Usuários podem deletar seus comentários" ON comments
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para reações
DROP POLICY IF EXISTS "Reações são visíveis para todos" ON reactions;
CREATE POLICY "Reações são visíveis para todos" ON reactions
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Usuários podem reagir" ON reactions;
CREATE POLICY "Usuários podem reagir" ON reactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem remover suas reações" ON reactions;
CREATE POLICY "Usuários podem remover suas reações" ON reactions
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para follows
DROP POLICY IF EXISTS "Follows são visíveis para todos" ON follows;
CREATE POLICY "Follows são visíveis para todos" ON follows
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Usuários podem seguir outros" ON follows;
CREATE POLICY "Usuários podem seguir outros" ON follows
    FOR INSERT WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "Usuários podem parar de seguir" ON follows;
CREATE POLICY "Usuários podem parar de seguir" ON follows
    FOR DELETE USING (auth.uid() = follower_id);

-- Políticas para notificações
DROP POLICY IF EXISTS "Usuários podem ver suas notificações" ON notifications;
CREATE POLICY "Usuários podem ver suas notificações" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Sistema pode criar notificações" ON notifications;
CREATE POLICY "Sistema pode criar notificações" ON notifications
    FOR INSERT WITH CHECK (true);

-- Políticas para shares
DROP POLICY IF EXISTS "Shares são visíveis para todos" ON shares;
CREATE POLICY "Shares são visíveis para todos" ON shares
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Usuários podem compartilhar" ON shares;
CREATE POLICY "Usuários podem compartilhar" ON shares
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas para saved_posts
DROP POLICY IF EXISTS "Usuários podem ver seus posts salvos" ON saved_posts;
CREATE POLICY "Usuários podem ver seus posts salvos" ON saved_posts
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem salvar posts" ON saved_posts;
CREATE POLICY "Usuários podem salvar posts" ON saved_posts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem remover posts salvos" ON saved_posts;
CREATE POLICY "Usuários podem remover posts salvos" ON saved_posts
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para blocks (já terá RLS em 016_final_fixes, mas garantimos aqui)
DROP POLICY IF EXISTS "Users can view blocks they are involved in" ON blocks;
CREATE POLICY "Users can view blocks they are involved in" ON blocks
    FOR SELECT USING (
        auth.uid()::text = blocker_id::text 
        OR auth.uid()::text = blocked_id::text
    );

DROP POLICY IF EXISTS "Users can create blocks" ON blocks;
CREATE POLICY "Users can create blocks" ON blocks
    FOR INSERT WITH CHECK (auth.uid()::text = blocker_id::text);

DROP POLICY IF EXISTS "Users can delete their own blocks" ON blocks;
CREATE POLICY "Users can delete their own blocks" ON blocks
    FOR DELETE USING (auth.uid()::text = blocker_id::text);

-- Políticas para hashtags
DROP POLICY IF EXISTS "Hashtags are viewable by everyone" ON hashtags;
CREATE POLICY "Hashtags are viewable by everyone" ON hashtags
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "System can manage hashtags" ON hashtags;
CREATE POLICY "System can manage hashtags" ON hashtags
    FOR ALL USING (true); -- Sistema pode gerenciar (via triggers)

-- Políticas para post_hashtags
DROP POLICY IF EXISTS "Post hashtags are viewable by everyone" ON post_hashtags;
CREATE POLICY "Post hashtags are viewable by everyone" ON post_hashtags
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage hashtags in own posts" ON post_hashtags;
CREATE POLICY "Users can manage hashtags in own posts" ON post_hashtags
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM posts 
            WHERE posts.id = post_hashtags.post_id 
            AND posts.user_id::text = auth.uid()::text
        )
    );

-- Políticas para grupos
DROP POLICY IF EXISTS "Users can view public groups" ON groups;
CREATE POLICY "Users can view public groups" ON groups
    FOR SELECT
    USING (
        privacy = 'public' 
        OR creator_id::text = auth.uid()::text
        OR EXISTS (
            SELECT 1 FROM group_members 
            WHERE group_members.group_id = groups.id 
            AND group_members.user_id::text = auth.uid()::text
        )
    );

DROP POLICY IF EXISTS "Users can create groups" ON groups;
CREATE POLICY "Users can create groups" ON groups
    FOR INSERT
    WITH CHECK (auth.uid()::text = creator_id::text);

DROP POLICY IF EXISTS "Creators can update groups" ON groups;
CREATE POLICY "Creators can update groups" ON groups
    FOR UPDATE
    USING (
        creator_id::text = auth.uid()::text
        OR EXISTS (
            SELECT 1 FROM group_members 
            WHERE group_members.group_id = groups.id 
            AND group_members.user_id::text = auth.uid()::text
            AND group_members.role IN ('admin', 'moderator')
        )
    );

-- Políticas para group_members
DROP POLICY IF EXISTS "Users can view members of accessible groups" ON group_members;
CREATE POLICY "Users can view members of accessible groups" ON group_members
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM groups 
            WHERE groups.id = group_members.group_id 
            AND (
                groups.privacy = 'public'
                OR groups.creator_id::text = auth.uid()::text
                OR EXISTS (
                    SELECT 1 FROM group_members gm
                    WHERE gm.group_id = groups.id
                    AND gm.user_id::text = auth.uid()::text
                )
            )
        )
    );

DROP POLICY IF EXISTS "Users can join public groups" ON group_members;
CREATE POLICY "Users can join public groups" ON group_members
    FOR INSERT
    WITH CHECK (
        auth.uid()::text = user_id::text
        AND EXISTS (
            SELECT 1 FROM groups
            WHERE groups.id = group_members.group_id
            AND groups.privacy = 'public'
            AND groups.is_active = true
        )
    );

DROP POLICY IF EXISTS "Users can leave groups" ON group_members;
CREATE POLICY "Users can leave groups" ON group_members
    FOR DELETE
    USING (
        auth.uid()::text = user_id::text
        AND NOT EXISTS (
            SELECT 1 FROM groups
            WHERE groups.id = group_members.group_id
            AND groups.creator_id::text = auth.uid()::text
        )
    );

DROP POLICY IF EXISTS "Admins can remove members" ON group_members;
CREATE POLICY "Admins can remove members" ON group_members
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM group_members gm
            WHERE gm.group_id = group_members.group_id
            AND gm.user_id::text = auth.uid()::text
            AND gm.role IN ('admin', 'moderator')
        )
    );

-- Políticas para group_posts (já terá RLS em 016_final_fixes, mas garantimos aqui)
DROP POLICY IF EXISTS "Users can view posts in accessible groups" ON group_posts;
CREATE POLICY "Users can view posts in accessible groups" ON group_posts
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM groups 
            WHERE groups.id = group_posts.group_id 
            AND (
                groups.privacy = 'public'
                OR groups.creator_id::text = auth.uid()::text
                OR EXISTS (
                    SELECT 1 FROM group_members gm
                    WHERE gm.group_id = groups.id
                    AND gm.user_id::text = auth.uid()::text
                )
            )
        )
    );

DROP POLICY IF EXISTS "Users can add posts to groups they belong to" ON group_posts;
CREATE POLICY "Users can add posts to groups they belong to" ON group_posts
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM groups g
            JOIN group_members gm ON g.id = gm.group_id
            WHERE g.id = group_posts.group_id
            AND gm.user_id::text = auth.uid()::text
        )
        AND EXISTS (
            SELECT 1 FROM posts p
            WHERE p.id = group_posts.post_id
            AND p.user_id::text = auth.uid()::text
        )
    );

-- Políticas para direct_messages
DROP POLICY IF EXISTS "Users can view own messages" ON direct_messages;
CREATE POLICY "Users can view own messages" ON direct_messages
    FOR SELECT
    USING (
        auth.uid()::text = sender_id::text 
        OR auth.uid()::text = recipient_id::text
    );

DROP POLICY IF EXISTS "Users can send messages" ON direct_messages;
CREATE POLICY "Users can send messages" ON direct_messages
    FOR INSERT
    WITH CHECK (auth.uid()::text = sender_id::text);

DROP POLICY IF EXISTS "Users can update own sent messages" ON direct_messages;
CREATE POLICY "Users can update own sent messages" ON direct_messages
    FOR UPDATE
    USING (auth.uid()::text = sender_id::text);

DROP POLICY IF EXISTS "Recipients can mark messages as read" ON direct_messages;
CREATE POLICY "Recipients can mark messages as read" ON direct_messages
    FOR UPDATE
    USING (auth.uid()::text = recipient_id::text)
    WITH CHECK (auth.uid()::text = recipient_id::text);

-- ============================================================
-- 7. DADOS INICIAIS
-- ============================================================

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

-- ============================================================
-- 8. COMENTÁRIOS
-- ============================================================

COMMENT ON TABLE posts IS 'Posts da rede social';
COMMENT ON TABLE comments IS 'Comentários em posts';
COMMENT ON TABLE reactions IS 'Reações (curtidas, etc.) em posts e comentários';
COMMENT ON TABLE follows IS 'Relações de seguidores';
COMMENT ON TABLE notifications IS 'Notificações dos usuários';
COMMENT ON TABLE groups IS 'Grupos e comunidades da rede social';
COMMENT ON TABLE group_members IS 'Membros dos grupos';
COMMENT ON TABLE direct_messages IS 'Mensagens diretas entre usuários (1:1)';

SELECT 'Migração 004: Rede social completa criada com sucesso!' as status;
