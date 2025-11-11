import React, { useState, useEffect } from "react";
import logger from "@/utils/logger";
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
import { Label } from "@/components/Ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/Ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/Ui/tabs";
import { Textarea } from "@/components/Ui/textarea";
import apiClient from "@/services/apiClient";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Dumbbell,
  TrendingUp,
  Activity,
  Users,
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/Ui/dialog";

/**
 * AdminExercisesPage
 * Gestão completa de exercícios e planos de treino (admin).
 */
const AdminExercisesPage = () => {
  const [exercises, setExercises] = useState([]);
  const [workoutPlans, setWorkoutPlans] = useState([]);
  const [filteredExercises, setFilteredExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [activeTab, setActiveTab] = useState("exercises");
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [stats, setStats] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    difficulty: "",
    equipment: "",
    muscle_group: "",
    instructions: "",
    image_url: "",
  });

  // Carregar exercícios
  useEffect(() => {
    loadExercises();
    loadStats();
  }, []);

  // Carregar planos quando mudar de tab
  useEffect(() => {
    if (activeTab === "plans") {
      loadWorkoutPlans();
    }
  }, [activeTab]);

  // Filtrar exercícios
  useEffect(() => {
    filterExercises();
  }, [searchTerm, selectedCategory, selectedDifficulty, exercises]);

  const loadExercises = async () => {
    try {
      setLoading(true);
      const response = await apiClient.admin.getExercises({
        page: 1,
        limit: 100,
      });

      const exercisesList = Array.isArray(response?.exercises)
        ? response.exercises
        : Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response)
            ? response
            : [];

      setExercises(exercisesList);
    } catch (error) {
      logger.error("Erro ao carregar exercícios:", error);
      toast.error("Erro ao carregar exercícios");
    } finally {
      setLoading(false);
    }
  };

  const loadWorkoutPlans = async () => {
    try {
      setLoading(true);
      const response = await apiClient.admin.getWorkoutPlans({
        page: 1,
        limit: 100,
      });

      const plansList = Array.isArray(response?.plans)
        ? response.plans
        : Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response)
            ? response
            : [];

      setWorkoutPlans(plansList);
    } catch (error) {
      logger.error("Erro ao carregar planos:", error);
      toast.error("Erro ao carregar planos de treino");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await apiClient.admin.getExercisesStats();
      if (response?.success && response?.stats) {
        setStats(response.stats);
      }
    } catch (error) {
      logger.error("Erro ao carregar estatísticas:", error);
    }
  };

  const filterExercises = () => {
    let filtered = [...exercises];

    if (searchTerm) {
      filtered = filtered.filter(
        (e) =>
          e.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          e.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          e.category?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter((e) => e.category === selectedCategory);
    }

    if (selectedDifficulty !== "all") {
      filtered = filtered.filter((e) => e.difficulty === selectedDifficulty);
    }

    setFilteredExercises(filtered);
  };

  const handleAddExercise = async () => {
    try {
      if (!formData.name || !formData.category) {
        toast.error("Nome e categoria são obrigatórios");
        return;
      }

      const response = await apiClient.admin.createExercise(formData);

      if (response?.success) {
        toast.success("Exercício criado com sucesso");
        setShowAddModal(false);
        resetForm();
        loadExercises();
        loadStats();
      } else {
        toast.error(response?.error || "Erro ao criar exercício");
      }
    } catch (error) {
      logger.error("Erro ao criar exercício:", error);
      toast.error("Erro ao criar exercício");
    }
  };

  const handleEditExercise = async () => {
    try {
      if (!selectedExercise?.id) return;

      const response = await apiClient.admin.updateExercise(
        selectedExercise.id,
        formData,
      );

      if (response?.success) {
        toast.success("Exercício atualizado com sucesso");
        setShowEditModal(false);
        resetForm();
        setSelectedExercise(null);
        loadExercises();
        loadStats();
      } else {
        toast.error(response?.error || "Erro ao atualizar exercício");
      }
    } catch (error) {
      logger.error("Erro ao atualizar exercício:", error);
      toast.error("Erro ao atualizar exercício");
    }
  };

  const handleDeleteExercise = async (exerciseId) => {
    if (!window.confirm("Tem certeza que deseja excluir este exercício?")) {
      return;
    }

    try {
      const response = await apiClient.admin.deleteExercise(exerciseId);

      if (response?.success) {
        toast.success("Exercício excluído com sucesso");
        loadExercises();
        loadStats();
      } else {
        toast.error(response?.error || "Erro ao excluir exercício");
      }
    } catch (error) {
      logger.error("Erro ao excluir exercício:", error);
      toast.error("Erro ao excluir exercício");
    }
  };

  const handleDeletePlan = async (planId) => {
    if (!window.confirm("Tem certeza que deseja excluir este plano de treino?")) {
      return;
    }

    try {
      const response = await apiClient.admin.deleteWorkoutPlan(planId);

      if (response?.success) {
        toast.success("Plano excluído com sucesso");
        loadWorkoutPlans();
      } else {
        toast.error(response?.error || "Erro ao excluir plano");
      }
    } catch (error) {
      logger.error("Erro ao excluir plano:", error);
      toast.error("Erro ao excluir plano");
    }
  };

  const handleEditClick = (exercise) => {
    setSelectedExercise(exercise);
    setFormData({
      name: exercise.name || "",
      description: exercise.description || "",
      category: exercise.category || "",
      difficulty: exercise.difficulty || "",
      equipment: exercise.equipment || "",
      muscle_group: exercise.muscle_group || "",
      instructions: exercise.instructions || "",
      image_url: exercise.image_url || "",
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "",
      difficulty: "",
      equipment: "",
      muscle_group: "",
      instructions: "",
      image_url: "",
    });
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case "beginner":
      case "iniciante":
        return "bg-primary/10 text-primary";
      case "intermediate":
      case "intermediário":
        return "bg-primary/10 text-primary";
      case "advanced":
      case "avançado":
        return "bg-destructive/10 text-destructive";
      default:
        return "bg-muted text-foreground";
    }
  };

  const getDifficultyLabel = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case "beginner":
        return "Iniciante";
      case "intermediate":
        return "Intermediário";
      case "advanced":
        return "Avançado";
      default:
        return difficulty || "N/A";
    }
  };

  const categories = stats?.categories || [];
  const uniqueCategories = [
    ...new Set(exercises.map((e) => e.category).filter(Boolean)),
  ];

  if (loading && exercises.length === 0) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-6">
                <div className="h-32 bg-muted rounded mb-4"></div>
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
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Dumbbell className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Gestão de Exercícios e Planos
              </h1>
              <p className="text-muted-foreground">
                Gerencie exercícios e planos de treino
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowStats(!showStats)}
            >
              <Activity className="w-4 h-4 mr-2" />
              Estatísticas
            </Button>
            {activeTab === "exercises" && (
              <Button
                onClick={() => {
                  resetForm();
                  setShowAddModal(true);
                }}
                className="bg-primary hover:bg-primary/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Exercício
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        {showStats && stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">
                  {stats.total_exercises || 0}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total Exercícios
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">
                  {stats.total_workout_plans || 0}
                </div>
                <div className="text-sm text-muted-foreground">
                  Planos de Treino
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">
                  {categories.length || 0}
                </div>
                <div className="text-sm text-muted-foreground">
                  Categorias
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">
                  {Object.keys(stats.exercises_by_category || {}).length || 0}
                </div>
                <div className="text-sm text-muted-foreground">
                  Categorias Ativas
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filtros */}
        {activeTab === "exercises" && (
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar exercícios..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {uniqueCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={selectedDifficulty}
              onValueChange={setSelectedDifficulty}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Dificuldade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="beginner">Iniciante</SelectItem>
                <SelectItem value="intermediate">Intermediário</SelectItem>
                <SelectItem value="advanced">Avançado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="exercises">Exercícios</TabsTrigger>
          <TabsTrigger value="plans">Planos de Treino</TabsTrigger>
        </TabsList>

        {/* Tab: Exercícios */}
        <TabsContent value="exercises" className="mt-6">
          {filteredExercises.length === 0 ? (
            <Card>
              <CardContent className="p-16 text-center">
                <div className="relative mb-6 max-w-md mx-auto">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-24 h-24 rounded-full bg-primary/10 animate-pulse"></div>
                  </div>
                  <Dumbbell className="w-16 h-16 text-primary mx-auto relative z-10" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  Nenhum exercício encontrado
                </h3>
                <p className="text-muted-foreground/90 leading-relaxed max-w-md mx-auto mb-6">
                  {exercises.length === 0
                    ? "Comece adicionando seu primeiro exercício à biblioteca"
                    : "Tente ajustar os filtros de busca para encontrar exercícios"}
                </p>
                {exercises.length === 0 && (
                  <Button
                    onClick={() => {
                      resetForm();
                      setShowAddModal(true);
                    }}
                    className="gap-2 shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar Primeiro Exercício
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredExercises.map((exercise) => (
                <Card key={exercise.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">
                          {exercise.name || "Exercício"}
                        </CardTitle>
                        <CardDescription className="line-clamp-2">
                          {exercise.description || "Sem descrição"}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Categoria:
                        </span>
                        <Badge variant="outline">{exercise.category}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Dificuldade:
                        </span>
                        <Badge className={getDifficultyColor(exercise.difficulty)}>
                          {getDifficultyLabel(exercise.difficulty)}
                        </Badge>
                      </div>
                      {exercise.equipment && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            Equipamento:
                          </span>
                          <span className="text-sm font-medium">
                            {exercise.equipment}
                          </span>
                        </div>
                      )}
                      {exercise.muscle_group && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            Grupo Muscular:
                          </span>
                          <span className="text-sm font-medium">
                            {exercise.muscle_group}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-end space-x-2 pt-4 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditClick(exercise)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteExercise(exercise.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab: Planos de Treino */}
        <TabsContent value="plans" className="mt-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : workoutPlans.length === 0 ? (
            <Card>
              <CardContent className="p-16 text-center">
                <div className="relative mb-6 max-w-md mx-auto">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-24 h-24 rounded-full bg-primary/10 animate-pulse"></div>
                  </div>
                  <Calendar className="w-16 h-16 text-primary mx-auto relative z-10" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  Nenhum plano de treino encontrado
                </h3>
                <p className="text-muted-foreground/90 leading-relaxed max-w-md mx-auto">
                  Os planos de treino criados pelos usuários aparecerão aqui quando forem criados
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {workoutPlans.map((plan) => (
                <Card key={plan.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle>{plan.name || "Plano de Treino"}</CardTitle>
                        <CardDescription className="mt-2">
                          {plan.description || "Sem descrição"}
                        </CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        {plan.is_active && (
                          <Badge className="bg-primary/10 text-primary">
                            Ativo
                          </Badge>
                        )}
                        {plan.is_public && (
                          <Badge variant="outline">Público</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <div className="text-sm text-muted-foreground">
                          Duração
                        </div>
                        <div className="text-sm font-medium">
                          {plan.duration_weeks || "N/A"} semanas
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">
                          Sessões
                        </div>
                        <div className="text-sm font-medium">
                          {plan.sessions_per_week || "N/A"} por semana
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">
                          Criado em
                        </div>
                        <div className="text-sm font-medium">
                          {plan.created_at
                            ? new Date(plan.created_at).toLocaleDateString("pt-BR")
                            : "N/A"}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">
                          Exercícios
                        </div>
                        <div className="text-sm font-medium">
                          {plan.exercises_count || 0}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-end space-x-2 pt-4 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePlan(plan.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal: Adicionar Exercício */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Exercício</DialogTitle>
            <DialogDescription>
              Preencha os dados do novo exercício
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Ex: Agachamento"
              />
            </div>
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Descrição do exercício"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Categoria *</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  placeholder="Ex: Força"
                />
              </div>
              <div>
                <Label htmlFor="difficulty">Dificuldade</Label>
                <Select
                  value={formData.difficulty}
                  onValueChange={(value) =>
                    setFormData({ ...formData, difficulty: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Iniciante</SelectItem>
                    <SelectItem value="intermediate">Intermediário</SelectItem>
                    <SelectItem value="advanced">Avançado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="equipment">Equipamento</Label>
                <Input
                  id="equipment"
                  value={formData.equipment}
                  onChange={(e) =>
                    setFormData({ ...formData, equipment: e.target.value })
                  }
                  placeholder="Ex: Halteres"
                />
              </div>
              <div>
                <Label htmlFor="muscle_group">Grupo Muscular</Label>
                <Input
                  id="muscle_group"
                  value={formData.muscle_group}
                  onChange={(e) =>
                    setFormData({ ...formData, muscle_group: e.target.value })
                  }
                  placeholder="Ex: Pernas"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="instructions">Instruções</Label>
              <Textarea
                id="instructions"
                value={formData.instructions}
                onChange={(e) =>
                  setFormData({ ...formData, instructions: e.target.value })
                }
                placeholder="Instruções de execução"
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="image_url">URL da Imagem</Label>
              <Input
                id="image_url"
                value={formData.image_url}
                onChange={(e) =>
                  setFormData({ ...formData, image_url: e.target.value })
                }
                placeholder="https://..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddExercise}>Criar Exercício</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Editar Exercício */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Exercício</DialogTitle>
            <DialogDescription>
              Atualize os dados do exercício
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Nome *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Ex: Agachamento"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Descrição</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Descrição do exercício"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-category">Categoria *</Label>
                <Input
                  id="edit-category"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  placeholder="Ex: Força"
                />
              </div>
              <div>
                <Label htmlFor="edit-difficulty">Dificuldade</Label>
                <Select
                  value={formData.difficulty}
                  onValueChange={(value) =>
                    setFormData({ ...formData, difficulty: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Iniciante</SelectItem>
                    <SelectItem value="intermediate">Intermediário</SelectItem>
                    <SelectItem value="advanced">Avançado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-equipment">Equipamento</Label>
                <Input
                  id="edit-equipment"
                  value={formData.equipment}
                  onChange={(e) =>
                    setFormData({ ...formData, equipment: e.target.value })
                  }
                  placeholder="Ex: Halteres"
                />
              </div>
              <div>
                <Label htmlFor="edit-muscle_group">Grupo Muscular</Label>
                <Input
                  id="edit-muscle_group"
                  value={formData.muscle_group}
                  onChange={(e) =>
                    setFormData({ ...formData, muscle_group: e.target.value })
                  }
                  placeholder="Ex: Pernas"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-instructions">Instruções</Label>
              <Textarea
                id="edit-instructions"
                value={formData.instructions}
                onChange={(e) =>
                  setFormData({ ...formData, instructions: e.target.value })
                }
                placeholder="Instruções de execução"
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="edit-image_url">URL da Imagem</Label>
              <Input
                id="edit-image_url"
                value={formData.image_url}
                onChange={(e) =>
                  setFormData({ ...formData, image_url: e.target.value })
                }
                placeholder="https://..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditExercise}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminExercisesPage;
