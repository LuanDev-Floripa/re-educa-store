#!/bin/sh

# Script de inicialização do Nginx para Re-Educa
# Este script configura SSL, certificados e inicia o Nginx

set -e

echo "🚀 Iniciando Nginx para Re-Educa..."

# Verificar se os certificados SSL existem
if [ ! -f "/etc/nginx/ssl/re-educa.crt" ] || [ ! -f "/etc/nginx/ssl/re-educa.key" ]; then
    echo "⚠️  Certificados SSL não encontrados. Gerando certificados auto-assinados..."
    
    # Criar diretório SSL se não existir
    mkdir -p /etc/nginx/ssl
    
    # Gerar certificado auto-assinado
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/nginx/ssl/re-educa.key \
        -out /etc/nginx/ssl/re-educa.crt \
        -subj "/C=BR/ST=SP/L=Sao Paulo/O=Re-Educa/CN=re-educa.com.br"
    
    echo "✅ Certificados auto-assinados gerados com sucesso!"
fi

# Verificar se o arquivo de configuração do Nginx existe
if [ ! -f "/etc/nginx/nginx.conf" ]; then
    echo "❌ Arquivo de configuração do Nginx não encontrado!"
    exit 1
fi

# Testar configuração do Nginx
echo "🔍 Testando configuração do Nginx..."
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Configuração do Nginx válida!"
else
    echo "❌ Configuração do Nginx inválida!"
    exit 1
fi

# Iniciar Nginx em primeiro plano
echo "🚀 Iniciando Nginx..."
exec nginx -g "daemon off;"