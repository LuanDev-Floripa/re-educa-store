import { useState, useCallback } from "react";
import { apiService } from "@/lib/api";
import { toast } from "sonner";
import logger from "@/utils/logger";
/**
 * useWeeklySessions
 * - Gerencia sess?es de treino semanais com fallbacks e toasts
 */

/**
 * Hook customizado para gerenciar sess?es de treino semanais
 *
 * @returns {Object} Estado e fun??es para gerenciar sess?es
 */
export const useWeeklySessions = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Busca sess?es de treino com filtros opcionais
   * @param {Object} filters - Filtros de busca
   */
  const fetchSessions = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        plan_id: filters.planId,
        week_number: filters.weekNumber,
        start_date: filters.startDate,
        end_date: filters.endDate,
      };

      // Remove undefined values
      Object.keys(params).forEach(
        (key) => params[key] === undefined && delete params[key],
      );
      if (!apiService?.weeklySessions?.getAll) {
        throw new Error("Servi?o de sess?es indispon?vel");
      }
      const response = await apiService.weeklySessions.getAll(params);
      setSessions(Array.isArray(response?.sessions) ? response.sessions : []);
    } catch (err) {
      logger.error("Erro ao buscar sess?es:", err);
      setError(err?.message || "Erro ao buscar sess?es de treino");
      setSessions([]);
      toast.error("Erro ao carregar sess?es de treino");
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Cria sess?es semanais baseadas em um plano
   * @param {Object} sessionData - Dados das sess?es
   * @returns {Array|null} Lista de sess?es criadas ou null
   */
  const createSessions = useCallback(
    async (sessionData) => {
      setLoading(true);
      try {
        if (!apiService?.weeklySessions?.create) {
          throw new Error("Servi?o de cria??o de sess?es indispon?vel");
        }
        const response = await apiService.weeklySessions.create(sessionData);
        if (Array.isArray(response?.sessions)) {
          toast.success(
            `${response.sessions.length} sess?o(?es) criada(s) com sucesso!`,
          );
          // Atualiza lista
          await fetchSessions({ planId: sessionData.plan_id });
          return response.sessions;
        }
        return null;
      } catch (err) {
        logger.error("Erro ao criar sess?es:", err);
        toast.error(err?.message || "Erro ao criar sess?es de treino");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [fetchSessions],
  );

  /**
   * Atualiza status de uma sess?o
   * @param {string} sessionId - ID da sess?o
   * @param {Object} statusData - Dados do status
   * @returns {Object|null} Sess?o atualizada ou null
   */
  const updateSessionStatus = useCallback(
    async (sessionId, statusData) => {
      setLoading(true);
      try {
        if (!apiService?.weeklySessions?.updateStatus) {
          throw new Error("Servi?o de atualiza??o de sess?o indispon?vel");
        }
        const response = await apiService.weeklySessions.updateStatus(
          sessionId,
          statusData,
        );
        if (response?.session) {
          toast.success("Status da sess?o atualizado!");
          // Atualiza lista
          const updatedSessions = sessions.map((s) =>
            s.id === sessionId ? response.session : s,
          );
          setSessions(updatedSessions);
          return response.session;
        }
        return null;
      } catch (err) {
        logger.error("Erro ao atualizar sess?o:", err);
        toast.error(err?.message || "Erro ao atualizar sess?o");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [sessions],
  );

  /**
   * Salva progresso de um exerc?cio em uma sess?o
   * @param {string} sessionId - ID da sess?o
   * @param {Object} progressData - Dados do progresso
   * @returns {Object|null} Progresso salvo ou null
   */
  const saveProgress = useCallback(
    async (sessionId, progressData) => {
      setLoading(true);
      try {
        if (!apiService?.weeklySessions?.saveProgress) {
          throw new Error("Servi?o de progresso de sess?o indispon?vel");
        }
        const response = await apiService.weeklySessions.saveProgress(
          sessionId,
          progressData,
        );
        if (response?.progress) {
          toast.success("Progresso salvo com sucesso!");
          // Atualiza sess?o na lista
          await fetchSessions();
          return response.progress;
        }
        return null;
      } catch (err) {
        logger.error("Erro ao salvar progresso:", err);
        toast.error(err?.message || "Erro ao salvar progresso");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [fetchSessions],
  );

  return {
    sessions,
    loading,
    error,
    fetchSessions,
    createSessions,
    updateSessionStatus,
    saveProgress,
  };
};
