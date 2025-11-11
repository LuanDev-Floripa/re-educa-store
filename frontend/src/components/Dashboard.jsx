import React, { useState, useEffect } from "react";
import logger from "@/utils/logger";
import apiClient from "@/services/apiClient";
// ... demais imports ...

/**
 * Dashboard principal do sistema.
 * Mostra: perfil, estatísticas, gráficos, conquistas.
 * Inclui fallback amigável em caso de erro na API.
 */
const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const response = await apiClient.getUserDashboard();
        if (response) { /* ...atualiza... */ }
        const profile = await apiClient.getUserProfile();
        if (profile?.user) { /* ...atualiza user... */ }
      } catch (_ERROR) {
        logger.error(_ERROR);
        setApiError("Não foi possível carregar o dashboard. Tente novamente mais tarde.");
      } finally {
        setIsLoading(false);
      }
    };
    loadDashboardData();
  }, []);

  if (isLoading) return <DashboardSkeleton />;
  if (apiError) return <div className="min-h-screen flex items-center justify-center text-red-600 text-xl">{apiError}</div>;

  // ...restante do componente...
};

const DashboardSkeleton = () => (
  <div className="min-h-screen flex items-center justify-center text-muted-foreground">Carregando...</div>
);

export default Dashboard;

