# Resumo de Necessidades de Implementação - RE-EDUCA Store

## 🎯 Objetivo
Identificar todas as funcionalidades parcialmente implementadas ou faltantes para tornar o projeto 100% completo e funcional.

---

## 🔴 CRÍTICO - Implementar Imediatamente

### 1. Sistema de Reviews de Produtos (30% → 100%)
**Problema:** Frontend tenta criar reviews mas backend não tem endpoint.

**O que falta:**
- Rota POST `/api/products/<id>/reviews` 
- Rota PUT `/api/products/<id>/reviews/<review_id>` (editar)
- Rota DELETE `/api/products/<id>/reviews/<review_id>`
- Rota POST `/api/products/<id>/reviews/<review_id>/helpful` (marcar útil)
- `ReviewRepository` completo
- Implementação real de `create_review()` e `get_product_reviews()` no service
- Migration para tabela `product_reviews` com campos: `title`, `pros`, `cons`, `verified`, `helpful_count`, `images`, `updated_at`
- Atualização automática de `rating` e `reviews_count` em `products`

**Arquivos:**
- `backend/src/routes/products.py` - Adicionar rotas
- `backend/src/services/product_service.py` - Implementar métodos (linhas 170-217)
- `backend/src/repositories/` - Criar `review_repository.py`
- `supabase/migrations/` - Criar migration

**Impacto:** Sistema de avaliações não funciona.

---

### 2. Rastreamento de Pedidos (70% → 100%)
**Problema:** Método existe mas não há rota e integração com transportadoras.

**O que falta:**
- Rota GET `/api/orders/<id>/tracking`
- Integração com API Correios (ou similar)
- Detecção automática de transportadora baseado em `tracking_number`
- Webhook para atualização automática de status
- Histórico de rastreamento

**Arquivos:**
- `backend/src/routes/orders.py` - Adicionar rota
- `backend/src/services/order_service.py` - Completar método (linha 359)
- `backend/src/services/shipping_service.py` - Adicionar integração

**Impacto:** Usuários não conseguem rastrear pedidos.

---

### 3. Webhook Idempotency Completo
**Problema:** Idempotency pode não estar aplicado em todos os webhooks críticos.

**O que falta:**
- Verificar todos os webhooks têm `@idempotent_endpoint`
- Garantir verificação de `processed_webhooks` em todos os webhooks de pagamento
- Testes de duplicação

**Arquivos:**
- `backend/src/routes/payments.py` - Verificar webhooks
- `backend/src/services/payment_service.py` - Verificar implementação

**Impacto:** Risco de processar pagamentos duplicados.

---

## 🟡 IMPORTANTE - Implementar em Seguida

### 4. Estoque - Sistema de Alertas Automáticos
**O que falta:**
- Worker que verifica estoque baixo periodicamente
- Notificações por email para admin quando estoque < threshold
- Tabela de histórico de alertas
- Sistema de reabastecimento automático (opcional)

**Arquivos:**
- `backend/src/workers/` - Criar `inventory_alert_worker.py`
- `backend/src/services/inventory_service.py` - Adicionar métodos de alerta
- `backend/src/services/email_service.py` - Adicionar template de alerta

---

### 5. Frete - Integração com Transportadoras
**O que falta:**
- Integração com API Correios (ou similar)
- Cálculo de frete por CEP
- Cálculo por peso e dimensões (mencionado como "futuro")
- Múltiplas opções de frete (PAC, SEDEX, etc)

**Arquivos:**
- `backend/src/services/shipping_service.py` - Adicionar integração (linha 7 menciona futuro)
- Criar `backend/src/services/carrier_integration_service.py`

---

### 6. Social - Busca Avançada Real
**O que falta:**
- Implementar busca avançada real (TODO no frontend)
- Filtros avançados (por tipo, data, hashtag, etc)
- Analytics de audiência (mencionado como "implementar depois")

**Arquivos:**
- `frontend/src/pages/social/SocialPage.jsx` - Remover TODO e implementar
- `backend/src/routes/social_additional.py` - Completar analytics

---

### 7. Recomendações - Machine Learning
**O que falta:**
- Sistema de ML para recomendações (mencionado como "em produção usar ML")
- Coleta estruturada de dados de treinamento
- Retreinamento automático de modelos

**Arquivos:**
- `backend/src/services/product_service.py` - Linha 237-246
- `backend/src/services/ai_recommendation_service.py` - Verificar e completar

---

### 8. Live Streaming - Métricas WebSocket
**O que falta:**
- Métricas específicas de WebSocket (TODO)
- Contagem real de conexões (TODO)
- Contagem real de mensagens (TODO)

**Arquivos:**
- `backend/src/services/monitoring_service.py` - Completar TODOs
- `backend/src/services/websocket_service.py` - Adicionar métricas

---

## 🟢 MELHORIAS - Opcional

### 9. Gamificação Completa
- Verificar se sistema de desafios está completo
- Sistema de recompensas completo

### 10. Video Analytics Completo
- Analytics avançados de vídeos
- Métricas de engajamento

### 11. Admin Dashboard Completo
- Verificar se todas as métricas estão implementadas
- Exportação de relatórios completa

---

## 📊 Estatísticas

- **Total de funcionalidades incompletas:** 15
- **Críticas (bloqueiam funcionalidade):** 3
- **Importantes (melhoram experiência):** 7
- **Melhorias (opcionais):** 5

---

## ✅ Checklist Rápido

### Fase 1 - Crítico (1-2 semanas)
- [ ] Reviews: Criar rotas, repository, service completo
- [ ] Rastreamento: Rota + integração transportadoras
- [ ] Idempotency: Verificar todos webhooks

### Fase 2 - Importante (2-3 semanas)
- [ ] Alertas estoque: Worker + notificações
- [ ] Frete: Integração APIs transportadoras
- [ ] Social: Busca avançada + analytics
- [ ] WebSocket: Métricas completas

### Fase 3 - Melhorias (1-2 semanas)
- [ ] ML: Recomendações com machine learning
- [ ] Gamificação: Sistema completo
- [ ] Videos: Analytics avançado

---

## 🎯 Próximos Passos

1. **Revisar análise completa:** `ANALISE_COMPLETITUDE_MODULOS.md`
2. **Priorizar:** Começar pelas 3 funcionalidades críticas
3. **Implementar:** Seguir checklist detalhado
4. **Testar:** Garantir integração frontend/backend
5. **Documentar:** Atualizar documentação após cada implementação
