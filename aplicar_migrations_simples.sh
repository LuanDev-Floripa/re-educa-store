#!/bin/bash
# Script para aplicar migrations do Supabase
# Método 1: Via CLI (se funcionar)
# Método 2: Via SQL direto no Dashboard

echo "🔧 Tentando aplicar migrations via Supabase CLI..."

# Tentar push simples
if supabase db push --password H@cker9981 2>&1 | grep -q "applied\|success"; then
    echo "✅ Migrations aplicadas via CLI!"
else
    echo "⚠️ CLI não funcionou. Use o arquivo SQL no Dashboard:"
    echo "📄 APLICAR_MIGRATIONS_SUPABASE.sql"
    echo ""
    echo "📝 Instruções:"
    echo "   1. Acesse: https://supabase.com/dashboard/project/hgfrntbtqsarencqzsla/sql"
    echo "   2. Cole o conteúdo de APLICAR_MIGRATIONS_SUPABASE.sql"
    echo "   3. Clique em 'Run'"
fi
