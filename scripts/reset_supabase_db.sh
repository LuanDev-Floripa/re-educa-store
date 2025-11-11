#!/bin/bash
# Script para resetar completamente o banco de dados Supabase e aplicar novas migrações
# ATENÇÃO: Este script apaga TODOS os dados do banco!

set -e

echo "=========================================="
echo "RESET COMPLETO DO BANCO SUPABASE"
echo "=========================================="
echo ""
echo "⚠️  ATENÇÃO: Este script irá:"
echo "   1. Apagar TODAS as tabelas do banco"
echo "   2. Aplicar todas as novas migrações consolidadas"
echo ""
read -p "Deseja continuar? (digite 'SIM' para confirmar): " confirm

if [ "$confirm" != "SIM" ]; then
    echo "Operação cancelada."
    exit 1
fi

cd "$(dirname "$0")/.."

# Verificar se Supabase CLI está instalado
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI não encontrado. Instale primeiro."
    exit 1
fi

# Verificar se projeto está linkado
if [ ! -f ".supabase/project.toml" ]; then
    echo "📌 Linkando projeto ao Supabase..."
    supabase link --project-ref hgfrntbtqsarencqzsla
fi

echo ""
echo "🔄 Opção 1: Reset via Dashboard (RECOMENDADO)"
echo "   Acesse: https://supabase.com/dashboard/project/hgfrntbtqsarencqzsla/settings/database"
echo "   E clique em 'Reset Database'"
echo ""
echo "🔄 Opção 2: Aplicar migrações novas (vai criar novas tabelas)"
echo "   Executando: supabase db push --linked --include-all"
echo ""

read -p "Deseja aplicar as novas migrações agora? (s/n): " apply_migrations

if [ "$apply_migrations" = "s" ] || [ "$apply_migrations" = "S" ]; then
    echo ""
    echo "📤 Aplicando migrações..."
    supabase db push --linked --include-all --yes
    
    echo ""
    echo "✅ Migrações aplicadas com sucesso!"
    echo ""
    echo "📋 Verificando status..."
    supabase migration list --linked || echo "⚠️  Não foi possível listar migrações (pode precisar de senha)"
else
    echo "Operação cancelada."
    exit 0
fi

echo ""
echo "=========================================="
echo "✅ PROCESSO CONCLUÍDO!"
echo "=========================================="
echo ""
echo "📝 Próximos passos:"
echo "   1. Verifique o Dashboard do Supabase"
echo "   2. Confirme que todas as tabelas foram criadas"
echo "   3. Teste a aplicação"
echo ""
