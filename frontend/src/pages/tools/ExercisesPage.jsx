import React, { useState, useEffect } from "react";
import logger from "@/utils/logger";
import { getExerciseFavorites, getRecentExercises } from "@/utils/storage";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/Ui/dialog";
import { H1, H3 } from "@/components/Ui/typography";
import { ExerciseCard } from "../../components/exercises/ExerciseCard";
import apiClient from "@/services/apiClient";
import { apiService } from "@/lib/api";
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
} from "lucide-react";

const ExercisesPage = () => {
  const [exercises, setExercises] = useState([]);
  const [filteredExercises, setFilteredExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState("all");
  const [selectedEquipment, setSelectedEquipment] = useState("all");
  const [activeTab, setActiveTab] = useState("all");
  const [favoriteExercises, setFavoriteExercises] = useState([]);
  const [recentExercises, setRecentExercises] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Carregar exercícios da API
  useEffect(() => {
    const loadExercises = async () => {
      try {
        setLoading(true);
        // Usar apiService se disponível, senão apiClient
        let response;
        if (apiService?.exercises?.getAll) {
          response = await apiService.exercises.getAll({ page: 1, limit: 100 });
          // apiService retorna { exercises: [...] } ou { data: [...] }
          response = response.exercises ? { exercises: response.exercises } : response;
        } else if (apiClient?.getExercises) {
          response = await apiClient.getExercises();
        } else {
          throw new Error("Serviço de exercícios indisponível");
        }

        if (Array.isArray(response?.exercises) || Array.isArray(response?.data) || Array.isArray(response)) {
          const exercisesList = Array.isArray(response?.exercises)
            ? response.exercises
            : Array.isArray(response?.data)
              ? response.data
              : Array.isArray(response)
                ? response
                : [];
          setExercises(exercisesList);
          setFilteredExercises(exercisesList);
        } else {
          // Se API não retornar exercícios, usar array vazio
          setExercises([]);
          setFilteredExercises([]);
        }
      } catch (err) {
        logger.error("Erro ao carregar exercícios:", err);
        toast.error("Erro ao carregar exercícios");
        setExercises([]);
        setFilteredExercises([]);
      } finally {
        setLoading(false);
      }
    };

    loadExercises();
  }, []);

  // Removido exerciseDataFallback - não utilizado

  const categories = [
    { value: "all", label: "Todas as Categorias" },
    { value: "Força", label: "Força" },
    { value: "Cardio", label: "Cardio" },
    { value: "Core", label: "Core" },
    { value: "Flexibilidade", label: "Flexibilidade" },
  ];

  const difficulties = [
    { value: "all", label: "Todas as Dificuldades" },
    { value: "beginner", label: "Iniciante" },
    { value: "intermediate", label: "Intermediário" },
    { value: "advanced", label: "Avançado" },
  ];

  const muscleGroups = [
    { value: "all", label: "Todos os Grupos" },
    { value: "Peito", label: "Peito" },
    { value: "Ombros", label: "Ombros" },
    { value: "Tríceps", label: "Tríceps" },
    { value: "Quadríceps", label: "Quadríceps" },
    { value: "Glúteos", label: "Glúteos" },
    { value: "Isquiotibiais", label: "Isquiotibiais" },
    { value: "Core", label: "Core" },
    { value: "Lombar", label: "Lombar" },
    { value: "Panturrilhas", label: "Panturrilhas" },
  ];

  const equipment = [
    { value: "all", label: "Todos os Equipamentos" },
    { value: "Nenhum", label: "Sem Equipamento" },
    { value: "Corda", label: "Corda" },
    { value: "Banco", label: "Banco" },
    { value: "Halteres", label: "Halteres" },
    { value: "Barra", label: "Barra" },
  ];

  useEffect(() => {
    filterExercises();
  }, [
    searchTerm,
    selectedCategory,
    selectedDifficulty,
    selectedMuscleGroup,
    selectedEquipment,
    activeTab,
    exercises,
  ]);

  const filterExercises = () => {
    let filtered = Array.isArray(exercises) ? exercises : [];

    // Filtro por busca
    if (searchTerm) {
      filtered = filtered.filter((exercise) =>
        String(exercise?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(exercise?.description || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (Array.isArray(exercise?.muscle_groups)
          ? exercise.muscle_groups.some((muscle) => String(muscle).toLowerCase().includes(searchTerm.toLowerCase()))
          : false),
      );
    }

    // Filtro por categoria
    if (selectedCategory !== "all") {
      filtered = filtered.filter((exercise) => exercise?.category === selectedCategory);
    }

    // Filtro por dificuldade
    if (selectedDifficulty !== "all") {
      filtered = filtered.filter((exercise) => exercise?.difficulty === selectedDifficulty);
    }

    // Filtro por grupo muscular
    if (selectedMuscleGroup !== "all") {
      filtered = filtered.filter((exercise) => Array.isArray(exercise?.muscle_groups) && exercise.muscle_groups.includes(selectedMuscleGroup));
    }

    // Filtro por equipamento
    if (selectedEquipment !== "all") {
      filtered = filtered.filter((exercise) => Array.isArray(exercise?.equipment) && exercise.equipment.includes(selectedEquipment));
    }

    // Filtro por aba
    if (activeTab === "favorites") {
      // Filtrar favoritos
      const favoriteIds = new Set((Array.isArray(favoriteExercises) ? favoriteExercises : []).map((e) => e?.id || e?.exercise_id));
      filtered = filtered.filter((exercise) => favoriteIds.has(exercise?.id));
    } else if (activeTab === "recent") {
      // Filtrar exercícios recentes (últimos 7 dias)
      const recentIds = new Set((Array.isArray(recentExercises) ? recentExercises : []).map((e) => e?.id || e?.exercise_id));
      filtered = filtered
        .filter((exercise) => recentIds.has(exercise?.id))
        .sort((a, b) => {
          const aDate = (Array.isArray(recentExercises) ? recentExercises : []).find((e) => (e?.id || e?.exercise_id) === a?.id)?.created_at || "";
          const bDate = (Array.isArray(recentExercises) ? recentExercises : []).find((e) => (e?.id || e?.exercise_id) === b?.id)?.created_at || "";
          return new Date(bDate) - new Date(aDate);
        })
        .slice(0, 10); // Limitar a 10 mais recentes
    }

    setFilteredExercises(filtered);
  };

  const handleViewDetails = (exercise) => {
    setSelectedExercise(exercise);
    setShowDetailsModal(true);
  };

  useEffect(() => {
    // Carregar favoritos do localStorage
    try {
      const savedFavorites = getExerciseFavorites();
      if (savedFavorites && Array.isArray(savedFavorites)) {
        setFavoriteExercises(savedFavorites);
      }
    } catch (e) {
      logger.error("Erro ao carregar favoritos:", e);
      setFavoriteExercises([]);
    }

    // Carregar exercícios recentes do localStorage (poderia vir da API também)
    try {
      const savedRecent = getRecentExercises();
      if (savedRecent && Array.isArray(savedRecent)) {
        // Filtrar apenas últimos 7 dias
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const filtered = savedRecent.filter((e) => {
          const date = new Date(e?.created_at || e?.timestamp);
          return date >= sevenDaysAgo;
        });
        setRecentExercises(filtered);
      }
    } catch (e) {
      logger.error("Erro ao carregar exercícios recentes:", e);
      setRecentExercises([]);
    }
  }, []);

  const handleAddToWorkout = (exercise) => {
    // Adicionar aos exercícios recentes ao usar em treino
    const recent = recentExercises.filter(
      (e) => (e.id || e.exercise_id) !== exercise.id,
    );
    const updated = [
      {
        id: exercise.id,
        exercise_id: exercise.id,
        created_at: new Date().toISOString(),
        ...exercise,
      },
      ...recent,
    ].slice(0, 50); // Manter apenas últimos 50

    setRecentExercises(updated);
    toast.success("Adicionado ao treino");
  };

  const getStats = () => {
    const safeExercises = Array.isArray(exercises) ? exercises : [];
    const totalExercises = safeExercises.length;
    const beginnerCount = safeExercises.filter((e) => e?.difficulty === "beginner").length;
    const intermediateCount = safeExercises.filter((e) => e?.difficulty === "intermediate").length;
    const advancedCount = safeExercises.filter((e) => e?.difficulty === "advanced").length;
    const noEquipmentCount = safeExercises.filter((e) => Array.isArray(e?.equipment) && e.equipment.includes("Nenhum")).length;

    return {
      total: totalExercises,
      beginner: beginnerCount,
      intermediate: intermediateCount,
      advanced: advancedCount,
      noEquipment: noEquipmentCount,
    };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-card rounded-lg p-4 sm:p-6">
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
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Dumbbell className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Biblioteca de Exercícios
            </h1>
            <p className="text-muted-foreground/90 leading-relaxed">
              Explore nossa coleção completa de exercícios para todos os níveis
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">
                {stats.total}
              </div>
              <div className="text-sm text-muted-foreground/90">
                Total
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
                {stats.noEquipment}
              </div>
              <div className="text-sm text-muted-foreground/90">
                Sem Equipamento
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filtros */}
      <Card className="mb-4 sm:mb-6">
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground/80 w-4 h-4" />
              <Input
                placeholder="Buscar exercícios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger>
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

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

            <Select
              value={selectedMuscleGroup}
              onValueChange={setSelectedMuscleGroup}
            >
              <SelectTrigger>
                <SelectValue placeholder="Grupo Muscular" />
              </SelectTrigger>
              <SelectContent>
                {muscleGroups.map((muscle) => (
                  <SelectItem key={muscle.value} value={muscle.value}>
                    {muscle.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedEquipment}
              onValueChange={setSelectedEquipment}
            >
              <SelectTrigger>
                <SelectValue placeholder="Equipamento" />
              </SelectTrigger>
              <SelectContent>
                {equipment.map((eq) => (
                  <SelectItem key={eq.value} value={eq.value}>
                    {eq.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4 sm:mb-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="all" className="flex items-center gap-2.5">
            <BookOpen className="w-4 h-4" />
            <span>Todos</span>
          </TabsTrigger>
          <TabsTrigger
            value="favorites"
            className="flex items-center gap-2.5"
          >
            <Star className="w-4 h-4" />
            <span>Favoritos</span>
          </TabsTrigger>
          <TabsTrigger value="recent" className="flex items-center space-x-2">
            <Clock className="w-4 h-4" />
            <span>Recentes</span>
          </TabsTrigger>
          <TabsTrigger value="trending" className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4" />
            <span>Populares</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredExercises.map((exercise) => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                onViewDetails={handleViewDetails}
                onAddToWorkout={handleAddToWorkout}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="favorites" className="mt-4 sm:mt-6">
          <div className="text-center py-16 px-4">
            <div className="max-w-md mx-auto">
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-primary/10 animate-pulse"></div>
                </div>
                <Star className="w-16 h-16 sm:w-20 sm:h-20 text-primary mx-auto relative z-10" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3">
                Nenhum exercício favorito
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground/90 leading-relaxed">
                Adicione exercícios aos seus favoritos para encontrá-los facilmente
              </p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="recent" className="mt-4 sm:mt-6">
          <div className="text-center py-16 px-4">
            <div className="max-w-md mx-auto">
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-primary/10 animate-pulse"></div>
                </div>
                <Clock className="w-16 h-16 sm:w-20 sm:h-20 text-primary mx-auto relative z-10" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3">
                Nenhum exercício recente
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground/90 leading-relaxed">
                Exercícios que você visualizou recentemente aparecerão aqui
              </p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="trending" className="mt-4 sm:mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredExercises.slice(0, 8).map((exercise) => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                onViewDetails={handleViewDetails}
                onAddToWorkout={handleAddToWorkout}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Resultados */}
      {filteredExercises.length === 0 && activeTab === "all" && (
        <div className="text-center py-16 px-4">
          <div className="max-w-md mx-auto">
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-primary/10 animate-pulse"></div>
              </div>
              <Search className="w-16 h-16 sm:w-20 sm:h-20 text-primary mx-auto relative z-10" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3">
              Nenhum exercício encontrado
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground/90 leading-relaxed">
              Tente ajustar os filtros para encontrar mais exercícios
            </p>
          </div>
        </div>
      )}

      {/* Modal de Detalhes do Exercício */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          {selectedExercise && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl sm:text-2xl flex items-center gap-2">
                  <Dumbbell className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  {selectedExercise.name}
                </DialogTitle>
                <DialogDescription>
                  {selectedExercise.description || "Detalhes completos do exercício"}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 sm:space-y-6 mt-4">
                {/* Imagem do exercício */}
                {selectedExercise.image_url && (
                  <div className="aspect-video overflow-hidden rounded-lg bg-muted">
                    <img
                      src={selectedExercise.image_url}
                      alt={selectedExercise.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                )}

                {/* Informações principais */}
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <Target className="w-5 h-5 text-primary" />
                    <div>
                      <div className="text-sm text-muted-foreground">Dificuldade</div>
                      <div className="font-semibold capitalize">
                        {selectedExercise.difficulty === "beginner" ? "Iniciante" :
                         selectedExercise.difficulty === "intermediate" ? "Intermediário" :
                         selectedExercise.difficulty === "advanced" ? "Avançado" :
                         selectedExercise.difficulty}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <Clock className="w-5 h-5 text-primary" />
                    <div>
                      <div className="text-sm text-muted-foreground/90">MET</div>
                      <div className="font-semibold">{selectedExercise.met_value || "N/A"}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    <div>
                      <div className="text-sm text-muted-foreground">Categoria</div>
                      <div className="font-semibold text-foreground">{selectedExercise.category || "N/A"}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <Star className="w-5 h-5 text-primary" />
                    <div>
                      <div className="text-sm text-muted-foreground">Avaliação</div>
                      <div className="font-semibold text-foreground">4.2</div>
                    </div>
                  </div>
                </div>

                {/* Descrição completa */}
                {selectedExercise.description && (
                  <section>
                    <H3 className="mb-2 flex items-center gap-2">
                      <BookOpen className="w-5 h-5" />
                      Descrição
                    </H3>
                    <p className="text-muted-foreground/90 leading-relaxed">
                      {selectedExercise.description}
                    </p>
                  </section>
                )}

                {/* Grupos musculares */}
                {selectedExercise.muscle_groups && selectedExercise.muscle_groups.length > 0 && (
                  <section>
                    <H3 className="mb-3 flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      Grupos Musculares Trabalhados
                    </H3>
                    <div className="flex flex-wrap gap-2">
                      {selectedExercise.muscle_groups.map((muscle, index) => (
                        <Badge key={index} variant="outline" className="text-sm py-1 px-3">
                          {muscle}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Equipamentos */}
                {selectedExercise.equipment && selectedExercise.equipment.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Dumbbell className="w-5 h-5" />
                      Equipamentos Necessários
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedExercise.equipment.map((equipment, index) => (
                        <Badge key={index} variant="secondary" className="text-sm py-1 px-3">
                          {equipment}
                        </Badge>
                      ))}
                    </div>
                  </section>
                )}

                {/* Instruções */}
                {selectedExercise.instructions && selectedExercise.instructions.length > 0 && (
                  <section>
                    <H3 className="mb-3 flex items-center gap-2">
                      <Play className="w-5 h-5" />
                      Instruções
                    </H3>
                    <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                      {selectedExercise.instructions.map((instruction, index) => (
                        <li key={index} className="leading-relaxed">
                          {instruction}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Dicas */}
                {selectedExercise.tips && selectedExercise.tips.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Zap className="w-5 h-5" />
                      Dicas
                    </h3>
                    <ul className="list-disc list-inside space-y-2.5 text-muted-foreground/90">
                      {selectedExercise.tips.map((tip, index) => (
                        <li key={index} className="leading-relaxed">
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {/* Vídeo */}
                {selectedExercise.video_url && (
                  <section>
                    <H3 className="mb-3 flex items-center gap-2">
                      <Play className="w-5 h-5" />
                      Vídeo Demonstrativo
                    </H3>
                    <Button
                      onClick={() => window.open(selectedExercise.video_url, "_blank")}
                      className="w-full"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Assistir Vídeo
                    </Button>
                  </section>
                )}

                {/* Botões de ação */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                  <Button
                    onClick={() => {
                      // Adicionar ao treino
                      toast.success("Exercício adicionado ao treino!");
                      setShowDetailsModal(false);
                    }}
                    className="flex-1"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Adicionar ao Treino
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowDetailsModal(false)}
                    className="flex-1"
                  >
                    Fechar
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExercisesPage;
ExercisesPage;
