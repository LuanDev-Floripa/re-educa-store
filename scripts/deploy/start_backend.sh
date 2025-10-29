#!/bin/bash
cd /root/Projetos/re-educa/backend

# Ativar venv se existir
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Iniciar backend
export FLASK_ENV=production
export PORT=9001
python3 src/app.py > backend.log 2>&1 &

# Salvar PID
echo $! > backend.pid

echo "Backend iniciado com PID: $(cat backend.pid)"
echo "Logs em: backend.log"
