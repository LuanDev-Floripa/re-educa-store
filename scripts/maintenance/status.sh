#!/bin/bash

# ================================
# RE-EDUCA Store - Script de Status
# ================================
# Este script mostra o status detalhado dos serviços

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Função para verificar se uma porta está em uso
port_in_use() {
    lsof -i :$1 >/dev/null 2>&1
}

# Função para obter informações de um processo
get_process_info() {
    local port=$1
    if port_in_use $port; then
        local pid=$(lsof -ti :$port)
        local process_info=$(ps -p $pid -o pid,ppid,cmd --no-headers 2>/dev/null)
        echo "$process_info"
    else
        echo ""
    fi
}

# Função para verificar saúde do serviço
check_service_health() {
    local url=$1
    local service_name=$2
    
    if curl -s --max-time 5 "$url" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Saudável${NC}"
    else
        echo -e "${RED}❌ Não responsivo${NC}"
    fi
}

# Função para mostrar informações do sistema
show_system_info() {
    echo -e "${PURPLE}🖥️  Informações do Sistema${NC}"
    echo "----------------------------------------"
    echo -e "${BLUE}OS:${NC} $(uname -s) $(uname -r)"
    echo -e "${BLUE}Arquitetura:${NC} $(uname -m)"
    echo -e "${BLUE}Uptime:${NC} $(uptime | cut -d',' -f1 | cut -d' ' -f4-)"
    echo -e "${BLUE}Memória:${NC} $(free -h | grep '^Mem:' | awk '{print $3 "/" $2}')"
    echo -e "${BLUE}Disco:${NC} $(df -h . | tail -1 | awk '{print $3 "/" $2 " (" $5 " usado)"}')"
    echo ""
}

# Função para mostrar informações dos serviços
show_services_info() {
    echo -e "${PURPLE}🚀 Status dos Serviços${NC}"
    echo "----------------------------------------"
    
    # Backend
    echo -e "${BLUE}Backend (Flask):${NC}"
    if port_in_use 9001; then
        local backend_info=$(get_process_info 9001)
        local backend_pid=$(echo $backend_info | awk '{print $1}')
        echo -e "  Status: ${GREEN}✅ Rodando${NC}"
        echo -e "  URL: ${CYAN}http://localhost:9001${NC}"
        echo -e "  PID: ${YELLOW}$backend_pid${NC}"
        echo -e "  Saúde: $(check_service_health 'http://localhost:9001' 'Backend')"
        echo -e "  Processo: ${backend_info}"
    else
        echo -e "  Status: ${RED}❌ Parado${NC}"
    fi
    echo ""
    
    # Frontend
    echo -e "${BLUE}Frontend (Vite):${NC}"
    if port_in_use 9002; then
        local frontend_info=$(get_process_info 9002)
        local frontend_pid=$(echo $frontend_info | awk '{print $1}')
        echo -e "  Status: ${GREEN}✅ Rodando${NC}"
        echo -e "  URL: ${CYAN}http://localhost:9002${NC}"
        echo -e "  PID: ${YELLOW}$frontend_pid${NC}"
        echo -e "  Saúde: $(check_service_health 'http://localhost:9002' 'Frontend')"
        echo -e "  Processo: ${frontend_info}"
    else
        echo -e "  Status: ${RED}❌ Parado${NC}"
    fi
    echo ""
}

# Função para mostrar informações de rede
show_network_info() {
    echo -e "${PURPLE}🌐 Informações de Rede${NC}"
    echo "----------------------------------------"
    
    # Portas em uso
    echo -e "${BLUE}Portas em uso:${NC}"
    for port in 9001 9002; do
        if port_in_use $port; then
            local process=$(lsof -i :$port | tail -1 | awk '{print $1}')
            echo -e "  Porta $port: ${GREEN}✅ Em uso por $process${NC}"
        else
            echo -e "  Porta $port: ${RED}❌ Livre${NC}"
        fi
    done
    echo ""
    
    # IP local
    local local_ip=$(hostname -I | awk '{print $1}' 2>/dev/null || echo "Não disponível")
    echo -e "${BLUE}IP Local:${NC} $local_ip"
    echo ""
}

# Função para mostrar informações de arquivos
show_files_info() {
    echo -e "${PURPLE}📁 Informações de Arquivos${NC}"
    echo "----------------------------------------"
    
    # Arquivos PID
    echo -e "${BLUE}Arquivos PID:${NC}"
    if [ -f "backend/backend.pid" ]; then
        local backend_pid=$(cat backend/backend.pid)
        echo -e "  Backend PID: ${YELLOW}$backend_pid${NC}"
    else
        echo -e "  Backend PID: ${RED}❌ Não encontrado${NC}"
    fi
    
    if [ -f "frontend.pid" ]; then
        local frontend_pid=$(cat frontend.pid)
        echo -e "  Frontend PID: ${YELLOW}$frontend_pid${NC}"
    else
        echo -e "  Frontend PID: ${RED}❌ Não encontrado${NC}"
    fi
    echo ""
    
    # Arquivos de log
    echo -e "${BLUE}Arquivos de Log:${NC}"
    if [ -f "backend.log" ]; then
        local backend_log_size=$(du -h backend.log | cut -f1)
        echo -e "  Backend log: ${GREEN}✅ Existe (${backend_log_size})${NC}"
    else
        echo -e "  Backend log: ${RED}❌ Não encontrado${NC}"
    fi
    
    if [ -f "frontend.log" ]; then
        local frontend_log_size=$(du -h frontend.log | cut -f1)
        echo -e "  Frontend log: ${GREEN}✅ Existe (${frontend_log_size})${NC}"
    else
        echo -e "  Frontend log: ${RED}❌ Não encontrado${NC}"
    fi
    echo ""
}

# Função para mostrar informações de ambiente
show_environment_info() {
    echo -e "${PURPLE}🔧 Informações de Ambiente${NC}"
    echo "----------------------------------------"
    
    # Python
    if command -v python3 >/dev/null 2>&1; then
        local python_version=$(python3 --version)
        echo -e "${BLUE}Python:${NC} ${GREEN}✅ $python_version${NC}"
    else
        echo -e "${BLUE}Python:${NC} ${RED}❌ Não instalado${NC}"
    fi
    
    # Node.js
    if command -v node >/dev/null 2>&1; then
        local node_version=$(node --version)
        echo -e "${BLUE}Node.js:${NC} ${GREEN}✅ $node_version${NC}"
    else
        echo -e "${BLUE}Node.js:${NC} ${RED}❌ Não instalado${NC}"
    fi
    
    # npm
    if command -v npm >/dev/null 2>&1; then
        local npm_version=$(npm --version)
        echo -e "${BLUE}npm:${NC} ${GREEN}✅ $npm_version${NC}"
    else
        echo -e "${BLUE}npm:${NC} ${RED}❌ Não instalado${NC}"
    fi
    
    # Ambiente virtual Python
    if [ -d "backend/venv" ]; then
        echo -e "${BLUE}Ambiente Virtual Python:${NC} ${GREEN}✅ Existe${NC}"
    else
        echo -e "${BLUE}Ambiente Virtual Python:${NC} ${RED}❌ Não encontrado${NC}"
    fi
    
    # Arquivo .env
    if [ -f "backend/.env" ]; then
        echo -e "${BLUE}Arquivo .env:${NC} ${GREEN}✅ Existe${NC}"
    else
        echo -e "${BLUE}Arquivo .env:${NC} ${RED}❌ Não encontrado${NC}"
    fi
    
    echo ""
}

# Função para mostrar resumo
show_summary() {
    echo -e "${PURPLE}📊 Resumo${NC}"
    echo "----------------------------------------"
    
    local backend_running=false
    local frontend_running=false
    
    if port_in_use 9001; then
        backend_running=true
    fi
    
    if port_in_use 9002; then
        frontend_running=true
    fi
    
    if [ "$backend_running" = true ] && [ "$frontend_running" = true ]; then
        echo -e "Status Geral: ${GREEN}✅ Todos os serviços rodando${NC}"
        echo -e "Aplicação: ${CYAN}http://localhost:9002${NC}"
        echo -e "API: ${CYAN}http://localhost:9001${NC}"
    elif [ "$backend_running" = true ]; then
        echo -e "Status Geral: ${YELLOW}⚠️  Apenas backend rodando${NC}"
        echo -e "API: ${CYAN}http://localhost:9001${NC}"
    elif [ "$frontend_running" = true ]; then
        echo -e "Status Geral: ${YELLOW}⚠️  Apenas frontend rodando${NC}"
        echo -e "Aplicação: ${CYAN}http://localhost:9002${NC}"
    else
        echo -e "Status Geral: ${RED}❌ Nenhum serviço rodando${NC}"
    fi
    
    echo ""
    echo -e "${BLUE}Comandos úteis:${NC}"
    echo -e "  • Iniciar: ${CYAN}./start.sh${NC}"
    echo -e "  • Parar: ${CYAN}./stop.sh${NC}"
    echo -e "  • Reiniciar: ${CYAN}./start.sh restart${NC}"
    echo -e "  • Logs: ${CYAN}tail -f backend.log${NC} ou ${CYAN}tail -f frontend.log${NC}"
    echo ""
}

# Função para mostrar ajuda
show_help() {
    echo -e "${PURPLE}RE-EDUCA Store - Script de Status${NC}"
    echo ""
    echo -e "${BLUE}Uso:${NC}"
    echo "  $0 [opções]"
    echo ""
    echo -e "${BLUE}Opções:${NC}"
    echo "  --services     Mostrar apenas status dos serviços"
    echo "  --system       Mostrar apenas informações do sistema"
    echo "  --network      Mostrar apenas informações de rede"
    echo "  --files        Mostrar apenas informações de arquivos"
    echo "  --environment  Mostrar apenas informações de ambiente"
    echo "  --summary      Mostrar apenas resumo"
    echo "  --help, -h     Mostrar esta ajuda"
    echo ""
    echo -e "${BLUE}Exemplos:${NC}"
    echo "  $0                    # Mostrar tudo"
    echo "  $0 --services        # Apenas serviços"
    echo "  $0 --summary         # Apenas resumo"
    echo ""
}

# Função principal
main() {
    local show_all=true
    local show_services=false
    local show_system=false
    local show_network=false
    local show_files=false
    local show_environment=false
    local show_summary_only=false
    
    # Processar argumentos
    for arg in "$@"; do
        case $arg in
            --services)
                show_all=false
                show_services=true
                ;;
            --system)
                show_all=false
                show_system=true
                ;;
            --network)
                show_all=false
                show_network=true
                ;;
            --files)
                show_all=false
                show_files=true
                ;;
            --environment)
                show_all=false
                show_environment=true
                ;;
            --summary)
                show_all=false
                show_summary_only=true
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                echo -e "${RED}Opção desconhecida: $arg${NC}"
                show_help
                exit 1
                ;;
        esac
    done
    
    # Mostrar informações baseado nos argumentos
    if [ "$show_all" = true ] || [ "$show_system" = true ]; then
        show_system_info
    fi
    
    if [ "$show_all" = true ] || [ "$show_services" = true ]; then
        show_services_info
    fi
    
    if [ "$show_all" = true ] || [ "$show_network" = true ]; then
        show_network_info
    fi
    
    if [ "$show_all" = true ] || [ "$show_files" = true ]; then
        show_files_info
    fi
    
    if [ "$show_all" = true ] || [ "$show_environment" = true ]; then
        show_environment_info
    fi
    
    if [ "$show_all" = true ] || [ "$show_summary_only" = true ]; then
        show_summary
    fi
}

# Executar função principal
main "$@"