# 🔧 Aplicar Migrações Críticas do Supabase

Este guia explica como aplicar as migrações críticas (017 e 018) quando o Supabase CLI não consegue conectar.

## 📋 Migrações Críticas Pendentes

- **017**: `fix_race_conditions_atomic_transactions` - Corrige race conditions em estoque
- **018**: `webhook_idempotency` - Adiciona idempotência em webhooks de pagamento

## 🚀 Método 1: Script Python (Recomendado)

### Pré-requisitos

1. **Instalar dependências:**
   ```bash
   cd /root/Projetos/re-educa/backend
   pip install psycopg2-binary
   ```

2. **Configurar variáveis de ambiente no `.env`:**
   
   **Opção A: URL completa de conexão (Recomendado)**
   ```env
   SUPABASE_DB_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require
   ```
   
   **Opção B: Variáveis separadas**
   ```env
   SUPABASE_DB_HOST=aws-0-us-east-1.pooler.supabase.com
   SUPABASE_DB_USER=postgres.[PROJECT_REF]
   SUPABASE_DB_PASSWORD=[SUA_SENHA]
   SUPABASE_DB_NAME=postgres
   SUPABASE_DB_PORT=5432
   ```

   💡 **Onde encontrar essas informações:**
   - Acesse: https://supabase.com/dashboard/project/[PROJECT_REF]/settings/database
   - Em "Connection string", copie a string de conexão
   - Ou use as informações de "Connection pooling"

### Executar o script

```bash
cd /root/Projetos/re-educa/backend
python3 scripts/apply_critical_migrations.py
```

O script irá:
- ✅ Verificar se as migrações já foram aplicadas
- ✅ Aplicar apenas as migrações pendentes
- ✅ Registrar as migrações na tabela `supabase_migrations.schema_migrations`
- ✅ Mostrar um resumo do que foi aplicado

## 🖥️ Método 2: Dashboard do Supabase (Manual)

Se o script não funcionar, você pode aplicar manualmente via Dashboard:

1. **Acesse o SQL Editor:**
   ```
   https://supabase.com/dashboard/project/hgfrntbtqsarencqzsla/sql
   ```

2. **Aplique a migração 017:**
   - Abra o arquivo: `supabase/migrations/017_fix_race_conditions_atomic_transactions.sql`
   - Copie todo o conteúdo
   - Cole no SQL Editor
   - Clique em "Run"

3. **Aplique a migração 018:**
   - Abra o arquivo: `supabase/migrations/018_webhook_idempotency.sql`
   - Copie todo o conteúdo
   - Cole no SQL Editor
   - Clique em "Run"

4. **Verificar aplicação:**
   ```bash
   supabase migration list
   ```

## 🔍 Verificar Status das Migrações

```bash
cd /root/Projetos/re-educa
supabase migration list
```

Ou via SQL:
```sql
SELECT * FROM supabase_migrations.schema_migrations 
ORDER BY version;
```

## ⚠️ Troubleshooting

### Erro: "psycopg2 não está instalado"
```bash
pip install psycopg2-binary
```

### Erro: "connection refused"
- Verifique se o projeto está ativo no Dashboard
- Verifique se as credenciais estão corretas
- Tente usar a URL de conexão direta (não pooler)

### Erro: "relation does not exist"
- Algumas migrações podem depender de outras
- Verifique se as migrações 001-016 foram aplicadas
- Execute: `supabase migration list` para verificar

### Erro: "permission denied"
- Use a Service Role Key ou credenciais de admin
- Verifique se o usuário tem permissões para criar funções e tabelas

## 📝 Notas Importantes

- ⚠️ **Migrações 019 e 020 são rollbacks** - Não precisam ser aplicadas a menos que seja necessário reverter
- ✅ **Migrações 017 e 018 são críticas** - Devem ser aplicadas o quanto antes
- 🔒 **Backup recomendado** - Faça backup antes de aplicar migrações em produção
- 🧪 **Teste primeiro** - Se possível, teste em ambiente de staging antes de produção

## 🔗 Links Úteis

- [Dashboard do Supabase](https://supabase.com/dashboard/project/hgfrntbtqsarencqzsla)
- [SQL Editor](https://supabase.com/dashboard/project/hgfrntbtqsarencqzsla/sql)
- [Database Settings](https://supabase.com/dashboard/project/hgfrntbtqsarencqzsla/settings/database)
