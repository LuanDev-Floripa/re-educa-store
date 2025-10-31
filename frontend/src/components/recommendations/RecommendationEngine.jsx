import React, { useState, useEffect, useCallback, useMemo } from "react";
/**
 * RecommendationEngine
 * - Carrega recomendações (API + fallbacks), feedback e UI por abas
 */
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/Ui/card";
import { Button } from "@/components/Ui/button";
import { Badge } from "@/components/Ui/badge";
import { Progress } from "@/components/Ui/progress";
import {
  Star,
  Heart,
  ShoppingCart,
  TrendingUp,
  Users,
  Target,
  Activity,
  Calculator,
  Package,
  Award,
  Zap,
  Clock,
  CheckCircle,
  ArrowRight,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Filter,
  Eye,
  Bookmark,
  Share2,
  MessageCircle,
  BarChart3,
  PieChart,
  TrendingDown,
  Flame,
  Droplets,
  Moon,
  Brain,
  Dumbbell,
  Utensils,
  Pill,
} from "lucide-react";

/**
 * Motor de recomendações (fallback + API autenticada).
 * - Personalizadas, Tendências, Similares e categorias (saúde/fitness/nutrição)
 * - Usa dados locais se sem token; emite toasts em erros
 */
export const RecommendationEngine = ({
  userProfile = {},
  onRecommendationClick,
  onFeedback,
  showPersonalized = true,
  showTrending = true,
  showSimilar = true,
}) => {
  // Usar as variáveis de controle
  const [activeTab, setActiveTab] = useState(
    showPersonalized ? "personalized" : showTrending ? "trending" : "similar",
  );
  const [recommendations, setRecommendations] = useState({
    personalized: [],
    trending: [],
    similar: [],
    health: [],
    fitness: [],
    nutrition: [],
  });
  const [loading, setLoading] = useState(false);
  const [userFeedback, setUserFeedback] = useState({});

  // Perfil do usuário de exemplo
  const defaultUserProfile = useMemo(() => ({
    id: 1,
    name: "João Silva",
    age: 28,
    gender: "male",
    weight: 75,
    height: 175,
    activityLevel: "moderate",
    goals: ["Ganho de Massa", "Força"],
    interests: ["Musculação", "Suplementação", "Nutrição"],
    experience: "intermediate",
    preferences: {
      priceRange: [50, 300],
      brands: ["MuscleTech", "Optimum Nutrition"],
      categories: ["Suplementos", "Equipamentos"],
      flavors: ["Chocolate", "Baunilha"],
    },
    purchaseHistory: [
      {
        id: 1,
        type: "product",
        name: "Whey Protein",
        category: "Suplementos",
        rating: 5,
      },
      {
        id: 2,
        type: "product",
        name: "Creatina",
        category: "Suplementos",
        rating: 4,
      },
      {
        id: 3,
        type: "exercise",
        name: "Flexão de Braço",
        category: "Peito",
        rating: 5,
      },
    ],
    workoutHistory: [
      { type: "strength", duration: 60, frequency: 4 },
      { type: "cardio", duration: 30, frequency: 2 },
    ],
    healthData: {
      bmr: 1800,
      tdee: 2400,
      bodyFat: 15,
      muscleMass: 65,
    },
  }), []);

  const currentUserProfile = useMemo(() => ({ ...defaultUserProfile, ...userProfile }), [defaultUserProfile, userProfile]);

  // Dados de exemplo para recomendações - memoizado
  const recommendationData = useMemo(() => ({
    personalized: [
      {
        id: 1,
        type: "product",
        name: "Whey Protein Premium",
        category: "Suplementos",
        subcategory: "Proteínas",
        brand: "MuscleTech",
        price: 189.9,
        originalPrice: 229.9,
        discount: 17,
        rating: 4.8,
        reviews: 1247,
        image: "/images/whey-premium.jpg",
        reason: "Baseado no seu objetivo de ganho de massa",
        confidence: 95,
        matchScore: 92,
        tags: ["Ganho de Massa", "Proteína", "Recuperação"],
        inStock: true,
        popularity: 95,
      },
      {
        id: 2,
        type: "exercise",
        name: "Supino Reto",
        category: "Peito",
        difficulty: "intermediate",
        duration: 45,
        equipment: ["Barra", "Banco"],
        reason: "Perfeito para seu nível intermediário",
        confidence: 88,
        matchScore: 85,
        tags: ["Peito", "Força", "Intermediário"],
        popularity: 90,
      },
      {
        id: 3,
        type: "workout_plan",
        name: "Ganho de Massa Avançado",
        category: "Força",
        duration: 12,
        difficulty: "intermediate",
        workoutsPerWeek: 4,
        reason: "Alinhado com seus objetivos e experiência",
        confidence: 90,
        matchScore: 88,
        tags: ["Ganho de Massa", "Força", "12 semanas"],
        popularity: 87,
      },
    ],
    trending: [
      {
        id: 4,
        type: "product",
        name: "Creatina Monohidratada",
        category: "Suplementos",
        brand: "Optimum Nutrition",
        price: 89.9,
        rating: 4.9,
        reviews: 2156,
        reason: "Tendência #1 em suplementos",
        confidence: 85,
        trend: "up",
        trendValue: 25,
        tags: ["Tendência", "Creatina", "Força"],
        popularity: 98,
      },
      {
        id: 5,
        type: "exercise",
        name: "Burpee",
        category: "Cardio",
        difficulty: "intermediate",
        duration: 20,
        equipment: ["Nenhum"],
        reason: "Exercício mais popular esta semana",
        confidence: 80,
        trend: "up",
        trendValue: 40,
        tags: ["Cardio", "HIIT", "Popular"],
        popularity: 95,
      },
    ],
    similar: [
      {
        id: 6,
        type: "product",
        name: "BCAA 2:1:1",
        category: "Suplementos",
        brand: "Dymatize",
        price: 79.9,
        rating: 4.7,
        reviews: 892,
        reason: "Usuários similares também compraram",
        confidence: 75,
        similarUsers: 1247,
        tags: ["BCAA", "Recuperação", "Similar"],
        popularity: 87,
      },
    ],
    health: [
      {
        id: 7,
        type: "tool",
        name: "Calculadora de Metabolismo",
        category: "Saúde",
        description: "Calcule seu metabolismo basal",
        reason: "Baseado no seu perfil de saúde",
        confidence: 90,
        tags: ["Metabolismo", "Saúde", "Calculadora"],
        popularity: 85,
      },
    ],
    fitness: [
      {
        id: 8,
        type: "workout_plan",
        name: "HIIT Queima Gordura",
        category: "Cardio",
        duration: 6,
        difficulty: "intermediate",
        reason: "Complementa seu treino de força",
        confidence: 82,
        tags: ["HIIT", "Cardio", "Queima Gordura"],
        popularity: 90,
      },
    ],
    nutrition: [
      {
        id: 9,
        type: "product",
        name: "Multivitamínico Completo",
        category: "Suplementos",
        brand: "Centrum",
        price: 59.9,
        rating: 4.6,
        reviews: 634,
        reason: "Suporte nutricional completo",
        confidence: 78,
        tags: ["Vitaminas", "Saúde", "Completo"],
        popularity: 82,
      },
    ],
  }), []);

  useEffect(() => {
    loadRecommendations();
  }, [currentUserProfile, loadRecommendations]);

  const loadRecommendations = useCallback(async () => {
    setLoading(true);

    try {
      const token = localStorage.getItem("token");

    if (!token) {
        // Fallback para recomendações padrão se não autenticado
        setRecommendations(recommendationData);
        setLoading(false);
        toast.message?.("Usando recomendações padrão (não autenticado)");
        return;
      }

      // Carregar recomendações personalizadas da API
      const personalizedResponse = await fetch(
        "/api/recommendations/personalized",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      // Carregar recomendações em tendência
      const trendingResponse = await fetch("/api/recommendations/trending", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      // Carregar recomendações similares
      const similarResponse = await fetch("/api/recommendations/similar", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const newRecommendations = { ...recommendationData };

      if (personalizedResponse.ok) {
        const data = await personalizedResponse.json();
        newRecommendations.personalized = data.recommendations || [];
      }

      if (trendingResponse.ok) {
        const data = await trendingResponse.json();
        newRecommendations.trending = data.recommendations || [];
      }

      if (similarResponse.ok) {
        const data = await similarResponse.json();
        newRecommendations.similar = data.recommendations || [];
      }

      setRecommendations(newRecommendations);
    } catch (error) {
      console.error("Erro ao carregar recomendações:", error);
      // Fallback para recomendações padrão em caso de erro
      setRecommendations(recommendationData);
      toast.error("Falha ao carregar recomendações. Exibindo padrão.");
    } finally {
      setLoading(false);
    }
  }, [currentUserProfile, recommendationData]);

  const handleRecommendationClick = (recommendation) => {
    if (onRecommendationClick) {
      onRecommendationClick(recommendation);
    }
  };

  const handleFeedback = (recommendationId, feedback) => {
    setUserFeedback((prev) => ({
      ...prev,
      [recommendationId]: feedback,
    }));

    if (onFeedback) {
      onFeedback(recommendationId, feedback);
    }
  };

  const getRecommendationIcon = (type) => {
    switch (type) {
      case "product":
        return Package;
      case "exercise":
        return Dumbbell;
      case "workout_plan":
        return Target;
      case "tool":
        return Calculator;
      default:
        return Star;
    }
  };

  const getRecommendationColor = (type) => {
    switch (type) {
      case "product":
        return "text-green-600";
      case "exercise":
        return "text-blue-600";
      case "workout_plan":
        return "text-purple-600";
      case "tool":
        return "text-orange-600";
      default:
        return "text-gray-600";
    }
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case "down":
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <TrendingUp className="w-4 h-4 text-gray-500" />;
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 90) return "text-green-600";
    if (confidence >= 80) return "text-yellow-600";
    if (confidence >= 70) return "text-orange-600";
    return "text-red-600";
  };

  const renderRecommendationCard = (recommendation) => {
    const IconComponent = getRecommendationIcon(recommendation.type);
    const feedback = userFeedback[recommendation.id];

    return (
      <Card
        key={recommendation.id}
        className="hover:shadow-lg transition-shadow"
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <IconComponent
                className={`w-5 h-5 ${getRecommendationColor(recommendation.type)}`}
              />
              <Badge variant="outline" className="text-xs">
                {recommendation.type === "product"
                  ? "Produto"
                  : recommendation.type === "exercise"
                    ? "Exercício"
                    : recommendation.type === "workout_plan"
                      ? "Plano"
                      : "Ferramenta"}
              </Badge>
            </div>
            <div className="flex items-center space-x-1">
              {recommendation.trend && getTrendIcon(recommendation.trend)}
              <Badge variant="secondary" className="text-xs">
                {recommendation.popularity}%
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Nome e Categoria */}
          <div>
            <h3 className="font-semibold text-sm line-clamp-2 mb-1">
              {recommendation.name}
            </h3>
            <p className="text-xs text-gray-600">
              {recommendation.category}
              {recommendation.brand && ` • ${recommendation.brand}`}
            </p>
          </div>

          {/* Preço (para produtos) */}
          {typeof recommendation.price === "number" && (
            <div className="flex items-center space-x-2">
              <span className="font-bold text-green-600">
                R$ {recommendation.price.toFixed(2).replace(".", ",")}
              </span>
              {typeof recommendation.originalPrice === "number" &&
                recommendation.originalPrice > recommendation.price && (
                <span className="text-xs text-gray-500 line-through">
                  R$ {recommendation.originalPrice.toFixed(2).replace(".", ",")}
                </span>
              )}
            </div>
          )}

          {/* Rating (para produtos) */}
          {Number.isFinite(recommendation.rating) && (
            <div className="flex items-center space-x-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3 h-3 ${
                      i < Math.floor(Number.isFinite(recommendation.rating) ? recommendation.rating : 0)
                        ? "text-yellow-400 fill-current"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-600">
                {Number.isFinite(recommendation.rating) ? recommendation.rating : 0} ({recommendation.reviews ?? 0})
              </span>
            </div>
          )}

          {/* Motivo da Recomendação */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              <Zap className="w-3 h-3 inline mr-1" />
              {recommendation.reason}
            </p>
          </div>

          {/* Score de Confiança */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span>Confiança</span>
              <span className={getConfidenceColor(recommendation.confidence)}>
                {recommendation.confidence}%
              </span>
            </div>
            <Progress value={recommendation.confidence} className="h-1" />
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1">
            {(Array.isArray(recommendation.tags) ? recommendation.tags : []).slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>

          {/* Ações */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex space-x-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleRecommendationClick(recommendation)}
                className="text-xs"
              >
                <Eye className="w-3 h-3 mr-1" />
                Ver
              </Button>
              {recommendation.type === "product" && (
                <Button size="sm" variant="outline" className="text-xs">
                  <ShoppingCart className="w-3 h-3 mr-1" />
                  Comprar
                </Button>
              )}
            </div>

            {/* Feedback */}
            <div className="flex space-x-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleFeedback(recommendation.id, "like")}
                className={`text-xs ${feedback === "like" ? "text-green-600" : "text-gray-400"}`}
              >
                <ThumbsUp className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleFeedback(recommendation.id, "dislike")}
                className={`text-xs ${feedback === "dislike" ? "text-red-600" : "text-gray-400"}`}
              >
                <ThumbsDown className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const tabs = [
    {
      id: "personalized",
      label: "Personalizado",
      icon: Star,
      count: recommendations.personalized.length,
    },
    {
      id: "trending",
      label: "Tendências",
      icon: TrendingUp,
      count: recommendations.trending.length,
    },
    {
      id: "similar",
      label: "Similar",
      icon: Users,
      count: recommendations.similar.length,
    },
    {
      id: "health",
      label: "Saúde",
      icon: Heart,
      count: recommendations.health.length,
    },
    {
      id: "fitness",
      label: "Fitness",
      icon: Activity,
      count: recommendations.fitness.length,
    },
    {
      id: "nutrition",
      label: "Nutrição",
      icon: Utensils,
      count: recommendations.nutrition.length,
    },
  ];

  const currentRecommendations = recommendations[activeTab] || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Recomendações para Você
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Baseado no seu perfil e preferências
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {/* Controles de exibição */}
          <div className="flex items-center space-x-2">
            <Button
              variant={activeTab === "personalized" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("personalized")}
              disabled={!showPersonalized}
            >
              Personalizadas
            </Button>
            <Button
              variant={activeTab === "trending" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("trending")}
              disabled={!showTrending}
            >
              Em Tendência
            </Button>
            <Button
              variant={activeTab === "similar" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("similar")}
              disabled={!showSimilar}
            >
              Similares
            </Button>
          </div>
          <Button
            variant="outline"
            onClick={loadRecommendations}
            disabled={loading}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <IconComponent className="w-4 h-4" />
              <span>{tab.label}</span>
              <Badge variant="secondary" className="text-xs">
                {tab.count}
              </Badge>
            </button>
          );
        })}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Analisando seu perfil e gerando recomendações...
          </p>
        </div>
      )}

      {/* Recommendations Grid */}
      {!loading && currentRecommendations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentRecommendations.map(renderRecommendationCard)}
        </div>
      )}

      {/* Empty State */}
      {!loading && currentRecommendations.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Nenhuma recomendação encontrada
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Complete seu perfil para receber recomendações personalizadas
            </p>
            <Button>
              <ArrowRight className="w-4 h-4 mr-2" />
              Completar Perfil
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Insights */}
      {!loading && currentRecommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Insights das Recomendações</CardTitle>
            <CardDescription>
              Análise baseada no seu perfil e comportamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Target className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-sm">Objetivos</span>
                </div>
                <p className="text-xs text-gray-600">
                  Foco em ganho de massa e força
                </p>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-sm">Tendências</span>
                </div>
                <p className="text-xs text-gray-600">
                  Suplementos em alta esta semana
                </p>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Users className="w-4 h-4 text-purple-600" />
                  <span className="font-medium text-sm">Similar</span>
                </div>
                <p className="text-xs text-gray-600">
                  Baseado em usuários com perfil similar
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
