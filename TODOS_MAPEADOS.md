# 📋 Mapeamento de TODOs Pendentes - RE-EDUCA Store

**Data:** 2025-01-08  
**Status:** Análise Completa

---

## 📊 Resumo Executivo

- **Total de TODOs:** 24
- **Prioridade Alta:** 8
- **Prioridade Média:** 10
- **Prioridade Baixa:** 6

---

## 🔴 PRIORIDADE ALTA

### 1. Sistema de Avaliações de Produtos
**Arquivo:** `backend/src/services/product_service.py`  
**Linhas:** 184, 207  
**Descrição:**
- Busca de reviews na tabela `product_reviews` (linha 184)
- Criação completa de review na tabela `product_reviews` (linha 207)

**Impacto:** Funcionalidade crítica para e-commerce - usuários não podem avaliar produtos  
**Esforço:** Médio  
**Dependências:** Tabela `product_reviews` já existe no schema

---

### 2. Rate Limiting Robusto
**Arquivo:** `backend/src/utils/decorators.py`  
**Linha:** 132  
**Descrição:** Migrar para Flask-Limiter em produção para melhor controle de rate limiting

**Impacto:** Segurança e prevenção de abuso da API  
**Esforço:** Baixo  
**Dependências:** Instalar Flask-Limiter

---

### 3. Cache Distribuído
**Arquivo:** `backend/src/utils/decorators.py`  
**Linha:** 195  
**Descrição:** Migrar para Flask-Caching em produção para melhor performance

**Impacto:** Performance e escalabilidade  
**Esforço:** Médio  
**Dependências:** Instalar Flask-Caching

---

### 4. Migração de Acesso Direto ao Supabase
**Arquivo:** `backend/src/services/affiliate_service.py`  
**Linha:** 42  
**Descrição:** Migrar para uso exclusivo de repositórios (remover acesso direto ao Supabase)

**Impacto:** Consistência arquitetural e manutenibilidade  
**Esforço:** Médio  
**Dependências:** Verificar se AffiliateRepository tem todos os métodos necessários

---

### 5. Métricas de API
**Arquivo:** `backend/src/services/monitoring_service.py`  
**Linha:** 215  
**Descrição:** Implementar coleta de métricas de API (tempo de resposta, requisições/minuto, taxa de erro)

**Impacto:** Monitoramento e observabilidade  
**Esforço:** Médio  
**Dependências:** Sistema de métricas (Prometheus, StatsD, etc.)

---

### 6. Métricas de WebSocket
**Arquivo:** `backend/src/services/monitoring_service.py`  
**Linhas:** 182, 185, 186  
**Descrição:**
- Implementar métricas específicas do WebSocket
- Contagem real de conexões ativas
- Contagem real de mensagens por segundo

**Impacto:** Monitoramento de conexões em tempo real  
**Esforço:** Médio  
**Dependências:** Sistema de métricas

---

### 7. Sistema de Recomendação com ML
**Arquivo:** `backend/src/services/product_service.py`  
**Linha:** 284-285  
**Descrição:** Implementar sistema de recomendação com machine learning (atualmente usa implementação básica)

**Impacto:** Experiência do usuário e conversão  
**Esforço:** Alto  
**Dependências:** Modelo de ML, dados históricos de compras

---

### 8. Ranking de Produtos por Vendas Reais
**Arquivo:** `backend/src/repositories/product_repository.py`  
**Linha:** 256  
**Descrição:** Implementar ranking baseado em dados reais de vendas (atualmente usa avaliações e estoque)

**Impacto:** Precisão de recomendações e tendências  
**Esforço:** Médio  
**Dependências:** Dados de vendas históricas

---

## 🟡 PRIORIDADE MÉDIA

### 9. Analytics de Audiência
**Arquivo:** `backend/src/routes/social_additional.py`  
**Linha:** 123  
**Descrição:** Implementar analytics de audiência (prioridade média)

**Impacto:** Funcionalidade social avançada  
**Esforço:** Alto  
**Dependências:** Dados de engajamento e visualizações

---

### 10. Detecção Automática de Transportadora
**Arquivo:** `backend/src/services/order_service.py`  
**Linha:** 389  
**Descrição:** Implementar detecção automática de transportadora baseado no método de envio

**Impacto:** UX melhorada no rastreamento  
**Esforço:** Médio  
**Dependências:** Integração com APIs de transportadoras

---

### 11. Lógica BOGO (Buy One Get One)
**Arquivo:** `backend/src/services/promotion_service.py`  
**Linha:** 365  
**Descrição:** Implementar lógica BOGO quando necessário

**Impacto:** Funcionalidade de promoções  
**Esforço:** Baixo  
**Dependências:** Nenhuma

---

### 12. Migração para Método Específico do Repositório
**Arquivo:** `backend/src/services/health_service.py`  
**Linha:** 364  
**Descrição:** Migrar para método específico do repositório quando implementado (get_health_goals)

**Impacto:** Consistência arquitetural  
**Esforço:** Baixo  
**Dependências:** Implementar método no GoalRepository

---

### 13. Busca Avançada em Rede Social
**Arquivo:** `frontend/src/pages/social/SocialPage.jsx`  
**Linha:** 142  
**Descrição:** Implementar busca avançada real usando searchFilters

**Impacto:** UX na busca social  
**Esforço:** Médio  
**Dependências:** Backend deve suportar filtros avançados

---

### 14. Upload Completo de Arquivos
**Arquivo:** `frontend/src/components/social/DirectMessages.jsx`  
**Linha:** 176  
**Descrição:** Implementar upload completo quando necessário

**Impacto:** Funcionalidade de mensagens  
**Esforço:** Médio  
**Dependências:** Backend de upload de arquivos

---

### 15. Edição de Entrada Alimentar
**Arquivo:** `frontend/src/pages/tools/FoodDiaryPage.jsx`  
**Linha:** 708  
**Descrição:** Implementar funcionalidade de edição de entrada alimentar

**Impacto:** UX no diário alimentar  
**Esforço:** Baixo  
**Dependências:** Backend deve ter endpoint de edição

---

### 16. Modal de Detalhes do Exercício
**Arquivo:** `frontend/src/pages/tools/ExercisesPage.jsx`  
**Linha:** 205  
**Descrição:** Implementar modal de detalhes do exercício

**Impacto:** UX na visualização de exercícios  
**Esforço:** Baixo  
**Dependências:** Nenhuma

---

### 17. Lógica de Curtir Mensagem
**Arquivo:** `backend/src/services/websocket_service.py`  
**Linha:** 435  
**Descrição:** Implementar lógica de curtir mensagem no WebSocket

**Impacto:** Funcionalidade social em tempo real  
**Esforço:** Baixo  
**Dependências:** Tabela de reações de mensagens

---

### 18. Pausa/Retomada de Treino
**Arquivo:** `frontend/src/pages/tools/WorkoutSessionsPage.jsx`  
**Linhas:** 251, 255  
**Descrição:**
- Implementar lógica de pausa de treino
- Implementar lógica de retomada de treino

**Impacto:** UX nas sessões de treino  
**Esforço:** Médio  
**Dependências:** Backend deve suportar pausa/retomada

---

## 🟢 PRIORIDADE BAIXA

### 19. Busca de Hashtags em Produção
**Arquivo:** `frontend/src/components/social/SocialSearch.jsx`  
**Linha:** 79  
**Descrição:** Em produção, poderia buscar posts e contar hashtags

**Impacto:** Funcionalidade social avançada  
**Esforço:** Médio  
**Dependências:** Backend de busca de hashtags

---

### 20. Mapeamento Inverso Socket ID -> User ID
**Arquivo:** `backend/src/services/websocket_service.py`  
**Linha:** 214  
**Descrição:** Em produção, considerar manter um mapeamento inverso socket_id -> user_id

**Impacto:** Performance em WebSocket  
**Esforço:** Baixo  
**Dependências:** Nenhuma

---

### 21. Validação com jsonschema
**Arquivo:** `backend/src/middleware/auth.py`  
**Linhas:** 180, 193  
**Descrição:** Em produção, usar jsonschema library para validação

**Impacto:** Validação mais robusta  
**Esforço:** Baixo  
**Dependências:** Instalar jsonschema

---

### 22. Rate Limiting com Redis
**Arquivo:** `backend/src/middleware/auth.py`  
**Linha:** 156  
**Descrição:** Em produção, usar Redis ou similar para rate limiting

**Impacto:** Rate limiting distribuído  
**Esforço:** Médio  
**Dependências:** Redis configurado

---

### 23. Desafios do Banco de Dados
**Arquivo:** `backend/src/services/gamification_service.py`  
**Linhas:** 89, 160, 188, 216  
**Descrição:** Vários pontos onde em produção deve buscar/salvar do banco

**Impacto:** Gamificação completa  
**Esforço:** Médio  
**Dependências:** Tabelas de gamificação

---

### 24. Solicitar Nova Chave de IA
**Arquivo:** `backend/src/services/ai_key_rotation_service.py`  
**Linha:** 169  
**Descrição:** Em produção, solicitar nova chave (implementar lógica específica)

**Impacto:** Rotação automática de chaves  
**Esforço:** Médio  
**Dependências:** API de geração de chaves

---

## 📈 Recomendações de Implementação

### Fase 1 - Crítico (1-2 semanas)
1. Sistema de Avaliações de Produtos (#1)
2. Rate Limiting Robusto (#2)
3. Cache Distribuído (#3)

### Fase 2 - Importante (2-4 semanas)
4. Métricas de API e WebSocket (#5, #6)
5. Migração de Acesso Direto ao Supabase (#4)
6. Ranking de Produtos por Vendas (#8)

### Fase 3 - Melhorias (1-2 meses)
7. Sistema de Recomendação com ML (#7)
8. Analytics de Audiência (#9)
9. Funcionalidades Frontend (#13, #14, #15, #16, #18)

### Fase 4 - Otimizações (Contínuo)
10. Detecção Automática de Transportadora (#10)
11. Melhorias de Validação (#21, #22)
12. Gamificação Completa (#23)

---

## 📝 Notas Adicionais

- Alguns TODOs são melhorias incrementais que podem ser implementadas conforme necessidade
- Prioridades podem mudar baseado em feedback de usuários
- Alguns itens dependem de integrações externas (APIs, serviços)
- Considerar criar issues no GitHub para rastreamento

---

## 🔍 Comentários "Em Produção" Não Convertidos

Alguns comentários ainda contêm "Em produção" mas não foram convertidos para TODO porque são:
- Avisos de configuração (settings.py)
- Comentários informativos sobre comportamento em produção
- Notas sobre mock services

Estes não precisam de ação imediata, mas podem ser revisados para padronização.

---

**Última atualização:** 2025-01-08
