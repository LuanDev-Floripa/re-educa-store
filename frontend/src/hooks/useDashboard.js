import { useState, useEffect, useCallback } from "react";
import apiClient from "../services/apiClient";
/**
 * useDashboard
 * - Busca dados do dashboard e permite atualizar widgets/layout
 * - Retornos padronizados e fallbacks seguros
 */

export const useDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.getUserDashboard();
      setDashboardData(response || null);
      return { success: true, data: response || null };
    } catch (err) {
      const errorMessage = err.message || "Erro ao carregar dashboard";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const updateWidget = useCallback(
    async (widgetId, updates) => {
      try {
        setLoading(true);
        setError(null);

        // Simula atualização de widget (implementar endpoint no backend)
        const response = await apiClient.request?.(
          `/users/dashboard/widgets/${widgetId}`,
          {
            method: "PUT",
            body: JSON.stringify(updates),
          },
        );

        // Atualiza dados locais
        if (dashboardData) {
          setDashboardData((prev) => ({
            ...prev,
            widgets: (prev.widgets || []).map((widget) =>
              widget.id === widgetId ? { ...widget, ...updates } : widget,
            ),
          }));
        }

        return { success: true, data: response };
      } catch (err) {
        const errorMessage = err.message || "Erro ao atualizar widget";
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [dashboardData],
  );

  const updateLayout = useCallback(
    async (newLayout) => {
      try {
        setLoading(true);
        setError(null);

        // Simula atualização de layout (implementar endpoint no backend)
        const response = await apiClient.request?.("/users/dashboard/layout", {
          method: "PUT",
          body: JSON.stringify({ layout: newLayout }),
        });

        // Atualiza dados locais
        if (dashboardData) {
          setDashboardData((prev) => ({
            ...prev,
            layout: newLayout,
          }));
        }

        return { success: true, data: response };
      } catch (err) {
        const errorMessage = err.message || "Erro ao atualizar layout";
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [dashboardData],
  );

  // Carrega dados do dashboard ao montar o componente
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    dashboardData,
    loading,
    error,
    fetchDashboardData,
    updateWidget,
    updateLayout,
  };
};
