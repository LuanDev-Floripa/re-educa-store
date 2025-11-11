#!/bin/bash

cd /root/Projetos/re-educa/backend

# Ativar venv
source venv/bin/activate

# Configurar variáveis
export USE_SQLITE=true
export SECRET_KEY="dev-secret-key-re-educa-2025"
export PORT=9001
export FLASK_ENV=development

# Matar processos anteriores
pkill -f "python.*src/app.py" 2>/dev/null

# Iniciar backend
echo "🚀 Iniciando backend na porta $PORT..."
python src/app.py
