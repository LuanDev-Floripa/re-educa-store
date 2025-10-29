#!/bin/bash
# Script para monitorar logs do backend em tempo real

echo "🔍 Monitorando logs do RE-EDUCA Store Backend"
echo "📊 Arquivos de log disponíveis:"
echo "   1. backend.log (log principal)"
echo "   2. logs/app.log (log da aplicação)"
echo ""
echo "Pressione Ctrl+C para sair"
echo "=========================================="
echo ""

# Monitora ambos os logs simultaneamente
tail -f backend.log logs/app.log 2>/dev/null
