#!/bin/bash

# ================================
# RE-EDUCA Store - Script de Parada
# ================================
# Este script para todos os serviços do projeto

set -e  # Parar em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Função para imprimir mensagens coloridas
print_message() {
    echo -e "${2}${1}${NC}"
}

print_header() {
    echo -e "${PURPLE}"
    echo "=========================================="
    echo "🛑 RE-EDUCA Store - Parando Serviços"
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

# Função para verificar se uma porta está em uso
port_in_use() {
    lsof -i :$1 >/dev/null 2>&1
}

# Função para matar processos em portas específicas
kill_port() {
    local port=$1
    local service_name=$2
    
    if port_in_use $port; then
        print_step "Parando $service_name na porta $port..."
        local pids=$(lsof -ti :$port)
        if [ ! -z "$pids" ]; then
            echo $pids | xargs kill -9 2>/dev/null || true
            sleep 1
            if ! port_in_use $port; then
                print_success "$service_name parado com sucesso"
            else
                print_warning "$service_name pode ainda estar rodando"
            fi
        fi
    else
        print_success "$service_name já está parado"
    fi
}

# Função para parar serviços por PID
stop_by_pid() {
    local pid_file=$1
    local service_name=$2
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if kill -0 $pid 2>/dev/null; then
            print_step "Parando $service_name (PID: $pid)..."
            kill $pid 2>/dev/null || true
            sleep 2
            
            # Verificar se ainda está rodando
            if kill -0 $pid 2>/dev/null; then
                print_warning "Forçando parada do $service_name..."
                kill -9 $pid 2>/dev/null || true
            fi
            
            print_success "$service_name parado"
        else
            print_success "$service_name já estava parado"
        fi
        rm -f "$pid_file"
    else
        print_success "Arquivo PID do $service_name não encontrado"
    fi
}

# Função para limpar arquivos temporários
cleanup_temp_files() {
    print_step "Limpando arquivos temporários..."
    
    # Remover arquivos de log se solicitado
    if [ "$1" = "--clean-logs" ]; then
        rm -f backend.log frontend.log
        print_success "Logs removidos"
    fi
    
    # Remover arquivos PID
    rm -f backend/backend.pid frontend.pid
    
    # Remover arquivos de lock se existirem
    rm -f backend/src/app.lock frontend/.vite.lock
    
    print_success "Arquivos temporários limpos"
}

# Função para mostrar status final
show_final_status() {
    echo ""
    echo -e "${BLUE}📊 Status Final:${NC}"
    
    if port_in_use 9001; then
        print_warning "Backend ainda está rodando na porta 9001"
    else
        print_success "Backend parado"
    fi
    
    if port_in_use 9002; then
        print_warning "Frontend ainda está rodando na porta 9002"
    else
        print_success "Frontend parado"
    fi
    
    echo ""
    print_success "🎉 Todos os serviços foram parados!"
    echo ""
    echo -e "${YELLOW}💡 Para iniciar novamente: ${BLUE}./start.sh${NC}"
    echo -e "${YELLOW}💡 Para limpar logs também: ${BLUE}./stop.sh --clean-logs${NC}"
    echo ""
}

# Função para mostrar ajuda
show_help() {
    echo -e "${PURPLE}RE-EDUCA Store - Script de Parada${NC}"
    echo ""
    echo -e "${BLUE}Uso:${NC}"
    echo "  $0 [opções]"
    echo ""
    echo -e "${BLUE}Opções:${NC}"
    echo "  --clean-logs    Remover arquivos de log também"
    echo "  --force         Forçar parada de todos os processos"
    echo "  --help, -h      Mostrar esta ajuda"
    echo ""
    echo -e "${BLUE}Exemplos:${NC}"
    echo "  $0                    # Parar serviços normalmente"
    echo "  $0 --clean-logs       # Parar e limpar logs"
    echo "  $0 --force            # Forçar parada"
    echo ""
}

# Função principal
main() {
    local clean_logs=false
    local force=false
    
    # Processar argumentos
    for arg in "$@"; do
        case $arg in
            --clean-logs)
                clean_logs=true
                ;;
            --force)
                force=true
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                print_error "Opção desconhecida: $arg"
                show_help
                exit 1
                ;;
        esac
    done
    
    print_header
    
    # Parar serviços por PID primeiro
    stop_by_pid "backend/backend.pid" "Backend"
    stop_by_pid "frontend.pid" "Frontend"
    
    # Parar por porta (caso os PIDs não tenham funcionado)
    kill_port 9001 "Backend"
    kill_port 9002 "Frontend"
    
    # Se forçado, tentar parar todos os processos relacionados
    if [ "$force" = true ]; then
        print_step "Modo forçado: parando todos os processos relacionados..."
        
        # Parar processos Python relacionados ao Flask
        pkill -f "python.*app.py" 2>/dev/null || true
        pkill -f "flask" 2>/dev/null || true
        
        # Parar processos Node relacionados ao Vite
        pkill -f "vite" 2>/dev/null || true
        pkill -f "node.*dev" 2>/dev/null || true
        
        # Aguardar um pouco
        sleep 2
        
        # Verificar novamente as portas
        kill_port 9001 "Backend (forçado)"
        kill_port 9002 "Frontend (forçado)"
    fi
    
    # Limpar arquivos temporários
    cleanup_temp_files $([ "$clean_logs" = true ] && echo "--clean-logs")
    
    # Mostrar status final
    show_final_status
}

# Executar função principal
main "$@"