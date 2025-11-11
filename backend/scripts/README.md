# 📜 Scripts - Backend

Scripts utilitários para gerenciamento e manutenção do backend.

## 📋 Scripts Disponíveis

### 🔍 Auditoria

- **`audit_endpoints.py`** - Valida padronização de endpoints
  - Verifica se todos os endpoints seguem o padrão `/api/`
  - Identifica duplicações de `url_prefix`
  - Valida registro de blueprints no `app.py`
  
  **Uso:**
  ```bash
  python scripts/audit_endpoints.py
  ```

- **`audit_direct_supabase.py`** - Auditoria de acesso direto ao Supabase
  - Identifica acessos diretos ao Supabase fora de repositories
  - Valida padrão Repository Pattern
  - Categoriza por severidade (crítico, atenção, legítimo)
  
  **Uso:**
  ```bash
  python scripts/audit_direct_supabase.py
  ```

### 👤 Administração

- **`create_admin.py`** - Criar usuário administrador
  - Cria usuário admin no Supabase Auth
  - Útil para setup inicial ou criação de novos admins
  
  **Uso:**
  ```bash
  python scripts/create_admin.py
  ```

- **`check_users.py`** - Verificar usuários cadastrados
  - Lista usuários do sistema
  - Mostra informações de perfis
  - Útil para administração
  
  **Uso:**
  ```bash
  python scripts/check_users.py
  ```

### 🗄️ Storage

- **`create_bucket.py`** - Criar bucket no Supabase Storage
  - Cria buckets necessários para a aplicação
  - Configura políticas RLS
  
  **Uso:**
  ```bash
  python scripts/create_bucket.py
  ```

- **`setup_supabase_storage.py`** - Setup completo de storage
  - Configura todos os buckets necessários
  - Define políticas de acesso
  - Setup completo de storage
  
  **Uso:**
  ```bash
  python scripts/setup_supabase_storage.py
  ```

### 📊 Dados

- **`populate_exercises.py`** - Popular banco com exercícios
  - Insere exercícios no banco de dados
  - Baseado na migration de workout system
  - 40+ exercícios pré-configurados
  
  **Uso:**
  ```bash
  python scripts/populate_exercises.py
  ```

### 🔧 Migrações

- **`apply_critical_migrations.py`** - Aplicar migrações críticas
  - Aplica migrações críticas (017 e 018) quando Supabase CLI não consegue conectar
  - Usa conexão direta ao PostgreSQL via psycopg2
  - Verifica se migrações já foram aplicadas antes de executar
  
  **Uso:**
  ```bash
  python scripts/apply_critical_migrations.py
  ```
  
  **Documentação completa:** Ver [README_MIGRATIONS.md](README_MIGRATIONS.md)

- **`check_migrations_status.py`** - Verificar status das migrações
  - Verifica quais migrações foram aplicadas
  - Compara migrações locais vs remotas
  - Útil para validar estado do banco de dados
  
  **Uso:**
  ```bash
  python scripts/check_migrations_status.py
  ```

### 🔍 Testes e Validação

- **`test_db_connection.py`** - Testar conexão com banco de dados
  - Valida conexão com Supabase PostgreSQL
  - Testa credenciais e conectividade
  - Útil para troubleshooting
  
  **Uso:**
  ```bash
  python scripts/test_db_connection.py
  ```

- **`add_http_timeouts.py`** - Auditoria de timeouts HTTP
  - Identifica chamadas HTTP sem timeout
  - Gera relatório de auditoria
  - Valida resiliência HTTP do sistema
  
  **Uso:**
  ```bash
  python scripts/add_http_timeouts.py
  ```

## 📝 Notas

- Todos os scripts devem ser executados do diretório `backend/`
- Certifique-se de ter as variáveis de ambiente configuradas (`.env`)
- Scripts de auditoria são úteis para validação durante desenvolvimento

## 🔄 Atualizações

Scripts são atualizados conforme necessário. Para adicionar novos scripts:
1. Siga o padrão existente
2. Adicione documentação clara
3. Use type hints e docstrings

---

**Última Atualização:** 2024-11-04
