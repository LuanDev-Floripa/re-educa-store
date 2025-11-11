#!/bin/bash
# Script para executar testes E2E com bypass de autenticação

echo "🧪 Iniciando testes E2E com Puppeteer e Lynx"
echo "=========================================="

# Configura variáveis de ambiente para bypass de autenticação
export TESTING=true
export BYPASS_AUTH=true
export TEST_BASE_URL=${TEST_BASE_URL:-"http://localhost:9001"}
export TEST_FRONTEND_URL=${TEST_FRONTEND_URL:-"http://localhost:9002"}
export PUPPETEER_HEADLESS=${PUPPETEER_HEADLESS:-"true"}

echo "⚙️  Configurações:"
echo "   - TESTING: $TESTING"
echo "   - BYPASS_AUTH: $BYPASS_AUTH"
echo "   - Backend URL: $TEST_BASE_URL"
echo "   - Frontend URL: $TEST_FRONTEND_URL"
echo "   - Headless: $PUPPETEER_HEADLESS"
echo ""

# Verifica se o backend está rodando
echo "🔍 Verificando se backend está rodando..."
if curl -s "$TEST_BASE_URL/health" > /dev/null 2>&1; then
    echo "✅ Backend está rodando"
else
    echo "❌ Backend não está rodando em $TEST_BASE_URL"
    echo "   Inicie o backend antes de executar os testes"
    exit 1
fi

# Verifica se Lynx está instalado
if ! command -v lynx &> /dev/null; then
    echo "⚠️  Lynx não encontrado. Instalando..."
    apt-get update -qq && apt-get install -y lynx
fi

# Cria diretório de logs
mkdir -p logs/e2e/screenshots

# Executa testes Jest
echo ""
echo "🚀 Executando testes E2E..."
echo ""

cd "$(dirname "$0")/../.."
npm test -- tests/e2e/ --testTimeout=120000

echo ""
echo "✅ Testes concluídos!"
echo "📄 Logs salvos em: logs/e2e/"
