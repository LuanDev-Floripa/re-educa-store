#!/bin/bash

# Script de Backup para Re-Educa
# Este script realiza backup completo da plataforma incluindo banco, arquivos e configurações
# NOTA: Este script foi adaptado para ambientes sem Docker. 
# Para ambientes Docker, use ferramentas específicas de backup de containers.

set -e

# Configurações
BACKUP_DIR="${BACKUP_DIR:-/backup}"
LOGS_DIR="${LOGS_DIR:-/logs}"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="re-educa-backup-$DATE"
RETENTION_DAYS=30

# Configurações de banco de dados
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-re_educa}"
DB_USER="${DB_USER:-re_educa_user}"
DB_PASSWORD="${DB_PASSWORD:-}"

# Configurações de Redis
REDIS_HOST="${REDIS_HOST:-localhost}"
REDIS_PORT="${REDIS_PORT:-6379}"
REDIS_PASSWORD="${REDIS_PASSWORD:-}"

# Função de log
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOGS_DIR/backup.log"
}

# Função de erro
error() {
    log "ERROR: $1" >&2
    exit 1
}

# Função de limpeza
cleanup() {
    log "Executando limpeza..."
    
    # Remover backups antigos
    find "$BACKUP_DIR" -name "re-educa-backup-*.tar.gz" -mtime +$RETENTION_DAYS -delete
    
    # Limpar logs antigos
    find "$LOGS_DIR" -name "*.log" -mtime +7 -delete
    
    log "Limpeza concluída"
}

# Função de backup do banco de dados
backup_database() {
    log "Iniciando backup do banco de dados..."
    
    local db_backup_file="$BACKUP_DIR/$BACKUP_NAME-db.sql"
    
    # Backup do PostgreSQL
    if PGPASSWORD="$DB_PASSWORD" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" --verbose --clean --create --if-exists > "$db_backup_file"; then
        log "Backup do banco de dados concluído: $db_backup_file"
        
        # Comprimir backup
        gzip "$db_backup_file"
        log "Backup do banco comprimido: $db_backup_file.gz"
    else
        error "Falha no backup do banco de dados"
    fi
}

# Função de backup do Redis
backup_redis() {
    log "Iniciando backup do Redis..."
    
    local redis_backup_file="$BACKUP_DIR/$BACKUP_NAME-redis.rdb"
    
    # Backup do Redis
    if [ -n "$REDIS_PASSWORD" ]; then
        REDIS_CMD="redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASSWORD"
    else
        REDIS_CMD="redis-cli -h $REDIS_HOST -p $REDIS_PORT"
    fi
    
    if $REDIS_CMD BGSAVE; then
        log "Backup do Redis iniciado (BGSAVE)"
        
        # Aguardar conclusão do backup
        sleep 10
        
        # Obter diretório de dados do Redis
        local redis_data_dir=$($REDIS_CMD CONFIG GET dir | tail -n1)
        
        # Copiar arquivo RDB
        if [ -f "$redis_data_dir/dump.rdb" ]; then
            cp "$redis_data_dir/dump.rdb" "$redis_backup_file"
            log "Backup do Redis copiado: $redis_backup_file"
            
            # Comprimir backup
            gzip "$redis_backup_file"
            log "Backup do Redis comprimido: $redis_backup_file.gz"
        else
            log "AVISO: Arquivo dump.rdb não encontrado em $redis_data_dir"
        fi
    else
        log "AVISO: Falha no backup do Redis"
    fi
}

# Função de backup de arquivos de configuração
backup_configs() {
    log "Iniciando backup de configurações..."
    
    local configs_backup_dir="$BACKUP_DIR/$BACKUP_NAME-configs"
    mkdir -p "$configs_backup_dir"
    
    # Backup do Nginx
    if [ -d "/etc/nginx" ]; then
        tar czf - -C /etc/nginx . | tar xzf - -C "$configs_backup_dir"
        log "Configurações do Nginx copiadas"
    fi
    
    # Backup do Backend
    if [ -f "backend/.env" ]; then
        cp "backend/.env" "$configs_backup_dir/backend.env"
        log "Configurações do Backend copiadas"
    fi
    
    # Backup do Frontend
    if [ -d "frontend/dist" ]; then
        tar czf - -C frontend/dist . | tar xzf - -C "$configs_backup_dir"
        log "Arquivos do Frontend copiados"
    fi
    
    # Backup de certificados SSL
    if [ -d "/etc/nginx/ssl" ] || [ -d "ssl" ]; then
        local ssl_dir="${SSL_DIR:-ssl}"
        if [ -d "$ssl_dir" ]; then
            tar czf - -C "$ssl_dir" . | tar xzf - -C "$configs_backup_dir"
            log "Certificados SSL copiados"
        fi
    fi
    
    # Comprimir configurações
    tar czf "$configs_backup_dir.tar.gz" -C "$configs_backup_dir" .
    rm -rf "$configs_backup_dir"
    log "Backup de configurações comprimido: $configs_backup_dir.tar.gz"
}

# Função de backup de logs
backup_logs() {
    log "Iniciando backup de logs..."
    
    local logs_backup_dir="$BACKUP_DIR/$BACKUP_NAME-logs"
    mkdir -p "$logs_backup_dir"
    
    # Backup de logs do Nginx
    if [ -d "/var/log/nginx" ]; then
        tar czf "$logs_backup_dir/nginx-logs.tar.gz" -C /var/log/nginx .
        log "Logs do Nginx copiados"
    fi
    
    # Backup de logs do Backend
    if [ -f "backend/logs/app.log" ]; then
        cp "backend/logs/app.log" "$logs_backup_dir/backend.log"
        log "Logs do Backend copiados"
    fi
    
    # Backup de logs do sistema
    if [ -d "/var/log" ]; then
        tar czf "$logs_backup_dir/system-logs.tar.gz" -C /var/log . 2>/dev/null || true
        log "Logs do sistema copiados"
    fi
    
    # Comprimir logs
    tar czf "$logs_backup_dir.tar.gz" -C "$logs_backup_dir" .
    rm -rf "$logs_backup_dir"
    log "Backup de logs comprimido: $logs_backup_dir.tar.gz"
}

# Função de verificação de integridade
verify_backup() {
    log "Verificando integridade dos backups..."
    
    local backup_files
    backup_files=$(find "$BACKUP_DIR" -name "$BACKUP_NAME-*.tar.gz" -type f)
    
    for file in $backup_files; do
        if tar tzf "$file" >/dev/null 2>&1; then
            log "✅ Backup válido: $file"
        else
            error "❌ Backup corrompido: $file"
        fi
    done
    
    log "Verificação de integridade concluída"
}

# Função de backup completo
full_backup() {
    log "🚀 Iniciando backup completo da plataforma Re-Educa..."
    
    # Criar diretório de backup
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$LOGS_DIR"
    
    # Executar todos os tipos de backup
    backup_database
    backup_redis
    backup_configs
    backup_logs
    
    # Verificar integridade
    verify_backup
    
    # Limpeza
    cleanup
    
    log "🎉 Backup completo concluído com sucesso!"
    log "📁 Localização: $BACKUP_DIR"
    log "📊 Tamanho total: $(du -sh "$BACKUP_DIR" | cut -f1)"
    
    # Listar arquivos de backup
    log "📋 Arquivos de backup criados:"
    find "$BACKUP_DIR" -name "$BACKUP_NAME-*" -type f -exec ls -lh {} \;
}

# Função de backup incremental
incremental_backup() {
    log "🔄 Iniciando backup incremental..."
    
    # Backup apenas do banco de dados (mais frequente)
    backup_database
    
    # Backup de logs (mais frequente)
    backup_logs
    
    log "✅ Backup incremental concluído"
}

# Função principal
main() {
    case "${1:-}" in
        "full")
            full_backup
            ;;
        "incremental")
            incremental_backup
            ;;
        "db")
            backup_database
            ;;
        "redis")
            backup_redis
            ;;
        "configs")
            backup_configs
            ;;
        "logs")
            backup_logs
            ;;
        "verify")
            verify_backup
            ;;
        "cleanup")
            cleanup
            ;;
        *)
            log "Uso: $0 {full|incremental|db|redis|configs|logs|verify|cleanup}"
            log "  full        - Backup completo da plataforma"
            log "  incremental - Backup incremental (banco + logs)"
            log "  db          - Backup apenas do banco de dados"
            log "  redis       - Backup apenas do Redis"
            log "  configs     - Backup apenas de configurações"
            log "  logs        - Backup apenas de logs"
            log "  verify      - Verificar integridade dos backups"
            log "  cleanup     - Limpar backups antigos"
            exit 1
            ;;
    esac
}

# Executar função principal
main "$@"
