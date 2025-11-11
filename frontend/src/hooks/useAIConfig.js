import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import apiClient from "@/services/apiClient";
/**
 * useAIConfig
 * - Gestão de configurações de AI (CRUD, testes, métricas)
 * - Fallbacks com mensagens e retorno seguro; deps corretas
 */

const useAIConfig = () => {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Carregar configurações
  const loadConfigs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await apiClient.request("/admin/ai/configs");
      setConfigs(data.data || data || []);
      return data.data || data || [];
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Criar nova configuração
  const createConfig = useCallback(
    async (configData) => {
      try {
        setLoading(true);
        setError(null);

        const data = await apiClient.post("/admin/ai/configs", {
          body: configData,
        });

        if (data.success) {
          toast.success("Configuração criada com sucesso");
          await loadConfigs(); // Recarregar lista
          return data.data;
        } else {
          throw new Error(data.error || "Erro ao criar configuração");
        }
      } catch (err) {
        setError(err.message);
        toast.error(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [loadConfigs],
  );

  // Atualizar configuração
  const updateConfig = useCallback(
    async (configId, updateData) => {
      try {
        setLoading(true);
        setError(null);

        const data = await apiClient.put(`/admin/ai/configs/${configId}`, {
          body: updateData,
        });

        if (data.success) {
          toast.success("Configuração atualizada com sucesso");
          await loadConfigs(); // Recarregar lista
          return data.data;
        } else {
          throw new Error(data.error || "Erro ao atualizar configuração");
        }
      } catch (err) {
        setError(err.message);
        toast.error(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [loadConfigs],
  );

  // Deletar configuração
  const deleteConfig = useCallback(
    async (configId) => {
      try {
        setLoading(true);
        setError(null);

        const data = await apiClient.delete(`/admin/ai/configs/${configId}`);

        if (data.success) {
          toast.success("Configuração deletada com sucesso");
          await loadConfigs(); // Recarregar lista
          return true;
        } else {
          throw new Error(data.error || "Erro ao deletar configuração");
        }
      } catch (err) {
        setError(err.message);
        toast.error(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [loadConfigs],
  );

  // Testar configuração
  const testConfig = useCallback(async (configId) => {
    try {
      setLoading(true);
      setError(null);

      const data = await apiClient.post(`/admin/ai/configs/${configId}/test`);

      if (data.success) {
        toast.success(`Teste bem-sucedido: ${data.data.status}`);
        return data.data;
      } else {
        throw new Error(data.error || "Teste falhou");
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Obter health check
  const getHealthStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await apiClient.get("/admin/ai/health");
      return data.data || data;
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Obter estatísticas de uso
  const getUsageStats = useCallback(async (days = 30, provider = null) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (days) params.append("days", days);
      if (provider) params.append("provider", provider);

      const data = await apiClient.get(`/admin/ai/usage-stats?${params}`);
      return data.data || data;
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Carregar configurações na inicialização
  useEffect(() => {
    loadConfigs();
  }, [loadConfigs]);

  return {
    configs,
    loading,
    error,
    loadConfigs,
    createConfig,
    updateConfig,
    deleteConfig,
    testConfig,
    getHealthStatus,
    getUsageStats,
  };
};

export default useAIConfig;
