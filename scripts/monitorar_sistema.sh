#!/bin/bash
echo "🔍 MONITORAMENTO RE-EDUCA - $(date)"
echo "=================================="

echo "📊 Backend (localhost:9001):"
curl -s http://localhost:9001/health | jq . 2>/dev/null || echo "❌ Backend não responde"

echo ""
echo "🌐 Nginx (localhost:8080):"
curl -s http://localhost:8080/health | jq . 2>/dev/null || echo "❌ Nginx não responde"

echo ""
echo "🌍 API Externa:"
curl -s https://api.topsupplementslab.com/health | jq . 2>/dev/null || echo "❌ API externa não responde"

echo ""
echo "📈 Processos:"
ps aux | grep -E "(python3.*app.py|nginx)" | grep -v grep

echo ""
echo "🔌 Portas abertas:"
netstat -tlnp 2>/dev/null | grep -E "(9001|8080)" || echo "❌ Portas não encontradas"
