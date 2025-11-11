#!/bin/bash

# 🚀 Script para iniciar Backend + Cloudflare Tunnel
# Inicia o backend Flask e o Cloudflare Tunnel juntos

set -e

echo "🚀 Iniciando Backend + Cloudflare Tunnel..."
echo "=========================================="

# Verificar se estamos no diretório correto
if [ ! -d "backend" ]; then
    echo "❌ Erro: Execute este script a partir do diretório raiz do projeto"
    exit 1
fi

# Verificar se cloudflared está instalado
if ! command -v cloudflared &> /dev/null; then
    echo "❌ cloudflared não encontrado. Instale primeiro:"
    echo "   https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/"
    exit 1
fi

# Verificar se o ambiente virtual existe
if [ ! -d "backend/venv" ]; then
    echo "❌ Ambiente virtual do backend não encontrado."
    echo "   Execute './scripts/install.sh' primeiro."
    exit 1
fi

# Verificar se o arquivo .env existe
if [ ! -f "backend/.env" ]; then
    echo "❌ Arquivo backend/.env não encontrado."
    echo "   Configure as variáveis de ambiente primeiro."
    exit 1
fi

# Verificar se o config do Cloudflare Tunnel existe
if [ ! -f ~/.cloudflared/config.yml ]; then
    echo "❌ Configuração do Cloudflare Tunnel não encontrada."
    echo "   Execute './scripts/configurar_tunnel_cloudflare.sh' primeiro."
    exit 1
fi

# Função para limpar processos ao sair
cleanup() {
    echo ""
    echo "🛑 Parando serviços..."
    
    if [ ! -z "$BACKEND_PID" ]; then
        echo "   Parando backend (PID: $BACKEND_PID)..."
        kill $BACKEND_PID 2>/dev/null || true
        wait $BACKEND_PID 2>/dev/null || true
    fi
    
    if [ ! -z "$TUNNEL_PID" ]; then
        echo "   Parando Cloudflare Tunnel (PID: $TUNNEL_PID)..."
        kill $TUNNEL_PID 2>/dev/null || true
        wait $TUNNEL_PID 2>/dev/null || true
    fi
    
    echo "✅ Serviços parados"
    exit 0
}

# Capturar sinais para limpeza
trap cleanup SIGINT SIGTERM

echo ""
echo "🔧 Iniciando Backend..."
echo "====================="

# Navegar para o diretório backend
cd backend

# Ativar ambiente virtual
source venv/bin/activate

# Iniciar backend em background
echo "🐍 Iniciando servidor Flask na porta 9001..."
python src/app.py > ../logs/backend.log 2>&1 &
BACKEND_PID=$!

echo "   Backend iniciado (PID: $BACKEND_PID)"
echo "   Logs: logs/backend.log"

# Voltar ao diretório raiz
cd ..

# Aguardar backend estar pronto
echo ""
echo "⏳ Aguardando backend estar pronto..."
MAX_WAIT=30
WAIT_COUNT=0

while [ $WAIT_COUNT -lt $MAX_WAIT ]; do
    if curl -s http://localhost:9001/health > /dev/null 2>&1; then
        echo "✅ Backend está pronto!"
        break
    fi
    sleep 1
    WAIT_COUNT=$((WAIT_COUNT + 1))
    echo -n "."
done

if [ $WAIT_COUNT -eq $MAX_WAIT ]; then
    echo ""
    echo "❌ Timeout: Backend não respondeu em 30 segundos"
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

echo ""
echo "🌐 Iniciando Cloudflare Tunnel..."
echo "================================"

# Ler o nome do tunnel do config
TUNNEL_NAME=$(grep -E "^tunnel:" ~/.cloudflared/config.yml | awk '{print $2}' | head -1)

if [ -z "$TUNNEL_NAME" ]; then
    echo "❌ Não foi possível identificar o nome do tunnel no config.yml"
    exit 1
fi

echo "   Tunnel: $TUNNEL_NAME"
echo "   Hostname: api.topsupplementslab.com"
echo "   Service: http://127.0.0.1:9001"

# Iniciar Cloudflare Tunnel em background
cloudflared tunnel run $TUNNEL_NAME > logs/tunnel.log 2>&1 &
TUNNEL_PID=$!

echo "   Tunnel iniciado (PID: $TUNNEL_PID)"
echo "   Logs: logs/tunnel.log"

# Aguardar um pouco para o tunnel inicializar
sleep 3

# Verificar se o tunnel está rodando
if ! ps -p $TUNNEL_PID > /dev/null 2>&1; then
    echo "❌ Cloudflare Tunnel não iniciou corretamente"
    echo "   Verifique os logs: logs/tunnel.log"
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

echo ""
echo "✅ Backend + Cloudflare Tunnel iniciados com sucesso!"
echo "=================================================="
echo ""
echo "🌐 Acesse a aplicação:"
echo "   Local:  http://localhost:9001"
echo "   Public: https://api.topsupplementslab.com"
echo ""
echo "📊 Monitoramento:"
echo "   Backend PID: $BACKEND_PID"
echo "   Tunnel PID: $TUNNEL_PID"
echo ""
echo "📝 Logs:"
echo "   Backend: tail -f logs/backend.log"
echo "   Tunnel:  tail -f logs/tunnel.log"
echo ""
echo "⏹️  Para parar os serviços, pressione Ctrl+C"
echo ""

# Criar diretório de logs se não existir
mkdir -p logs

# Aguardar indefinidamente (até receber sinal)
wait
