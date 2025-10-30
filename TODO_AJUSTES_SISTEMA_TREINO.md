# TODO: Ajustes de Sem?ntica e Estilo - Sistema de Exerc?cios e Planos de Treino

## ?? Vis?o Geral
Este documento organiza todos os ajustes necess?rios para padronizar o c?digo do sistema de exerc?cios, planos de treino e sess?es semanais conforme os padr?es sem?nticos e de estilo j? estabelecidos no projeto.

---

## ?? PRIORIDADE 1: Backend - Sem?ntica e Organiza??o

### 1.1 Service Layer (`backend/src/services/exercise_service.py`)

#### ? Ajustes de Sem?ntica
- [ ] **Nomenclatura de m?todos**: Padronizar nomes seguindo conven??o `action_resource` ou `get_resource`
  - Verificar se m?todos seguem padr?o: `get_*`, `create_*`, `update_*`, `delete_*`
  - M?todos internos devem come?ar com `_` (j? implementado corretamente)

- [ ] **Docstrings**: Adicionar docstrings completas em todos os m?todos
  ```python
  """Descri??o clara do m?todo
    
  Args:
      param1 (type): Descri??o do par?metro
      
  Returns:
      type: Descri??o do retorno
      
  Raises:
      Exception: Quando ocorre
  """
  ```

- [ ] **Type Hints**: Garantir que todos os m?todos tenham type hints completos
  - Adicionar `-> Dict[str, Any]` onde faltar
  - Usar `Optional[Type]` quando apropriado
  - Adicionar tipos para par?metros de entrada

- [ ] **Tratamento de Erros**: Padronizar mensagens de erro
  - Todas as mensagens devem ser em portugu?s
  - Usar logging apropriado (logger.error, logger.warning)
  - Retornar estrutura consistente: `{'success': bool, 'error': str}`

- [ ] **Valida??o de Dados**: Adicionar valida??o consistente
  - Validar tipos antes de processar
  - Validar campos obrigat?rios
  - Validar ranges (ex: `day_of_week` entre 1-7)

#### ? Ajustes de Estrutura
- [ ] **Separa??o de Responsabilidades**: 
  - Criar m?todos auxiliares para c?lculos complexos (ex: c?lculo de datas semanais)
  - Separar l?gica de neg?cio de acesso ao banco
  - Extrair constantes m?gicas para constantes nomeadas

- [ ] **Constantes**: Definir constantes para valores fixos
  ```python
  # No topo do arquivo
  DAYS_OF_WEEK = {
      1: 'Segunda-feira',
      2: 'Ter?a-feira',
      # ...
  }
  
  WORKOUT_STATUS = {
      'scheduled': 'Agendado',
      'in_progress': 'Em Progresso',
      # ...
  }
  ```

- [ ] **Queries SQL**: Otimizar queries com joins expl?citos quando necess?rio
  - Usar `.select()` expl?cito em vez de `*` quando poss?vel
  - Adicionar ?ndices para campos frequentemente consultados

---

### 1.2 Routes Layer (`backend/src/routes/exercises.py`)

#### ? Padr?es de Rotas
- [ ] **Nomenclatura de Rotas**: Padronizar endpoints RESTful
  - GET `/api/exercises` - lista
  - GET `/api/exercises/:id` - detalhes
  - POST `/api/exercises` - criar
  - PUT `/api/exercises/:id` - atualizar
  - DELETE `/api/exercises/:id` - deletar

- [ ] **Valida??o de Entrada**: Usar `@validate_json` consistentemente
  - Definir schemas de valida??o para cada endpoint
  - Retornar erros de valida??o formatados

- [ ] **Rate Limiting**: Ajustar limites por tipo de opera??o
  - READ: 30/min (j? est? correto)
  - CREATE/UPDATE: 10/hora (j? est? correto)
  - DELETE: 5/hora

- [ ] **C?digos HTTP**: Garantir uso correto
  - 200: Sucesso em GET/PUT
  - 201: Sucesso em POST
  - 400: Erro de valida??o/requisi??o
  - 404: Recurso n?o encontrado
  - 500: Erro interno

- [ ] **Logging**: Padronizar logs de atividade
  - Usar `log_user_activity` para a??es do usu?rio
  - Usar `log_security_event` para opera??es sens?veis
  - Incluir contexto relevante nos logs

#### ? Organiza??o de C?digo
- [ ] **Agrupamento de Rotas**: Organizar por funcionalidade
  ```python
  # ============================================================
  # EXERC?CIOS
  # ============================================================
  
  # ============================================================
  # PLANOS DE TREINO
  # ============================================================
  
  # ============================================================
  # SESS?ES SEMANAIS
  # ============================================================
  ```

- [ ] **Coment?rios**: Adicionar docstrings em todas as rotas
  - Descri??o clara do que a rota faz
  - Par?metros esperados
  - Resposta esperada

---

### 1.3 Database Layer (`supabase/migrations/16_create_workout_system.sql`)

#### ? Estrutura do Banco
- [ ] **Nomenclatura**: Garantir consist?ncia
  - Tabelas: `snake_case`, plural (ex: `workout_plans`)
  - Colunas: `snake_case` (j? est? correto)
  - ?ndices: `idx_<table>_<column>`

- [ ] **Constraints**: Adicionar constraints apropriadas
  - CHECK constraints para valores v?lidos
  - NOT NULL onde necess?rio
  - FOREIGN KEY com ON DELETE apropriado

- [ ] **?ndices**: Otimizar queries com ?ndices compostos
  - Adicionar ?ndices para queries frequentes
  - ?ndices para campos de filtro (ex: `user_id`, `status`)

- [ ] **Coment?rios no Banco**: Adicionar COMMENT nas tabelas e colunas importantes

---

## ?? PRIORIDADE 2: Frontend - Componentes React

### 2.1 Nomenclatura e Estrutura

#### ? Componentes
- [ ] **Nomenclatura**: Todos componentes em PascalCase
  - Arquivos: `ComponentName.jsx`
  - Export: `export const ComponentName = () => {}`
  - Props: camelCase (ex: `onStartPlan`)

- [ ] **Organiza??o de Imports**: Padronizar ordem
  ```javascript
  // 1. React e hooks
  import React, { useState, useEffect } from 'react';
  
  // 2. Depend?ncias externas
  import { toast } from 'sonner';
  import { format } from 'date-fns';
  
  // 3. Componentes UI locais
  import { Card, CardContent } from '@/components/Ui/card';
  import { Button } from '@/components/Ui/button';
  
  // 4. Componentes do projeto
  import { WorkoutPlanCard } from './WorkoutPlanCard';
  
  // 5. Hooks customizados
  import { useApi, apiService } from '@/lib/api';
  
  // 6. Utilit?rios
  import { formatDate } from '@/utils/helpers';
  
  // 7. Tipos (se houver)
  // import type { WorkoutPlan } from '@/types';
  ```

- [ ] **Estrutura de Componente**: Padronizar ordem interna
  ```javascript
  export const ComponentName = ({ prop1, prop2 }) => {
    // 1. Hooks (useState, useEffect, etc)
    // 2. Fun??es auxiliares/handlers
    // 3. Fun??es de renderiza??o auxiliares
    // 4. Efeitos (useEffect)
    // 5. Return JSX
  };
  ```

#### ? Props e Estado
- [ ] **Tipagem**: Adicionar PropTypes ou coment?rios de tipos
  ```javascript
  /**
   * @param {Object} plan - Plano de treino
   * @param {Function} onStartPlan - Callback ao iniciar plano
   */
  export const WorkoutPlanCard = ({ plan, onStartPlan }) => {
  ```

- [ ] **Valida??o de Props**: Validar props obrigat?rias
  - Usar destructuring com defaults quando apropriado
  - Validar se props s?o undefined antes de usar

---

### 2.2 Estiliza??o e UI

#### ? Tailwind CSS
- [ ] **Classes Consistentes**: Padronizar uso do Tailwind
  - Usar classes utilit?rias em vez de inline styles
  - Agrupar classes relacionadas (ex: `flex items-center gap-2`)
  - Usar dark mode: `dark:bg-gray-900`

- [ ] **Responsividade**: Garantir responsividade
  - Usar grid responsivo: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
  - Padding responsivo: `p-4 md:p-6`
  - Texto responsivo: `text-sm md:text-base`

- [ ] **Cores**: Usar paleta consistente
  - Primary: `blue-600`, `blue-700` (hover)
  - Success: `green-600`
  - Warning: `yellow-600`
  - Danger: `red-600`
  - Neutral: `gray-600`

#### ? Acessibilidade
- [ ] **ARIA Labels**: Adicionar labels apropriados
  - Bot?es: `aria-label` quando necess?rio
  - Formul?rios: `aria-describedby` para erros
  - Navega??o: `aria-current` para item ativo

- [ ] **Sem?ntica HTML**: Usar elementos sem?nticos
  - `<button>` para a??es, n?o `<div onClick>`
  - `<nav>` para navega??o
  - `<main>`, `<section>`, `<article>` apropriadamente

- [ ] **Keyboard Navigation**: Garantir navega??o por teclado
  - Tab order l?gico
  - Enter/Space para a??es
  - Escape para fechar modais

---

### 2.3 Gerenciamento de Estado e API

#### ? Hooks Customizados
- [ ] **Criar hook `useWorkoutPlans`**: 
  ```javascript
  export const useWorkoutPlans = () => {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    const fetchPlans = async (filters) => {
      // implementa??o
    };
    
    return { plans, loading, error, fetchPlans };
  };
  ```

- [ ] **Hook `useWeeklySessions`**: 
  - Similar ao anterior, mas para sess?es

#### ? Tratamento de Erros
- [ ] **Feedback ao Usu?rio**: Usar `toast` consistentemente
  - Sucesso: `toast.success('Mensagem')`
  - Erro: `toast.error('Mensagem')`
  - Info: `toast.info('Mensagem')`

- [ ] **Estados de Loading**: Adicionar estados visuais
  - Skeleton loaders durante carregamento
  - Disabled nos bot?es durante requisi??es

- [ ] **Tratamento de Erros de API**: 
  ```javascript
  try {
    const result = await apiService.workoutPlans.create(data);
    toast.success('Plano criado com sucesso!');
  } catch (error) {
    console.error('Erro:', error);
    toast.error(error.message || 'Erro ao criar plano');
  }
  ```

---

## ?? PRIORIDADE 3: Componentes Espec?ficos

### 3.1 `WorkoutPlanCard.jsx`

#### ? Ajustes Necess?rios
- [ ] **Props**: Verificar se recebe `duration_weeks` em vez de `duration`
- [ ] **Dados Mapeados**: Garantir que mapeia campos corretos da API
  - `plan.duration_weeks` ? exibir como "X semanas"
  - `plan.workouts_per_week` ? exibir como "Xx/semana"
  - `plan.goal` ? converter para array se necess?rio
  - `plan.exercises` ? contar exerc?cios se for array

- [ ] **Fallbacks**: Adicionar fallbacks para dados ausentes
  - Imagem padr?o quando `image_url` for null
  - Texto padr?o quando `description` for vazio
  - Valores padr?o para estat?sticas

- [ ] **Fun??es Auxiliares**: Mover para utils ou hooks
  - `getDifficultyColor` ? `/utils/workoutHelpers.js`
  - `getDifficultyLabel` ? `/utils/workoutHelpers.js`
  - `getGoalIcon` ? `/utils/workoutHelpers.js`
  - `getGoalLabel` ? `/utils/workoutHelpers.js`

---

### 3.2 `WorkoutPlansPage.jsx`

#### ? Integra??o com API
- [ ] **Substituir dados mockados**: Remover `workoutPlansDataFallback`
- [ ] **Usar API real**: Integrar com `apiService.workoutPlans.getAll()`
- [ ] **Tratamento de erros**: Adicionar try/catch adequado
- [ ] **Loading states**: Usar skeleton loaders reais

#### ? Filtros e Busca
- [ ] **Filtros funcionais**: Conectar filtros ? API
  ```javascript
  const params = {
    difficulty: selectedDifficulty !== 'all' ? selectedDifficulty : undefined,
    goal: selectedGoal !== 'all' ? selectedGoal : undefined,
    is_active: activeTab === 'my_plans' ? true : undefined,
    is_public: activeTab === 'popular' ? true : undefined,
    page: currentPage,
    limit: 20
  };
  ```

- [ ] **Busca**: Implementar busca no backend ou filtrar no frontend
- [ ] **Pagina??o**: Adicionar pagina??o real se API suportar

#### ? Tabs e Estados
- [ ] **Tabs funcionais**: 
  - `all`: Todos os planos p?blicos
  - `my_plans`: Planos do usu?rio (`user_id` do token)
  - `favorites`: Favoritos do localStorage ou API
  - `popular`: Ordenar por mais participantes/completados

---

### 3.3 `WorkoutSession.jsx` (se existir)

#### ? Criar Componente Completo
- [ ] **Estrutura b?sica**: Se n?o existir, criar componente para exibir sess?o
- [ ] **Lista de exerc?cios**: Exibir exerc?cios da sess?o
- [ ] **Progresso**: Mostrar progresso de cada exerc?cio
- [ ] **Status**: Visual para status (scheduled, in_progress, completed)
- [ ] **A??es**: Bot?es para iniciar, pausar, completar sess?o

---

## ??? PRIORIDADE 4: Utilit?rios e Helpers

### 4.1 Criar Arquivo de Helpers

#### ? `frontend/src/utils/workoutHelpers.js`
- [ ] **Fun??es de formata??o**:
  ```javascript
  export const formatDifficulty = (difficulty) => {
    const map = {
      'beginner': 'Iniciante',
      'intermediate': 'Intermedi?rio',
      'advanced': 'Avan?ado'
    };
    return map[difficulty] || difficulty;
  };
  
  export const getDifficultyColor = (difficulty) => {
    // retorna classes Tailwind
  };
  
  export const formatGoal = (goal) => {
    // retorna label em portugu?s
  };
  
  export const getDayName = (dayOfWeek) => {
    // retorna nome do dia (1 = Segunda)
  };
  
  export const formatWorkoutDuration = (minutes) => {
    // retorna "45 min" ou "1h 15min"
  };
  ```

---

### 4.2 Valida??o de Formul?rios

#### ? Criar validadores
- [ ] **`validateWorkoutPlan`**: Validar dados ao criar/editar plano
- [ ] **`validateExercise`**: Validar dados ao adicionar exerc?cio
- [ ] **Feedback visual**: Mostrar erros inline nos formul?rios

---

## ?? PRIORIDADE 5: Documenta??o e Coment?rios

### 5.1 Backend
- [ ] **Docstrings completas**: Adicionar em todas as fun??es
- [ ] **Coment?rios inline**: Explicar l?gica complexa
- [ ] **README do m?dulo**: Documentar endpoints e uso

### 5.2 Frontend
- [ ] **Coment?rios JSDoc**: Adicionar em componentes principais
- [ ] **Props documentation**: Documentar props de cada componente
- [ ] **README de componentes**: Explicar estrutura e uso

---

## ?? PRIORIDADE 6: Testes e Valida??o

### 6.1 Backend
- [ ] **Testes unit?rios**: Criar testes para `exercise_service.py`
- [ ] **Testes de integra??o**: Testar endpoints de exerc?cios
- [ ] **Valida??o de dados**: Testar casos edge (valores null, tipos errados)

### 6.2 Frontend
- [ ] **Testes de componentes**: Criar testes para componentes principais
- [ ] **Testes de hooks**: Testar hooks customizados
- [ ] **Testes de integra??o**: Testar fluxo completo (criar plano ? adicionar exerc?cios ? criar sess?es)

---

## ?? PRIORIDADE 7: Performance e Otimiza??o

### 7.1 Backend
- [ ] **Queries otimizadas**: Revisar queries N+1
- [ ] **Cache**: Adicionar cache para lista de exerc?cios (n?o muda frequentemente)
- [ ] **Pagina??o**: Garantir que pagina??o funciona corretamente

### 7.2 Frontend
- [ ] **Lazy loading**: Lazy load de componentes pesados
- [ ] **Memoiza??o**: Usar `React.memo` onde apropriado
- [ ] **Debounce**: Adicionar debounce na busca
- [ ] **Virtualiza??o**: Virtualizar listas longas de exerc?cios

---

## ? Checklist de Revis?o Final

### Sem?ntica
- [ ] Nomenclatura consistente em todo c?digo
- [ ] Estrutura de pastas organizada
- [ ] Imports organizados e sem duplicatas

### Estilo
- [ ] C?digo formatado (usar Prettier/Black)
- [ ] Sem warnings do ESLint
- [ ] Cores e espa?amentos consistentes

### Funcionalidade
- [ ] Todas as features funcionando
- [ ] Tratamento de erros adequado
- [ ] Feedback ao usu?rio em todas a??es

### Documenta??o
- [ ] README atualizado
- [ ] Coment?rios onde necess?rio
- [ ] Docstrings completas

---

## ?? Ordem de Execu??o Sugerida

1. **Semana 1**: Prioridades 1 e 2 (Backend e Frontend - estrutura)
2. **Semana 2**: Prioridade 3 (Componentes espec?ficos)
3. **Semana 3**: Prioridades 4 e 5 (Utilit?rios e documenta??o)
4. **Semana 4**: Prioridades 6 e 7 (Testes e otimiza??o)

---

## ?? Notas Finais

- Este TODO deve ser atualizado conforme itens s?o completados
- Priorizar itens que afetam funcionalidade antes de melhorias est?ticas
- Testar cada mudan?a antes de marcar como completa
- Fazer commits pequenos e frequentes para facilitar revis?o

---

**?ltima atualiza??o**: 2025-01-30
**Status**: Em andamento
**Respons?vel**: Equipe de Desenvolvimento
