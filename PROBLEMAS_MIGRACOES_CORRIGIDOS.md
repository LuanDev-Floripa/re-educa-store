# Problemas Encontrados e Corrigidos nas Migrações

**Data:** 2025-01-27  
**Análise:** Todas as 29 migrações revisadas

---

## 🔴 Problemas Críticos Encontrados

### 1. **001_base_schema.sql - Linha 400: Erro de Sintaxe**
**Problema:** Dois pontos e vírgulas (`;;`)
```sql
DROP POLICY IF EXISTS "Achievements are viewable by everyone" ON achievements;;
```
**Correção:** Remover um ponto e vírgula
```sql
DROP POLICY IF EXISTS "Achievements are viewable by everyone" ON achievements;
```

---

### 2. **001_base_schema.sql - Linhas 300-301: Redundância**
**Problema:** `DROP POLICY` duplicado
```sql
DROP POLICY IF EXISTS "Users can view own health_calculations" ON health_calculations;
DROP POLICY IF EXISTS "Users can view own health_calculations" ON health_calculations;
```
**Correção:** Remover linha duplicada

---

### 3. **004_social_network.sql - Linha 8: Comentário Incorreto**
**Problema:** Comentário diz "sem groups, pois groups está em 26" mas groups está na própria migração 004
```sql
-- Esta migração consolida:
-- - 05_social_network_schema.sql (sem groups, pois groups está em 26)
-- - 26_create_groups.sql
```
**Correção:** Atualizar comentário para refletir que groups está consolidado aqui

---

### 4. **005_health_calculations.sql - Linha 15: Comentário Confuso**
**Problema:** Comentário diz "Tabela calories_history não existe, usar calories_history"
```sql
-- Tabela calories_history não existe, usar calories_history
CREATE INDEX IF NOT EXISTS idx_calories_history_user_created ON calories_history(user_id, created_at DESC);
```
**Correção:** Remover comentário confuso (a tabela existe e está sendo usada corretamente)

---

### 5. **010_storage_system.sql - URLs Hardcoded**
**Problema:** URL do Supabase hardcoded em múltiplas funções
```sql
supabase_url := 'https://hgfrntbtqsarencqzsla.supabase.co';
```
**Correção:** Usar variável de ambiente ou configuração, não hardcode

---

### 6. **017_fix_race_conditions_atomic_transactions.sql - Colunas Faltantes**
**Problema:** Função `create_order_atomic` usa colunas que podem não existir:
- `subtotal` (não está em 001, pode estar em 003)
- `discount_amount` (não está em 001, pode estar em 003)
- `shipping_cost` (não está em 001, pode estar em 003)

**Correção:** Verificar se colunas existem antes de usar ou garantir que 003 foi executada antes

---

### 7. **024_add_message_attachments.sql - CHECK Constraint com NULL**
**Problema:** CHECK constraint permite NULL mas não está explícito
```sql
CHECK (attachment_type IN ('image', 'video', 'document', 'audio', NULL))
```
**Correção:** Permitir NULL explicitamente ou usar DEFAULT NULL

---

### 8. **029_report_schedules_system.sql - Título Inconsistente**
**Problema:** Título não segue padrão das outras migrações
```sql
-- ============================================================
-- Migration: Sistema de Agendamento de Relatórios
-- ============================================================
```
**Correção:** Seguir padrão: "Migração 029: Sistema de Agendamento de Relatórios"

---

## ⚠️ Problemas Menores

### 9. **Inconsistência em auth.uid()**
**Problema:** Algumas migrações usam `auth.uid()::text`, outras `auth.uid()::uuid`, outras apenas `auth.uid()`
**Impacto:** Pode causar problemas de comparação
**Correção:** Padronizar para `auth.uid()::uuid` quando comparando com UUID, `auth.uid()::text` quando comparando com TEXT

---

### 10. **Comentários em Português/Inglês Misturados**
**Problema:** Algumas políticas têm nomes em português, outras em inglês
**Exemplo:**
- "Posts são visíveis para todos" (português)
- "Users can view own messages" (inglês)
**Correção:** Padronizar para inglês (padrão da indústria) ou português (se preferir)

---

### 11. **Falta de Comentários em Algumas Funções**
**Problema:** Algumas funções não têm COMMENT
**Correção:** Adicionar COMMENT ON FUNCTION para todas as funções

---

## ✅ Correções Aplicadas
