#!/bin/bash

# 🔍 Script de Validação Geral do Sistema RE-EDUCA

set -e

echo "🔍 Validação Geral do Sistema RE-EDUCA"
echo "======================================="
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contadores
PASSED=0
FAILED=0

check() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}❌ $1${NC}"
        ((FAILED++))
        return 1
    fi
}

# 1. Backend
echo "1️⃣  Verificando Backend..."
echo "---------------------------"

# Backend rodando
if curl -s http://localhost:9001/health > /dev/null 2>&1; then
    check "Backend rodando (localhost:9001)"
    BACKEND_RESPONSE=$(curl -s http://localhost:9001/health)
    echo "   Resposta: $BACKEND_RESPONSE"
else
    check "Backend rodando (localhost:9001)" || true
fi

# Backend público
if curl -s https://api.topsupplementslab.com/health > /dev/null 2>&1; then
    check "Backend acessível publicamente (api.topsupplementslab.com)"
    API_RESPONSE=$(curl -s https://api.topsupplementslab.com/health)
    echo "   Resposta: $API_RESPONSE"
else
    check "Backend acessível publicamente (api.topsupplementslab.com)" || true
fi

# Cloudflare Tunnel
if ps aux | grep -q "[c]loudflared tunnel"; then
    check "Cloudflare Tunnel rodando"
else
    check "Cloudflare Tunnel rodando" || true
fi

echo ""

# 2. Frontend
echo "2️⃣  Verificando Frontend..."
echo "---------------------------"

# Build existe
if [ -d "frontend/dist" ]; then
    check "Build de produção existe (frontend/dist)"
    DIST_SIZE=$(du -sh frontend/dist | cut -f1)
    DIST_FILES=$(find frontend/dist -type f | wc -l)
    echo "   Tamanho: $DIST_SIZE"
    echo "   Arquivos: $DIST_FILES"
else
    check "Build de produção existe (frontend/dist)" || true
fi

# Frontend público
if curl -s https://re-educa.topsupplementslab.com > /dev/null 2>&1; then
    check "Frontend acessível (re-educa.topsupplementslab.com)"
    
    # Verificar se retorna HTML
    HTML_CHECK=$(curl -s https://re-educa.topsupplementslab.com | grep -o "<!doctype html" | head -1)
    if [ ! -z "$HTML_CHECK" ]; then
        check "Frontend retorna HTML válido"
    fi
    
    # Verificar assets
    ASSETS_CHECK=$(curl -s https://re-educa.topsupplementslab.com | grep -o "/assets/" | head -1)
    if [ ! -z "$ASSETS_CHECK" ]; then
        check "Frontend tem referências a assets"
    fi
else
    check "Frontend acessível (re-educa.topsupplementslab.com)" || true
fi

echo ""

# 3. Banco de Dados
echo "3️⃣  Verificando Banco de Dados..."
echo "----------------------------------"

# Supabase configurado
if [ -f "backend/.env" ] && grep -q "SUPABASE_URL" backend/.env; then
    check "Variáveis Supabase configuradas"
    SUPABASE_URL=$(grep "SUPABASE_URL" backend/.env | cut -d'=' -f2 | tr -d '"' | tr -d "'")
    echo "   URL: ${SUPABASE_URL:0:30}..."
else
    check "Variáveis Supabase configuradas" || true
fi

# Teste de conexão
if curl -s "${SUPABASE_URL}/rest/v1/" -H "apikey: test" > /dev/null 2>&1; then
    check "Supabase acessível"
else
    check "Supabase acessível" || true
fi

echo ""

# 4. Variáveis de Ambiente
echo "4️⃣  Verificando Variáveis de Ambiente..."
echo "------------------------------------------"

# Backend .env
if [ -f "backend/.env" ]; then
    check "backend/.env existe"
    
    REQUIRED_VARS=("SECRET_KEY" "SUPABASE_URL" "SUPABASE_KEY")
    for var in "${REQUIRED_VARS[@]}"; do
        if grep -q "^${var}=" backend/.env; then
            check "  $var configurado"
        else
            check "  $var configurado" || true
        fi
    done
else
    check "backend/.env existe" || true
fi

# Frontend .env.production
if [ -f "frontend/.env.production" ]; then
    check "frontend/.env.production existe"
    
    if grep -q "VITE_API_URL" frontend/.env.production; then
        API_URL=$(grep "VITE_API_URL" frontend/.env.production | cut -d'=' -f2)
        echo "   API URL: $API_URL"
        check "  VITE_API_URL configurado"
    fi
else
    check "frontend/.env.production existe" || true
fi

echo ""

# 5. Processos
echo "5️⃣  Verificando Processos..."
echo "-----------------------------"

# Backend Python
if ps aux | grep -q "[p]ython.*app.py"; then
    BACKEND_PID=$(ps aux | grep "[p]ython.*app.py" | awk '{print $2}' | head -1)
    check "Backend Python rodando (PID: $BACKEND_PID)"
else
    check "Backend Python rodando" || true
fi

# Cloudflare Tunnel
if ps aux | grep -q "[c]loudflared tunnel"; then
    TUNNEL_PID=$(ps aux | grep "[c]loudflared tunnel" | awk '{print $2}' | head -1)
    check "Cloudflare Tunnel rodando (PID: $TUNNEL_PID)"
else
    check "Cloudflare Tunnel rodando" || true
fi

echo ""

# 6. Resumo
echo "======================================="
echo "📊 RESUMO"
echo "======================================="
echo -e "${GREEN}✅ Passou: $PASSED${NC}"
echo -e "${RED}❌ Falhou: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 Todos os testes passaram!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  Alguns testes falharam. Verifique acima.${NC}"
    exit 1
fi
