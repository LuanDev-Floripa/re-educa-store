#!/bin/bash
# Script de build para Cloudflare Pages

set -e

echo "🚀 Iniciando build para Cloudflare Pages..."

# Instala dependências
echo "📦 Instalando dependências..."
npm install --legacy-peer-deps || pnpm install || yarn install

# Build do projeto
echo "🔨 Executando build..."
npm run build || pnpm build || yarn build

echo "✅ Build concluído com sucesso!"
echo "📁 Arquivos de build em: ./dist"
