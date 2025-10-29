#!/bin/bash

# Script de verificação SSL para Re-Educa
# Este script verifica a validade e status dos certificados SSL

set -e

# Configurações
DOMAIN="re-educa.com.br"
CERT_DIR="/etc/letsencrypt/live/$DOMAIN"
CERT_FILE="$CERT_DIR/cert.pem"
KEY_FILE="$CERT_DIR/privkey.pem"
CHAIN_FILE="$CERT_DIR/chain.pem"
FULLCHAIN_FILE="$CERT_DIR/fullchain.pem"

# Função de log
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Função de erro
error() {
    log "ERROR: $1" >&2
    exit 1
}

# Função de verificação de arquivos
check_files() {
    log "Verificando arquivos de certificado..."
    
    local missing_files=()
    
    if [ ! -f "$CERT_FILE" ]; then
        missing_files+=("$CERT_FILE")
    fi
    
    if [ ! -f "$KEY_FILE" ]; then
        missing_files+=("$KEY_FILE")
    fi
    
    if [ ! -f "$CHAIN_FILE" ]; then
        missing_files+=("$CHAIN_FILE")
    fi
    
    if [ ! -f "$FULLCHAIN_FILE" ]; then
        missing_files+=("$FULLCHAIN_FILE")
    fi
    
    if [ ${#missing_files[@]} -gt 0 ]; then
        error "Arquivos de certificado ausentes: ${missing_files[*]}"
    fi
    
    log "Todos os arquivos de certificado estão presentes"
}

# Função de verificação de permissões
check_permissions() {
    log "Verificando permissões dos arquivos..."
    
    # Verificar permissões do diretório
    if [ ! -r "$CERT_DIR" ]; then
        error "Diretório de certificados não é legível: $CERT_DIR"
    fi
    
    # Verificar permissões dos arquivos
    if [ ! -r "$CERT_FILE" ]; then
        error "Certificado não é legível: $CERT_FILE"
    fi
    
    if [ ! -r "$KEY_FILE" ]; then
        error "Chave privada não é legível: $KEY_FILE"
    fi
    
    log "Permissões dos arquivos estão corretas"
}

# Função de verificação de validade
check_validity() {
    log "Verificando validade do certificado..."
    
    # Verificar se o certificado não expirou
    if ! openssl x509 -checkend 86400 -noout -in "$CERT_FILE"; then
        error "Certificado expirou ou expira em menos de 24 horas"
    fi
    
    # Verificar data de expiração
    local expiry_date
    expiry_date=$(openssl x509 -enddate -noout -in "$CERT_FILE" | cut -d= -f2)
    log "Certificado expira em: $expiry_date"
    
    # Verificar se expira em menos de 30 dias
    if ! openssl x509 -checkend 2592000 -noout -in "$CERT_FILE"; then
        log "AVISO: Certificado expira em menos de 30 dias"
    fi
    
    log "Certificado é válido"
}

# Função de verificação de domínio
check_domain() {
    log "Verificando domínio do certificado..."
    
    local cert_domain
    cert_domain=$(openssl x509 -in "$CERT_FILE" -text -noout | grep -A1 "Subject Alternative Name" | tail -n1 | sed 's/DNS://g' | tr ',' '\n' | tr -d ' ')
    
    if [[ "$cert_domain" != *"$DOMAIN"* ]]; then
        error "Domínio do certificado não corresponde: $cert_domain"
    fi
    
    log "Domínio do certificado está correto: $cert_domain"
}

# Função de verificação de cadeia
check_chain() {
    log "Verificando cadeia de certificados..."
    
    # Verificar se a cadeia é válida
    if ! openssl verify -CAfile "$CHAIN_FILE" "$CERT_FILE" >/dev/null 2>&1; then
        error "Cadeia de certificados inválida"
    fi
    
    log "Cadeia de certificados é válida"
}

# Função de verificação de chave privada
check_private_key() {
    log "Verificando chave privada..."
    
    # Verificar se a chave privada corresponde ao certificado
    local cert_modulus
    local key_modulus
    
    cert_modulus=$(openssl x509 -noout -modulus -in "$CERT_FILE" | openssl md5)
    key_modulus=$(openssl rsa -noout -modulus -in "$KEY_FILE" | openssl md5)
    
    if [ "$cert_modulus" != "$key_modulus" ]; then
        error "Chave privada não corresponde ao certificado"
    fi
    
    log "Chave privada corresponde ao certificado"
}

# Função de verificação de força da chave
check_key_strength() {
    log "Verificando força da chave..."
    
    local key_bits
    key_bits=$(openssl rsa -in "$KEY_FILE" -text -noout | grep "Private-Key:" | awk '{print $2}')
    
    if [ "$key_bits" -lt 2048 ]; then
        log "AVISO: Chave privada tem menos de 2048 bits: $key_bits"
    else
        log "Força da chave é adequada: $key_bits bits"
    fi
}

# Função de verificação de OCSP
check_ocsp() {
    log "Verificando status OCSP..."
    
    # Tentar verificar status OCSP (pode falhar se o servidor OCSP estiver indisponível)
    if openssl ocsp -issuer "$CHAIN_FILE" -cert "$CERT_FILE" -url http://ocsp.int-x3.letsencrypt.org -header "Host" "ocsp.int-x3.letsencrypt.org" >/dev/null 2>&1; then
        log "Status OCSP verificado com sucesso"
    else
        log "AVISO: Não foi possível verificar status OCSP"
    fi
}

# Função de verificação de revogação
check_revocation() {
    log "Verificando revogação do certificado..."
    
    # Verificar se o certificado foi revogado
    if openssl verify -crl_check -CAfile "$CHAIN_FILE" "$CERT_FILE" >/dev/null 2>&1; then
        log "Certificado não foi revogado"
    else
        error "Certificado foi revogado ou não pode ser verificado"
    fi
}

# Função de verificação de integridade
check_integrity() {
    log "Verificando integridade dos arquivos..."
    
    # Verificar se os arquivos não estão corrompidos
    if ! openssl x509 -in "$CERT_FILE" -text -noout >/dev/null 2>&1; then
        error "Arquivo de certificado está corrompido"
    fi
    
    if ! openssl rsa -in "$KEY_FILE" -check >/dev/null 2>&1; then
        error "Arquivo de chave privada está corrompido"
    fi
    
    log "Integridade dos arquivos verificada"
}

# Função principal
main() {
    log "Iniciando verificação SSL para $DOMAIN..."
    
    # Verificar se o diretório de certificados existe
    if [ ! -d "$CERT_DIR" ]; then
        error "Diretório de certificados não existe: $CERT_DIR"
    fi
    
    # Executar todas as verificações
    check_files
    check_permissions
    check_validity
    check_domain
    check_chain
    check_private_key
    check_key_strength
    check_ocsp
    check_revocation
    check_integrity
    
    log "✅ Todas as verificações SSL foram concluídas com sucesso!"
    log "Certificado para $DOMAIN está válido e funcionando corretamente"
}

# Executar função principal
main "$@"