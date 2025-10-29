
#!/bin/bash

# Script de Instalação - Portal RE-EDUCA
# Este script instala todas as dependências necessárias para executar o projeto localmente

set -e  # Para o script se houver erro

echo "🚀 Iniciando instalação do Portal RE-EDUCA..."
echo "================================================"

# Verificar se estamos no diretório correto
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Erro: Execute este script a partir do diretório raiz do projeto"
    exit 1
fi

# Verificar pré-requisitos
echo "🔍 Verificando pré-requisitos..."

# Verificar Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 não encontrado. Instale Python 3.8+ antes de continuar."
    exit 1
fi

PYTHON_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
echo "✅ Python $PYTHON_VERSION encontrado"

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Instale Node.js 18+ antes de continuar."
    exit 1
fi

NODE_VERSION=$(node --version)
echo "✅ Node.js $NODE_VERSION encontrado"

# Verificar npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm não encontrado. Instale npm antes de continuar."
    exit 1
fi

NPM_VERSION=$(npm --version)
echo "✅ npm $NPM_VERSION encontrado"

echo ""
echo "🔧 Instalando dependências do Backend..."
echo "========================================"

# Navegar para o diretório backend
cd backend

# Criar ambiente virtual Python
echo "📦 Criando ambiente virtual Python..."
python3 -m venv venv

# Ativar ambiente virtual
echo "🔌 Ativando ambiente virtual..."
source venv/bin/activate

# Atualizar pip
echo "⬆️  Atualizando pip..."
pip install --upgrade pip

# Instalar dependências Python
echo "📚 Instalando dependências Python..."
pip install -r requirements.txt

echo "✅ Backend instalado com sucesso!"

# Voltar ao diretório raiz
cd ..

echo ""
echo "🎨 Instalando dependências do Frontend..."
echo "========================================"

# Navegar para o diretório frontend
cd frontend

# Instalar dependências Node.js
echo "📚 Instalando dependências Node.js..."
npm install

echo "✅ Frontend instalado com sucesso!"

# Voltar ao diretório raiz
cd ..

echo ""
echo "⚙️  Configurando arquivos de ambiente..."
echo "======================================"

# Copiar arquivos .env.example se não existirem
if [ ! -f "backend/.env" ]; then
    echo "📄 Criando backend/.env a partir do exemplo..."
    cp backend/.env.example backend/.env
    echo "⚠️  IMPORTANTE: Configure as variáveis em backend/.env antes de executar"
fi

if [ ! -f "frontend/.env" ]; then
    echo "📄 Criando frontend/.env a partir do exemplo..."
    cp frontend/.env.example frontend/.env
    echo "⚠️  IMPORTANTE: Configure as variáveis em frontend/.env antes de executar"
fi

echo ""
echo "🎉 Instalação concluída com sucesso!"
echo "=================================="
echo ""
echo "📋 Próximos passos:"
echo "1. Configure as variáveis de ambiente em backend/.env e frontend/.env"
echo "2. Execute './scripts/start.sh' para iniciar o projeto"
echo ""
echo "📖 Para mais informações, consulte o README_LOCAL.md"
