/**
 * DashboardReal Component - RE-EDUCA Store
 * 
 * Dashboard personalizado com widgets configuráveis.
 * 
 * Funcionalidades:
 * - Widgets de métricas e estatísticas
 * - Customização de layout
 * - Atualização em tempo real
 * - Modo de customização
 * 
 * @component
 * @param {Object} props - Props do componente
 * @param {Function} [props.onWidgetUpdate] - Callback ao atualizar widget
 * @param {Function} [props.onLayoutChange] - Callback ao mudar layout
 * @param {boolean} [props.showCustomization=true] - Mostrar opções de customização
 * @returns {JSX.Element} Dashboard personalizado
 */
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../Ui/card";
import { Button } from "../Ui/button";
import { Badge } from "../Ui/badge";
import { Progress } from "../Ui/progress";
import { useDashboard } from "../../hooks/useDashboard";
import { useAuth } from "../../hooks/useAuth";
import {
  User,
  Activity,
  Target,
  Trophy,
  Heart,
  TrendingUp,
  BarChart3,
  Star,
  Award,
  Calendar,
  Clock,
  Zap,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Settings,
  Plus,
  Eye,
  EyeOff,
} from "lucide-react";

const DashboardReal = ({
  onWidgetUpdate,
  onLayoutChange,
  showCustomization = true,
}) => {
  const { user } = useAuth();
  const {
    dashboardData,
    loading,
    error,
    fetchDashboardData,
    updateWidget,
    updateLayout,
  } = useDashboard();

  const [customizing, setCustomizing] = useState(false);
  const [selectedWidgets, setSelectedWidgets] = useState([]);

  // Carrega dados do dashboard
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  /**
   * Atualiza um widget específico e chama callback se fornecido.
   * Mantido para uso futuro ou chamadas externas.
   * 
   * @param {string} widgetId - ID do widget a atualizar
   * @param {Object} updates - Objeto com atualizações do widget
   */
  // eslint-disable-next-line no-unused-vars
  const handleWidgetUpdate = async (widgetId, updates) => {
    try {
      const result = await updateWidget(widgetId, updates);
      if (result?.success && onWidgetUpdate) {
        onWidgetUpdate(widgetId, updates);
      }
    } catch (error) {
      console.error("Erro ao atualizar widget:", error);
    }
  };

  /**
   * Atualiza o layout do dashboard e chama callback se fornecido.
   * Mantido para uso futuro ou chamadas externas.
   * 
   * @param {Object} newLayout - Novo layout do dashboard
   */
  // eslint-disable-next-line no-unused-vars
  const handleLayoutChange = async (newLayout) => {
    try {
      const result = await updateLayout(newLayout);
      if (result?.success && onLayoutChange) {
        onLayoutChange(newLayout);
      }
    } catch (error) {
      console.error("Erro ao atualizar layout:", error);
    }
  };

  const toggleCustomization = () => {
    setCustomizing(!customizing);
  };

  const getWidgetBgColor = (type) => {
    switch (type) {
      case "welcome":
        return "bg-blue-50";
      case "stats":
        return "bg-green-50";
      case "goals":
        return "bg-purple-50";
      case "achievements":
        return "bg-yellow-50";
      case "activity":
        return "bg-orange-50";
      case "health":
        return "bg-red-50";
      case "recommendations":
        return "bg-pink-50";
      case "progress":
        return "bg-indigo-50";
      default:
        return "bg-gray-50";
    }
  };

  const renderWelcomeWidget = () => (
    <Card className={`h-full ${getWidgetBgColor("welcome")}`}>
      <CardContent className="p-6">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-100 rounded-full">
            <User className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Bem-vindo de volta!</h3>
            <p className="text-gray-600">
              Olá, {user?.name || "Usuário"}! Como você está se sentindo hoje?
            </p>
          </div>
        </div>
        <div className="mt-4">
          <Button className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Começar Exercício
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderStatsWidget = () => (
    <Card className={`h-full ${getWidgetBgColor("stats")}`}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <BarChart3 className="w-5 h-5 mr-2" />
          Estatísticas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Exercícios hoje</span>
            <span className="font-semibold">
              {dashboardData?.stats?.exercises_today || 0}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Calorias queimadas</span>
            <span className="font-semibold">
              {dashboardData?.stats?.calories_burned || 0}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Tempo ativo</span>
            <span className="font-semibold">
              {dashboardData?.stats?.active_time || "0min"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderGoalsWidget = () => (
    <Card className={`h-full ${getWidgetBgColor("goals")}`}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Target className="w-5 h-5 mr-2" />
          Metas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {dashboardData?.goals?.slice(0, 3).map((goal, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">{goal.title}</span>
                <span className="text-xs text-gray-500">{goal.progress}%</span>
              </div>
              <Progress value={goal.progress} className="h-2" />
            </div>
          )) || <p className="text-sm text-gray-500">Nenhuma meta definida</p>}
        </div>
      </CardContent>
    </Card>
  );

  const renderAchievementsWidget = () => (
    <Card className={`h-full ${getWidgetBgColor("achievements")}`}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Trophy className="w-5 h-5 mr-2" />
          Conquistas Recentes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {dashboardData?.achievements
            ?.slice(0, 3)
            .map((achievement, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="p-2 bg-yellow-100 rounded-full">
                  <Award className="w-4 h-4 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">{achievement.name}</p>
                  <p className="text-xs text-gray-500">{achievement.date}</p>
                </div>
              </div>
            )) || (
            <p className="text-sm text-gray-500">Nenhuma conquista recente</p>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderHealthWidget = () => (
    <Card className={`h-full ${getWidgetBgColor("health")}`}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Heart className="w-5 h-5 mr-2" />
          Saúde
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">IMC</span>
            <span className="font-semibold">
              {dashboardData?.health?.imc || "N/A"}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Peso</span>
            <span className="font-semibold">
              {dashboardData?.health?.weight || "N/A"}kg
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Meta de calorias</span>
            <span className="font-semibold">
              {dashboardData?.health?.calorie_goal || "N/A"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderRecommendationsWidget = () => (
    <Card className={`h-full ${getWidgetBgColor("recommendations")}`}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Star className="w-5 h-5 mr-2" />
          Recomendações
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {dashboardData?.recommendations?.slice(0, 3).map((rec, index) => (
            <div key={index} className="flex items-start space-x-3">
              <div className="p-1 bg-pink-100 rounded-full mt-1">
                <Zap className="w-3 h-3 text-pink-600" />
              </div>
              <div>
                <p className="text-sm font-medium">{rec.title}</p>
                <p className="text-xs text-gray-500">{rec.description}</p>
              </div>
            </div>
          )) || (
            <p className="text-sm text-gray-500">
              Nenhuma recomendação disponível
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderWidget = (widget) => {
    switch (widget.type) {
      case "welcome":
        return renderWelcomeWidget();
      case "stats":
        return renderStatsWidget();
      case "goals":
        return renderGoalsWidget();
      case "achievements":
        return renderAchievementsWidget();
      case "health":
        return renderHealthWidget();
      case "recommendations":
        return renderRecommendationsWidget();
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin" />
        <span className="ml-2">Carregando dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <AlertCircle className="w-6 h-6 text-red-500" />
        <span className="ml-2 text-red-500">{error}</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Acompanhe seu progresso e conquistas
            </p>
          </div>
          {showCustomization && (
            <Button onClick={toggleCustomization} variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              {customizing ? "Finalizar" : "Personalizar"}
            </Button>
          )}
        </div>

        {/* Grid de Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {dashboardData?.widgets?.map((widget, index) => (
            <div
              key={widget.id || index}
              className={`${widget.size === "large" ? "md:col-span-2" : ""} ${
                widget.size === "wide" ? "md:col-span-2 lg:col-span-3" : ""
              }`}
            >
              {renderWidget(widget)}
            </div>
          )) || (
            <div className="col-span-full text-center py-12">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum widget disponível</p>
            </div>
          )}
        </div>

        {/* Modo de Personalização */}
        {customizing && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">
                Personalizar Dashboard
              </h3>
              <p className="text-gray-600 mb-4">
                Selecione os widgets que deseja exibir no seu dashboard.
              </p>
              <div className="space-y-2">
                {[
                  { id: "welcome", name: "Boas-vindas", icon: User },
                  { id: "stats", name: "Estatísticas", icon: BarChart3 },
                  { id: "goals", name: "Metas", icon: Target },
                  { id: "achievements", name: "Conquistas", icon: Trophy },
                  { id: "health", name: "Saúde", icon: Heart },
                  { id: "recommendations", name: "Recomendações", icon: Star },
                ].map((widget) => {
                  const Icon = widget.icon;
                  return (
                    <label
                      key={widget.id}
                      className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={selectedWidgets.includes(widget.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedWidgets([...selectedWidgets, widget.id]);
                          } else {
                            setSelectedWidgets(
                              selectedWidgets.filter((id) => id !== widget.id),
                            );
                          }
                        }}
                        className="rounded"
                      />
                      <Icon className="w-4 h-4" />
                      <span className="text-sm">{widget.name}</span>
                    </label>
                  );
                })}
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <Button variant="outline" onClick={toggleCustomization}>
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    // Implementar salvamento das preferências
                    toggleCustomization();
                  }}
                >
                  Salvar
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardReal;
