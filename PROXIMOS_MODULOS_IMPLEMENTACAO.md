# 🎯 Próximos Módulos para Implementação - RE-EDUCA Store

**Data:** 2025-01-27  
**Status:** Análise de Próximos Passos

---

## 📊 Resumo Executivo

### ✅ Módulos Completos (Dashboard Admin)
- ✅ Gestão de Usuários
- ✅ Gestão de Produtos
- ✅ Gestão de Estoque
- ✅ Gestão de Cupons
- ✅ Gestão de Promoções
- ✅ Gestão de Pedidos
- ✅ Gestão de Afiliados
- ✅ Analytics
- ✅ Logs e Auditoria
- ✅ Configurações Gerais
- ✅ Configuração de IA

### ⏳ Próximos Módulos Identificados

---

## 🔴 PRIORIDADE ALTA - Funcionalidades Críticas

### 1. Sistema de Reviews de Produtos (30% → 100%)
**Status:** Backend parcial, Frontend não funciona

**O que falta:**
- ❌ Rota POST `/api/products/<id>/reviews` 
- ❌ Rota PUT `/api/products/<id>/reviews/<review_id>` (editar)
- ❌ Rota DELETE `/api/products/<id>/reviews/<review_id>`
- ❌ Rota POST `/api/products/<id>/reviews/<review_id>/helpful` (marcar útil)
- ❌ `ReviewRepository` completo
- ❌ Migration para campos faltantes: `title`, `pros`, `cons`, `verified`, `helpful_count`, `images`, `updated_at`
- ❌ Atualização automática de `rating` e `reviews_count` em `products`

**Arquivos:**
- `backend/src/routes/products.py` - Adicionar rotas
- `backend/src/services/product_service.py` - Implementar métodos
- `backend/src/repositories/review_repository.py` - Criar/Completar
- `supabase/migrations/027_complete_reviews_system.sql` - Criar migration

**Impacto:** Sistema de avaliações não funciona no frontend.

**Estimativa:** 2-3 dias

---

### 2. Rastreamento de Pedidos (70% → 100%)
**Status:** Método existe mas não há rota e integração

**O que falta:**
- ❌ Rota GET `/api/orders/<id>/tracking`
- ❌ Integração com API Correios (ou similar)
- ❌ Detecção automática de transportadora baseado em `tracking_number`
- ❌ Webhook para atualização automática de status
- ❌ Histórico de rastreamento
- ❌ Frontend para visualizar rastreamento

**Arquivos:**
- `backend/src/routes/orders.py` - Adicionar rota
- `backend/src/services/order_service.py` - Completar método
- `backend/src/services/carrier_detection_service.py` - Expandir
- `frontend/src/pages/store/OrdersPage.jsx` - Adicionar visualização

**Impacto:** Usuários não conseguem rastrear pedidos.

**Estimativa:** 2-3 dias

---

### 3. Webhook Idempotency Completo
**Status:** Parcial - pode não estar em todos os webhooks

**O que falta:**
- ❌ Verificar todos os webhooks têm `@idempotent_endpoint`
- ❌ Garantir verificação de `processed_webhooks` em todos os webhooks de pagamento
- ❌ Testes de duplicação

**Arquivos:**
- `backend/src/routes/payments.py` - Verificar webhooks
- `backend/src/services/payment_service.py` - Verificar implementação

**Impacto:** Risco de processar pagamentos duplicados.

**Estimativa:** 1 dia

---

## 🟡 PRIORIDADE MÉDIA - Módulos Admin Faltantes

### 4. Página de Moderação de Rede Social
**Status:** Backend completo, Frontend admin faltando

**Backend Disponível:**
- ✅ `backend/src/routes/social.py` - Rotas de moderação
- ✅ `backend/src/routes/social_additional.py` - Analytics
- ✅ Sistema de reports e banimento

**O que falta:**
- ❌ `frontend/src/pages/admin/AdminSocialModerationPage.jsx`
- ❌ Listagem de posts reportados
- ❌ Ações de moderação (aprovar, rejeitar, banir)
- ❌ Analytics de rede social
- ❌ Gestão de usuários banidos

**Funcionalidades:**
- Listar posts reportados
- Visualizar detalhes do post
- Aprovar/Rejeitar posts
- Banir/Desbanir usuários
- Analytics de engajamento
- Histórico de moderação

**Estimativa:** 2-3 dias

---

### 5. Página de Gestão de Exercícios e Planos
**Status:** Backend completo, Frontend admin faltando

**Backend Disponível:**
- ✅ `backend/src/routes/exercises.py` - CRUD completo
- ✅ `backend/src/services/exercise_service.py` - Service completo

**O que falta:**
- ❌ `frontend/src/pages/admin/AdminExercisesPage.jsx`
- ❌ `frontend/src/pages/admin/AdminWorkoutPlansPage.jsx`
- ❌ CRUD de exercícios
- ❌ CRUD de planos de treino
- ❌ Estatísticas de uso
- ❌ Categorização e tags

**Funcionalidades:**
- Listar exercícios com filtros
- Criar/Editar/Deletar exercícios
- Listar planos de treino
- Criar/Editar/Deletar planos
- Estatísticas de uso (mais usados, mais populares)
- Categorias e tags

**Estimativa:** 2-3 dias

---

### 6. Relatórios Avançados
**Status:** Backend parcial, Frontend básico

**Backend Disponível:**
- ✅ GET `/api/admin/reports/export` - Exportação CSV/JSON
- ✅ Analytics básicos

**O que falta:**
- ❌ Interface visual de relatórios
- ❌ Relatórios customizados
- ❌ Agendamento de relatórios
- ❌ Templates de relatórios
- ❌ Relatórios em PDF
- ❌ Dashboard de relatórios

**Arquivos:**
- `frontend/src/pages/admin/AdminReportsPage.jsx` - Criar página completa
- `backend/src/routes/admin_reports.py` - Expandir rotas
- `backend/src/services/report_service.py` - Criar service

**Funcionalidades:**
- Visualização de relatórios com gráficos
- Filtros avançados (período, categoria, etc)
- Exportação em múltiplos formatos (PDF, CSV, Excel)
- Agendamento de relatórios (email automático)
- Templates pré-configurados
- Relatórios customizados

**Estimativa:** 3-4 dias

---

## 🟢 PRIORIDADE BAIXA - Melhorias e Otimizações

### 7. Sistema de Alertas de Estoque Automáticos
**Status:** Backend parcial

**O que falta:**
- ❌ Worker que verifica estoque baixo periodicamente
- ❌ Notificações por email para admin
- ❌ Tabela de histórico de alertas
- ❌ Sistema de reabastecimento automático (opcional)

**Arquivos:**
- `backend/src/workers/inventory_alert_worker.py` - Criar worker
- `backend/src/services/inventory_service.py` - Expandir métodos
- `backend/src/services/email_service.py` - Template de alerta

**Estimativa:** 2 dias

---

### 8. Integração Completa com Transportadoras
**Status:** Backend básico

**O que falta:**
- ❌ Integração com API Correios completa
- ❌ Integração com outras transportadoras (Jadlog, Loggi, etc)
- ❌ Cálculo por peso e dimensões
- ❌ Múltiplas opções de frete (PAC, SEDEX, etc)
- ❌ Cache de cálculos de frete

**Arquivos:**
- `backend/src/services/correios_integration_service.py` - Expandir
- `backend/src/services/shipping_service.py` - Completar integração

**Estimativa:** 3-4 dias

---

### 9. Melhorias no Dashboard Admin
**Status:** Funcional mas pode melhorar

**Melhorias sugeridas:**
- ❌ Gráficos de tendência temporal (Chart.js ou Recharts)
- ❌ Widgets customizáveis
- ❌ Comparação com período anterior
- ❌ Notificações em tempo real
- ❌ Atalhos rápidos personalizáveis

**Estimativa:** 2-3 dias

---

### 10. Melhorias nas Páginas Existentes

#### Gestão de Usuários
- ❌ Criação de novos usuários (botão existe mas não implementado)
- ❌ Histórico de atividades do usuário
- ❌ Exportação de lista de usuários
- ❌ Reset de senha administrativo
- ❌ Atribuição de permissões específicas

**Estimativa:** 1-2 dias

#### Gestão de Produtos
- ❌ Gestão de variações (tamanho, cor, etc)
- ❌ Importação em massa (CSV/Excel)
- ❌ Duplicação de produtos
- ❌ Preview antes de publicar
- ❌ Histórico de alterações

**Estimativa:** 2-3 dias

#### Gestão de Pedidos
- ❌ Cancelamento de pedidos
- ❌ Reembolso administrativo
- ❌ Edição de itens do pedido
- ❌ Histórico de alterações
- ❌ Notas internas
- ❌ Impressão de etiquetas de envio
- ❌ Gestão de devoluções

**Estimativa:** 2-3 dias

---

## 📋 TODOs Pendentes (Prioridade Alta)

### 11. Rate Limiting Robusto
**Status:** ⏳ PENDENTE  
**Arquivo:** `backend/src/utils/decorators.py:132`

**Ação:**
- [ ] Verificar que `rate_limit_helper.py` já usa Flask-Limiter
- [ ] Aplicar `@rate_limit()` em rotas críticas
- [ ] Remover decorator básico de `decorators.py`

**Estimativa:** 1 dia

---

### 12. Cache Distribuído
**Status:** ⏳ PENDENTE  
**Arquivo:** `backend/src/utils/decorators.py:195`

**Ação:**
- [ ] Implementar decorator `@cache_result()` usando `CacheService`
- [ ] Aplicar em endpoints de leitura (GET /products, etc)
- [ ] Implementar invalidação automática

**Estimativa:** 1 dia

---

### 13. Migração AffiliateService
**Status:** ⏳ PENDENTE  
**Arquivo:** `backend/src/services/affiliate_service.py:42`

**Ação:**
- [ ] Remover acesso direto ao Supabase
- [ ] Criar métodos faltantes em `AffiliateRepository`
- [ ] Substituir `self.supabase` por `self.repo`

**Estimativa:** 1-2 dias

---

### 14. Métricas de API
**Status:** ⏳ PENDENTE  
**Arquivo:** `backend/src/services/monitoring_service.py:261`

**Ação:**
- [ ] Criar middleware para coletar tempo de resposta
- [ ] Armazenar métricas no Redis
- [ ] Implementar agregação (média, p95, p99)
- [ ] Contar requisições e erros por endpoint

**Estimativa:** 2 dias

---

## 📊 Matriz de Priorização

| Módulo | Prioridade | Impacto | Esforço | Status |
|--------|-----------|---------|---------|--------|
| Reviews de Produtos | 🔴 Alta | Alto | Médio | 30% |
| Rastreamento Pedidos | 🔴 Alta | Alto | Médio | 70% |
| Webhook Idempotency | 🔴 Alta | Alto | Baixo | 80% |
| Moderação Social | 🟡 Média | Médio | Médio | 0% |
| Gestão Exercícios | 🟡 Média | Médio | Médio | 0% |
| Relatórios Avançados | 🟡 Média | Médio | Alto | 40% |
| Alertas Estoque | 🟢 Baixa | Médio | Baixo | 50% |
| Integração Frete | 🟢 Baixa | Médio | Alto | 60% |
| Rate Limiting | 🔴 Alta | Alto | Baixo | 90% |
| Cache Distribuído | 🔴 Alta | Alto | Baixo | 80% |
| Migração Affiliate | 🔴 Alta | Médio | Baixo | 90% |
| Métricas API | 🔴 Alta | Alto | Médio | 70% |

---

## 🎯 Plano de Implementação Sugerido

### Fase 1 - Crítico (1-2 semanas)
1. **Reviews de Produtos** (#1) - 2-3 dias
2. **Rastreamento Pedidos** (#2) - 2-3 dias
3. **Webhook Idempotency** (#3) - 1 dia
4. **Rate Limiting** (#11) - 1 dia
5. **Cache Distribuído** (#12) - 1 dia
6. **Métricas API** (#14) - 2 dias

**Total:** 9-11 dias

### Fase 2 - Admin Faltante (1 semana)
7. **Moderação Social** (#4) - 2-3 dias
8. **Gestão Exercícios** (#5) - 2-3 dias
9. **Relatórios Avançados** (#6) - 3-4 dias

**Total:** 7-10 dias

### Fase 3 - Melhorias (1 semana)
10. **Alertas Estoque** (#7) - 2 dias
11. **Integração Frete** (#8) - 3-4 dias
12. **Melhorias Dashboard** (#9) - 2-3 dias
13. **Melhorias Páginas** (#10) - 2-3 dias

**Total:** 9-12 dias

---

## 📈 Progresso Geral

- **Dashboard Admin:** 100% ✅
- **Funcionalidades Críticas:** 60% ⏳
- **Módulos Admin Faltantes:** 0% ❌
- **Melhorias:** 30% ⏳

**Total Geral:** ~65% completo

---

## ✅ Conclusão

**Próximos Passos Imediatos:**
1. Implementar sistema de Reviews completo (crítico para e-commerce)
2. Implementar rastreamento de pedidos (essencial para UX)
3. Completar webhook idempotency (segurança)
4. Adicionar módulos admin faltantes (moderação, exercícios, relatórios)

**Estimativa Total:** 3-4 semanas para completar todos os módulos identificados.

---

**Última atualização:** 2025-01-27
