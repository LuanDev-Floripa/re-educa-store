import React, { useState, useEffect } from "react";
import logger from "@/utils/logger";
import { getWorkoutPlanFavorites, setWorkoutPlanFavorites, getUserWorkoutPlans, setUserWorkoutPlans } from "@/utils/storage";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/Ui/card";
import { Button } from "@/components/Ui/button";
import { Badge } from "@/components/Ui/badge";
import { Input } from "@/components/Ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/Ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/Ui/tabs";
import { WorkoutPlanCard } from "../../components/workouts/WorkoutPlanCard";
import { useWorkoutPlans } from "@/hooks/useWorkoutPlans";
import { toast } from "sonner";
import {
  Search,
  Filter,
  Dumbbell,
  Target,
  Clock,
  TrendingUp,
  Play,
  BookOpen,
  Star,
  Users,
  Zap,
  Calendar,
  Plus,
  Heart,
  Award,
} from "lucide-react";

const WorkoutPlansPage = () => {
  const { plans, loading, pagination: plansPagination, fetchPlans, createPlan } = useWorkoutPlans();
  const [filteredPlans, setFilteredPlans] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [selectedGoal, setSelectedGoal] = useState("all");
  const [selectedDuration, setSelectedDuration] = useState("all");
  const [activeTab, setActiveTab] = useState("all");
  const [favoritePlans, setFavoritePlans] = useState([]);
  const [userPlans, setUserPlans] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlan, setNewPlan] = useState({
    name: "",
    description: "",
    difficulty: "beginner",
    goal: "general_fitness",
    duration_weeks: 4,
    workouts_per_week: 3,
  });

  // Carregar planos de treino da API
  useEffect(() => {
    const loadPlans = async () => {
      const filters = {
        isActive: activeTab === "my_plans" ? true : undefined,
        isPublic:
          activeTab === "all" || activeTab === "popular" ? true : undefined,
      };
      try {
        if (typeof fetchPlans !== "function") {
          throw new Error("Serviço de planos indisponível");
        }
        await fetchPlans(filters);
      } catch (e) {
        toast.error(e?.message || "Erro ao carregar planos");
      }
    };
    loadPlans();
  }, [activeTab, fetchPlans]);

  const difficulties = [
    { value: "all", label: "Todas as Dificuldades" },
    { value: "beginner", label: "Iniciante" },
    { value: "intermediate", label: "Intermediário" },
    { value: "advanced", label: "Avançado" },
  ];

  const goals = [
    { value: "all", label: "Todos os Objetivos" },
    { value: "weight_loss", label: "Perda de Peso" },
    { value: "muscle_gain", label: "Ganho de Massa" },
    { value: "endurance", label: "Resistência" },
    { value: "strength", label: "Força" },
  ];

  const durations = [
    { value: "all", label: "Todas as Durações" },
    { value: "4", label: "4 semanas" },
    { value: "6", label: "6 semanas" },
    { value: "8", label: "8 semanas" },
    { value: "10", label: "10 semanas" },
    { value: "12", label: "12 semanas" },
  ];

  useEffect(() => {
    filterPlans();
  }, [
    searchTerm,
    selectedDifficulty,
    selectedGoal,
    selectedDuration,
    activeTab,
    plans,
  ]);

  const filterPlans = () => {
    let filtered = Array.isArray(plans) ? plans : [];

    // Filtro por busca
    if (searchTerm) {
      filtered = filtered.filter((plan) =>
        String(plan?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(plan?.description || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (Array.isArray(plan?.goals)
          ? plan.goals.some((goal) => String(goal).toLowerCase().includes(searchTerm.toLowerCase()))
          : false),
      );
    }

    // Filtro por dificuldade
    if (selectedDifficulty !== "all") {
      filtered = filtered.filter((plan) => plan?.difficulty === selectedDifficulty);
    }

    // Filtro por objetivo
    if (selectedGoal !== "all") {
      filtered = filtered.filter((plan) => Array.isArray(plan?.goals) && plan.goals.includes(selectedGoal));
    }

    // Filtro por duração
    if (selectedDuration !== "all") {
      filtered = filtered.filter((plan) => String(plan?.duration ?? "") === selectedDuration);
    }

    // Filtro por aba
    if (activeTab === "my_plans") {
      // Filtrar planos do usuário
      const userPlanIds = new Set((Array.isArray(userPlans) ? userPlans : []).map((p) => p?.id || p?.plan_id));
      filtered = filtered.filter((plan) => userPlanIds.has(plan?.id));
    } else if (activeTab === "favorites") {
      // Filtrar favoritos
      const favoriteIds = new Set((Array.isArray(favoritePlans) ? favoritePlans : []).map((p) => p?.id || p?.plan_id));
      filtered = filtered.filter((plan) => favoriteIds.has(plan?.id));
    } else if (activeTab === "popular") {
      // Ordenar por popularidade
      filtered = filtered.sort(
        (a, b) => (Number(b?.participants_count) || 0) - (Number(a?.participants_count) || 0),
      );
    }

    setFilteredPlans(filtered);
  };

  const handleStartPlan = async (plan) => {
    try {
      if (!plan || !plan.id) {
        toast.error("Plano inválido");
        return;
      }
      // Adicionar plano aos planos do usuário
      const updatedUserPlans = [...(Array.isArray(userPlans) ? userPlans : []), plan];
      setUserWorkoutPlans(updatedUserPlans);
      toast.success(`Plano "${plan.name}" iniciado com sucesso!`);
    } catch (error) {
      logger.error("Erro ao iniciar plano:", error);
      toast.error("Erro ao iniciar plano");
    }
  };

  const handleViewDetails = (plan) => {
    if (!plan || !plan.id) {
      toast.error("Plano inválido");
      return;
    }
    // Abrir modal de detalhes (pode ser implementado com um modal component)
    toast.info(`Visualizando detalhes do plano: ${plan.name}`);
    // Aqui pode ser adicionado um modal para mostrar detalhes completos
  };

  useEffect(() => {
    // Carregar favoritos do localStorage
    try {
      const savedFavorites = getWorkoutPlanFavorites();
      if (savedFavorites && Array.isArray(savedFavorites)) {
        setFavoritePlans(savedFavorites);
      }
    } catch (e) {
      logger.error("Erro ao carregar favoritos:", e);
      setFavoritePlans([]);
    }

    // Carregar planos do usuário (se houver endpoint)
    // Por enquanto, usar localStorage também
    try {
      const savedUserPlans = getUserWorkoutPlans();
      if (savedUserPlans && Array.isArray(savedUserPlans)) {
        setUserPlans(savedUserPlans);
      }
    } catch (e) {
      logger.error("Erro ao carregar planos do usuário:", e);
      setUserPlans([]);
    }
  }, []);

  const handleAddToFavorites = (plan) => {
    const isFavorite = favoritePlans.some(
      (p) => (p.id || p.plan_id) === plan.id,
    );

    if (isFavorite) {
      // Remover dos favoritos
      const updated = favoritePlans.filter(
        (p) => (p.id || p.plan_id) !== plan.id,
      );
      setFavoritePlans(updated);
      setWorkoutPlanFavorites(updated);
      toast.success("Removido dos favoritos");
    } else {
      // Adicionar aos favoritos
      const updated = [...favoritePlans, { id: plan.id, ...plan }];
      setFavoritePlans(updated);
      setWorkoutPlanFavorites(updated);
      toast.success("Adicionado aos favoritos");
    }

    // Reaplicar filtros
    setTimeout(() => {
      const event = new Event("filterChange");
      window.dispatchEvent(event);
    }, 100);
  };

  const getStats = () => {
    const safePlans = Array.isArray(plans) ? plans : [];
    const totalPlans = safePlans.length;
    const beginnerCount = safePlans.filter((p) => p?.difficulty === "beginner").length;
    const intermediateCount = safePlans.filter((p) => p?.difficulty === "intermediate").length;
    const advancedCount = safePlans.filter((p) => p?.difficulty === "advanced").length;
    const totalParticipants = safePlans.reduce((sum, plan) => sum + Number(plan?.participants_count || 0), 0);

    return {
      total: totalPlans,
      beginner: beginnerCount,
      intermediate: intermediateCount,
      advanced: advancedCount,
      participants: totalParticipants,
    };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-card rounded-lg p-6">
                <div className="h-48 bg-muted rounded mb-4"></div>
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Dumbbell className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Planos de Treino
              </h1>
              <p className="text-muted-foreground/90 leading-relaxed">
                Escolha o plano perfeito para seus objetivos
              </p>
            </div>
          </div>
          <Button 
            className="bg-primary hover:bg-primary/90"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Criar Plano
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">
                {stats.total}
              </div>
              <div className="text-sm text-muted-foreground/90">
                Planos
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">
                {stats.beginner}
              </div>
              <div className="text-sm text-muted-foreground/90">
                Iniciante
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">
                {stats.intermediate}
              </div>
              <div className="text-sm text-muted-foreground/90">
                Intermediário
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-destructive">
                {stats.advanced}
              </div>
              <div className="text-sm text-muted-foreground/90">
                Avançado
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">
                {stats.participants.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground/90">
                Participantes
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar planos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select
              value={selectedDifficulty}
              onValueChange={setSelectedDifficulty}
            >
              <SelectTrigger>
                <SelectValue placeholder="Dificuldade" />
              </SelectTrigger>
              <SelectContent>
                {difficulties.map((difficulty) => (
                  <SelectItem key={difficulty.value} value={difficulty.value}>
                    {difficulty.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedGoal} onValueChange={setSelectedGoal}>
              <SelectTrigger>
                <SelectValue placeholder="Objetivo" />
              </SelectTrigger>
              <SelectContent>
                {goals.map((goal) => (
                  <SelectItem key={goal.value} value={goal.value}>
                    {goal.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedDuration}
              onValueChange={setSelectedDuration}
            >
              <SelectTrigger>
                <SelectValue placeholder="Duração" />
              </SelectTrigger>
              <SelectContent>
                {durations.map((duration) => (
                  <SelectItem key={duration.value} value={duration.value}>
                    {duration.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all" className="flex items-center space-x-2">
            <BookOpen className="w-4 h-4" />
            <span>Todos</span>
          </TabsTrigger>
          <TabsTrigger value="my_plans" className="flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <span>Meus Planos</span>
          </TabsTrigger>
          <TabsTrigger
            value="favorites"
            className="flex items-center gap-2.5"
          >
            <Star className="w-4 h-4" />
            <span>Favoritos</span>
          </TabsTrigger>
          <TabsTrigger value="popular" className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4" />
            <span>Populares</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlans.map((plan) => (
              <WorkoutPlanCard
                key={plan.id}
                plan={plan}
                onStartPlan={handleStartPlan}
                onViewDetails={handleViewDetails}
                onAddToFavorites={handleAddToFavorites}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="my_plans" className="mt-6">
          <div className="text-center py-16 px-4">
            <div className="max-w-md mx-auto">
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-primary/10 animate-pulse"></div>
                </div>
                <Calendar className="w-16 h-16 sm:w-20 sm:h-20 text-primary mx-auto relative z-10" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3">
                Nenhum plano ativo
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground/90 leading-relaxed mb-6">
                Comece um plano de treino para acompanhar seu progresso
              </p>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Escolher Plano
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="favorites" className="mt-6">
          <div className="text-center py-16 px-4">
            <div className="max-w-md mx-auto">
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-primary/10 animate-pulse"></div>
                </div>
                <Star className="w-16 h-16 sm:w-20 sm:h-20 text-primary mx-auto relative z-10" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3">
                Nenhum plano favorito
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground/90 leading-relaxed">
                Adicione planos aos seus favoritos para encontrá-los facilmente
              </p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="popular" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlans.map((plan) => (
              <WorkoutPlanCard
                key={plan.id}
                plan={plan}
                onStartPlan={handleStartPlan}
                onViewDetails={handleViewDetails}
                onAddToFavorites={handleAddToFavorites}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Resultados */}
      {filteredPlans.length === 0 && activeTab === "all" && (
        <div className="text-center py-16 px-4">
          <div className="max-w-md mx-auto">
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-primary/10 animate-pulse"></div>
              </div>
              <Search className="w-16 h-16 sm:w-20 sm:h-20 text-primary mx-auto relative z-10" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3">
              Nenhum plano encontrado
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground/90 leading-relaxed">
              Tente ajustar os filtros para encontrar mais planos
            </p>
          </div>
        </div>
      )}

      {/* Paginação */}
      {plansPagination && plansPagination.total_pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button
            variant="outline"
            onClick={() => fetchPlans({ page: plansPagination.current_page - 1 })}
            disabled={plansPagination.current_page <= 1}
          >
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {plansPagination.current_page} de {plansPagination.total_pages}
          </span>
          <Button
            variant="outline"
            onClick={() => fetchPlans({ page: plansPagination.current_page + 1 })}
            disabled={plansPagination.current_page >= plansPagination.total_pages}
          >
            Próxima
          </Button>
        </div>
      )}

      {/* Modal de Criação de Plano */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Criar Novo Plano de Treino</CardTitle>
              <CardDescription>
                Defina os detalhes do seu plano personalizado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    await createPlan(newPlan);
                    setShowCreateModal(false);
                    setNewPlan({
                      name: "",
                      description: "",
                      difficulty: "beginner",
                      goal: "general_fitness",
                      duration_weeks: 4,
                      workouts_per_week: 3,
                    });
                  } catch (error) {
                    logger.error("Erro ao criar plano:", error);
                  }
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Nome do Plano *
                  </label>
                  <Input
                    value={newPlan.name}
                    onChange={(e) =>
                      setNewPlan({ ...newPlan, name: e.target.value })
                    }
                    placeholder="Ex: Treino para Iniciantes"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Descrição
                  </label>
                  <textarea
                    value={newPlan.description}
                    onChange={(e) =>
                      setNewPlan({ ...newPlan, description: e.target.value })
                    }
                    placeholder="Descreva o objetivo do plano..."
                    className="w-full px-4 py-2.5 border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Dificuldade *
                    </label>
                    <Select
                      value={newPlan.difficulty}
                      onValueChange={(value) =>
                        setNewPlan({ ...newPlan, difficulty: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Iniciante</SelectItem>
                        <SelectItem value="intermediate">Intermediário</SelectItem>
                        <SelectItem value="advanced">Avançado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Objetivo *
                    </label>
                    <Select
                      value={newPlan.goal}
                      onValueChange={(value) =>
                        setNewPlan({ ...newPlan, goal: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general_fitness">Condicionamento Geral</SelectItem>
                        <SelectItem value="weight_loss">Perda de Peso</SelectItem>
                        <SelectItem value="muscle_gain">Ganho de Massa</SelectItem>
                        <SelectItem value="strength">Força</SelectItem>
                        <SelectItem value="endurance">Resistência</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Duração (semanas) *
                    </label>
                    <Input
                      type="number"
                      min="1"
                      max="52"
                      value={newPlan.duration_weeks}
                      onChange={(e) =>
                        setNewPlan({
                          ...newPlan,
                          duration_weeks: parseInt(e.target.value) || 4,
                        })
                      }
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Treinos por Semana *
                    </label>
                    <Input
                      type="number"
                      min="1"
                      max="7"
                      value={newPlan.workouts_per_week}
                      onChange={(e) =>
                        setNewPlan({
                          ...newPlan,
                          workouts_per_week: parseInt(e.target.value) || 3,
                        })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateModal(false);
                      setNewPlan({
                        name: "",
                        description: "",
                        difficulty: "beginner",
                        goal: "general_fitness",
                        duration_weeks: 4,
                        workouts_per_week: 3,
                      });
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-primary hover:bg-primary/90">
                    Criar Plano
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default WorkoutPlansPage;
