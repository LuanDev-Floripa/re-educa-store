# ✅ Checklist Detalhado de Implementação - TODOs

**Data:** 2025-01-08  
**Status:** Análise Completa do Código e Banco de Dados

---

## 📋 Índice

1. [Análise do Estado Atual](#análise-do-estado-atual)
2. [Checklist por Prioridade](#checklist-por-prioridade)
3. [Dependências e Pré-requisitos](#dependências-e-pré-requisitos)
4. [Padrões Arquiteturais](#padrões-arquiteturais)

---

## 🔍 Análise do Estado Atual

### Banco de Dados

#### Tabela `reviews` (001_base_schema.sql)
```sql
CREATE TABLE reviews (
    id UUID PRIMARY KEY,
    product_id UUID REFERENCES products(id),
    user_id UUID REFERENCES users(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Campos Faltantes para Funcionalidade Completa:**
- `title` TEXT - Título da avaliação
- `pros` TEXT - Pontos positivos
- `cons` TEXT - Pontos negativos
- `verified` BOOLEAN - Compra verificada
- `helpful_count` INTEGER - Contador de "útil"
- `not_helpful_count` INTEGER - Contador de "não útil"
- `images` TEXT[] - Array de URLs de imagens
- `updated_at` TIMESTAMP - Data de atualização

### Dependências Instaladas ✅

- ✅ Flask-Limiter==4.0.0 (já instalado)
- ✅ Flask-Caching==2.3.1 (já instalado)
- ✅ redis==5.0.1 (já instalado)
- ✅ jsonschema==4.25.1 (já instalado)
- ✅ Redis configurado e funcionando

### Padrões Arquiteturais Identificados

1. **Repositórios:**
   - Herdam de `BaseRepository`
   - Métodos: `find_by_id`, `find_all`, `create`, `update`, `delete`
   - Cache automático via `BaseRepository`
   - Validação de erros padronizada

2. **Services:**
   - Herdam de `BaseService`
   - Usam repositórios (não acesso direto ao Supabase)
   - Tratamento de erros padronizado
   - Logging consistente

3. **Rate Limiting:**
   - Já implementado com Redis (`rate_limit_redis.py`)
   - Flask-Limiter configurado globalmente
   - Decorators disponíveis em `utils/rate_limit_helper.py`

4. **Cache:**
   - `CacheService` já implementado
   - Redis como backend
   - Fallback para memória se Redis indisponível

---

## ✅ CHECKLIST POR PRIORIDADE

---

## 🔴 PRIORIDADE ALTA

### 1. Sistema de Avaliações de Produtos

#### 1.1 Migração de Banco de Dados
- [ ] Criar migration `021_add_review_fields.sql`
- [ ] Adicionar coluna `title` TEXT
- [ ] Adicionar coluna `pros` TEXT
- [ ] Adicionar coluna `cons` TEXT
- [ ] Adicionar coluna `verified` BOOLEAN DEFAULT false
- [ ] Adicionar coluna `helpful_count` INTEGER DEFAULT 0
- [ ] Adicionar coluna `not_helpful_count` INTEGER DEFAULT 0
- [ ] Adicionar coluna `images` TEXT[]
- [ ] Adicionar coluna `updated_at` TIMESTAMP WITH TIME ZONE
- [ ] Criar índice em `(product_id, created_at)` para performance
- [ ] Criar índice em `(user_id, product_id)` para evitar duplicatas
- [ ] Adicionar RLS policies se necessário
- [ ] Testar migration em ambiente de desenvolvimento

#### 1.2 Criar ReviewRepository
- [ ] Criar arquivo `backend/src/repositories/review_repository.py`
- [ ] Herdar de `BaseRepository` com `table_name="reviews"`
- [ ] Implementar `find_by_product(product_id, page, per_page)`
- [ ] Implementar `find_by_user(user_id)`
- [ ] Implementar `find_by_product_and_user(product_id, user_id)` (verificar duplicatas)
- [ ] Implementar `update_helpful_count(review_id, increment)`
- [ ] Implementar `get_rating_stats(product_id)` (agregação)
- [ ] Adicionar validações de rating (1-5)
- [ ] Adicionar cache para reviews populares
- [ ] Testes unitários do repositório

#### 1.3 Atualizar ProductService
- [ ] Remover comentário TODO linha 184
- [ ] Implementar `get_product_reviews()` usando `ReviewRepository`
- [ ] Implementar paginação correta
- [ ] Implementar ordenação (newest, oldest, highest_rating, most_helpful)
- [ ] Implementar filtro por rating
- [ ] Remover comentário TODO linha 207
- [ ] Implementar `create_product_review()` usando `ReviewRepository`
- [ ] Validar que usuário comprou o produto (verificar `orders`)
- [ ] Validar que usuário não já avaliou (evitar duplicatas)
- [ ] Atualizar `products.rating` e `products.reviews_count` após criar review
- [ ] Testes unitários do service

#### 1.4 Atualizar Rotas
- [ ] Verificar rota `GET /api/products/<product_id>/reviews` (já existe)
- [ ] Adicionar query params: `page`, `per_page`, `sort`, `filter_rating`
- [ ] Criar rota `POST /api/products/<product_id>/reviews`
- [ ] Adicionar validação de dados de entrada
- [ ] Adicionar `@token_required` na rota POST
- [ ] Adicionar tratamento de exceções
- [ ] Testes de integração das rotas

#### 1.5 Atualizar Frontend
- [ ] Verificar `ProductReviews.jsx` (já existe e está completo)
- [ ] Atualizar `apiService.products.getReviews()` para usar query params
- [ ] Atualizar `apiService.products.addReview()` para enviar todos os campos
- [ ] Remover dados mockados (linhas 60-151)
- [ ] Testar integração completa frontend-backend
- [ ] Adicionar loading states
- [ ] Adicionar error handling

**Arquivos a Modificar:**
- `supabase/migrations/021_add_review_fields.sql` (NOVO)
- `backend/src/repositories/review_repository.py` (NOVO)
- `backend/src/repositories/__init__.py` (adicionar import)
- `backend/src/services/product_service.py` (linhas 170-212)
- `backend/src/routes/products.py` (linhas 289-316)
- `frontend/src/services/apiClient.js` (verificar métodos)
- `frontend/src/components/products/ProductReviews.jsx` (remover mocks)

**Estimativa:** 2-3 dias

---

### 2. Rate Limiting Robusto

#### 2.1 Remover Implementação Básica
- [ ] Remover decorator `rate_limit` de `utils/decorators.py` (linha 125-136)
- [ ] Verificar se há uso do decorator antigo no código
- [ ] Substituir por `@rate_limit()` de `utils/rate_limit_helper.py`

#### 2.2 Atualizar Decorators
- [ ] Verificar `utils/rate_limit_helper.py` está usando Flask-Limiter corretamente
- [ ] Adicionar limites específicos por endpoint crítico
- [ ] Documentar limites recomendados por tipo de endpoint
- [ ] Testar rate limiting em desenvolvimento

#### 2.3 Aplicar em Rotas Críticas
- [ ] Adicionar `@rate_limit("10 per minute")` em rotas de autenticação
- [ ] Adicionar `@rate_limit("20 per minute")` em rotas de criação (reviews, orders)
- [ ] Adicionar `@rate_limit("100 per hour")` em rotas de leitura
- [ ] Verificar que admins estão isentos (já implementado)
- [ ] Testar limites em ambiente de staging

**Arquivos a Modificar:**
- `backend/src/utils/decorators.py` (remover rate_limit básico)
- `backend/src/routes/auth.py` (adicionar decorators)
- `backend/src/routes/products.py` (adicionar decorators)
- `backend/src/routes/orders.py` (adicionar decorators)

**Estimativa:** 1 dia

---

### 3. Cache Distribuído

#### 3.1 Verificar CacheService
- [ ] Verificar que `CacheService` está funcionando corretamente
- [ ] Testar conexão Redis
- [ ] Verificar fallback para memória

#### 3.2 Atualizar Decorator de Cache
- [ ] Remover comentário TODO de `utils/decorators.py` linha 195
- [ ] Implementar decorator usando `CacheService`
- [ ] Adicionar TTLs configuráveis por tipo de dado
- [ ] Implementar invalidação automática

#### 3.3 Aplicar Cache em Endpoints
- [ ] Adicionar cache em `GET /api/products` (TTL: 5 minutos)
- [ ] Adicionar cache em `GET /api/products/<id>` (TTL: 10 minutos)
- [ ] Adicionar cache em `GET /api/products/<id>/reviews` (TTL: 2 minutos)
- [ ] Invalidar cache ao criar/atualizar produto
- [ ] Invalidar cache ao criar review
- [ ] Testar invalidação de cache

**Arquivos a Modificar:**
- `backend/src/utils/decorators.py` (implementar cache decorator)
- `backend/src/routes/products.py` (adicionar cache)
- `backend/src/services/product_service.py` (invalidar cache)

**Estimativa:** 1 dia

---

### 4. Migração de Acesso Direto ao Supabase

#### 4.1 Analisar AffiliateService
- [ ] Identificar todos os usos de `self.supabase` em `AffiliateService`
- [ ] Listar métodos que precisam ser criados em `AffiliateRepository`
- [ ] Verificar se `AffiliateRepository` já tem os métodos necessários

#### 4.2 Criar Métodos Faltantes no Repository
- [ ] Adicionar métodos necessários em `AffiliateRepository`
- [ ] Migrar lógica de acesso direto para repositório
- [ ] Manter compatibilidade durante migração

#### 4.3 Atualizar AffiliateService
- [ ] Remover `self.supabase = supabase_client` (linha 42)
- [ ] Substituir todos os `self.supabase` por `self.repo`
- [ ] Testar todas as funcionalidades de afiliados
- [ ] Remover comentário TODO

**Arquivos a Modificar:**
- `backend/src/repositories/affiliate_repository.py` (adicionar métodos)
- `backend/src/services/affiliate_service.py` (remover acesso direto)

**Estimativa:** 1-2 dias

---

### 5. Métricas de API

#### 5.1 Implementar Coleta de Métricas
- [ ] Criar middleware para coletar tempo de resposta
- [ ] Armazenar métricas no Redis ou banco de dados
- [ ] Implementar agregação de métricas (média, p95, p99)
- [ ] Implementar contagem de requisições por endpoint
- [ ] Implementar contagem de erros por endpoint

#### 5.2 Atualizar MonitoringService
- [ ] Remover comentário TODO linha 215
- [ ] Implementar `_get_api_metrics()` com dados reais
- [ ] Conectar com middleware de métricas
- [ ] Adicionar endpoint `/api/admin/metrics/api` (se necessário)

**Arquivos a Modificar:**
- `backend/src/services/monitoring_service.py` (implementar métricas)
- `backend/src/middleware/metrics.py` (NOVO - se não existir)

**Estimativa:** 2 dias

---

### 6. Métricas de WebSocket

#### 6.1 Implementar Contagem de Conexões
- [ ] Remover comentário TODO linha 185
- [ ] Usar `CacheService` para contar conexões ativas
- [ ] Implementar `_count_active_connections()` usando Redis
- [ ] Atualizar `_get_websocket_metrics()`

#### 6.2 Implementar Contagem de Mensagens
- [ ] Remover comentário TODO linha 186
- [ ] Adicionar contador de mensagens por segundo
- [ ] Usar Redis para armazenar contadores
- [ ] Implementar janela deslizante (sliding window)

#### 6.3 Atualizar WebSocketService
- [ ] Adicionar tracking de mensagens enviadas
- [ ] Adicionar tracking de conexões estabelecidas/desconectadas
- [ ] Expor métricas via `_get_websocket_metrics()`

**Arquivos a Modificar:**
- `backend/src/services/websocket_service.py` (implementar métricas)
- `backend/src/services/monitoring_service.py` (usar métricas reais)

**Estimativa:** 2 dias

---

### 7. Sistema de Recomendação com ML

#### 7.1 Análise de Requisitos
- [ ] Definir algoritmo de recomendação (collaborative filtering, content-based, híbrido)
- [ ] Identificar dados necessários (histórico de compras, visualizações, favoritos)
- [ ] Definir modelo de ML ou usar biblioteca (scikit-learn, TensorFlow)

#### 7.2 Coleta de Dados
- [ ] Criar tabela `user_product_interactions` (views, clicks, purchases)
- [ ] Implementar tracking de interações do usuário
- [ ] Coletar dados históricos existentes

#### 7.3 Implementação
- [ ] Criar `RecommendationService`
- [ ] Implementar treinamento de modelo (offline)
- [ ] Implementar predição em tempo real
- [ ] Adicionar cache para recomendações
- [ ] Atualizar `ProductService._get_recommended_products_old()`

**Arquivos a Modificar:**
- `backend/src/services/recommendation_service.py` (NOVO)
- `backend/src/services/product_service.py` (usar RecommendationService)
- `supabase/migrations/022_user_interactions.sql` (NOVO)

**Estimativa:** 1-2 semanas (depende da complexidade do modelo)

---

### 8. Ranking de Produtos por Vendas Reais

#### 8.1 Criar Agregação de Vendas
- [ ] Criar view ou função SQL para calcular vendas por produto
- [ ] Considerar período (últimos 30 dias, 90 dias, todos)
- [ ] Considerar quantidade vendida e receita

#### 8.2 Atualizar ProductRepository
- [ ] Remover comentário TODO linha 256
- [ ] Implementar `get_trending_products()` usando dados reais
- [ ] Combinar vendas + avaliações + estoque
- [ ] Adicionar cache para ranking

**Arquivos a Modificar:**
- `backend/src/repositories/product_repository.py` (implementar ranking)
- `supabase/migrations/023_product_sales_view.sql` (NOVO - opcional)

**Estimativa:** 1 dia

---

## 🟡 PRIORIDADE MÉDIA

### 9. Analytics de Audiência

#### 9.1 Definir Métricas
- [ ] Definir quais métricas de audiência são necessárias
- [ ] Exemplos: alcance, impressões, engajamento, demografia

#### 9.2 Implementar Coleta
- [ ] Criar tabela `post_analytics` ou similar
- [ ] Implementar tracking de visualizações
- [ ] Implementar tracking de engajamento

#### 9.3 Implementar Endpoint
- [ ] Remover comentário TODO linha 123
- [ ] Implementar `get_audience_analytics()` em `SocialService`
- [ ] Adicionar rota `/api/social/analytics/audience`

**Estimativa:** 3-5 dias

---

### 10. Detecção Automática de Transportadora

#### 10.1 Criar Mapeamento de Transportadoras
- [ ] Criar tabela `shipping_carriers` ou config
- [ ] Mapear códigos de rastreamento por transportadora
- [ ] Adicionar URLs de rastreamento por transportadora

#### 10.2 Implementar Detecção
- [ ] Remover comentário TODO linha 389
- [ ] Criar função `detect_carrier(tracking_number)`
- [ ] Implementar lógica de detecção (prefixos, padrões)
- [ ] Atualizar `OrderService._get_tracking_info()`

**Arquivos a Modificar:**
- `backend/src/services/order_service.py` (implementar detecção)
- `backend/src/services/shipping_service.py` (adicionar mapeamento)

**Estimativa:** 1-2 dias

---

### 11. Lógica BOGO (Buy One Get One)

#### 11.1 Implementar Lógica
- [ ] Remover comentário TODO linha 365
- [ ] Implementar validação de quantidade mínima
- [ ] Calcular desconto baseado em quantidade
- [ ] Aplicar desconto no `OrderService`

**Arquivos a Modificar:**
- `backend/src/services/promotion_service.py` (implementar BOGO)

**Estimativa:** 1 dia

---

### 12. Migração para Método Específico do Repositório

#### 12.1 Criar Método no GoalRepository
- [ ] Adicionar `get_health_goals(user_id)` em `GoalRepository`
- [ ] Implementar lógica de busca

#### 12.2 Atualizar HealthService
- [ ] Remover comentário TODO linha 364
- [ ] Usar `GoalRepository.get_health_goals()` em vez de acesso direto
- [ ] Testar funcionalidade

**Arquivos a Modificar:**
- `backend/src/repositories/goal_repository.py` (adicionar método)
- `backend/src/services/health_service.py` (usar repositório)

**Estimativa:** 0.5 dia

---

### 13-18. Funcionalidades Frontend

#### 13. Busca Avançada em Rede Social
- [ ] Remover comentário TODO linha 142
- [ ] Implementar filtros avançados no backend
- [ ] Conectar frontend com backend

#### 14. Upload Completo de Arquivos
- [ ] Remover comentário TODO linha 176
- [ ] Implementar endpoint de upload
- [ ] Integrar com Supabase Storage
- [ ] Atualizar frontend

#### 15. Edição de Entrada Alimentar
- [ ] Remover comentário TODO linha 708
- [ ] Criar endpoint `PUT /api/health/food-diary/<id>`
- [ ] Implementar no frontend

#### 16. Modal de Detalhes do Exercício
- [ ] Remover comentário TODO linha 205
- [ ] Criar componente `ExerciseDetailModal`
- [ ] Integrar com `ExercisesPage`

#### 17. Lógica de Curtir Mensagem
- [ ] Remover comentário TODO linha 435
- [ ] Criar tabela `message_reactions` ou usar `reactions`
- [ ] Implementar lógica no WebSocketService

#### 18. Pausa/Retomada de Treino
- [ ] Remover comentários TODO linhas 251, 255
- [ ] Criar endpoints `POST /api/exercises/sessions/<id>/pause` e `/resume`
- [ ] Implementar no frontend

**Estimativa Total Frontend:** 3-5 dias

---

## 🟢 PRIORIDADE BAIXA

### 19-24. Otimizações e Melhorias

Estes itens podem ser implementados conforme necessidade e não são críticos.

**Estimativa Total:** 1-2 semanas

---

## 📦 Dependências e Pré-requisitos

### Já Instaladas ✅
- Flask-Limiter==4.0.0
- Flask-Caching==2.3.1
- redis==5.0.1
- jsonschema==4.25.1

### A Instalar (se necessário para ML)
- [ ] scikit-learn (para recomendações simples)
- [ ] pandas (já instalado)
- [ ] numpy (já instalado)

---

## 🏗️ Padrões Arquiteturais a Seguir

### Repositórios
1. Herdar de `BaseRepository`
2. Usar `self.table_name` para nome da tabela
3. Implementar métodos específicos além dos CRUD básicos
4. Usar cache quando apropriado
5. Validar dados de entrada

### Services
1. Herdar de `BaseService`
2. Usar repositórios (nunca acesso direto ao Supabase)
3. Implementar lógica de negócio
4. Tratar erros com `_handle_error()`
5. Retornar respostas padronizadas com `_format_success_response()`

### Rotas
1. Usar `@handle_route_exceptions` para tratamento de erros
2. Usar `@token_required` para autenticação
3. Usar `@rate_limit()` para rate limiting
4. Validar dados de entrada
5. Retornar JSON padronizado

### Migrations
1. Nomear arquivos: `021_<descricao>.sql`
2. Usar `IF NOT EXISTS` para colunas
3. Adicionar índices para performance
4. Adicionar RLS policies se necessário
5. Testar em desenvolvimento antes de produção

---

## 📊 Resumo de Esforço

| Prioridade | Itens | Estimativa |
|------------|-------|------------|
| Alta | 8 | 2-3 semanas |
| Média | 10 | 2-3 semanas |
| Baixa | 6 | 1-2 semanas |
| **Total** | **24** | **5-8 semanas** |

---

## 🎯 Próximos Passos Imediatos

1. **Começar com Prioridade Alta #1** (Sistema de Avaliações)
   - É a funcionalidade mais crítica
   - Frontend já está pronto
   - Apenas falta backend completo

2. **Seguir com Prioridade Alta #2 e #3** (Rate Limiting e Cache)
   - Dependências já instaladas
   - Implementação relativamente simples
   - Alto impacto em segurança e performance

3. **Continuar com demais itens de Prioridade Alta**

---

**Última atualização:** 2025-01-08
