import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/Ui/card";
import { Button } from "@/components/Ui/button";
import { Badge } from "@/components/Ui/badge";
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
        const API_URL = import.meta.env.VITE_API_URL || "http://localhost:9001";
        let token = null;
        try {
          token = localStorage.getItem("token");
        } catch {
          token = null;
        }

        const response = await fetch(`${API_URL}/api/users/dashboard`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
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
        } else {
          toast.error("Falha ao carregar dados do usuário");
        }
      } catch (error) {
        console.error("Erro ao buscar dados do dashboard:", error);
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
        return <Dumbbell className="w-5 h-5 text-blue-600" />;
      case "meal":
        return <Heart className="w-5 h-5 text-green-600" />;
      case "water":
        return <Droplets className="w-5 h-5 text-cyan-600" />;
      case "sleep":
        return <Moon className="w-5 h-5 text-purple-600" />;
      default:
        return <Activity className="w-5 h-5 text-gray-600" />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case "workout":
        return "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800";
      case "meal":
        return "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800";
      case "water":
        return "bg-cyan-50 border-cyan-200 dark:bg-cyan-900/20 dark:border-cyan-800";
      case "sleep":
        return "bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800";
      default:
        return "bg-gray-50 border-gray-200 dark:bg-gray-900/20 dark:border-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4" aria-hidden="true"></div>
          <p className="text-lg text-gray-600 dark:text-gray-300" role="status" aria-live="polite">
            Carregando seu dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Heart className="w-8 h-8 text-blue-600" />
            Olá, {user?.name || "Usuário"}! 👋
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Bem-vindo ao seu painel de saúde e bem-estar
          </p>
        </div>

        <div className="flex items-center gap-4">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="today">Hoje</option>
            <option value="week">Esta Semana</option>
            <option value="month">Este Mês</option>
          </select>

          <Link to="/ai">
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 shadow-lg">
              <Bot className="w-5 h-5 mr-2" />
              Assistente IA
            </Button>
          </Link>
        </div>
      </div>

      {/* Health Score */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Seu Score de Saúde
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Baseado nas suas atividades e metas
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600">
                {userData.healthScore}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                de 100
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Treinos
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {userData.quickStats.totalWorkouts}
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                <Dumbbell className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
              <span className="text-green-600">+3 esta semana</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Calorias Queimadas
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {userData.quickStats.totalCalories.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-full">
                <Zap className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
              <span className="text-green-600">+450 hoje</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Sequência
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {userData.quickStats.streakDays} dias
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                <Target className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
              <span className="text-green-600">Mantendo o foco!</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  IMC
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {userData.quickStats.bmi}
                </p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-full">
                <Calculator className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <span className="text-green-600">Peso ideal</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Goals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Metas da Semana
            </CardTitle>
            <CardDescription>Acompanhe seu progresso semanal</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(userData?.weeklyGoals || {}).map(([goal, data]) => (
              <div key={goal} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {goal === "workouts" && "Treinos"}
                    {goal === "water" && "Água (L)"}
                    {goal === "sleep" && "Sono (h)"}
                    {goal === "calories" && "Calorias"}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {Number(data?.completed) || 0} / {Number(data?.target) || 0}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
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
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Atividades Recentes
            </CardTitle>
            <CardDescription>
              Suas últimas atividades registradas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(Array.isArray(userData?.recentActivities) ? userData.recentActivities : []).map((activity, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-4 p-3 rounded-lg border ${getActivityColor(activity.type)}`}
                >
                  <div className="flex-shrink-0">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {activity?.name || "Atividade"}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {activity?.time || ""}
                    </p>
                  </div>
                  <div className="text-sm text-gray-500">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link to="/tools/imc">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-4 text-center">
                  <Calculator className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <h3 className="font-medium">Calculadora IMC</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Calcule seu IMC
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link to="/tools/calorie-calculator">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-4 text-center">
                  <Zap className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                  <h3 className="font-medium">Calorias</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Calcule suas necessidades
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link to="/tools/hydration-calculator">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-4 text-center">
                  <Droplets className="w-8 h-8 text-cyan-600 mx-auto mb-2" />
                  <h3 className="font-medium">Hidratação</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Suas necessidades de água
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link to="/store">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-4 text-center">
                  <ShoppingCart className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <h3 className="font-medium">Loja</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
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
          <CardDescription>Suas conquistas e badges</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(Array.isArray(userData?.achievements) ? userData.achievements : []).map((achievement, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-2 ${
                  achievement.earned
                    ? "border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20"
                    : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                }`}
              >
                <div className="text-center">
                  <achievement.icon
                    className={`w-8 h-8 mx-auto mb-2 ${
                      achievement.earned ? "text-yellow-600" : "text-gray-400"
                    }`}
                  />
                  <h4
                    className={`font-medium ${
                      achievement.earned
                        ? "text-yellow-800 dark:text-yellow-200"
                        : "text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    {achievement?.name || "Conquista"}
                  </h4>
                  <p
                    className={`text-sm ${
                      achievement.earned
                        ? "text-yellow-700 dark:text-yellow-300"
                        : "text-gray-500 dark:text-gray-500"
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
  );
};

export default UserDashboardPage;
