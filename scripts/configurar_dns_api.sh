#!/bin/bash

# 🌐 SCRIPT DE CONFIGURAÇÃO DNS PARA API
# Data: 26 de Janeiro de 2025
# Versão: 1.0

echo "🌐 CONFIGURANDO DNS PARA API RE-EDUCA..."
echo "=========================================="

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
}

warning() {
    echo -e "${YELLOW}[AVISO]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Obter IP público
log "📍 Obtendo IP público..."
PUBLIC_IP=$(curl -s ifconfig.me)
log "IP Público: $PUBLIC_IP"

# Verificar se nginx está rodando
log "🔍 Verificando nginx..."
if curl -s http://localhost:8080/health > /dev/null; then
    log "✅ Nginx funcionando em localhost:8080"
else
    error "❌ Nginx não está funcionando"
    exit 1
fi

# Verificar se backend está rodando
log "🔍 Verificando backend..."
if curl -s http://localhost:9001/health > /dev/null; then
    log "✅ Backend funcionando em localhost:9001"
else
    error "❌ Backend não está funcionando"
    exit 1
fi

# Testar conectividade externa
log "🌍 Testando conectividade externa..."
if curl -s http://$PUBLIC_IP:8080/health --connect-timeout 10 > /dev/null; then
    log "✅ Nginx acessível externamente em $PUBLIC_IP:8080"
    EXTERNAL_ACCESS=true
else
    warning "⚠️ Nginx não acessível externamente - pode ser firewall"
    EXTERNAL_ACCESS=false
fi

echo ""
echo "=========================================="
echo "📋 CONFIGURAÇÃO DNS NECESSÁRIA"
echo "=========================================="
echo ""
echo "Para configurar a API externamente, você precisa:"
echo ""
echo "1. 🌐 Acessar o painel do Cloudflare:"
echo "   https://dash.cloudflare.com/"
echo ""
echo "2. 🔧 Configurar DNS Record:"
echo "   • Tipo: A"
echo "   • Nome: api"
echo "   • Conteúdo: $PUBLIC_IP"
echo "   • TTL: 1 (Auto)"
echo "   • Proxy: ❌ Desabilitado (se nginx não acessível externamente)"
echo ""
echo "3. 🔧 Se nginx for acessível externamente:"
echo "   • Proxy: ✅ Habilitado"
echo "   • Porta: 8080"
echo ""

if [ "$EXTERNAL_ACCESS" = true ]; then
    echo "✅ CONFIGURAÇÃO RECOMENDADA:"
    echo "   • Use o IP: $PUBLIC_IP"
    echo "   • Configure como A record"
    echo "   • Habilite proxy do Cloudflare"
    echo "   • A API estará disponível em: https://api.topsupplementslab.com"
else
    echo "⚠️ CONFIGURAÇÃO ALTERNATIVA:"
    echo "   • Use o IP: $PUBLIC_IP"
    echo "   • Configure como A record"
    echo "   • Desabilite proxy do Cloudflare"
    echo "   • A API estará disponível em: http://api.topsupplementslab.com:8080"
fi

echo ""
echo "4. 🧪 Testar após configuração:"
echo "   curl https://api.topsupplementslab.com/health"
echo "   # ou"
echo "   curl http://api.topsupplementslab.com:8080/health"
echo ""

# Criar script de teste
log "📝 Criando script de teste..."
cat > /root/Projetos/re-educa/scripts/testar_api_externa.sh << 'TEST_EOF'
#!/bin/bash
echo "🧪 TESTANDO API EXTERNA..."
echo "=========================="

echo "1. Testando API via HTTPS (com proxy):"
curl -I https://api.topsupplementslab.com/health 2>/dev/null || echo "❌ HTTPS não funciona"

echo ""
echo "2. Testando API via HTTP (sem proxy):"
curl -I http://api.topsupplementslab.com:8080/health 2>/dev/null || echo "❌ HTTP não funciona"

echo ""
echo "3. Testando API local:"
curl -s http://localhost:9001/health | jq . 2>/dev/null || echo "❌ Local não funciona"

echo ""
echo "4. Testando nginx local:"
curl -s http://localhost:8080/health | jq . 2>/dev/null || echo "❌ Nginx não funciona"
TEST_EOF

chmod +x /root/Projetos/re-educa/scripts/testar_api_externa.sh

log "✅ Script de teste criado: ./scripts/testar_api_externa.sh"

echo ""
echo "=========================================="
echo "🎯 PRÓXIMOS PASSOS:"
echo "=========================================="
echo ""
echo "1. Configure o DNS no Cloudflare conforme instruções acima"
echo "2. Execute: ./scripts/testar_api_externa.sh"
echo "3. Se funcionar, a API estará disponível externamente!"
echo ""
echo "📞 Suporte: Verifique os logs em /var/log/re-educa-backend.log"
echo "=========================================="
