#!/bin/bash

# Script de Backup para Re-Educa
# Este script realiza backup completo da plataforma incluindo banco, arquivos e configurações

set -e

# Configurações
BACKUP_DIR="/backup"
LOGS_DIR="/logs"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="re-educa-backup-$DATE"
RETENTION_DAYS=30

# Configurações de banco de dados
DB_HOST="postgresql"
DB_PORT="5432"
DB_NAME="re_educa"
DB_USER="re_educa_user"
DB_PASSWORD="re_educa_password"

# Configurações de Redis
REDIS_HOST="redis"
REDIS_PORT="6379"
REDIS_PASSWORD="re_educa_redis_password"

# Configurações de containers
NGINX_CONTAINER="re-educa-nginx-1"
BACKEND_CONTAINER="re-educa-backend-1"
FRONTEND_CONTAINER="re-educa-frontend-1"

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
    if redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASSWORD" BGSAVE; then
        log "Backup do Redis iniciado (BGSAVE)"
        
        # Aguardar conclusão do backup
        sleep 10
        
        # Copiar arquivo RDB
        if redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASSWORD" CONFIG GET dir | grep -q "/data"; then
            local redis_data_dir=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASSWORD" CONFIG GET dir | tail -n1)
            if docker cp "$REDIS_CONTAINER:$redis_data_dir/dump.rdb" "$redis_backup_file"; then
                log "Backup do Redis copiado: $redis_backup_file"
                
                # Comprimir backup
                gzip "$redis_backup_file"
                log "Backup do Redis comprimido: $redis_backup_file.gz"
            else
                log "AVISO: Não foi possível copiar backup do Redis"
            fi
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
    if docker exec "$NGINX_CONTAINER" test -d /etc/nginx; then
        docker exec "$NGINX_CONTAINER" tar czf - /etc/nginx | tar xzf - -C "$configs_backup_dir"
        log "Configurações do Nginx copiadas"
    fi
    
    # Backup do Backend
    if docker exec "$BACKEND_CONTAINER" test -f /app/.env; then
        docker cp "$BACKEND_CONTAINER:/app/.env" "$configs_backup_dir/backend.env"
        log "Configurações do Backend copiadas"
    fi
    
    # Backup do Frontend
    if docker exec "$FRONTEND_CONTAINER" test -f /usr/share/nginx/html/index.html; then
        docker exec "$FRONTEND_CONTAINER" tar czf - /usr/share/nginx/html | tar xzf - -C "$configs_backup_dir"
        log "Configurações do Frontend copiadas"
    fi
    
    # Backup de certificados SSL
    if docker exec "$NGINX_CONTAINER" test -d /etc/nginx/ssl; then
        docker exec "$NGINX_CONTAINER" tar czf - /etc/nginx/ssl | tar xzf - -C "$configs_backup_dir"
        log "Certificados SSL copiados"
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
    if docker exec "$NGINX_CONTAINER" test -d /var/log/nginx; then
        docker exec "$NGINX_CONTAINER" tar czf - /var/log/nginx | tar xzf - -C "$logs_backup_dir"
        log "Logs do Nginx copiados"
    fi
    
    # Backup de logs do Backend
    if docker exec "$BACKEND_CONTAINER" test -f /app/app.log; then
        docker cp "$BACKEND_CONTAINER:/app/app.log" "$logs_backup_dir/backend.log"
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

# Função de backup de volumes Docker
backup_volumes() {
    log "Iniciando backup de volumes Docker..."
    
    local volumes_backup_dir="$BACKUP_DIR/$BACKUP_NAME-volumes"
    mkdir -p "$volumes_backup_dir"
    
    # Listar volumes
    local volumes
    volumes=$(docker volume ls --format "{{.Name}}" | grep "re-educa")
    
    for volume in $volumes; do
        log "Backup do volume: $volume"
        
        # Criar container temporário para backup
        if docker run --rm -v "$volume:/data" -v "$volumes_backup_dir:/backup" alpine tar czf "/backup/$volume.tar.gz" -C /data .; then
            log "Volume $volume copiado com sucesso"
        else
            log "AVISO: Falha no backup do volume $volume"
        fi
    done
    
    # Comprimir volumes
    tar czf "$volumes_backup_dir.tar.gz" -C "$volumes_backup_dir" .
    rm -rf "$volumes_backup_dir"
    log "Backup de volumes comprimido: $volumes_backup_dir.tar.gz"
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
    backup_volumes
    
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
        "volumes")
            backup_volumes
            ;;
        "verify")
            verify_backup
            ;;
        "cleanup")
            cleanup
            ;;
        *)
            log "Uso: $0 {full|incremental|db|redis|configs|logs|volumes|verify|cleanup}"
            log "  full        - Backup completo da plataforma"
            log "  incremental - Backup incremental (banco + logs)"
            log "  db          - Backup apenas do banco de dados"
            log "  redis       - Backup apenas do Redis"
            log "  configs     - Backup apenas de configurações"
            log "  logs        - Backup apenas de logs"
            log "  volumes     - Backup apenas de volumes Docker"
            log "  verify      - Verificar integridade dos backups"
            log "  cleanup     - Limpar backups antigos"
            exit 1
            ;;
    esac
}

# Executar função principal
main "$@"