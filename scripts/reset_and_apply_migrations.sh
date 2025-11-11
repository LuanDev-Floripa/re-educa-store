#!/bin/bash
# Script simplificado para aplicar novas migrações após reset do banco
# ATENÇÃO: Execute este script APÓS resetar o banco via Dashboard

set -e

echo "=========================================="
echo "APLICAR NOVAS MIGRAÇÕES AO SUPABASE"
echo "=========================================="
echo ""

cd "$(dirname "$0")/.."

# Verificar se Supabase CLI está instalado
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI não encontrado."
    exit 1
fi

# Verificar se projeto está linkado
if [ ! -f ".supabase/project.toml" ]; then
    echo "📌 Linkando projeto ao Supabase..."
    supabase link --project-ref hgfrntbtqsarencqzsla
fi

echo "📤 Aplicando todas as novas migrações..."
echo ""

# Aplicar migrações com include-all para garantir que todas sejam aplicadas
supabase db push --linked --include-all --yes

echo ""
echo "✅ Migrações aplicadas com sucesso!"
echo ""
echo "📋 Verificando migrações aplicadas..."
supabase migration list --linked 2>&1 || echo "⚠️  Não foi possível listar migrações (pode precisar de senha manualmente)"

echo ""
echo "=========================================="
echo "✅ PROCESSO CONCLUÍDO!"
echo "=========================================="
echo ""
echo "📝 Próximos passos:"
echo "   1. Verifique o Dashboard: https://supabase.com/dashboard/project/hgfrntbtqsarencqzsla/editor"
echo "   2. Confirme que todas as tabelas foram criadas"
echo "   3. Teste a aplicação"
echo ""
