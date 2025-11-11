/**
 * Sistema de Logging Frontend RE-EDUCA Store
 * 
 * Gerencia logs de forma centralizada, desabilitando console.logs em produção
 * e enviando erros críticos para o backend.
 */

import { getAuthToken } from './storage';

const isDevelopment = import.meta.env.MODE === 'development';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:9001';

/**
 * Envia erro crítico para o backend (não bloqueante)
 * @param {Error} error - Objeto de erro
 * @param {Object} context - Contexto adicional do erro
 */
function sendErrorToBackend(error, context = {}) {
  // Não bloquear a inicialização - usar setTimeout para execução assíncrona
  setTimeout(async () => {
    try {
      const token = getAuthToken();
      
      const errorData = {
        level: 'error',
        message: error?.message || 'Unknown error',
        stack: error?.stack,
        context,
        url: window.location?.href || 'unknown',
        userAgent: navigator?.userAgent || 'unknown',
        timestamp: new Date().toISOString()
      };

      // Usar fetch com timeout para não bloquear
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s timeout

      try {
        await fetch(`${API_URL}/api/v1/system/logs/error`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` })
          },
          body: JSON.stringify(errorData),
          signal: controller.signal
        });
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (e) {
      // Silenciar erros de logging para evitar loops infinitos
      // Em desenvolvimento, ainda logar no console
      if (isDevelopment) {
        console.warn('Erro ao enviar log para backend:', e);
      }
    }
  }, 0);
}

/**
 * Logger centralizado
 */
const logger = {
  /**
   * Log de erro
   * @param {string} message - Mensagem de erro
   * @param {Error} error - Objeto de erro (opcional)
   * @param {Object} context - Contexto adicional (opcional)
   */
  error: (message, error = null, context = {}) => {
    if (isDevelopment) {
      console.error(message, error, context);
    }
    
    // Em produção, enviar erros críticos para backend
    if (!isDevelopment && error) {
      sendErrorToBackend(error, { message, ...context });
    }
  },

  /**
   * Log de aviso
   * @param {string} message - Mensagem de aviso
   * @param {...any} args - Argumentos adicionais
   */
  warn: (message, ...args) => {
    if (isDevelopment) {
      console.warn(message, ...args);
    }
    // Avisos não são enviados para backend em produção
  },

  /**
   * Log de informação
   * @param {string} message - Mensagem informativa
   * @param {...any} args - Argumentos adicionais
   */
  info: (message, ...args) => {
    if (isDevelopment) {
      console.info(message, ...args);
    }
    // Informações não são enviadas para backend em produção
  },

  /**
   * Log de debug
   * @param {string} message - Mensagem de debug
   * @param {...any} args - Argumentos adicionais
   */
  debug: (message, ...args) => {
    if (isDevelopment) {
      console.debug(message, ...args);
    }
    // Debug não é enviado para backend em produção
  },

  /**
   * Log genérico (equivale a console.log)
   * @param {string} message - Mensagem
   * @param {...any} args - Argumentos adicionais
   */
  log: (message, ...args) => {
    if (isDevelopment) {
      console.log(message, ...args);
    }
    // Logs genéricos não são enviados para backend em produção
  }
};

export default logger;