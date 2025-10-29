# Testes E2E com Puppeteer e Lynx

Sistema de testes end-to-end que usa Puppeteer para automação de navegador e Lynx para captura de logs do backend.

## 🎯 Características

- ✅ **Bypass de Autenticação**: Ignora middlewares de auth seguindo boas práticas
- ✅ **Captura de Logs**: Usa Lynx para capturar logs do backend em tempo real
- ✅ **Screenshots**: Captura automática de telas durante os testes
- ✅ **Integração Completa**: Testa frontend, backend e interações

## 📋 Pré-requisitos

```bash
# Instalar dependências
npm install --save-dev puppeteer jest @jest/globals

# Garantir que Lynx está instalado
apt-get install -y lynx
```

## 🚀 Como Usar

### Opção 1: Script Automático

```bash
cd /root/Projetos/re-educa/backend
./tests/e2e/run_tests.sh
```

### Opção 2: Manual com Jest

```bash
# Configurar variáveis de ambiente
export TESTING=true
export BYPASS_AUTH=true
export TEST_BASE_URL=http://localhost:9001
export TEST_FRONTEND_URL=http://localhost:9002

# Executar testes
cd /root/Projetos/re-educa/backend
npx jest tests/e2e/ --config=tests/e2e/jest.config.js
```

## ⚙️ Configuração

As configurações estão em `test_config.js`:

- `BYPASS_AUTH`: Bypassa autenticação (padrão: true)
- `TEST_BASE_URL`: URL do backend (padrão: http://localhost:9001)
- `TEST_FRONTEND_URL`: URL do frontend (padrão: http://localhost:9002)
- `PUPPETEER_HEADLESS`: Modo headless (padrão: true)

## 📝 Estrutura de Arquivos

```
tests/e2e/
├── README.md              # Esta documentação
├── jest.config.js         # Configuração Jest
├── setup.js               # Setup antes de cada teste
├── globalSetup.js         # Setup global
├── globalTeardown.js      # Teardown global
├── test_config.js         # Configurações de teste
├── puppeteer_setup.js     # Classe de setup do Puppeteer
├── test_dashboard.js      # Testes do dashboard
└── run_tests.sh           # Script de execução
```

## 🔍 Bypass de Autenticação

O sistema usa um middleware especial (`auth_test.py`) que:

1. Verifica se `TESTING=true` e `BYPASS_AUTH=true`
2. Cria um usuário mock automaticamente
3. Ignora validação de tokens JWT
4. Permite acesso a rotas protegidas sem login real

**⚠️ IMPORTANTE**: Isso só funciona quando as variáveis de ambiente estão configuradas corretamente.

## 📊 Captura de Logs

O sistema captura logs de duas fontes:

1. **Logs do Backend**: Usa Lynx para ler `logs/app.log`
2. **Logs do Navegador**: Captura console.log, erros e warnings do Puppeteer

Os logs são salvos em `logs/e2e/` após cada teste.

## 📸 Screenshots

Screenshots são capturados automaticamente durante os testes e salvos em `logs/e2e/screenshots/`.

## 🧪 Exemplo de Teste

```javascript
test('Deve carregar dashboard sem autenticação', async () => {
    await setup.navigateToDashboard(true); // bypass auth
    const dashboardLoaded = await setup.waitForElement('.dashboard');
    expect(dashboardLoaded).toBe(true);
});
```

## 🔒 Boas Práticas

1. ✅ Sempre use `BYPASS_AUTH=true` nos testes
2. ✅ Não use credenciais reais em testes
3. ✅ Limpe estado entre testes
4. ✅ Capture logs para debugging
5. ✅ Use screenshots para identificar problemas visuais

## 🐛 Troubleshooting

**Erro: "Backend não está rodando"**
- Certifique-se de que o backend está rodando em `http://localhost:9001`
- Verifique com: `curl http://localhost:9001/health`

**Erro: "Lynx não encontrado"**
- Instale: `apt-get install -y lynx`

**Teste falha com erro 401/403**
- Verifique se `BYPASS_AUTH=true` está configurado
- Verifique se o middleware de teste está sendo usado

## 📚 Recursos

- [Puppeteer Docs](https://pptr.dev/)
- [Jest Docs](https://jestjs.io/)
- [Lynx Docs](https://lynx.invisible-island.net/)
