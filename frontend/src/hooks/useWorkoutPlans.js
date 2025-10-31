import { useState, useEffect, useCallback } from "react";
import { apiService } from "@/lib/api";
import { toast } from "sonner";
/**
 * useWorkoutPlans
 * - CRUD e listagem de planos com pagina??o, fallbacks e toasts
 */

/**
 * Hook customizado para gerenciar planos de treino
 *
 * @returns {Object} Estado e fun??es para gerenciar planos
 */
export const useWorkoutPlans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  /**
   * Busca planos de treino com filtros opcionais
   * @param {Object} filters - Filtros de busca
   */
  const fetchPlans = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        user_id: filters.userId,
        is_active:
          filters.isActive !== undefined ? String(filters.isActive) : undefined,
        is_public:
          filters.isPublic !== undefined ? String(filters.isPublic) : undefined,
        page: filters.page || 1,
        limit: filters.limit || 20,
      };

      // Remove undefined values
      Object.keys(params).forEach(
        (key) => params[key] === undefined && delete params[key],
      );

      if (!apiService?.workoutPlans?.getAll) {
        throw new Error("Servi?o de planos indispon?vel");
      }
      const response = await apiService.workoutPlans.getAll(params);

      if (Array.isArray(response?.plans)) {
        setPlans(response.plans);
        setPagination((prev) => response.pagination || prev);
      } else {
        setPlans([]);
      }
    } catch (err) {
      console.error("Erro ao buscar planos:", err);
      setError(err?.message || "Erro ao buscar planos de treino");
      setPlans([]);
      toast.error("Erro ao carregar planos de treino");
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Busca um plano espec?fico por ID
   * @param {string} planId - ID do plano
   * @returns {Object|null} Plano encontrado ou null
   */
  const fetchPlanById = useCallback(async (planId) => {
    if (!planId) return null;

    setLoading(true);
    try {
      if (!apiService?.workoutPlans?.getById) {
        throw new Error("Servi?o de planos indispon?vel");
      }
      const response = await apiService.workoutPlans.getById(planId);
      return response?.plan || null;
    } catch (err) {
      console.error("Erro ao buscar plano:", err);
      toast.error("Erro ao carregar plano de treino");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Cria um novo plano de treino
   * @param {Object} planData - Dados do plano
   * @returns {Object|null} Plano criado ou null
   */
  const createPlan = useCallback(
    async (planData) => {
      setLoading(true);
      try {
        if (!apiService?.workoutPlans?.create) {
          throw new Error("Servi?o de cria??o de planos indispon?vel");
        }
        const response = await apiService.workoutPlans.create(planData);
        if (response?.plan) {
          toast.success("Plano de treino criado com sucesso!");
          // Atualiza lista
          await fetchPlans();
          return response.plan;
        }
        return null;
      } catch (err) {
        console.error("Erro ao criar plano:", err);
        toast.error(err.message || "Erro ao criar plano de treino");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [fetchPlans],
  );

  /**
   * Atualiza um plano de treino existente
   * @param {string} planId - ID do plano
   * @param {Object} planData - Dados a atualizar
   * @returns {Object|null} Plano atualizado ou null
   */
  const updatePlan = useCallback(
    async (planId, planData) => {
      setLoading(true);
      try {
        if (!apiService?.workoutPlans?.update) {
          throw new Error("Servi?o de atualiza??o de planos indispon?vel");
        }
        const response = await apiService.workoutPlans.update(planId, planData);
        if (response?.plan) {
          toast.success("Plano de treino atualizado com sucesso!");
          // Atualiza lista
          await fetchPlans();
          return response.plan;
        }
        return null;
      } catch (err) {
        console.error("Erro ao atualizar plano:", err);
        toast.error(err.message || "Erro ao atualizar plano de treino");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [fetchPlans],
  );

  /**
   * Deleta um plano de treino
   * @param {string} planId - ID do plano
   * @returns {boolean} True se deletado com sucesso
   */
  const deletePlan = useCallback(
    async (planId) => {
      setLoading(true);
      try {
        if (!apiService?.workoutPlans?.delete) {
          throw new Error("Servi?o de dele??o de planos indispon?vel");
        }
        await apiService.workoutPlans.delete(planId);
        toast.success("Plano de treino deletado com sucesso!");
        // Atualiza lista
        await fetchPlans();
        return true;
      } catch (err) {
        console.error("Erro ao deletar plano:", err);
        toast.error(err?.message || "Erro ao deletar plano de treino");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [fetchPlans],
  );

  return {
    plans,
    loading,
    error,
    pagination,
    fetchPlans,
    fetchPlanById,
    createPlan,
    updatePlan,
    deletePlan,
  };
};
