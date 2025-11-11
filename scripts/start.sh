
#!/bin/bash

# Script de Inicialização - Portal RE-EDUCA
# Este script inicia o backend e frontend do projeto

set -e  # Para o script se houver erro

echo "🚀 Iniciando Portal RE-EDUCA..."
echo "==============================="

# Verificar se estamos no diretório correto
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "❌ Erro: Execute este script a partir do diretório raiz do projeto"
    exit 1
fi

# Verificar se as dependências foram instaladas
if [ ! -d "backend/venv" ]; then
    echo "❌ Ambiente virtual do backend não encontrado. Execute './scripts/install.sh' primeiro."
    exit 1
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "❌ Dependências do frontend não encontradas. Execute './scripts/install.sh' primeiro."
    exit 1
fi

# Verificar arquivos .env
if [ ! -f "backend/.env" ]; then
    echo "❌ Arquivo backend/.env não encontrado. Configure as variáveis de ambiente."
    exit 1
fi

if [ ! -f "frontend/.env" ]; then
    echo "❌ Arquivo frontend/.env não encontrado. Configure as variáveis de ambiente."
    exit 1
fi

# Função para limpar processos ao sair
cleanup() {
    echo ""
    echo "🛑 Parando serviços..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    echo "✅ Serviços parados"
    exit 0
}

# Capturar sinais para limpeza
trap cleanup SIGINT SIGTERM

echo "🔧 Iniciando Backend..."
echo "====================="

# Navegar para o diretório backend
cd backend

# Ativar ambiente virtual
source venv/bin/activate

# Iniciar backend em background
echo "🐍 Iniciando servidor Flask..."
python src/app.py &
BACKEND_PID=$!

# Aguardar um pouco para o backend inicializar
sleep 3

# Voltar ao diretório raiz
cd ..

echo "🎨 Iniciando Frontend..."
echo "====================="

# Navegar para o diretório frontend
cd frontend

# Iniciar frontend em background
echo "⚛️  Iniciando servidor Vite..."
npm run dev &
FRONTEND_PID=$!

# Voltar ao diretório raiz
cd ..

echo ""
echo "✅ Portal RE-EDUCA iniciado com sucesso!"
echo "======================================"
echo ""
echo "🌐 Acesse a aplicação:"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:5000"
echo ""
echo "📊 Monitoramento:"
echo "   Backend PID: $BACKEND_PID"
echo "   Frontend PID: $FRONTEND_PID"
echo ""
echo "⏹️  Para parar os serviços, pressione Ctrl+C"
echo ""

# Aguardar indefinidamente (até receber sinal)
wait
