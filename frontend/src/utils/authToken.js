/**
 * Helper centralizado para gerenciamento de tokens de autenticação
 * Padroniza o uso de tokens em todo o frontend
 */

/**
 * Retorna o token de autenticação do usuário
 * @returns {string|null} Token ou null se não encontrado
 */
export const getAuthToken = () => {
  // Prioridade: auth_token (padrão novo) > token (legado)
  return localStorage.getItem('auth_token') || localStorage.getItem('token');
};

/**
 * Define o token de autenticação
 * @param {string} token - Token JWT
 * @param {boolean} useLegacyKey - Se true, também salva em 'token' (legado)
 */
export const setAuthToken = (token, useLegacyKey = false) => {
  if (token) {
    localStorage.setItem('auth_token', token);
    if (useLegacyKey) {
      localStorage.setItem('token', token);
    }
  } else {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('token');
  }
};

/**
 * Remove o token de autenticação
 */
export const removeAuthToken = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('token');
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
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  if (includeAuth) {
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
};