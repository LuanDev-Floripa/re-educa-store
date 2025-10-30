/**
 * Utilit?rios para formata??o e transforma??o de dados de treinos
 */

/**
 * Mapeia dificuldade para label em portugu?s
 * @param {string} difficulty - Dificuldade (beginner, intermediate, advanced)
 * @returns {string} Label em portugu?s
 */
export const formatDifficulty = (difficulty) => {
  const map = {
    'beginner': 'Iniciante',
    'intermediate': 'Intermedi?rio',
    'advanced': 'Avan?ado'
  };
  return map[difficulty] || difficulty;
};

/**
 * Retorna classes Tailwind CSS para cor da dificuldade
 * @param {string} difficulty - Dificuldade
 * @returns {string} Classes CSS
 */
export const getDifficultyColor = (difficulty) => {
  switch (difficulty) {
    case 'beginner':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'intermediate':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'advanced':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
};

/**
 * Mapeia objetivo para label em portugu?s
 * @param {string} goal - Objetivo do treino
 * @returns {string} Label em portugu?s
 */
export const formatGoal = (goal) => {
  const map = {
    'weight_loss': 'Perda de Peso',
    'muscle_gain': 'Ganho de Massa',
    'endurance': 'Resist?ncia',
    'strength': 'For?a',
    'general_fitness': 'Condicionamento Geral',
    'flexibility': 'Flexibilidade'
  };
  return map[goal] || goal;
};

/**
 * Mapeia categoria para label em portugu?s
 * @param {string} category - Categoria do exerc?cio
 * @returns {string} Label em portugu?s
 */
export const formatCategory = (category) => {
  const map = {
    'strength': 'For?a',
    'cardio': 'Cardio',
    'flexibility': 'Flexibilidade',
    'core': 'Core',
    'balance': 'Equil?brio',
    'hiit': 'HIIT',
    'yoga': 'Yoga',
    'pilates': 'Pilates'
  };
  return map[category] || category;
};

/**
 * Retorna nome do dia da semana em portugu?s
 * @param {number} dayOfWeek - N?mero do dia (1=Segunda, 7=Domingo)
 * @returns {string} Nome do dia
 */
export const getDayName = (dayOfWeek) => {
  const days = {
    1: 'Segunda-feira',
    2: 'Ter?a-feira',
    3: 'Quarta-feira',
    4: 'Quinta-feira',
    5: 'Sexta-feira',
    6: 'S?bado',
    7: 'Domingo'
  };
  return days[dayOfWeek] || `Dia ${dayOfWeek}`;
};

/**
 * Formata dura??o do treino de forma leg?vel
 * @param {number} minutes - Dura??o em minutos
 * @returns {string} Dura??o formatada (ex: "45 min" ou "1h 15min")
 */
export const formatWorkoutDuration = (minutes) => {
  if (!minutes || minutes === 0) return '0 min';
  
  if (minutes < 60) {
    return `${minutes} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (mins === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${mins}min`;
};

/**
 * Formata status da sess?o para portugu?s
 * @param {string} status - Status da sess?o
 * @returns {string} Status em portugu?s
 */
export const formatSessionStatus = (status) => {
  const map = {
    'scheduled': 'Agendado',
    'in_progress': 'Em Progresso',
    'completed': 'Completo',
    'skipped': 'Pulado'
  };
  return map[status] || status;
};

/**
 * Retorna cor do status da sess?o
 * @param {string} status - Status da sess?o
 * @returns {string} Classes CSS
 */
export const getStatusColor = (status) => {
  switch (status) {
    case 'scheduled':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'in_progress':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'completed':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'skipped':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
};

/**
 * Conta exerc?cios de um plano
 * @param {Object} plan - Plano de treino
 * @returns {number} N?mero total de exerc?cios
 */
export const countPlanExercises = (plan) => {
  if (!plan || !plan.exercises) return 0;
  
  if (Array.isArray(plan.exercises)) {
    return plan.exercises.length;
  }
  
  return 0;
};

/**
 * Calcula progresso da sess?o
 * @param {Object} session - Sess?o de treino
 * @returns {Object} Progresso calculado
 */
export const calculateSessionProgress = (session) => {
  if (!session) {
    return { percentage: 0, completed: 0, total: 0 };
  }
  
  const total = session.total_exercises || 0;
  const completed = session.exercises_completed || 0;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  return { percentage, completed, total };
};

/**
 * Agrupa exerc?cios por dia da semana
 * @param {Array} exercises - Lista de exerc?cios
 * @returns {Object} Exerc?cios agrupados por dia
 */
export const groupExercisesByDay = (exercises) => {
  if (!Array.isArray(exercises)) return {};
  
  return exercises.reduce((acc, exercise) => {
    const day = exercise.day_of_week || exercise.dayOfWeek;
    if (day) {
      if (!acc[day]) {
        acc[day] = [];
      }
      acc[day].push(exercise);
    }
    return acc;
  }, {});
};

/**
 * Formata data para exibi??o
 * @param {string} dateString - Data em formato ISO
 * @returns {string} Data formatada (ex: "30/01/2025")
 */
export const formatDate = (dateString) => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return dateString;
  }
};

/**
 * Formata data e hora para exibi??o
 * @param {string} dateString - Data em formato ISO
 * @returns {string} Data e hora formatada
 */
export const formatDateTime = (dateString) => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateString;
  }
};
