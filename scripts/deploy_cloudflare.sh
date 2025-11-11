#!/bin/bash

# 🚀 Script de Deploy para Cloudflare Pages
# Deploy do frontend RE-EDUCA para Cloudflare Pages

set -e

echo "🚀 Deploy para Cloudflare Pages - RE-EDUCA"
echo "=========================================="

# Verificar se estamos no diretório correto
if [ ! -d "frontend" ]; then
    echo "❌ Erro: Execute este script a partir do diretório raiz do projeto"
    exit 1
fi

cd frontend

# Verificar se dist existe
if [ ! -d "dist" ]; then
    echo "❌ Diretório dist não encontrado. Execute 'npm run build' primeiro."
    exit 1
fi

# Verificar se wrangler está instalado
if ! command -v wrangler &> /dev/null; then
    echo "❌ wrangler não encontrado. Instale: npm install -g wrangler"
    exit 1
fi

# Verificar autenticação
echo "🔐 Verificando autenticação Cloudflare..."
if ! wrangler whoami &> /dev/null; then
    echo "⚠️  Não autenticado. Execute: wrangler login"
    echo "   Ou configure CLOUDFLARE_API_TOKEN"
    exit 1
fi

PROJECT_NAME="re-educa-store"

# Deploy Preview
echo ""
echo "📦 Fazendo deploy PREVIEW..."
echo "============================"
wrangler pages deploy dist \
    --project-name=$PROJECT_NAME \
    --branch=preview \
    --compatibility-date=2024-01-01

echo ""
echo "✅ Deploy PREVIEW concluído!"

# Deploy Produção
echo ""
echo "📦 Fazendo deploy PRODUÇÃO..."
echo "============================"
wrangler pages deploy dist \
    --project-name=$PROJECT_NAME \
    --branch=main \
    --compatibility-date=2024-01-01

echo ""
echo "✅ Deploy PRODUÇÃO concluído!"
echo ""
echo "🌐 URLs:"
echo "   Preview: https://preview.re-educa-store.pages.dev"
echo "   Produção: https://re-educa-store.pages.dev"
echo "   Custom: https://re-educa.topsupplementslab.com"
echo ""
