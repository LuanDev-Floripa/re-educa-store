#!/bin/bash
# Script para acompanhar progresso do checklist de correções

CHECKLIST_FILE="docs/correcoes/CHECKLIST_COMPLETO_CORRECOES.md"

# Verificar se está sendo executado da raiz do projeto
if [ ! -f "$CHECKLIST_FILE" ]; then
    # Tentar caminho alternativo
    if [ -f "../$CHECKLIST_FILE" ]; then
        CHECKLIST_FILE="../$CHECKLIST_FILE"
    elif [ -f "CHECKLIST_COMPLETO_CORRECOES.md" ]; then
        CHECKLIST_FILE="CHECKLIST_COMPLETO_CORRECOES.md"
    else
        echo "❌ Arquivo $CHECKLIST_FILE não encontrado!"
        echo "💡 Execute este script da raiz do projeto"
        exit 1
    fi
fi

echo "=========================================="
echo "📊 PROGRESSO DO CHECKLIST DE CORREÇÕES"
echo "=========================================="
echo ""

# Contar itens
TOTAL_ITEMS=$(grep -c "^\s*-\s*\[" "$CHECKLIST_FILE" || echo "0")
COMPLETED_ITEMS=$(grep -c "^\s*-\s*\[x\]" "$CHECKLIST_FILE" || echo "0")
PENDING_ITEMS=$((TOTAL_ITEMS - COMPLETED_ITEMS))

# Calcular porcentagem
if [ "$TOTAL_ITEMS" -gt 0 ]; then
    PERCENTAGE=$(echo "scale=1; ($COMPLETED_ITEMS * 100) / $TOTAL_ITEMS" | bc)
else
    PERCENTAGE=0
fi

echo "📋 Total de Itens: $TOTAL_ITEMS"
echo "✅ Concluídos: $COMPLETED_ITEMS"
echo "⏳ Pendentes: $PENDING_ITEMS"
echo "📊 Progresso: ${PERCENTAGE}%"
echo ""

# Progresso por categoria
echo "📂 Por Categoria:"
echo ""

# Endpoints
ENDPOINTS_TOTAL=$(grep -A 100 "## 1️⃣ PADRONIZAÇÃO DE ENDPOINTS" "$CHECKLIST_FILE" | grep -B 100 "## 2️⃣" | grep -c "^\s*-\s*\[" || echo "0")
ENDPOINTS_DONE=$(grep -A 100 "## 1️⃣ PADRONIZAÇÃO DE ENDPOINTS" "$CHECKLIST_FILE" | grep -B 100 "## 2️⃣" | grep -c "^\s*-\s*\[x\]" || echo "0")
ENDPOINTS_PCT=$([ "$ENDPOINTS_TOTAL" -gt 0 ] && echo "scale=1; ($ENDPOINTS_DONE * 100) / $ENDPOINTS_TOTAL" | bc || echo "0")
echo "  1️⃣  Endpoints: $ENDPOINTS_DONE/$ENDPOINTS_TOTAL (${ENDPOINTS_PCT}%)"

# Supabase
SUPABASE_TOTAL=$(grep -A 200 "## 2️⃣ REFATORAÇÃO DE ACESSO AO SUPABASE" "$CHECKLIST_FILE" | grep -B 200 "## 3️⃣" | grep -c "^\s*-\s*\[" || echo "0")
SUPABASE_DONE=$(grep -A 200 "## 2️⃣ REFATORAÇÃO DE ACESSO AO SUPABASE" "$CHECKLIST_FILE" | grep -B 200 "## 3️⃣" | grep -c "^\s*-\s*\[x\]" || echo "0")
SUPABASE_PCT=$([ "$SUPABASE_TOTAL" -gt 0 ] && echo "scale=1; ($SUPABASE_DONE * 100) / $SUPABASE_TOTAL" | bc || echo "0")
echo "  2️⃣  Supabase: $SUPABASE_DONE/$SUPABASE_TOTAL (${SUPABASE_PCT}%)"

# CORS
CORS_TOTAL=$(grep -A 150 "## 3️⃣ CONFIGURAÇÃO DE CORS" "$CHECKLIST_FILE" | grep -B 150 "## 4️⃣" | grep -c "^\s*-\s*\[" || echo "0")
CORS_DONE=$(grep -A 150 "## 3️⃣ CONFIGURAÇÃO DE CORS" "$CHECKLIST_FILE" | grep -B 150 "## 4️⃣" | grep -c "^\s*-\s*\[x\]" || echo "0")
CORS_PCT=$([ "$CORS_TOTAL" -gt 0 ] && echo "scale=1; ($CORS_DONE * 100) / $CORS_TOTAL" | bc || echo "0")
echo "  3️⃣  CORS: $CORS_DONE/$CORS_TOTAL (${CORS_PCT}%)"

# Testes
TESTS_TOTAL=$(grep -A 100 "## 4️⃣ VALIDAÇÃO E TESTES" "$CHECKLIST_FILE" | grep -B 100 "## 5️⃣" | grep -c "^\s*-\s*\[" || echo "0")
TESTS_DONE=$(grep -A 100 "## 4️⃣ VALIDAÇÃO E TESTES" "$CHECKLIST_FILE" | grep -B 100 "## 5️⃣" | grep -c "^\s*-\s*\[x\]" || echo "0")
TESTS_PCT=$([ "$TESTS_TOTAL" -gt 0 ] && echo "scale=1; ($TESTS_DONE * 100) / $TESTS_TOTAL" | bc || echo "0")
echo "  4️⃣  Testes: $TESTS_DONE/$TESTS_TOTAL (${TESTS_PCT}%)"

# Documentação
DOCS_TOTAL=$(grep -A 50 "## 5️⃣ DOCUMENTAÇÃO" "$CHECKLIST_FILE" | grep -c "^\s*-\s*\[" || echo "0")
DOCS_DONE=$(grep -A 50 "## 5️⃣ DOCUMENTAÇÃO" "$CHECKLIST_FILE" | grep -c "^\s*-\s*\[x\]" || echo "0")
DOCS_PCT=$([ "$DOCS_TOTAL" -gt 0 ] && echo "scale=1; ($DOCS_DONE * 100) / $DOCS_TOTAL" | bc || echo "0")
echo "  5️⃣  Documentação: $DOCS_DONE/$DOCS_TOTAL (${DOCS_PCT}%)"

echo ""
echo "=========================================="

# Barra de progresso visual
FILLED=$((COMPLETED_ITEMS * 50 / TOTAL_ITEMS))
EMPTY=$((50 - FILLED))
printf "Progresso: ["
printf "%${FILLED}s" | tr ' ' '█'
printf "%${EMPTY}s" | tr ' ' '░'
printf "] ${PERCENTAGE}%%\n"

echo ""
echo "Para atualizar progresso, edite docs/correcoes/CHECKLIST_COMPLETO_CORRECOES.md"
echo "e marque os itens com [x] ao invés de [ ]"
echo ""
