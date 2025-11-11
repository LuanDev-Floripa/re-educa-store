-- Script de inicialização do PostgreSQL para Re-Educa
-- Este script configura o banco de dados e cria usuários necessários

-- Conectar ao banco de dados
\c re_educa;

-- Criar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Criar usuário para aplicação
CREATE USER re_educa_app WITH PASSWORD 're_educa_app_password';

-- Conceder permissões necessárias
GRANT CONNECT ON DATABASE re_educa TO re_educa_app;
GRANT USAGE ON SCHEMA public TO re_educa_app;
GRANT CREATE ON SCHEMA public TO re_educa_app;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO re_educa_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO re_educa_app;

-- Configurar configurações de performance
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET pg_stat_statements.track = 'all';
ALTER SYSTEM SET pg_stat_statements.max = 10000;

-- Configurar configurações de conexão
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;

-- Recarregar configurações
SELECT pg_reload_conf();

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_user_id ON ai_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_gamification_user_id ON gamification(user_id);

-- Configurar particionamento para tabelas grandes (se necessário)
-- CREATE TABLE payments_partitioned (
--     LIKE payments INCLUDING ALL
-- ) PARTITION BY RANGE (created_at);

-- Criar partições mensais para o ano atual
-- SELECT create_monthly_partitions('payments_partitioned', '2024-01-01', '2024-12-31');

-- Configurar backup automático
-- ALTER SYSTEM SET archive_mode = on;
-- ALTER SYSTEM SET archive_command = 'test ! -f /var/lib/postgresql/backup/archive/%f && cp %p /var/lib/postgresql/backup/archive/%f';

-- Configurar replicação (se necessário)
-- ALTER SYSTEM SET wal_level = replica;
-- ALTER SYSTEM SET max_wal_senders = 3;
-- ALTER SYSTEM SET max_replication_slots = 3;

-- Recarregar configurações finais
SELECT pg_reload_conf();

-- Verificar configurações
SELECT name, setting, unit FROM pg_settings WHERE name IN (
    'shared_preload_libraries',
    'max_connections',
    'shared_buffers',
    'effective_cache_size'
);