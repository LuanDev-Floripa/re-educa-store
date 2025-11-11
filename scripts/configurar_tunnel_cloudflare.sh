#!/bin/bash

# 🌐 Script para configurar Cloudflare Tunnel para api.topsupplementslab.com

set -e

echo "🌐 Configurando Cloudflare Tunnel para api.topsupplementslab.com"
echo "================================================================"

# Verificar se cloudflared está instalado
if ! command -v cloudflared &> /dev/null; then
    echo "❌ cloudflared não encontrado. Instale primeiro."
    exit 1
fi

# Verificar se backend está rodando
if ! curl -s http://localhost:9001/health > /dev/null; then
    echo "❌ Backend não está rodando em localhost:9001"
    echo "   Inicie o backend antes de configurar o tunnel"
    exit 1
fi

echo ""
echo "📋 Instruções:"
echo "=============="
echo ""
echo "Para configurar o tunnel corretamente, você precisa:"
echo ""
echo "1. Fazer login no Cloudflare:"
echo "   cloudflared tunnel login"
echo ""
echo "2. Criar um tunnel nomeado:"
echo "   cloudflared tunnel create re-educa-api"
echo ""
echo "3. Registrar o DNS:"
echo "   cloudflared tunnel route dns re-educa-api api.topsupplementslab.com"
echo ""
echo "4. Configurar o arquivo ~/.cloudflared/config.yml:"
echo ""
echo "   tunnel: re-educa-api"
echo "   credentials-file: /root/.cloudflared/[tunnel-id].json"
echo ""
echo "   ingress:"
echo "     - hostname: api.topsupplementslab.com"
echo "       service: http://localhost:9001"
echo "     - service: http_status:404"
echo ""
echo "5. Rodar o tunnel:"
echo "   cloudflared tunnel run re-educa-api"
echo ""
echo "⚠️  NOTA: O tunnel atual está usando quick tunnel temporário."
echo "   Para produção, configure um tunnel nomeado conforme acima."

