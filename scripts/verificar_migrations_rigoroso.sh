#!/bin/bash
# Script rigoroso de verificação de migrações do Supabase
# Verifica se todas as migrações foram aplicadas corretamente

set -e

echo "=========================================="
echo "🔍 VERIFICAÇÃO RIGOROSA DE MIGRAÇÕES"
echo "=========================================="
echo ""

cd "$(dirname "$0")/.."

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ERRORS=0
WARNINGS=0

# Função para imprimir status
print_ok() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
    ((ERRORS++))
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    ((WARNINGS++))
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# 1. Verificar se CLI está instalado
echo "1️⃣  Verificando Supabase CLI..."
if ! command -v supabase &> /dev/null; then
    print_error "Supabase CLI não encontrado"
    exit 1
fi
print_ok "Supabase CLI instalado: $(supabase --version | head -1)"

# 2. Verificar se está no diretório correto
echo ""
echo "2️⃣  Verificando estrutura do projeto..."
if [ ! -f "supabase/config.toml" ]; then
    print_error "Arquivo supabase/config.toml não encontrado"
    exit 1
fi
print_ok "Estrutura do projeto correta"

# 3. Verificar se projeto está linkado
echo ""
echo "3️⃣  Verificando vínculo do projeto..."
LINKED_PROJECT=$(supabase projects list 2>/dev/null | grep -E "●|LINKED" | grep -c "●" || echo "0")
if [ "$LINKED_PROJECT" -gt 0 ]; then
    print_ok "Projeto linkado (encontrado $LINKED_PROJECT projeto(s))"
    PROJECT_INFO=$(supabase projects list 2>/dev/null | grep "●" | awk '{print $4}')
    print_info "Project ID: $PROJECT_INFO"
else
    print_warning "Projeto não parece estar linkado. Tentando linkar..."
    supabase link --project-ref hgfrntbtqsarencqzsla || print_error "Falha ao linkar projeto"
fi

# 4. Listar arquivos de migração locais
echo ""
echo "4️⃣  Verificando arquivos de migração locais..."
MIGRATION_FILES=$(ls -1 supabase/migrations/*.sql 2>/dev/null | sort)
MIGRATION_COUNT=$(echo "$MIGRATION_FILES" | wc -l)

if [ "$MIGRATION_COUNT" -eq 0 ]; then
    print_error "Nenhum arquivo de migração encontrado"
    exit 1
fi

print_info "Total de migrações locais: $MIGRATION_COUNT"
echo ""
echo "Arquivos de migração:"
echo "$MIGRATION_FILES" | while read file; do
    basename "$file"
done

# 5. Verificar formato dos nomes das migrações
echo ""
echo "5️⃣  Verificando formato dos nomes das migrações..."
INVALID_FORMAT=0
for file in supabase/migrations/*.sql; do
    basename_file=$(basename "$file")
    if ! [[ "$basename_file" =~ ^[0-9]{3}_[a-zA-Z0-9_]+\.sql$ ]]; then
        print_error "Formato inválido: $basename_file (deve ser: 001_nome.sql)"
        ((INVALID_FORMAT++))
    fi
done

if [ "$INVALID_FORMAT" -eq 0 ]; then
    print_ok "Todos os arquivos têm formato válido"
fi

# 6. Verificar sequência numérica
echo ""
echo "6️⃣  Verificando sequência numérica das migrações..."
EXPECTED=1
for i in {1..999}; do
    num=$(printf "%03d" $i)
    file="supabase/migrations/${num}_*.sql"
    if ls $file 1> /dev/null 2>&1; then
        if [ "$EXPECTED" -ne "$i" ]; then
            print_error "Sequência quebrada: esperado $EXPECTED, encontrado $i"
        else
            print_ok "Migração $num encontrada"
        fi
        EXPECTED=$((i+1))
    fi
done

# 7. Verificar conteúdo das migrações (não vazias)
echo ""
echo "7️⃣  Verificando conteúdo das migrações..."
EMPTY_FILES=0
for file in supabase/migrations/*.sql; do
    if [ ! -s "$file" ]; then
        print_error "Arquivo vazio: $(basename $file)"
        ((EMPTY_FILES++))
    fi
    line_count=$(wc -l < "$file")
    if [ "$line_count" -lt 5 ]; then
        print_warning "Arquivo muito pequeno: $(basename $file) ($line_count linhas)"
    fi
done

if [ "$EMPTY_FILES" -eq 0 ]; then
    print_ok "Nenhum arquivo vazio encontrado"
fi

# 8. Verificar status das migrações no remoto
echo ""
echo "8️⃣  Verificando status das migrações no banco remoto..."
MIGRATION_LIST_OUTPUT=$(supabase migration list --linked 2>&1)

if echo "$MIGRATION_LIST_OUTPUT" | grep -q "connection refused\|failed to connect"; then
    print_warning "Não foi possível conectar ao banco remoto para verificação"
    print_info "Você pode verificar manualmente no Dashboard:"
    print_info "https://supabase.com/dashboard/project/hgfrntbtqsarencqzsla/database/migrations"
else
    # Extrair lista de migrações locais e remotas da tabela formatada
    LOCAL_MIGRATIONS=$(echo "$MIGRATION_LIST_OUTPUT" | awk '/^[[:space:]]*[0-9]{3}/ {print $1}' | tr -d ' ' || true)
    REMOTE_MIGRATIONS=$(echo "$MIGRATION_LIST_OUTPUT" | awk '/^[[:space:]]*[0-9]{3}/ {print $3}' | tr -d ' ' || true)
    
    LOCAL_COUNT=$(echo "$LOCAL_MIGRATIONS" | grep -c . || echo "0")
    REMOTE_COUNT=$(echo "$REMOTE_MIGRATIONS" | grep -c . || echo "0")
    
    # Limpar valores vazios
    LOCAL_COUNT=$(echo "$LOCAL_COUNT" | tr -d '\n' | sed 's/[^0-9]//g')
    REMOTE_COUNT=$(echo "$REMOTE_COUNT" | tr -d '\n' | sed 's/[^0-9]//g')
    
    if [ -z "$LOCAL_COUNT" ] || [ "$LOCAL_COUNT" = "" ]; then
        LOCAL_COUNT=0
    fi
    if [ -z "$REMOTE_COUNT" ] || [ "$REMOTE_COUNT" = "" ]; then
        REMOTE_COUNT=0
    fi
    
    print_info "Migrações locais detectadas: $LOCAL_COUNT"
    print_info "Migrações remotas detectadas: $REMOTE_COUNT"
    print_info "Arquivos de migração locais: $MIGRATION_COUNT"
    
    # Verificar correspondência
    if [ "$LOCAL_COUNT" -eq "$MIGRATION_COUNT" ] && [ "$REMOTE_COUNT" -eq "$MIGRATION_COUNT" ]; then
        print_ok "✅ Todas as $MIGRATION_COUNT migrações locais estão aplicadas no remoto!"
    elif [ "$LOCAL_COUNT" -eq "$REMOTE_COUNT" ] && [ "$LOCAL_COUNT" -eq "$MIGRATION_COUNT" ]; then
        print_ok "✅ Sincronização perfeita: Local=$LOCAL_COUNT, Remote=$REMOTE_COUNT, Arquivos=$MIGRATION_COUNT"
    else
        print_error "Discrepância detectada: Local=$LOCAL_COUNT, Remote=$REMOTE_COUNT, Arquivos=$MIGRATION_COUNT"
    fi
    
    # Verificar se cada migração local está no remoto
    MISSING_COUNT=0
    for file in supabase/migrations/*.sql; do
        basename_file=$(basename "$file")
        migration_num=$(echo "$basename_file" | cut -d'_' -f1)
        if ! echo "$REMOTE_MIGRATIONS" | grep -q "^$migration_num$"; then
            print_error "Migração $migration_num não está aplicada no remoto: $basename_file"
            ((MISSING_COUNT++))
        fi
    done
    
    if [ "$MISSING_COUNT" -eq 0 ] && [ "$REMOTE_COUNT" -eq "$MIGRATION_COUNT" ]; then
        print_ok "Todas as migrações individuais estão sincronizadas"
    fi
fi

# 9. Resumo
echo ""
echo "=========================================="
echo "📊 RESUMO DA VERIFICAÇÃO"
echo "=========================================="
echo ""

if [ "$ERRORS" -eq 0 ] && [ "$WARNINGS" -eq 0 ]; then
    print_ok "✅ Todas as verificações passaram!"
    echo ""
    print_info "Migrações locais: $MIGRATION_COUNT"
    if [ -n "$REMOTE_COUNT" ]; then
        print_info "Migrações remotas: $REMOTE_COUNT"
    fi
    exit 0
elif [ "$ERRORS" -eq 0 ]; then
    print_warning "⚠️  Verificação concluída com $WARNINGS aviso(s)"
    exit 0
else
    print_error "❌ Verificação falhou com $ERRORS erro(s) e $WARNINGS aviso(s)"
    exit 1
fi
