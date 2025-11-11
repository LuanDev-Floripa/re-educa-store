#!/bin/bash

# ================================
# RE-EDUCA Store - Script de Inicialização
# ================================
# Este script automatiza a inicialização completa do projeto
# Inclui verificação de dependências, setup do ambiente e start dos serviços

set -e  # Parar em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Função para imprimir mensagens coloridas
print_message() {
    echo -e "${2}${1}${NC}"
}

print_header() {
    echo -e "${PURPLE}"
    echo "=========================================="
    echo "🚀 RE-EDUCA Store - Inicialização"
    echo "=========================================="
    echo -e "${NC}"
}

print_step() {
    echo -e "${BLUE}📋 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Função para verificar se um comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Função para verificar se uma porta está em uso
port_in_use() {
    lsof -i :$1 >/dev/null 2>&1
}

# Função para aguardar um serviço estar pronto
wait_for_service() {
    local port=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1
    
    print_step "Aguardando $service_name estar pronto na porta $port..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s http://localhost:$port >/dev/null 2>&1; then
            print_success "$service_name está rodando!"
            return 0
        fi
        
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_error "$service_name não iniciou em tempo hábil"
    return 1
}

# Função para matar processos em portas específicas
kill_port() {
    local port=$1
    if port_in_use $port; then
        print_warning "Porta $port está em uso. Tentando liberar..."
        lsof -ti :$port | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
}

# Função para verificar dependências do sistema
check_system_dependencies() {
    print_step "Verificando dependências do sistema..."
    
    # Verificar Python
    if ! command_exists python3; then
        print_error "Python 3 não está instalado. Instale Python 3.8+ e tente novamente."
        exit 1
    fi
    
    local python_version=$(python3 --version | cut -d' ' -f2)
    local python_major=$(echo $python_version | cut -d'.' -f1)
    local python_minor=$(echo $python_version | cut -d'.' -f2)
    
    if [[ $python_major -lt 3 ]] || [[ $python_major -eq 3 && $python_minor -lt 8 ]]; then
        print_error "Python 3.8+ é necessário. Versão atual: $python_version"
        exit 1
    fi
    print_success "Python $python_version encontrado"
    
    # Verificar Node.js
    if ! command_exists node; then
        print_error "Node.js não está instalado. Instale Node.js 16+ e tente novamente."
        exit 1
    fi
    
    local node_version=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [[ $node_version -lt 16 ]]; then
        print_error "Node.js 16+ é necessário. Versão atual: $(node --version)"
        exit 1
    fi
    print_success "Node.js $(node --version) encontrado"
    
    # Verificar npm
    if ! command_exists npm; then
        print_error "npm não está instalado."
        exit 1
    fi
    print_success "npm $(npm --version) encontrado"
    
    # Verificar pip
    if ! command_exists pip3; then
        print_error "pip3 não está instalado."
        exit 1
    fi
    print_success "pip3 encontrado"
}

# Função para configurar ambiente Python
setup_python_env() {
    print_step "Configurando ambiente Python..."
    
    cd backend
    
    # Criar ambiente virtual se não existir
    if [ ! -d "venv" ]; then
        print_step "Criando ambiente virtual Python..."
        python3 -m venv venv
        print_success "Ambiente virtual criado"
    else
        print_success "Ambiente virtual já existe"
    fi
    
    # Ativar ambiente virtual
    source venv/bin/activate
    print_success "Ambiente virtual ativado"
    
    # Atualizar pip
    print_step "Atualizando pip..."
    pip install --upgrade pip >/dev/null 2>&1
    
    # Instalar dependências
    print_step "Instalando dependências Python..."
    if [ -f "requirements.txt" ]; then
        pip install -r requirements.txt >/dev/null 2>&1
        print_success "Dependências Python instaladas"
    else
        print_error "Arquivo requirements.txt não encontrado"
        exit 1
    fi
    
    cd ..
}

# Função para configurar ambiente Node.js
setup_node_env() {
    print_step "Configurando ambiente Node.js..."
    
    cd frontend
    
    # Verificar se package.json existe
    if [ ! -f "package.json" ]; then
        print_error "package.json não encontrado no diretório frontend"
        exit 1
    fi
    
    # Instalar dependências
    print_step "Instalando dependências Node.js..."
    if command_exists pnpm; then
        print_step "Usando pnpm..."
        pnpm install --legacy-peer-deps >/dev/null 2>&1
    else
        print_step "Usando npm..."
        npm install --legacy-peer-deps >/dev/null 2>&1
    fi
    print_success "Dependências Node.js instaladas"
    
    cd ..
}

# Função para configurar arquivo .env
setup_env_file() {
    print_step "Configurando arquivo de ambiente..."
    
    cd backend
    
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env
            print_success "Arquivo .env criado a partir do .env.example"
            print_warning "IMPORTANTE: Edite o arquivo .env com suas credenciais antes de usar em produção!"
        else
            print_error "Arquivo .env.example não encontrado"
            exit 1
        fi
    else
        print_success "Arquivo .env já existe"
    fi
    
    cd ..
}

# Função para inicializar banco de dados
setup_database() {
    print_step "Inicializando banco de dados..."
    
    cd backend
    source venv/bin/activate
    
    if [ -f "setup.py" ]; then
        python setup.py >/dev/null 2>&1
        print_success "Banco de dados inicializado"
    else
        print_warning "Arquivo setup.py não encontrado. Criando banco manualmente..."
        python -c "
import sys
sys.path.append('src')
from config.database_sqlite import init_database
init_database()
print('Banco de dados criado com sucesso')
" >/dev/null 2>&1
        print_success "Banco de dados criado manualmente"
    fi
    
    cd ..
}

# Função para iniciar backend
start_backend() {
    print_step "Iniciando backend..."
    
    cd backend
    source venv/bin/activate
    
    # Liberar porta 9001 se estiver em uso
    kill_port 9001
    
    # Iniciar backend em background
    print_step "Iniciando servidor Flask na porta 9001..."
    nohup python src/app.py > backend.log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > backend.pid
    
    # Aguardar backend estar pronto
    if wait_for_service 9001 "Backend"; then
        print_success "Backend iniciado com sucesso (PID: $BACKEND_PID)"
    else
        print_error "Falha ao iniciar backend"
        exit 1
    fi
    
    cd ..
}

# Função para iniciar frontend
start_frontend() {
    print_step "Iniciando frontend..."
    
    cd frontend
    
    # Liberar porta 9002 se estiver em uso
    kill_port 9002
    
    # Iniciar frontend em background
    print_step "Iniciando servidor Vite na porta 9002..."
    if command_exists pnpm; then
        nohup pnpm dev --port 9002 > ../frontend.log 2>&1 &
    else
        nohup npm run dev -- --port 9002 > ../frontend.log 2>&1 &
    fi
    FRONTEND_PID=$!
    echo $FRONTEND_PID > ../frontend.pid
    
    # Aguardar frontend estar pronto
    if wait_for_service 9002 "Frontend"; then
        print_success "Frontend iniciado com sucesso (PID: $FRONTEND_PID)"
    else
        print_error "Falha ao iniciar frontend"
        exit 1
    fi
    
    cd ..
}

# Função para mostrar status dos serviços
show_status() {
    echo -e "${CYAN}"
    echo "=========================================="
    echo "📊 STATUS DOS SERVIÇOS"
    echo "=========================================="
    echo -e "${NC}"
    
    # Verificar backend
    if port_in_use 9001; then
        print_success "Backend: http://localhost:9001 (Rodando)"
    else
        print_error "Backend: Não está rodando"
    fi
    
    # Verificar frontend
    if port_in_use 9002; then
        print_success "Frontend: http://localhost:9002 (Rodando)"
    else
        print_error "Frontend: Não está rodando"
    fi
    
    echo ""
    print_success "🎉 RE-EDUCA Store está rodando!"
    echo ""
    echo -e "${YELLOW}📱 Acesse a aplicação em: http://localhost:9002${NC}"
    echo -e "${YELLOW}🔧 API Backend em: http://localhost:9001${NC}"
    echo ""
    echo -e "${BLUE}📋 Comandos úteis:${NC}"
    echo -e "  • Parar serviços: ${CYAN}./stop.sh${NC}"
    echo -e "  • Ver logs: ${CYAN}tail -f backend.log${NC} ou ${CYAN}tail -f frontend.log${NC}"
    echo -e "  • Status: ${CYAN}./start.sh status${NC}"
    echo ""
}

# Função para parar serviços
stop_services() {
    print_step "Parando serviços..."
    
    # Parar backend
    if [ -f "backend/backend.pid" ]; then
        BACKEND_PID=$(cat backend/backend.pid)
        if kill -0 $BACKEND_PID 2>/dev/null; then
            kill $BACKEND_PID
            print_success "Backend parado (PID: $BACKEND_PID)"
        fi
        rm -f backend/backend.pid
    fi
    
    # Parar frontend
    if [ -f "frontend.pid" ]; then
        FRONTEND_PID=$(cat frontend.pid)
        if kill -0 $FRONTEND_PID 2>/dev/null; then
            kill $FRONTEND_PID
            print_success "Frontend parado (PID: $FRONTEND_PID)"
        fi
        rm -f frontend.pid
    fi
    
    # Forçar parada de processos nas portas
    kill_port 5000
    kill_port 5173
    
    print_success "Todos os serviços foram parados"
}

# Função para mostrar logs
show_logs() {
    local service=$1
    
    case $service in
        "backend")
            if [ -f "backend.log" ]; then
                tail -f backend.log
            else
                print_error "Arquivo de log do backend não encontrado"
            fi
            ;;
        "frontend")
            if [ -f "frontend.log" ]; then
                tail -f frontend.log
            else
                print_error "Arquivo de log do frontend não encontrado"
            fi
            ;;
        *)
            print_error "Uso: $0 logs [backend|frontend]"
            ;;
    esac
}

# Função para mostrar ajuda
show_help() {
    echo -e "${PURPLE}RE-EDUCA Store - Script de Inicialização${NC}"
    echo ""
    echo -e "${BLUE}Uso:${NC}"
    echo "  $0 [comando]"
    echo ""
    echo -e "${BLUE}Comandos:${NC}"
    echo "  start     Iniciar todos os serviços (padrão)"
    echo "  stop      Parar todos os serviços"
    echo "  restart   Reiniciar todos os serviços"
    echo "  status    Mostrar status dos serviços"
    echo "  setup     Apenas configurar ambiente (sem iniciar)"
    echo "  logs      Mostrar logs [backend|frontend]"
    echo "  help      Mostrar esta ajuda"
    echo ""
    echo -e "${BLUE}Exemplos:${NC}"
    echo "  $0                # Iniciar tudo"
    echo "  $0 start          # Iniciar tudo"
    echo "  $0 stop           # Parar tudo"
    echo "  $0 restart        # Reiniciar tudo"
    echo "  $0 status         # Ver status"
    echo "  $0 setup          # Apenas configurar"
    echo "  $0 logs backend   # Ver logs do backend"
    echo "  $0 logs frontend  # Ver logs do frontend"
    echo ""
}

# Função principal
main() {
    local command=${1:-start}
    
    case $command in
        "start")
            print_header
            check_system_dependencies
            setup_python_env
            setup_node_env
            setup_env_file
            setup_database
            start_backend
            start_frontend
            show_status
            ;;
        "stop")
            print_header
            stop_services
            ;;
        "restart")
            print_header
            stop_services
            sleep 3
            main start
            ;;
        "status")
            print_header
            show_status
            ;;
        "setup")
            print_header
            check_system_dependencies
            setup_python_env
            setup_node_env
            setup_env_file
            setup_database
            print_success "Ambiente configurado com sucesso!"
            print_warning "Execute '$0 start' para iniciar os serviços"
            ;;
        "logs")
            show_logs $2
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            print_error "Comando desconhecido: $command"
            show_help
            exit 1
            ;;
    esac
}

# Verificar se bc está instalado (necessário para comparações)
if ! command_exists bc; then
    print_warning "bc não está instalado. Instalando..."
    if command_exists apt-get; then
        sudo apt-get update && sudo apt-get install -y bc
    elif command_exists brew; then
        brew install bc
    elif command_exists yum; then
        sudo yum install -y bc
    else
        print_error "Não foi possível instalar bc automaticamente. Instale manualmente."
        exit 1
    fi
fi

# Executar função principal
main "$@"