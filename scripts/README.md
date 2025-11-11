# 📜 Scripts - RE-EDUCA Store

Scripts utilitários para gerenciamento, desenvolvimento e deploy do projeto.

---

## 📋 Scripts Principais

### 🚀 Inicialização e Setup

- **`start.sh`** - Inicia backend e frontend em desenvolvimento
  - Verifica dependências
  - Inicia serviços na porta padrão
  - **Uso:** `./scripts/start.sh`

- **`install.sh`** - Instala todas as dependências
  - Python venv
  - Node.js packages
  - Configuração inicial
  - **Uso:** `./scripts/install.sh`

- **`ativar_sistema.sh`** - Ativação completa para produção
  - Inicia backend
  - Configura Nginx
  - Configura DNS via Cloudflare
  - **Uso:** `./scripts/ativar_sistema.sh` (produção)

### 📊 Monitoramento e Status

- **`monitorar_sistema.sh`** - Monitoramento rápido dos serviços
  - Verifica health checks
  - Mostra processos rodando
  - **Uso:** `./scripts/monitorar_sistema.sh`

- **`checklist_progress.sh`** - Mostra progresso do checklist de correções
  - Estatísticas por categoria
  - Barra de progresso visual
  - **Uso:** `./scripts/checklist_progress.sh`

### 🗄️ Banco de Dados e Migrações

- **`verificar_migrations_rigoroso.sh`** - Verificação completa de migrações
  - Compara migrações locais vs remotas
  - Valida sequência e formato
  - **Uso:** `./scripts/verificar_migrations_rigoroso.sh`

- **`reset_and_apply_migrations.sh`** - Aplica novas migrações após reset
  - Usa Supabase CLI
  - **Uso:** `./scripts/reset_and_apply_migrations.sh`

- **`reset_supabase_db.sh`** - Reset completo do banco de dados
  - ⚠️ **ATENÇÃO:** Apaga todos os dados
  - **Uso:** `./scripts/reset_supabase_db.sh`

### 🌐 Configuração e Deploy

- **`configurar_tunnel_cloudflare.sh`** - Configura tunnel Cloudflare
  - Para expor API localmente
  - **Uso:** `./scripts/configurar_tunnel_cloudflare.sh`

- **`configurar_dns_api.sh`** - Configura DNS da API
  - Integração com Cloudflare
  - **Uso:** `./scripts/configurar_dns_api.sh`

---

## 📁 Scripts por Categoria

### `deploy/` - Scripts de Deploy

- **`start_backend.sh`** - Inicia backend em produção (background)
- **`run_backend.sh`** - Inicia backend em desenvolvimento (foreground)
- **`install_deps.sh`** - Instala dependências para deploy

### `maintenance/` - Scripts de Manutenção

- **`start.sh`** - Inicia serviços (manutenção)
- **`status.sh`** - Status detalhado dos serviços
- **`stop.sh`** - Para todos os serviços

### `backup/` - Scripts de Backup

- **`backup.sh`** - Backup completo do sistema (Docker)

### `ssl/` - Scripts SSL

- **`ssl-check.sh`** - Verifica certificados SSL
- **`ssl-renew.sh`** - Renova certificados SSL

### `supabase/` - Scripts Supabase

- **`verificar_supabase.sh`** - Verificação completa do Supabase

---

## 🎯 Uso Rápido

### Desenvolvimento Local

```bash
# Instalar dependências (primeira vez)
./scripts/install.sh

# Iniciar serviços
./scripts/start.sh

# Monitorar
./scripts/monitorar_sistema.sh
```

### Produção

```bash
# Ativar sistema completo
./scripts/ativar_sistema.sh

# Status detalhado
./scripts/maintenance/status.sh
```

### Migrações

```bash
# Verificar migrações
./scripts/verificar_migrations_rigoroso.sh

# Aplicar migrações
./scripts/reset_and_apply_migrations.sh
```

---

## 📝 Notas

- Todos os scripts devem ser executados da raiz do projeto
- Scripts de produção requerem permissões especiais (sudo)
- Scripts de migrações requerem Supabase CLI configurado

---

**Última Atualização:** 2024-11-04
