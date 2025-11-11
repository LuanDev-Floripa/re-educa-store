-- ============================================================
-- Migração 029: Sistema de Agendamento de Relatórios
-- Para: RE-EDUCA Store - Sistema de Reeducação de Estilo de Vida
-- Data: 2025-01-27
-- ============================================================
--
-- Cria tabela para armazenar agendamentos de relatórios
-- que serão enviados automaticamente por email
-- ============================================================

CREATE TABLE IF NOT EXISTS report_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id TEXT NOT NULL,
    frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
    recipients JSONB NOT NULL DEFAULT '[]'::jsonb,
    format TEXT NOT NULL DEFAULT 'pdf' CHECK (format IN ('pdf', 'csv', 'json', 'excel')),
    start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_sent_at TIMESTAMP WITH TIME ZONE,
    next_send_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_report_schedules_active ON report_schedules(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_report_schedules_frequency ON report_schedules(frequency);
CREATE INDEX IF NOT EXISTS idx_report_schedules_next_send ON report_schedules(next_send_at) WHERE is_active = true;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_report_schedules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_report_schedules_updated_at
    BEFORE UPDATE ON report_schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_report_schedules_updated_at();

-- RLS Policies
ALTER TABLE report_schedules ENABLE ROW LEVEL SECURITY;

-- Política: Apenas admins podem ver todos os agendamentos
CREATE POLICY "Admins can view all report schedules"
    ON report_schedules
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Política: Apenas admins podem criar agendamentos
CREATE POLICY "Admins can create report schedules"
    ON report_schedules
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Política: Apenas admins podem atualizar agendamentos
CREATE POLICY "Admins can update report schedules"
    ON report_schedules
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Política: Apenas admins podem deletar agendamentos
CREATE POLICY "Admins can delete report schedules"
    ON report_schedules
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Comentários
COMMENT ON TABLE report_schedules IS 'Agendamentos de relatórios para envio automático por email';
COMMENT ON COLUMN report_schedules.template_id IS 'ID do template de relatório a ser usado';
COMMENT ON COLUMN report_schedules.frequency IS 'Frequência de envio: daily, weekly, monthly';
COMMENT ON COLUMN report_schedules.recipients IS 'Lista de emails que receberão o relatório';
COMMENT ON COLUMN report_schedules.format IS 'Formato do relatório: pdf, csv, json, excel';
COMMENT ON COLUMN report_schedules.next_send_at IS 'Próxima data/hora de envio (calculada automaticamente)';
