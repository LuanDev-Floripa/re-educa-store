-- Migration: Support System (Tickets e FAQs)
-- Data: 2025-01-28
-- Descrição: Cria tabelas para sistema de suporte (tickets e FAQs)

-- Tabela de Tickets de Suporte
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'general',
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'pending', 'closed', 'resolved')),
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    
    CONSTRAINT valid_priority CHECK (priority IN ('low', 'medium', 'high')),
    CONSTRAINT valid_status CHECK (status IN ('open', 'pending', 'closed', 'resolved'))
);

-- Tabela de Mensagens dos Tickets
CREATE TABLE IF NOT EXISTS support_ticket_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    message TEXT NOT NULL,
    is_from_user BOOLEAN DEFAULT true,
    is_internal BOOLEAN DEFAULT false, -- Mensagens internas da equipe
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_user_or_system CHECK (user_id IS NOT NULL OR is_internal = true)
);

-- Tabela de FAQs
CREATE TABLE IF NOT EXISTS support_faqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'general',
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    views_count INTEGER DEFAULT 0,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_category ON support_tickets(category);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_support_ticket_messages_ticket_id ON support_ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_ticket_messages_created_at ON support_ticket_messages(created_at);

CREATE INDEX IF NOT EXISTS idx_support_faqs_category ON support_faqs(category);
CREATE INDEX IF NOT EXISTS idx_support_faqs_is_active ON support_faqs(is_active);
CREATE INDEX IF NOT EXISTS idx_support_faqs_order_index ON support_faqs(order_index);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_support_tickets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_support_tickets_updated_at
    BEFORE UPDATE ON support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_support_tickets_updated_at();

CREATE TRIGGER trigger_update_support_faqs_updated_at
    BEFORE UPDATE ON support_faqs
    FOR EACH ROW
    EXECUTE FUNCTION update_support_tickets_updated_at();

-- RLS (Row Level Security)
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_faqs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para support_tickets
-- Usuários podem ver apenas seus próprios tickets
CREATE POLICY "Users can view own tickets"
    ON support_tickets FOR SELECT
    USING (auth.uid() = user_id);

-- Usuários podem criar seus próprios tickets
CREATE POLICY "Users can create own tickets"
    ON support_tickets FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar seus próprios tickets (apenas status para closed)
CREATE POLICY "Users can update own tickets"
    ON support_tickets FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Admins podem ver todos os tickets
CREATE POLICY "Admins can view all tickets"
    ON support_tickets FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Admins podem atualizar todos os tickets
CREATE POLICY "Admins can update all tickets"
    ON support_tickets FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Políticas RLS para support_ticket_messages
-- Usuários podem ver mensagens de seus próprios tickets
CREATE POLICY "Users can view messages of own tickets"
    ON support_ticket_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM support_tickets
            WHERE support_tickets.id = support_ticket_messages.ticket_id
            AND support_tickets.user_id = auth.uid()
        )
    );

-- Usuários podem criar mensagens em seus próprios tickets
CREATE POLICY "Users can create messages in own tickets"
    ON support_ticket_messages FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM support_tickets
            WHERE support_tickets.id = support_ticket_messages.ticket_id
            AND support_tickets.user_id = auth.uid()
        )
        AND user_id = auth.uid()
    );

-- Admins podem ver todas as mensagens
CREATE POLICY "Admins can view all messages"
    ON support_ticket_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Admins podem criar mensagens em qualquer ticket
CREATE POLICY "Admins can create messages in any ticket"
    ON support_ticket_messages FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Políticas RLS para support_faqs
-- FAQs são públicas (qualquer usuário autenticado pode ver)
CREATE POLICY "Authenticated users can view active FAQs"
    ON support_faqs FOR SELECT
    USING (is_active = true AND auth.uid() IS NOT NULL);

-- Admins podem gerenciar FAQs
CREATE POLICY "Admins can manage FAQs"
    ON support_faqs FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Comentários
COMMENT ON TABLE support_tickets IS 'Tickets de suporte dos usuários';
COMMENT ON TABLE support_ticket_messages IS 'Mensagens dos tickets de suporte';
COMMENT ON TABLE support_faqs IS 'Perguntas frequentes (FAQs)';

COMMENT ON COLUMN support_tickets.priority IS 'Prioridade: low, medium, high';
COMMENT ON COLUMN support_tickets.status IS 'Status: open, pending, closed, resolved';
COMMENT ON COLUMN support_ticket_messages.is_from_user IS 'True se mensagem é do usuário, False se é da equipe';
COMMENT ON COLUMN support_ticket_messages.is_internal IS 'True se mensagem é interna da equipe';
