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
  showCustomization = true,
}) => {
  const { user } = useAuth();
  const {
    dashboardData,
    loading,
    error,
    fetchDashboardData,
  } = useDashboard();

  const [customizing, setCustomizing] = useState(false);
  const [selectedWidgets, setSelectedWidgets] = useState([]);

  // Carrega dados do dashboard
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);


  const toggleCustomization = () => {
    setCustomizing(!customizing);
  };

  const getWidgetBgColor = (type) => {
    switch (type) {
      case "welcome":
        return "bg-primary/10";
      case "stats":
        return "bg-primary/5";
      case "goals":
        return "bg-primary/10";
      case "achievements":
        return "bg-primary/5";
      case "activity":
        return "bg-primary/10";
      case "health":
        return "bg-primary/5";
      case "recommendations":
        return "bg-primary/10";
      case "progress":
        return "bg-primary/5";
      default:
        return "bg-muted";
    }
  };

  const renderWelcomeWidget = () => (
    <Card className={`h-full ${getWidgetBgColor("welcome")}`}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-primary/20 rounded-full">
            <User className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-foreground">Bem-vindo de volta!</h3>
            <p className="text-sm sm:text-base text-muted-foreground">
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
            <span className="text-sm text-muted-foreground">Exercícios hoje</span>
            <span className="font-semibold text-foreground">
              {dashboardData?.stats?.exercises_today || 0}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Calorias queimadas</span>
            <span className="font-semibold text-foreground">
              {dashboardData?.stats?.calories_burned || 0}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Tempo ativo</span>
            <span className="font-semibold text-foreground">
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
                <span className="text-xs text-muted-foreground">{goal.progress}%</span>
              </div>
              <Progress value={goal.progress} className="h-2" />
            </div>
          )) || <p className="text-sm text-muted-foreground">Nenhuma meta definida</p>}
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
                <div className="p-2 bg-primary/20 rounded-full">
                  <Award className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{achievement.name}</p>
                  <p className="text-xs text-muted-foreground">{achievement.date}</p>
                </div>
              </div>
            )) || (
            <p className="text-sm text-muted-foreground">Nenhuma conquista recente</p>
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
            <span className="text-sm text-muted-foreground">IMC</span>
            <span className="font-semibold text-foreground">
              {dashboardData?.health?.imc || "N/A"}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Peso</span>
            <span className="font-semibold text-foreground">
              {dashboardData?.health?.weight || "N/A"}kg
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Meta de calorias</span>
            <span className="font-semibold text-foreground">
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
              <div className="p-1 bg-primary/20 rounded-full mt-1">
                <Zap className="w-3 h-3 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{rec.title}</p>
                <p className="text-xs text-muted-foreground">{rec.description}</p>
              </div>
            </div>
          )) || (
            <p className="text-sm text-muted-foreground">
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
        <AlertCircle className="w-6 h-6 text-destructive" />
        <span className="ml-2 text-destructive">{error}</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6 sm:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Dashboard
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
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
              <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum widget disponível</p>
            </div>
          )}
        </div>

        {/* Modo de Personalização */}
        {customizing && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-card/95 backdrop-blur-xl rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_rgba(0,0,0,0.04)] border border-border/30">
              <h3 className="text-lg font-semibold mb-4 text-foreground">
                Personalizar Dashboard
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-4">
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
                      className="flex items-center space-x-3 p-2 hover:bg-accent rounded cursor-pointer"
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
                        className="rounded border-border text-primary focus:ring-primary"
                      />
                      <Icon className="w-4 h-4 text-foreground" />
                      <span className="text-sm text-foreground">{widget.name}</span>
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
