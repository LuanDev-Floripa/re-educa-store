#!/bin/bash
# Script para executar testes de integração

echo "=========================================="
echo "Executando Testes de Integração"
echo "=========================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar se pytest está instalado
if ! command -v pytest &> /dev/null; then
    echo -e "${RED}Erro: pytest não encontrado${NC}"
    echo "Instale com: pip install pytest pytest-cov"
    exit 1
fi

# Executar testes
echo -e "\n${YELLOW}1. Testes de Validação Simples${NC}"
pytest tests/integration/test_simple_validation.py -v

echo -e "\n${YELLOW}2. Testes de Endpoints Críticos${NC}"
pytest tests/integration/test_critical_endpoints.py -v

echo -e "\n${YELLOW}3. Testes de Cobertura de API${NC}"
pytest tests/integration/test_api_coverage.py -v

echo -e "\n${YELLOW}4. Testes de Estrutura de Respostas${NC}"
pytest tests/integration/test_endpoint_responses.py -v

echo -e "\n${YELLOW}5. Todos os Testes de Integração${NC}"
pytest tests/integration/ -v --tb=short

echo -e "\n${GREEN}=========================================="
echo "Testes de Integração Concluídos!"
echo "==========================================${NC}"
