#!/bin/bash

# 🚀 SCRIPT DE ATIVAÇÃO COMPLETA - RE-EDUCA
# Data: 26 de Janeiro de 2025
# Versão: 1.0

set -e

echo "🚀 INICIANDO ATIVAÇÃO COMPLETA DO RE-EDUCA..."
echo "=================================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERRO]${NC} $1"
    exit 1
}

warning() {
    echo -e "${YELLOW}[AVISO]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# 1. PARAR SERVIÇOS EXISTENTES
log "🛑 Parando serviços existentes..."
pkill -f "python3.*app.py" || true
pkill -f "nginx" || true
sleep 2

# 2. ATIVAR BACKEND
log "🔧 Ativando backend Flask..."
cd /root/Projetos/re-educa/backend

# Ativar ambiente virtual
source venv/bin/activate

# Configurar variáveis de ambiente
export HOST=0.0.0.0
export PORT=9001
export FLASK_ENV=production
export PYTHONPATH=/root/Projetos/re-educa/backend/src

# Iniciar backend em background
nohup python3 src/app.py > /var/log/re-educa-backend.log 2>&1 &
BACKEND_PID=$!

# Aguardar backend inicializar
log "⏳ Aguardando backend inicializar..."
sleep 10

# Verificar se backend está rodando
if curl -s http://localhost:9001/health > /dev/null; then
    log "✅ Backend ativado com sucesso! (PID: $BACKEND_PID)"
else
    error "❌ Falha ao ativar backend"
fi

# 3. CONFIGURAR NGINX
log "🌐 Configurando Nginx como proxy reverso..."

# Criar configuração nginx
cat > /etc/nginx/sites-available/re-educa-api << 'NGINX_EOF'
server {
    listen 8080;
    server_name api.topsupplementslab.com;

    # Headers de segurança
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # CORS headers
    add_header Access-Control-Allow-Origin "*" always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
    add_header Access-Control-Allow-Headers "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization" always;

    # Proxy para o backend Flask
    location / {
        proxy_pass http://127.0.0.1:9001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://127.0.0.1:9001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check
    location /health {
        proxy_pass http://127.0.0.1:9001/health;
        access_log off;
    }
}
NGINX_EOF

# Ativar configuração
ln -sf /etc/nginx/sites-available/re-educa-api /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Testar configuração
if nginx -t; then
    log "✅ Configuração Nginx válida"
else
    error "❌ Erro na configuração Nginx"
fi

# Iniciar Nginx
nginx -g "daemon on;" || warning "Nginx pode precisar de permissões especiais"

# 4. CONFIGURAR DNS VIA CLOUDFLARE
log "🌍 Configurando DNS via Cloudflare..."

# Obter IP público
PUBLIC_IP=$(curl -s ifconfig.me)
log "📍 IP Público: $PUBLIC_IP"

# Configurar DNS (use variáveis de ambiente)
ZONE_ID="${CLOUDFLARE_ZONE_ID:-8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b}"
API_TOKEN="${CLOUDFLARE_API_TOKEN}"

# Atualizar DNS para API
curl -X PUT "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records/8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"type\": \"A\",
    \"name\": \"api\",
    \"content\": \"$PUBLIC_IP\",
    \"ttl\": 1,
    \"proxied\": true
  }" || warning "Falha ao atualizar DNS - configure manualmente"

# 5. VERIFICAÇÕES FINAIS
log "🔍 Executando verificações finais..."

# Verificar backend
if curl -s http://localhost:9001/health | grep -q "healthy"; then
    log "✅ Backend: Funcionando"
else
    error "❌ Backend: Falha"
fi

# Verificar nginx
if curl -s http://localhost:8080/health | grep -q "healthy"; then
    log "✅ Nginx: Funcionando"
else
    warning "⚠️ Nginx: Pode precisar de configuração manual"
fi

# Verificar API externa
if curl -s https://api.topsupplementslab.com/health | grep -q "healthy"; then
    log "✅ API Externa: Funcionando"
else
    warning "⚠️ API Externa: Aguardando propagação DNS"
fi

# 6. CRIAR SCRIPT DE MONITORAMENTO
log "📊 Criando script de monitoramento..."

cat > /root/Projetos/re-educa/scripts/monitorar_sistema.sh << 'MONITOR_EOF'
#!/bin/bash
echo "🔍 MONITORAMENTO RE-EDUCA - $(date)"
echo "=================================="

echo "📊 Backend (localhost:9001):"
curl -s http://localhost:9001/health | jq . 2>/dev/null || echo "❌ Backend não responde"

echo ""
echo "🌐 Nginx (localhost:8080):"
curl -s http://localhost:8080/health | jq . 2>/dev/null || echo "❌ Nginx não responde"

echo ""
echo "🌍 API Externa:"
curl -s https://api.topsupplementslab.com/health | jq . 2>/dev/null || echo "❌ API externa não responde"

echo ""
echo "📈 Processos:"
ps aux | grep -E "(python3.*app.py|nginx)" | grep -v grep

echo ""
echo "🔌 Portas abertas:"
netstat -tlnp 2>/dev/null | grep -E "(9001|8080)" || echo "❌ Portas não encontradas"
MONITOR_EOF

chmod +x /root/Projetos/re-educa/scripts/monitorar_sistema.sh

# 7. RESUMO FINAL
log "🎉 ATIVAÇÃO COMPLETA FINALIZADA!"
echo ""
echo "=================================================="
echo "🚀 RE-EDUCA STORE - SISTEMA ATIVO"
echo "=================================================="
echo ""
echo "📍 URLs de Acesso:"
echo "   • Frontend: https://re-educa.topsupplementslab.com"
echo "   • API: https://api.topsupplementslab.com"
echo "   • API Local: http://localhost:9001"
echo "   • Nginx: http://localhost:8080"
echo ""
echo "🔧 Comandos Úteis:"
echo "   • Monitorar: ./scripts/monitorar_sistema.sh"
echo "   • Logs Backend: tail -f /var/log/re-educa-backend.log"
echo "   • Logs Nginx: tail -f /var/log/nginx/access.log"
echo ""
echo "📊 Status dos Serviços:"
echo "   • Backend: $(curl -s http://localhost:9001/health | jq -r '.status' 2>/dev/null || echo '❌')"
echo "   • Nginx: $(curl -s http://localhost:8080/health | jq -r '.status' 2>/dev/null || echo '❌')"
echo "   • API Externa: $(curl -s https://api.topsupplementslab.com/health | jq -r '.status' 2>/dev/null || echo '❌')"
echo ""
echo "🎯 Sistema pronto para produção!"
echo "=================================================="
