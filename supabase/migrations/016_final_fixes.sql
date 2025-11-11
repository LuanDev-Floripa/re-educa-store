-- ============================================================
-- Migração 016: Correções Finais de Segurança e Integridade
-- Para: RE-EDUCA Store - Sistema de Reeducação de Estilo de Vida
-- Data: 2025
-- ============================================================
--
-- Esta migração consolida:
-- - 28_fix_critical_issues.sql
--
-- Aplica correções críticas: FKs faltantes, RLS, índices
-- ============================================================

-- Adicionar Foreign Keys faltantes (se ainda não existirem)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'health_calculations_user_id_fkey' AND table_name = 'health_calculations') THEN
        ALTER TABLE health_calculations ADD CONSTRAINT health_calculations_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'imc_history_user_id_fkey' AND table_name = 'imc_history') THEN
        ALTER TABLE imc_history ADD CONSTRAINT imc_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'calories_history_user_id_fkey' AND table_name = 'calories_history') THEN
        ALTER TABLE calories_history ADD CONSTRAINT calories_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'hydration_history_user_id_fkey' AND table_name = 'hydration_history') THEN
        ALTER TABLE hydration_history ADD CONSTRAINT hydration_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'body_fat_history_user_id_fkey' AND table_name = 'body_fat_history') THEN
        ALTER TABLE body_fat_history ADD CONSTRAINT body_fat_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'workout_sessions_user_id_fkey' AND table_name = 'workout_sessions') THEN
        ALTER TABLE workout_sessions ADD CONSTRAINT workout_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'workout_plans_user_id_fkey' AND table_name = 'workout_plans') THEN
        ALTER TABLE workout_plans ADD CONSTRAINT workout_plans_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'weekly_workout_sessions_user_id_fkey' AND table_name = 'weekly_workout_sessions') THEN
        ALTER TABLE weekly_workout_sessions ADD CONSTRAINT weekly_workout_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Garantir RLS em tabelas críticas (pode já estar habilitado, mas garantir políticas)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_consents') THEN
        ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_consents' AND policyname = 'Admins can view all consents') THEN
            CREATE POLICY "Admins can view all consents" ON user_consents
                FOR SELECT USING (EXISTS (SELECT 1 FROM users WHERE users.id::text = auth.uid()::text AND users.role = 'admin'));
        END IF;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'data_access_logs') THEN
        ALTER TABLE data_access_logs ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_deletions') THEN
        ALTER TABLE user_deletions ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'blocks') THEN
        ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'hashtags') THEN
        ALTER TABLE hashtags ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'post_hashtags') THEN
        ALTER TABLE post_hashtags ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'group_posts') THEN
        ALTER TABLE group_posts ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'shipping_rules') THEN
        ALTER TABLE shipping_rules ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Índices adicionais se ainda não existirem
CREATE INDEX IF NOT EXISTS idx_blocks_blocker_blocked ON blocks(blocker_id, blocked_id);
CREATE INDEX IF NOT EXISTS idx_hashtags_usage_count ON hashtags(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_post_hashtags_post_hashtag ON post_hashtags(post_id, hashtag_id);
CREATE INDEX IF NOT EXISTS idx_group_posts_group_post ON group_posts(group_id, post_id);
CREATE INDEX IF NOT EXISTS idx_saved_posts_user_post ON saved_posts(user_id, post_id);

SELECT 'Migração 016: Correções finais aplicadas com sucesso!' as status;
