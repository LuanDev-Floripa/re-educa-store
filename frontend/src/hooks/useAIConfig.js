import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

const useAIConfig = () => {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Obter token de autenticação
  const getAuthToken = () => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      toast.error('Token de autenticação não encontrado');
      throw new Error('Token de autenticação requerido');
    }
    return token;
  };

  // Carregar configurações
  const loadConfigs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/ai/configs', {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setConfigs(data.data || []);
        return data.data || [];
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao carregar configurações');
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Criar nova configuração
  const createConfig = useCallback(async (configData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/ai/configs', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(configData)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast.success('Configuração criada com sucesso');
          await loadConfigs(); // Recarregar lista
          return data.data;
        } else {
          throw new Error(data.error || 'Erro ao criar configuração');
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao criar configuração');
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadConfigs]);

  // Atualizar configuração
  const updateConfig = useCallback(async (configId, updateData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/admin/ai/configs/${configId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast.success('Configuração atualizada com sucesso');
          await loadConfigs(); // Recarregar lista
          return data.data;
        } else {
          throw new Error(data.error || 'Erro ao atualizar configuração');
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao atualizar configuração');
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadConfigs]);

  // Deletar configuração
  const deleteConfig = useCallback(async (configId) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/admin/ai/configs/${configId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast.success('Configuração deletada com sucesso');
          await loadConfigs(); // Recarregar lista
          return true;
        } else {
          throw new Error(data.error || 'Erro ao deletar configuração');
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao deletar configuração');
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadConfigs]);

  // Testar configuração
  const testConfig = useCallback(async (configId) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/admin/ai/configs/${configId}/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast.success(`Teste bem-sucedido: ${data.data.status}`);
          return data.data;
        } else {
          throw new Error(data.error || 'Teste falhou');
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao testar configuração');
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
      
      const response = await fetch('/api/admin/ai/health', {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.data;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao obter status de saúde');
      }
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
      if (days) params.append('days', days);
      if (provider) params.append('provider', provider);
      
      const response = await fetch(`/api/admin/ai/usage-stats?${params}`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.data;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao obter estatísticas');
      }
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
    getUsageStats
  };
};

export default useAIConfig;