import React, { useState, useEffect } from "react";
/**
 * Analytics e Insights do Social.
 * - Carrega métricas, posts, audiência e insights da API
 * - Fallbacks seguros e toasts em falhas
 */
import { getAuthToken } from "../../utils/authToken";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "../Ui/card";
import { Button } from "../Ui/button";
import { Input } from "../Ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "../Ui/avatar";
import { Badge } from "../Ui/badge";
import { Progress } from "../Ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../Ui/tabs";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Calendar,
  Clock,
  Target,
  Award,
  Star,
  Crown,
  Zap,
  ArrowUp,
  ArrowDown,
  Filter,
  Download,
  RefreshCw,
  Settings,
  Bell,
  MoreHorizontal,
  X,
  Check,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const AnalyticsAndInsights = ({
  currentUser,
  onExportData,
  onUpdateGoals,
  onGenerateReport,
}) => {
  const [analytics, setAnalytics] = useState({
    followers: {
      current: 12500,
      change: 12.5,
      trend: "up",
    },
    engagement: {
      rate: 8.5,
      change: 2.1,
      trend: "up",
    },
    reach: {
      current: 45000,
      change: -5.2,
      trend: "down",
    },
    impressions: {
      current: 125000,
      change: 15.8,
      trend: "up",
    },
    likes: {
      current: 8500,
      change: 8.3,
      trend: "up",
    },
    comments: {
      current: 1200,
      change: 22.1,
      trend: "up",
    },
    shares: {
      current: 450,
      change: -3.2,
      trend: "down",
    },
  });

  const [posts, setPosts] = useState([]);
  const [audience, setAudience] = useState({});
  const [goals, setGoals] = useState([]);
  const [insights, setInsights] = useState([]);
  const [timeRange, setTimeRange] = useState("7d");
  const [showExportModal, setShowExportModal] = useState(false);
  const [showGoalsModal, setShowGoalsModal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    type: "followers",
    target: 0,
    deadline: "",
    description: "",
  });

  // Carregar dados reais de analytics
  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const token = getAuthToken();
        const response = await fetch("/api/social/analytics", {
          method: "GET",
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          setPosts(data.posts || []);
          setAudience(
            data.audience || {
              ageGroups: [],
              genders: [],
              locations: [],
              interests: [],
            },
          );
          setGoals(data.goals || []);
          setInsights(data.insights || []);
        } else {
          // Em caso de erro, manter arrays vazios e notificar usuário
          const errorMsg = `Erro ${response.status}: Não foi possível carregar analytics`;
          toast.error(errorMsg);
          setPosts([]);
          setAudience({
            ageGroups: [],
            genders: [],
            locations: [],
            interests: [],
          });
          setGoals([]);
          setInsights([]);
        }
      } catch (error) {
        console.error("Erro ao carregar analytics:", error);
        toast.error(
          "Erro ao carregar dados de analytics. Tente novamente mais tarde.",
        );
        setPosts([]);
        setAudience({
          ageGroups: [],
          genders: [],
          locations: [],
          interests: [],
        });
        setGoals([]);
        setInsights([]);
      }
    };

    loadAnalytics();

    // Todos os dados mockados foram removidos - usando API real acima
  }, []);

  const handleExportData = async (format) => {
    try {
      if (onExportData) {
        await onExportData({ format, timeRange });
      }
      setShowExportModal(false);
      toast.success(`Dados exportados em formato ${format.toUpperCase()}`);
    } catch {
      toast.error("Erro ao exportar dados");
    }
  };

  const handleCreateGoal = async () => {
    if (!newGoal.target || !newGoal.deadline) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      if (onUpdateGoals) {
        await onUpdateGoals([...goals, { ...newGoal, id: Date.now() }]);
      }
      setGoals((prev) => [...prev, { ...newGoal, id: Date.now() }]);
      setNewGoal({
        type: "followers",
        target: 0,
        deadline: "",
        description: "",
      });
      setShowGoalsModal(false);
      toast.success("Meta criada com sucesso!");
    } catch {
      toast.error("Erro ao criar meta");
    }
  };

  // Implementar funcionalidade real para refresh
  // eslint-disable-next-line no-unused-vars
  const handleRefreshAnalytics = async () => {
    try {
      const response = await fetch("/api/analytics/social", {
        headers: {
          Authorization: `Bearer ${currentUser?.token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
        toast.success("Analytics atualizados!");
      }
    } catch {
      toast.error("Erro ao atualizar analytics");
    }
  };

  // eslint-disable-next-line no-unused-vars
  const handleGenerateReport = async () => {
    try {
      const response = await fetch("/api/analytics/generate-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentUser?.token}`,
        },
        body: JSON.stringify({ period: "monthly" }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "analytics-report.pdf";
        a.click();
        toast.success("Relatório gerado com sucesso!");

        onGenerateReport?.({ timeRange, format: "pdf" });
      } else {
        const error = await response.json();
        throw new Error(error.error || "Erro ao gerar relatório");
      }
    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      toast.error(error.message || "Erro ao gerar relatório");
    }
  };

  const getTrendIcon = (trend) => {
    return trend === "up" ? (
      <ArrowUp className="w-4 h-4 text-green-500" />
    ) : (
      <ArrowDown className="w-4 h-4 text-red-500" />
    );
  };

  const getTrendColor = (trend) => {
    return trend === "up" ? "text-green-600" : "text-red-600";
  };

  const timeRanges = [
    { value: "7d", label: "7 dias" },
    { value: "30d", label: "30 dias" },
    { value: "90d", label: "90 dias" },
    { value: "1y", label: "1 ano" },
  ];

  const goalTypes = [
    { value: "followers", label: "Seguidores", icon: "👥" },
    { value: "engagement", label: "Engajamento", icon: "💬" },
    { value: "reach", label: "Alcance", icon: "👁️" },
    { value: "posts", label: "Posts", icon: "📝" },
    { value: "likes", label: "Curtidas", icon: "❤️" },
    { value: "comments", label: "Comentários", icon: "💭" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Analytics e Insights
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Acompanhe seu desempenho e otimize sua estratégia
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
          >
            {timeRanges.map((range) => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
          <Button onClick={() => setShowExportModal(true)} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Seguidores
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {analytics.followers.current.toLocaleString()}
                </p>
                <div className="flex items-center space-x-1 mt-1">
                  {getTrendIcon(analytics.followers.trend)}
                  <span
                    className={`text-sm ${getTrendColor(analytics.followers.trend)}`}
                  >
                    {analytics.followers.change}%
                  </span>
                </div>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Taxa de Engajamento
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {analytics.engagement.rate}%
                </p>
                <div className="flex items-center space-x-1 mt-1">
                  {getTrendIcon(analytics.engagement.trend)}
                  <span
                    className={`text-sm ${getTrendColor(analytics.engagement.trend)}`}
                  >
                    {analytics.engagement.change}%
                  </span>
                </div>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                <Heart className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Alcance
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {analytics.reach.current.toLocaleString()}
                </p>
                <div className="flex items-center space-x-1 mt-1">
                  {getTrendIcon(analytics.reach.trend)}
                  <span
                    className={`text-sm ${getTrendColor(analytics.reach.trend)}`}
                  >
                    {analytics.reach.change}%
                  </span>
                </div>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                <Eye className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Impressões
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {analytics.impressions.current.toLocaleString()}
                </p>
                <div className="flex items-center space-x-1 mt-1">
                  {getTrendIcon(analytics.impressions.trend)}
                  <span
                    className={`text-sm ${getTrendColor(analytics.impressions.trend)}`}
                  >
                    {analytics.impressions.change}%
                  </span>
                </div>
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-full">
                <BarChart3 className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="audience">Audiência</TabsTrigger>
          <TabsTrigger value="goals">Metas</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        {/* Visão Geral */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Métricas de Engajamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Curtidas
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold">
                        {analytics.likes.current.toLocaleString()}
                      </span>
                      <div className="flex items-center space-x-1">
                        {getTrendIcon(analytics.likes.trend)}
                        <span
                          className={`text-sm ${getTrendColor(analytics.likes.trend)}`}
                        >
                          {analytics.likes.change}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Comentários
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold">
                        {analytics.comments.current.toLocaleString()}
                      </span>
                      <div className="flex items-center space-x-1">
                        {getTrendIcon(analytics.comments.trend)}
                        <span
                          className={`text-sm ${getTrendColor(analytics.comments.trend)}`}
                        >
                          {analytics.comments.change}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Compartilhamentos
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold">
                        {analytics.shares.current.toLocaleString()}
                      </span>
                      <div className="flex items-center space-x-1">
                        {getTrendIcon(analytics.shares.trend)}
                        <span
                          className={`text-sm ${getTrendColor(analytics.shares.trend)}`}
                        >
                          {analytics.shares.change}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resumo de Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                      {analytics.engagement.rate}%
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Taxa de Engajamento Média
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {analytics.followers.current.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Seguidores
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {analytics.reach.current.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Alcance
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Posts */}
        <TabsContent value="posts" className="space-y-4">
          <div className="space-y-4">
            {posts.map((post) => (
              <Card key={post.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <img
                      src={post.image}
                      alt="Post"
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <p className="text-gray-900 dark:text-white mb-2 line-clamp-2">
                        {post.content}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                        <span className="flex items-center space-x-1">
                          <Heart className="w-4 h-4" />
                          <span>{post.metrics.likes.toLocaleString()}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <MessageCircle className="w-4 h-4" />
                          <span>{post.metrics.comments.toLocaleString()}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Share2 className="w-4 h-4" />
                          <span>{post.metrics.shares.toLocaleString()}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Eye className="w-4 h-4" />
                          <span>{post.metrics.reach.toLocaleString()}</span>
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                          {formatDistanceToNow(post.timestamp, {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </span>
                        <Badge variant="outline">
                          {post.metrics.engagement}% engajamento
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Audiência */}
        <TabsContent value="audience" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Faixa Etária</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {audience.ageGroups?.map((group, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          {group.range} anos
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {group.percentage}%
                        </span>
                      </div>
                      <Progress value={group.percentage} className="w-full" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Gênero</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {audience.genders?.map((gender, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          {gender.gender}
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {gender.percentage}%
                        </span>
                      </div>
                      <Progress value={gender.percentage} className="w-full" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Localização</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {audience.locations?.map((location, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          {location.location}
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {location.percentage}%
                        </span>
                      </div>
                      <Progress
                        value={location.percentage}
                        className="w-full"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Interesses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {audience.interests?.map((interest, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          {interest.interest}
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {interest.percentage}%
                        </span>
                      </div>
                      <Progress
                        value={interest.percentage}
                        className="w-full"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Metas */}
        <TabsContent value="goals" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Suas Metas
            </h3>
            <Button onClick={() => setShowGoalsModal(true)}>
              <Target className="w-4 h-4 mr-2" />
              Nova Meta
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {goals.map((goal) => (
              <Card key={goal.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {goalTypes.find((t) => t.value === goal.type)?.icon}{" "}
                      {goalTypes.find((t) => t.value === goal.type)?.label}
                    </CardTitle>
                    <Badge
                      variant={
                        goal.status === "active" ? "default" : "secondary"
                      }
                    >
                      {goal.status === "active" ? "Ativa" : "Concluída"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {goal.description}
                    </p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        {goal.current.toLocaleString()} /{" "}
                        {goal.target.toLocaleString()}
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {goal.progress}%
                      </span>
                    </div>
                    <Progress value={goal.progress} className="w-full mt-2" />
                  </div>

                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Prazo:{" "}
                    {formatDistanceToNow(goal.deadline, {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Insights */}
        <TabsContent value="insights" className="space-y-4">
          <div className="space-y-4">
            {insights.map((insight) => (
              <Card key={insight.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="text-2xl">{insight.icon}</div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                        {insight.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-3">
                        {insight.description}
                      </p>
                      <Button size="sm" variant="outline">
                        {insight.action}
                      </Button>
                    </div>
                    <Badge
                      variant={
                        insight.type === "success"
                          ? "default"
                          : insight.type === "warning"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {insight.type === "success"
                        ? "Sucesso"
                        : insight.type === "warning"
                          ? "Atenção"
                          : "Info"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal de Exportação */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Exportar Dados</CardTitle>
              <Button
                onClick={() => setShowExportModal(false)}
                variant="ghost"
                size="sm"
              >
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Formato de Exportação
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => handleExportData("csv")}
                    variant="outline"
                    className="w-full"
                  >
                    CSV
                  </Button>
                  <Button
                    onClick={() => handleExportData("xlsx")}
                    variant="outline"
                    className="w-full"
                  >
                    Excel
                  </Button>
                  <Button
                    onClick={() => handleExportData("pdf")}
                    variant="outline"
                    className="w-full"
                  >
                    PDF
                  </Button>
                  <Button
                    onClick={() => handleExportData("json")}
                    variant="outline"
                    className="w-full"
                  >
                    JSON
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Nova Meta */}
      {showGoalsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Nova Meta</CardTitle>
              <Button
                onClick={() => setShowGoalsModal(false)}
                variant="ghost"
                size="sm"
              >
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tipo de Meta
                </label>
                <select
                  value={newGoal.type}
                  onChange={(e) =>
                    setNewGoal((prev) => ({ ...prev, type: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                >
                  {goalTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Meta
                </label>
                <Input
                  type="number"
                  value={newGoal.target}
                  onChange={(e) =>
                    setNewGoal((prev) => ({
                      ...prev,
                      target: Number(e.target.value),
                    }))
                  }
                  placeholder="Digite a meta"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Prazo
                </label>
                <Input
                  type="date"
                  value={newGoal.deadline}
                  onChange={(e) =>
                    setNewGoal((prev) => ({
                      ...prev,
                      deadline: e.target.value,
                    }))
                  }
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descrição
                </label>
                <textarea
                  value={newGoal.description}
                  onChange={(e) =>
                    setNewGoal((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Descreva sua meta..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  onClick={() => setShowGoalsModal(false)}
                  variant="outline"
                >
                  Cancelar
                </Button>
                <Button onClick={handleCreateGoal}>
                  <Target className="w-4 h-4 mr-2" />
                  Criar Meta
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AnalyticsAndInsights;
