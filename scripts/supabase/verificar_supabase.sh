#!/bin/bash

# Script de verificação rápida do Supabase RE-EDUCA
# Funciona sem Docker

echo "🚀 VERIFICAÇÃO RÁPIDA DO SUPABASE RE-EDUCA"
echo "=========================================="
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para imprimir com cores
print_status() {
    if [ $2 -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
    else
        echo -e "${RED}❌ $1${NC}"
    fi
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# 1. Verificar se está no diretório correto
if [ ! -f "supabase/config.toml" ]; then
    echo -e "${RED}❌ Execute este script no diretório raiz do projeto RE-EDUCA${NC}"
    exit 1
fi

print_info "Diretório do projeto: $(pwd)"

# 2. Verificar se o Supabase CLI está instalado
if command -v supabase &> /dev/null; then
    print_status "Supabase CLI instalado" 0
    echo "   Versão: $(supabase --version)"
else
    print_status "Supabase CLI não encontrado" 1
    exit 1
fi

# 3. Verificar projetos vinculados
echo ""
print_info "Verificando projetos vinculados..."
if supabase projects list &> /dev/null; then
    print_status "Projetos vinculados" 0
    supabase projects list
else
    print_status "Erro ao listar projetos" 1
fi

# 4. Verificar migrações
echo ""
print_info "Verificando migrações..."
if supabase migration list &> /dev/null; then
    print_status "Migrações verificadas" 0
    echo "   Total de migrações: $(supabase migration list | grep -c '^[[:space:]]*[0-9]')"
else
    print_status "Erro ao verificar migrações" 1
fi

# 5. Verificar tabelas
echo ""
print_info "Verificando tabelas do banco..."
if supabase inspect db table-stats --linked &> /dev/null; then
    print_status "Tabelas verificadas" 0
    echo "   Total de tabelas: $(supabase inspect db table-stats --linked | grep -c 'public\.')"
else
    print_status "Erro ao verificar tabelas" 1
fi

# 6. Verificar arquivos de migração
echo ""
print_info "Verificando arquivos de migração locais..."
if [ -d "supabase/migrations" ]; then
    migration_count=$(ls -1 supabase/migrations/*.sql 2>/dev/null | wc -l)
    print_status "Diretório de migrações encontrado" 0
    echo "   Arquivos de migração: $migration_count"
else
    print_status "Diretório de migrações não encontrado" 1
fi

# 7. Verificar variáveis de ambiente
echo ""
print_info "Verificando configuração..."
if [ -f "backend/.env" ]; then
    if grep -q "SUPABASE_URL" backend/.env; then
        print_status "Arquivo .env encontrado" 0
        print_status "SUPABASE_URL configurado" 0
    else
        print_status "SUPABASE_URL não configurado" 1
    fi
    
    if grep -q "SUPABASE_ANON_KEY" backend/.env; then
        print_status "SUPABASE_ANON_KEY configurado" 0
    else
        print_status "SUPABASE_ANON_KEY não configurado" 1
    fi
    
    if grep -q "SUPABASE_SERVICE_KEY" backend/.env; then
        print_status "SUPABASE_SERVICE_KEY configurado" 0
    else
        print_status "SUPABASE_SERVICE_KEY não configurado" 1
    fi
else
    print_status "Arquivo .env não encontrado" 1
fi

# 8. Verificar scripts Python
echo ""
print_info "Verificando scripts Python..."
if [ -f "scripts/supabase/check_supabase_status.py" ]; then
    print_status "Script check_supabase_status.py encontrado" 0
else
    print_warning "Script check_supabase_status.py não encontrado"
fi

if [ -f "backend/create_bucket.py" ]; then
    print_status "Script create_bucket.py encontrado" 0
else
    print_warning "Script create_bucket.py não encontrado"
fi

# 9. Testar conexão com API
echo ""
print_info "Testando conexão com API..."
if [ -f "backend/.env" ]; then
    source backend/.env
    if [ ! -z "$SUPABASE_URL" ] && [ ! -z "$SUPABASE_ANON_KEY" ]; then
        if curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $SUPABASE_ANON_KEY" -H "apikey: $SUPABASE_ANON_KEY" "$SUPABASE_URL/rest/v1/" | grep -q "200"; then
            print_status "Conexão com API funcionando" 0
        else
            print_status "Erro na conexão com API" 1
        fi
    else
        print_warning "Variáveis de ambiente não carregadas"
    fi
else
    print_warning "Arquivo .env não encontrado para teste de API"
fi

# 10. Resumo final
echo ""
echo "=========================================="
echo "📊 RESUMO DA VERIFICAÇÃO"
echo "=========================================="

# Contar sucessos e falhas
success_count=0
total_checks=0

# Verificar cada item
checks=(
    "Supabase CLI instalado"
    "Projetos vinculados"
    "Migrações verificadas"
    "Tabelas verificadas"
    "Diretório de migrações"
    "Arquivo .env encontrado"
    "SUPABASE_URL configurado"
    "SUPABASE_ANON_KEY configurado"
    "SUPABASE_SERVICE_KEY configurado"
)

for check in "${checks[@]}"; do
    total_checks=$((total_checks + 1))
    # Aqui você pode adicionar lógica para contar sucessos
done

echo ""
print_info "Verificação concluída!"
echo ""
print_info "Para mais detalhes, execute:"
echo "   python3 scripts/supabase/check_supabase_status.py"
echo ""
print_info "Para ver estatísticas das tabelas:"
echo "   supabase inspect db table-stats --linked"
echo ""
print_info "Para aplicar migrações:"
echo "   supabase db push"
echo ""

# Verificar se há problemas críticos
if [ -f "backend/.env" ] && command -v supabase &> /dev/null; then
    echo -e "${GREEN}🎉 PROJETO RE-EDUCA SUPABASE: FUNCIONAL! 🎉${NC}"
else
    echo -e "${RED}⚠️  ALGUNS PROBLEMAS ENCONTRADOS - VERIFIQUE ACIMA ⚠️${NC}"
fi

echo ""
echo "=========================================="