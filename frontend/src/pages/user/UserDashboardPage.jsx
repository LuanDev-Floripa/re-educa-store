import React, { useState, useEffect } from "react";
import logger from "@/utils/logger";
import apiClient from "@/services/apiClient";
import { HelmetWrapper } from "@/components/SEO/HelmetWrapper";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/Ui/card";
import { Button } from "@/components/Ui/button";
import { Badge } from "@/components/Ui/badge";
import { H1, H2, H3 } from "@/components/Ui/typography";
import {
  Heart,
  Activity,
  Target,
  TrendingUp,
  Calendar,
  Award,
  Clock,
  Zap,
  Droplets,
  Moon,
  Brain,
  Dumbbell,
  Calculator,
  ShoppingCart,
  Package,
  Bot,
  ArrowRight,
  Plus,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.jsx";
import { toast } from "sonner";

/**
 * UserDashboardPage
 * Painel do usuário com metas, atividades e atalhos (com fallbacks e guards).
 */
const UserDashboardPage = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [selectedPeriod, setSelectedPeriod] = useState("week");

  // Dados do usuário - buscar do backend
  const [userData, setUserData] = useState({
    healthScore: 0,
    weeklyGoals: {
      workouts: { completed: 0, target: 5 },
      water: { completed: 0, target: 3.0 },
      sleep: { completed: 0, target: 8.0 },
      calories: { completed: 0, target: 2000 },
    },
    recentActivities: [],
    achievements: [],
    quickStats: {
      totalWorkouts: 0,
      totalCalories: 0,
      streakDays: 0,
      bmi: 0,
    },
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Usar apiClient para consistência
        const responseData = await apiClient.getUserDashboard();
        const data = responseData.data || responseData;
          const safe = {
            healthScore: Number(data?.healthScore) || 0,
            weeklyGoals: {
              workouts: {
                completed: Number(data?.weeklyGoals?.workouts?.completed) || 0,
                target: Number(data?.weeklyGoals?.workouts?.target) || 0,
              },
              water: {
                completed: Number(data?.weeklyGoals?.water?.completed) || 0,
                target: Number(data?.weeklyGoals?.water?.target) || 0,
              },
              sleep: {
                completed: Number(data?.weeklyGoals?.sleep?.completed) || 0,
                target: Number(data?.weeklyGoals?.sleep?.target) || 0,
              },
              calories: {
                completed: Number(data?.weeklyGoals?.calories?.completed) || 0,
                target: Number(data?.weeklyGoals?.calories?.target) || 0,
              },
            },
            recentActivities: Array.isArray(data?.recentActivities) ? data.recentActivities : [],
            achievements: Array.isArray(data?.achievements) ? data.achievements : [],
            quickStats: {
              totalWorkouts: Number(data?.quickStats?.totalWorkouts) || 0,
              totalCalories: Number(data?.quickStats?.totalCalories) || 0,
              streakDays: Number(data?.quickStats?.streakDays) || 0,
              bmi: Number(data?.quickStats?.bmi) || 0,
            },
          };
          setUserData(safe);
      } catch (error) {
        logger.error("Erro ao buscar dados do dashboard:", error);
        toast.error(error?.message || "Erro ao carregar dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const getActivityIcon = (type) => {
    switch (type) {
      case "workout":
        return <Dumbbell className="w-5 h-5 text-primary" />;
      case "meal":
        return <Heart className="w-5 h-5 text-primary" />;
      case "water":
        return <Droplets className="w-5 h-5 text-primary" />;
      case "sleep":
        return <Moon className="w-5 h-5 text-primary" />;
      default:
        return <Activity className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case "workout":
        return "bg-primary/10 border-primary/20";
      case "meal":
        return "bg-primary/10 border-primary/20";
      case "water":
        return "bg-primary/10 border-primary/20";
      case "sleep":
        return "bg-primary/10 border-primary/20";
      default:
        return "bg-muted border-border";
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 px-4 sm:px-6 lg:px-8">
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-4 border-primary mx-auto mb-4" aria-hidden="true"></div>
          <p className="text-base sm:text-lg text-muted-foreground" role="status" aria-live="polite">
            Carregando seu dashboard...
          </p>
        </div>
      </div>
    );
  }

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://topsupplementslab.com';
  const userName = user?.name || 'Usuário';

  return (
    <HelmetWrapper
      title={`Dashboard - ${userName} | RE-EDUCA`}
      description={`Painel personalizado de ${userName}. Acompanhe sua saúde, metas, atividades e progresso na plataforma RE-EDUCA.`}
      keywords="dashboard, saúde, bem-estar, metas, atividades, progresso, RE-EDUCA"
      ogUrl={`${baseUrl}/dashboard`}
      canonical={`${baseUrl}/dashboard`}
      noindex={true}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <H1 className="flex items-center gap-2.5 sm:gap-3 mb-3">
            <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            {t('dashboard.welcome', { name: user?.name || t('common.appName') })}
          </H1>
          <p className="text-muted-foreground/90 leading-relaxed">
            {t('dashboard.welcomeMessage')}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="border border-border/50 rounded-lg px-4 py-2.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200 w-full sm:w-auto"
          >
            <option value="today">Hoje</option>
            <option value="week">Esta Semana</option>
            <option value="month">Este Mês</option>
          </select>

          <Link to="/ai" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto gap-2.5">
              <Bot className="w-5 h-5" />
              Assistente IA
            </Button>
          </Link>
        </div>
      </div>

      {/* Health Score */}
      <Card className="bg-gradient-primary/10">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <H2 className="mb-2">
                {t('dashboard.healthScore')}
              </H2>
              <p className="text-sm sm:text-base text-muted-foreground/90 leading-relaxed">
                {t('dashboard.healthScoreDescription')}
              </p>
            </div>
            <div className="text-center w-full sm:w-auto">
              <div className="text-3xl sm:text-4xl font-bold text-primary mb-1">
                {userData.healthScore}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground/90">
                de 100
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground/90 mb-2">
                  Treinos
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {userData.quickStats.totalWorkouts}
                </p>
              </div>
              <div className="p-3 bg-primary/10 rounded-lg">
                <Dumbbell className="w-6 h-6 text-primary" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-primary">+3 esta semana</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground/90 mb-2">
                  Calorias Queimadas
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {userData.quickStats.totalCalories.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-primary/10 rounded-lg">
                <Zap className="w-6 h-6 text-primary" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-primary">+450 hoje</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground/90 mb-2">
                  Sequência
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {userData.quickStats.streakDays} dias
                </p>
              </div>
              <div className="p-3 bg-primary/10 rounded-lg">
                <Target className="w-6 h-6 text-primary" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-primary">Mantendo o foco!</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground/90 mb-2">
                  IMC
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {userData.quickStats.bmi}
                </p>
              </div>
              <div className="p-3 bg-primary/10 rounded-lg">
                <Calculator className="w-6 h-6 text-primary" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <span className="text-primary">Peso ideal</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Weekly Goals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2.5">
              <Target className="w-5 h-5" />
              Metas da Semana
            </CardTitle>
            <CardDescription className="text-muted-foreground/90 leading-relaxed">Acompanhe seu progresso semanal</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {Object.entries(userData?.weeklyGoals || {}).map(([goal, data]) => (
              <div key={goal} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-foreground">
                    {goal === "workouts" && "Treinos"}
                    {goal === "water" && "Água (L)"}
                    {goal === "sleep" && "Sono (h)"}
                    {goal === "calories" && "Calorias"}
                  </span>
                  <span className="text-sm text-muted-foreground/90">
                    {Number(data?.completed) || 0} / {Number(data?.target) || 0}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${(Number(data?.target) ? (Number(data?.completed) || 0) / Number(data?.target) : 0) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2.5">
              <Clock className="w-5 h-5" />
              Atividades Recentes
            </CardTitle>
            <CardDescription className="text-muted-foreground/90 leading-relaxed">
              Suas últimas atividades registradas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {(Array.isArray(userData?.recentActivities) ? userData.recentActivities : []).map((activity, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-4 p-4 rounded-lg border border-border/30 ${getActivityColor(activity.type)} transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]`}
                >
                  <div className="flex-shrink-0">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">
                      {activity?.name || "Atividade"}
                    </p>
                    <p className="text-sm text-muted-foreground/90">
                      {activity?.time || ""}
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground/90">
                    {activity?.duration || activity?.calories || activity?.amount || ""}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ferramentas Rápidas</CardTitle>
          <CardDescription>
            Acesse rapidamente as principais funcionalidades
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link to="/tools/imc">
              <Card className="hover:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] cursor-pointer">
                <CardContent className="p-6 text-center">
                  <Calculator className="w-8 h-8 text-primary mx-auto mb-3" />
                  <h3 className="font-medium mb-2">Calculadora IMC</h3>
                  <p className="text-sm text-muted-foreground/90 leading-relaxed">
                    Calcule seu IMC
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link to="/tools/calorie-calculator">
              <Card className="hover:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] cursor-pointer">
                <CardContent className="p-6 text-center">
                  <Zap className="w-8 h-8 text-primary mx-auto mb-3" />
                  <h3 className="font-medium mb-2">Calorias</h3>
                  <p className="text-sm text-muted-foreground/90 leading-relaxed">
                    Calcule suas necessidades
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link to="/tools/hydration-calculator">
              <Card className="hover:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] cursor-pointer">
                <CardContent className="p-6 text-center">
                  <Droplets className="w-8 h-8 text-primary mx-auto mb-3" />
                  <h3 className="font-medium mb-2">Hidratação</h3>
                  <p className="text-sm text-muted-foreground/90 leading-relaxed">
                    Suas necessidades de água
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link to="/store">
              <Card className="hover:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] cursor-pointer">
                <CardContent className="p-6 text-center">
                  <ShoppingCart className="w-8 h-8 text-primary mx-auto mb-3" />
                  <h3 className="font-medium mb-2">Loja</h3>
                  <p className="text-sm text-muted-foreground/90 leading-relaxed">
                    Suplementos e produtos
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Conquistas
          </CardTitle>
          <CardDescription className="text-muted-foreground/90 leading-relaxed">Suas conquistas e badges</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {(Array.isArray(userData?.achievements) ? userData.achievements : []).map((achievement, index) => (
              <div
                key={index}
                className={`p-6 rounded-lg border-2 transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                  achievement.earned
                    ? "border-primary/50 bg-primary/10"
                    : "border-border/30 bg-muted/50"
                }`}
              >
                <div className="text-center">
                  <achievement.icon
                    className={`w-8 h-8 mx-auto mb-3 ${
                      achievement.earned ? "text-primary" : "text-muted-foreground/60"
                    }`}
                  />
                  <h4
                    className={`font-medium mb-2 ${
                      achievement.earned
                        ? "text-foreground"
                        : "text-muted-foreground/90"
                    }`}
                  >
                    {achievement?.name || "Conquista"}
                  </h4>
                  <p
                    className={`text-sm leading-relaxed ${
                      achievement.earned
                        ? "text-foreground/90"
                        : "text-muted-foreground/90"
                    }`}
                  >
                    {achievement?.description || ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      </div>
    </HelmetWrapper>
  );
};

export default UserDashboardPage;
