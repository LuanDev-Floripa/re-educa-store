# Testes de Integração - RE-EDUCA Store

## 📋 Visão Geral

Este diretório contém testes de integração para validar que todos os endpoints críticos do frontend estão funcionando corretamente no backend.

## 🎯 Objetivos

1. **Validar Cobertura Completa**: Garantir que os 68 endpoints do frontend estão implementados
2. **Validar Endpoints Críticos**: Testar os 11 endpoints críticos identificados
3. **Validar Estrutura de Respostas**: Garantir que respostas são JSON válido
4. **Prevenir Regressões**: Detectar quebras quando novos endpoints são adicionados

## 📁 Estrutura

```
tests/integration/
├── conftest.py                    # Configurações compartilhadas
├── test_critical_endpoints.py     # Testes dos 11 endpoints críticos
├── test_api_coverage.py           # Validação de cobertura completa
├── test_endpoint_responses.py     # Validação de estrutura de respostas
└── README.md                      # Este arquivo
```

## 🚀 Como Executar

### Executar todos os testes de integração:
```bash
cd backend
pytest tests/integration/ -v -m integration
```

### Executar testes específicos:
```bash
# Testes de endpoints críticos
pytest tests/integration/test_critical_endpoints.py -v

# Testes de cobertura
pytest tests/integration/test_api_coverage.py -v

# Testes de respostas
pytest tests/integration/test_endpoint_responses.py -v
```

### Executar com cobertura:
```bash
pytest tests/integration/ --cov=src --cov-report=html -m integration
```

## 📊 Endpoints Testados

### Endpoints Críticos (11)
1. ✅ `GET /api/cart`
2. ✅ `GET /api/orders`
3. ✅ `GET /api/products`
4. ✅ `GET /api/exercises`
5. ✅ `GET /api/health/imc/history`
6. ✅ `GET /api/health/food-diary/entries`
7. ✅ `GET /api/social/messages`
8. ✅ `GET /api/social/groups`
9. ✅ `GET /api/gamification/stats`
10. ✅ `GET /api/gamification/challenges`
11. ✅ `POST /api/payments/process`

### Categorias de Endpoints (68 total)
- **Health:** 15 endpoints
- **Products:** 10 endpoints
- **Social:** 12 endpoints
- **Orders:** 7 endpoints
- **Cart:** 8 endpoints
- **Users:** 5 endpoints
- **Exercises:** 8 endpoints
- **Payments:** 3 endpoints

## 🔧 Configuração

Os testes usam:
- **pytest** como framework de testes
- **Mocks** para serviços externos (Supabase, Stripe, etc.)
- **Flask test client** para requisições HTTP
- **Fixtures** para setup/teardown

## 📝 Fixtures Disponíveis

- `app`: Instância da aplicação Flask
- `client`: Cliente de teste HTTP
- `auth_headers`: Headers de autenticação
- `mock_user`: Mock de usuário
- `db`: Conexão com banco de dados

## ⚠️ Notas Importantes

1. **Autenticação**: Os testes usam mocks para autenticação. Em produção, usar tokens reais.
2. **Banco de Dados**: Os testes não modificam dados reais. Usar banco de teste separado.
3. **Serviços Externos**: Todos os serviços externos são mockados.

## 🐛 Troubleshooting

### Erro: "Module not found"
```bash
# Instalar dependências
pip install -r requirements.txt
```

### Erro: "Database connection failed"
```bash
# Verificar variáveis de ambiente
# Os testes devem usar banco de teste, não produção
```

### Erro: "Authentication failed"
```bash
# Os testes usam mocks de autenticação
# Verificar se @token_required está sendo mockado corretamente
```

## 📈 Métricas de Cobertura

Execute com cobertura para ver estatísticas:
```bash
pytest tests/integration/ --cov=src --cov-report=term-missing
```

## 🔄 CI/CD

Estes testes devem ser executados:
- Antes de cada commit (pre-commit hook)
- Em cada pull request
- Antes de cada deploy

## 📚 Referências

- [Documentação pytest](https://docs.pytest.org/)
- [Documentação Flask Testing](https://flask.palletsprojects.com/en/2.0.x/testing/)
- [Documentação de Verificação de Endpoints](../docs/VERIFICACAO_MINUCIOSA_COMPLETA.md)
