/**
 * Helper centralizado para gerenciamento de tokens de autenticação
 * Padroniza o uso de tokens em todo o frontend
 * 
 * @deprecated Este arquivo é mantido para compatibilidade.
 * Use frontend/src/utils/storage.js para novos códigos.
 */

// Re-exporta de storage.js para manter compatibilidade
export {
  getAuthToken,
  setAuthToken,
  removeAuthToken,
  isAuthenticated,
  getAuthHeaders,
  getRefreshToken,
  setRefreshToken,
  getAdminToken,
  setAdminToken,
  clearAllTokens,
} from './storage';
