#!/bin/bash

# Script de renovação SSL para Re-Educa
# Este script gerencia a renovação automática de certificados SSL

set -e

# Configurações
DOMAIN="re-educa.com.br"
EMAIL="admin@re-educa.com.br"
CERTBOT_CONFIG="/etc/letsencrypt/certbot.conf"
NGINX_CONTAINER="re-educa-nginx-1"
BACKUP_DIR="/etc/letsencrypt/backup"

# Função de log
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Função de erro
error() {
    log "ERROR: $1" >&2
    exit 1
}

# Função de backup
backup_certs() {
    log "Fazendo backup dos certificados atuais..."
    mkdir -p "$BACKUP_DIR/$(date +%Y%m%d_%H%M%S)"
    cp -r /etc/letsencrypt/live /etc/letsencrypt/archive "$BACKUP_DIR/$(date +%Y%m%d_%H%M%S)/" || true
    log "Backup concluído"
}

# Função de verificação de domínio
check_domain() {
    log "Verificando domínio $DOMAIN..."
    if ! nslookup "$DOMAIN" >/dev/null 2>&1; then
        error "Domínio $DOMAIN não pode ser resolvido"
    fi
    log "Domínio verificado com sucesso"
}

# Função de pré-renovação
pre_renewal() {
    log "Executando pré-renovação..."
    
    # Verificar se o Certbot está rodando
    if pgrep -f certbot >/dev/null; then
        log "Certbot já está rodando, aguardando..."
        sleep 10
    fi
    
    # Fazer backup dos certificados atuais
    backup_certs
    
    # Verificar domínio
    check_domain
    
    log "Pré-renovação concluída"
}

# Função de pós-renovação
post_renewal() {
    log "Executando pós-renovação..."
    
    # Verificar se os novos certificados foram criados
    if [ ! -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
        error "Novos certificados não foram criados"
    fi
    
    # Verificar validade dos novos certificados
    if ! openssl x509 -checkend 86400 -noout -in "/etc/letsencrypt/live/$DOMAIN/cert.pem"; then
        error "Novos certificados não são válidos"
    fi
    
    log "Pós-renovação concluída"
}

# Função de renovação
renew_certificates() {
    log "Iniciando renovação de certificados..."
    
    # Executar renovação
    if certbot renew --config "$CERTBOT_CONFIG" --quiet; then
        log "Renovação concluída com sucesso"
        
        # Recarregar Nginx se estiver rodando
        if docker ps | grep -q "$NGINX_CONTAINER"; then
            log "Recarregando Nginx..."
            docker exec "$NGINX_CONTAINER" nginx -s reload
            log "Nginx recarregado com sucesso"
        fi
    else
        error "Falha na renovação dos certificados"
    fi
}

# Função de deploy
deploy_certificates() {
    log "Deployando certificados..."
    
    # Copiar certificados para o Nginx
    if docker ps | grep -q "$NGINX_CONTAINER"; then
        log "Copiando certificados para o container Nginx..."
        docker cp "/etc/letsencrypt/live/$DOMAIN/" "$NGINX_CONTAINER:/etc/nginx/ssl/"
        docker exec "$NGINX_CONTAINER" chown -R nginx:nginx /etc/nginx/ssl/
        log "Certificados copiados com sucesso"
        
        # Recarregar Nginx
        log "Recarregando Nginx..."
        docker exec "$NGINX_CONTAINER" nginx -s reload
        log "Nginx recarregado com sucesso"
    else
        log "Container Nginx não está rodando, certificados não podem ser copiados"
    fi
}

# Função de notificação
notify_renewal() {
    log "Enviando notificação de renovação..."
    
    # Aqui você pode adicionar código para enviar notificações
    # por email, Slack, Telegram, etc.
    
    log "Notificação enviada"
}

# Função de limpeza
cleanup_old_certs() {
    log "Limpando certificados antigos..."
    
    # Manter apenas os últimos 5 backups
    find "$BACKUP_DIR" -type d -name "*_*" | sort -r | tail -n +6 | xargs rm -rf || true
    
    # Limpar logs antigos
    find /var/log/letsencrypt -name "*.log" -mtime +30 -delete || true
    
    log "Limpeza concluída"
}

# Função principal
main() {
    case "${1:-}" in
        "pre")
            pre_renewal
            ;;
        "post")
            post_renewal
            ;;
        "renew")
            renew_certificates
            ;;
        "deploy")
            deploy_certificates
            ;;
        "notify")
            notify_renewal
            ;;
        "cleanup")
            cleanup_old_certs
            ;;
        *)
            log "Uso: $0 {pre|post|renew|deploy|notify|cleanup}"
            log "  pre     - Executar antes da renovação"
            log "  post    - Executar após a renovação"
            log "  renew   - Renovar certificados"
            log "  deploy  - Deployar certificados"
            log "  notify  - Enviar notificação"
            log "  cleanup - Limpar arquivos antigos"
            exit 1
            ;;
    esac
}

# Executar função principal
main "$@"