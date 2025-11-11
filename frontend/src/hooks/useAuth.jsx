import { useState, useEffect, useCallback, createContext, useContext } from "react";
import logger from "@/utils/logger";
/**
 * useAuth / AuthProvider
 * - Autenticação global com verificação, login, registro e atualizações
 * - Fallbacks seguros, limpeza de tokens em erro, deps corretas
 */
import apiClient from "../services/apiClient";
import { getAuthToken, clearAllTokens } from "../utils/storage";

// Context para autenticação
const AuthContext = createContext();

// Hook para usar o contexto de autenticação
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
};

// Provider de autenticação
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const checkAuthStatus = useCallback(async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        setLoading(false);
        return;
      }

      // Atualiza token no apiClient
      apiClient.token = token;
      
      // Verifica se token é válido buscando perfil do usuário
      const response = await apiClient.getUserProfile();
      if (response && (response.user || response.name || response.email)) {
        // Normaliza formato do usuário
        const userData = response.user || response;
        setUser(userData);
        setIsAuthenticated(true);
      }
    } catch (error) {
      logger.error("Erro ao verificar autenticação:", error);
      // Se falhou, limpa tokens
      apiClient.clearTokens?.();
      clearAllTokens();
    } finally {
      setLoading(false);
    }
  }, []);

  // Verifica se usuário está autenticado ao carregar
  useEffect(() => {
    checkAuthStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email, password) => {
    try {
      setLoading(true);
      const response = await apiClient.login(email, password);

      if (response.token) {
        // Usa o usuário retornado na resposta ou busca dados completos
        let userData = response.user;

        if (!userData || !userData.id) {
          // Se não tiver dados completos, busca do perfil
          try {
            const userResponse = await apiClient.getUserProfile();
            userData = userResponse.user || response.user;
          } catch (profileError) {
            logger.warn(
              "Erro ao buscar perfil, usando dados da resposta:",
              profileError,
            );
            // Usa os dados básicos da resposta
            userData = response.user;
          }
        }

        setUser(userData);
        setIsAuthenticated(true);
        return { success: true, user: userData };
      }

      return {
        success: false,
        error: response.error || response.message || "Erro no login",
      };
    } catch (error) {
      logger.error("Erro no login:", error);
      const errorMessage =
        error.message || "Erro ao fazer login. Verifique suas credenciais.";
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      const response = await apiClient.register(userData);

      if (response.token && response.user) {
        // Salva tokens se fornecidos
        if (response.token) {
          apiClient.setTokens?.(response.token, response.refresh_token);
        }

        // Usa o usuário retornado na resposta
        const userData = response.user;
        setUser(userData);
        setIsAuthenticated(true);
        return { success: true, user: userData };
      }

      // Se não tem token mas tem mensagem de sucesso
      if (response.message && response.message.includes("sucesso")) {
        // Busca perfil para obter dados do usuário
        try {
          const profileResponse = await apiClient.getUserProfile();
          if (profileResponse.user) {
            setUser(profileResponse.user);
            setIsAuthenticated(true);
            return { success: true, user: profileResponse.user };
          }
        } catch (profileError) {
          logger.warn("Erro ao buscar perfil após registro:", profileError);
        }
      }

      return {
        success: false,
        error: response.error || response.message || "Erro no registro",
      };
    } catch (error) {
      logger.error("Erro no registro:", error);
      const errorMessage =
        error.message || "Erro ao criar conta. Tente novamente.";
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiClient.logout?.();
    } catch (error) {
      logger.error("Erro no logout:", error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
    }
  };

  const updateUser = async (userData) => {
    try {
      const response = await apiClient.updateUserProfile(userData);
      if (response.user) {
        setUser(response.user);
        return { success: true, user: response.user };
      }
      return {
        success: false,
        error: response.error || "Erro ao atualizar perfil",
      };
    } catch (error) {
      logger.error("Erro ao atualizar perfil:", error);
      return { success: false, error: error.message };
    }
  };

  const refreshUser = async () => {
    try {
      const response = await apiClient.getUserProfile();
      if (response.user) {
        setUser(response.user);
        return response.user;
      }
    } catch (error) {
      logger.error("Erro ao atualizar dados do usuário:", error);
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
