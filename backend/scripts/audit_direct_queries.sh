#!/bin/bash
# Script para auditar queries diretas ao Supabase
# Uso: ./scripts/audit_direct_queries.sh

echo "🔍 Auditoria de Queries Diretas ao Supabase"
echo "=============================================="
echo ""

AUDIT_FILE="direct_queries_audit.txt"

# Limpa arquivo anterior
> "$AUDIT_FILE"

echo "📋 Buscando padrões de queries diretas..."
echo ""

# Padrões a buscar
PATTERNS=(
    "supabase_client.table"
    "self.supabase.table"
    "db.table"
    "self.db.table"
    ".table("
)

# Arquivos a excluir (repositórios podem usar)
EXCLUDE_DIRS=(
    "repositories"
    "__pycache__"
    "venv"
    "tests"
    "migrations"
)

EXCLUDE_PATTERN=$(IFS='|'; echo "${EXCLUDE_DIRS[*]}")

for pattern in "${PATTERNS[@]}"; do
    echo "🔎 Buscando: $pattern"
    
    grep -rn "$pattern" src/ \
        --exclude-dir="$EXCLUDE_PATTERN" \
        --exclude="*.pyc" \
        --exclude="*.pyo" \
        >> "$AUDIT_FILE" 2>/dev/null || true
done

# Conta ocorrências
TOTAL=$(wc -l < "$AUDIT_FILE" | tr -d ' ')

echo ""
echo "✅ Auditoria completa!"
echo "📊 Total de ocorrências encontradas: $TOTAL"
echo "📄 Resultado salvo em: $AUDIT_FILE"
echo ""
echo "⚠️  NOTA: Queries em repositórios são permitidas (camada de abstração)"
echo "⚠️  Queries em services/routes devem ser migradas para repositórios"
echo ""

if [ "$TOTAL" -gt 0 ]; then
    echo "📋 Primeiras 20 ocorrências:"
    echo "---"
    head -20 "$AUDIT_FILE"
    echo "..."
fi

exit 0
