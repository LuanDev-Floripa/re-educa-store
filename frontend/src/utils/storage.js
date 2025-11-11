/**
 * Utilitário centralizado para gerenciamento de localStorage
 * Padroniza o acesso a localStorage em todo o frontend
 * Trata erros de forma consistente e fornece APIs tipadas
 */

/**
 * Retorna o token de autenticação do usuário
 * @returns {string|null} Token ou null se não encontrado
 */
export const getAuthToken = () => {
  try {
    // Prioridade: auth_token (padrão novo) > token (legado)
    return localStorage.getItem("auth_token") || localStorage.getItem("token");
  } catch {
    return null;
  }
};

/**
 * Define o token de autenticação
 * @param {string} token - Token JWT
 * @param {boolean} useLegacyKey - Se true, também salva em 'token' (legado)
 */
export const setAuthToken = (token, useLegacyKey = false) => {
  try {
    if (token) {
      localStorage.setItem("auth_token", token);
      if (useLegacyKey) {
        localStorage.setItem("token", token);
      }
    } else {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("token");
    }
  } catch {
    // Ignora falhas de storage (modo privado / quotas)
  }
};

/**
 * Remove o token de autenticação
 */
export const removeAuthToken = () => {
  try {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("token");
  } catch {
    // noop
  }
};

/**
 * Retorna o refresh token
 * @returns {string|null}
 */
export const getRefreshToken = () => {
  try {
    return localStorage.getItem("refresh_token");
  } catch {
    return null;
  }
};

/**
 * Define o refresh token
 * @param {string} refreshToken
 */
export const setRefreshToken = (refreshToken) => {
  try {
    if (refreshToken) {
      localStorage.setItem("refresh_token", refreshToken);
    } else {
      localStorage.removeItem("refresh_token");
    }
  } catch {
    // noop
  }
};

/**
 * Retorna o admin token
 * @returns {string|null}
 */
export const getAdminToken = () => {
  try {
    return localStorage.getItem("admin_token");
  } catch {
    return null;
  }
};

/**
 * Define o admin token
 * @param {string} adminToken
 */
export const setAdminToken = (adminToken) => {
  try {
    if (adminToken) {
      localStorage.setItem("admin_token", adminToken);
    } else {
      localStorage.removeItem("admin_token");
    }
  } catch {
    // noop
  }
};

/**
 * Limpa todos os tokens
 */
export const clearAllTokens = () => {
  try {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("admin_token");
  } catch {
    // noop
  }
};

/**
 * Verifica se o usuário está autenticado
 * @returns {boolean}
 */
export const isAuthenticated = () => {
  return !!getAuthToken();
};

/**
 * Retorna headers de autenticação para requisições
 * @param {boolean} includeAuth - Se false, retorna headers sem Authorization
 * @returns {Object} Headers configurados
 */
export const getAuthHeaders = (includeAuth = true) => {
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (includeAuth) {
    const token = getAuthToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  return headers;
};

// ================================
// FUNÇÕES GENÉRICAS PARA DADOS JSON
// ================================

/**
 * Obtém um item do localStorage e faz parse JSON
 * @param {string} key - Chave do item
 * @param {any} defaultValue - Valor padrão se não encontrado ou erro
 * @returns {any} Valor parseado ou defaultValue
 */
export const getItem = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    if (item === null) {
      return defaultValue;
    }
    // Tenta fazer parse JSON, se falhar retorna como string
    try {
      return JSON.parse(item);
    } catch {
      // Se não for JSON válido, retorna como string
      return item;
    }
  } catch {
    return defaultValue;
  }
};

/**
 * Salva um item no localStorage com JSON.stringify automático
 * @param {string} key - Chave do item
 * @param {any} value - Valor a ser salvo (será convertido para JSON)
 * @returns {boolean} true se salvou com sucesso, false caso contrário
 */
export const setItem = (key, value) => {
  try {
    // Se for string, salva diretamente (não faz stringify)
    if (typeof value === "string") {
      localStorage.setItem(key, value);
    } else {
      localStorage.setItem(key, JSON.stringify(value));
    }
    return true;
  } catch {
    // Ignora falhas de storage (modo privado / quotas)
    return false;
  }
};

/**
 * Remove um item do localStorage
 * @param {string} key - Chave do item
 */
export const removeItem = (key) => {
  try {
    localStorage.removeItem(key);
  } catch {
    // noop
  }
};

/**
 * Limpa todo o localStorage
 * ⚠️ Use com cuidado!
 */
export const clear = () => {
  try {
    localStorage.clear();
  } catch {
    // noop
  }
};

// ================================
// FUNÇÕES ESPECÍFICAS PARA DADOS COMUNS
// ================================

/**
 * Obtém favoritos de exercícios
 * @returns {Array}
 */
export const getExerciseFavorites = () => {
  return getItem("exercise_favorites", []);
};

/**
 * Salva favoritos de exercícios
 * @param {Array} favorites
 */
export const setExerciseFavorites = (favorites) => {
  setItem("exercise_favorites", favorites);
};

/**
 * Obtém exercícios recentes
 * @returns {Array}
 */
export const getRecentExercises = () => {
  return getItem("recent_exercises", []);
};

/**
 * Salva exercícios recentes
 * @param {Array} recent
 */
export const setRecentExercises = (recent) => {
  setItem("recent_exercises", recent);
};

/**
 * Obtém favoritos de planos de treino
 * @returns {Array}
 */
export const getWorkoutPlanFavorites = () => {
  return getItem("workout_plan_favorites", []);
};

/**
 * Salva favoritos de planos de treino
 * @param {Array} favorites
 */
export const setWorkoutPlanFavorites = (favorites) => {
  setItem("workout_plan_favorites", favorites);
};

/**
 * Obtém planos de treino do usuário
 * @returns {Array}
 */
export const getUserWorkoutPlans = () => {
  return getItem("user_workout_plans", []);
};

/**
 * Salva planos de treino do usuário
 * @param {Array} plans
 */
export const setUserWorkoutPlans = (plans) => {
  setItem("user_workout_plans", plans);
};

/**
 * Obtém favoritos gerais (re-educa-favorites)
 * @returns {Array}
 */
export const getFavorites = () => {
  return getItem("re-educa-favorites", []);
};

/**
 * Salva favoritos gerais
 * @param {Array} favorites
 */
export const setFavorites = (favorites) => {
  setItem("re-educa-favorites", favorites);
};

/**
 * Obtém carrinho salvo
 * @returns {Array}
 */
export const getCart = () => {
  return getItem("cart", []);
};

/**
 * Salva carrinho
 * @param {Array} cart
 */
export const setCart = (cart) => {
  setItem("cart", cart);
};

/**
 * Obtém buscas recentes de rede social
 * @returns {Array}
 */
export const getSocialRecentSearches = () => {
  return getItem("social_recent_searches", []);
};

/**
 * Salva buscas recentes de rede social
 * @param {Array} searches
 */
export const setSocialRecentSearches = (searches) => {
  setItem("social_recent_searches", searches);
};

/**
 * Verifica se PWA install foi descartado
 * @returns {boolean}
 */
export const isPWAInstallDismissed = () => {
  return getItem("pwa-install-dismissed", false);
};

/**
 * Marca PWA install como descartado
 */
export const setPWAInstallDismissed = () => {
  setItem("pwa-install-dismissed", "true");
};

// Exportar funções de authToken adicionais para compatibilidade
// (getAuthToken, setAuthToken, removeAuthToken, isAuthenticated, getAuthHeaders já exportadas acima)
