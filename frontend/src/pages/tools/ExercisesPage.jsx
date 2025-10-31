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
import { Input } from "@/components/Ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/Ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/Ui/tabs";
import { ExerciseCard } from "../../components/exercises/ExerciseCard";
import apiClient from "@/services/apiClient";
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

  // Carregar exercícios da API
  useEffect(() => {
    const loadExercises = async () => {
      try {
        setLoading(true);
        if (!apiClient?.getExercises) {
          throw new Error("Serviço de exercícios indisponível");
        }
        const response = await apiClient.getExercises();

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
        console.error("Erro ao carregar exercícios:", err);
        toast.error("Erro ao carregar exercícios");
        setExercises([]);
        setFilteredExercises([]);
      } finally {
        setLoading(false);
      }
    };

    loadExercises();
  }, []);

  // Dados de exemplo removidos - usando API real acima
  const exerciseDataFallback = [
    {
      id: 1,
      name: "Flexão de Braço",
      description: "Exercício clássico para fortalecer peito, ombros e tríceps",
      category: "Força",
      difficulty: "beginner",
      muscle_groups: ["Peito", "Ombros", "Tríceps"],
      equipment: ["Nenhum"],
      met_value: 3.8,
      image_url: null,
      video_url: "https://www.youtube.com/watch?v=example1",
      instructions: [
        "Deite-se de bruços no chão",
        "Posicione as mãos ligeiramente mais largas que os ombros",
        "Mantenha o corpo em linha reta",
        "Desça o corpo até quase tocar o chão",
        "Empurre de volta à posição inicial",
      ],
      tips: [
        "Mantenha o core contraído",
        "Não deixe o quadril cair",
        "Respire na descida e expire na subida",
      ],
    },
    {
      id: 2,
      name: "Agachamento",
      description: "Movimento fundamental para pernas e glúteos",
      category: "Força",
      difficulty: "beginner",
      muscle_groups: ["Quadríceps", "Glúteos", "Isquiotibiais"],
      equipment: ["Nenhum"],
      met_value: 5.0,
      image_url: null,
      video_url: "https://www.youtube.com/watch?v=example2",
      instructions: [
        "Fique em pé com os pés na largura dos ombros",
        "Desça como se fosse sentar em uma cadeira",
        "Mantenha o peito erguido",
        "Desça até as coxas ficarem paralelas ao chão",
        "Volte à posição inicial",
      ],
      tips: [
        "Mantenha os joelhos alinhados com os pés",
        "Não deixe os joelhos ultrapassarem os dedos dos pés",
        "Mantenha o peso nos calcanhares",
      ],
    },
    {
      id: 3,
      name: "Prancha",
      description: "Exercício isométrico para fortalecer o core",
      category: "Core",
      difficulty: "beginner",
      muscle_groups: ["Core", "Ombros", "Glúteos"],
      equipment: ["Nenhum"],
      met_value: 3.5,
      image_url: null,
      video_url: "https://www.youtube.com/watch?v=example3",
      instructions: [
        "Deite-se de bruços",
        "Apoie-se nos antebraços e dedos dos pés",
        "Mantenha o corpo em linha reta",
        "Contraia o abdômen",
        "Mantenha a posição pelo tempo determinado",
      ],
      tips: [
        "Não deixe o quadril subir ou descer",
        "Mantenha a respiração normal",
        "Comece com 30 segundos e aumente gradualmente",
      ],
    },
    {
      id: 4,
      name: "Burpee",
      description: "Exercício completo que combina força e cardio",
      category: "Cardio",
      difficulty: "intermediate",
      muscle_groups: ["Corpo Inteiro"],
      equipment: ["Nenhum"],
      met_value: 8.0,
      image_url: null,
      video_url: "https://www.youtube.com/watch?v=example4",
      instructions: [
        "Comece em pé",
        "Agache e coloque as mãos no chão",
        "Estenda as pernas para trás (posição de flexão)",
        "Faça uma flexão",
        "Volte à posição de agachamento",
        "Salte para cima com os braços estendidos",
      ],
      tips: [
        "Mantenha o ritmo constante",
        "Land suavemente após o salto",
        "Modifique removendo o salto se necessário",
      ],
    },
    {
      id: 5,
      name: "Mountain Climber",
      description: "Exercício dinâmico para cardio e core",
      category: "Cardio",
      difficulty: "intermediate",
      muscle_groups: ["Core", "Ombros", "Quadríceps"],
      equipment: ["Nenhum"],
      met_value: 8.0,
      image_url: null,
      video_url: "https://www.youtube.com/watch?v=example5",
      instructions: [
        "Comece na posição de flexão",
        "Mantenha o corpo em linha reta",
        "Traga um joelho em direção ao peito",
        "Retorne à posição inicial",
        "Repita com a outra perna",
        "Alterne rapidamente",
      ],
      tips: [
        "Mantenha o core contraído",
        "Não deixe o quadril subir",
        "Mantenha um ritmo constante",
      ],
    },
    {
      id: 6,
      name: "Lunges",
      description: "Exercício unilateral para pernas e glúteos",
      category: "Força",
      difficulty: "beginner",
      muscle_groups: ["Quadríceps", "Glúteos", "Isquiotibiais"],
      equipment: ["Nenhum"],
      met_value: 4.5,
      image_url: null,
      video_url: "https://www.youtube.com/watch?v=example6",
      instructions: [
        "Fique em pé com os pés juntos",
        "Dê um passo à frente",
        "Desça até o joelho de trás quase tocar o chão",
        "Empurre de volta à posição inicial",
        "Repita com a outra perna",
      ],
      tips: [
        "Mantenha o tronco ereto",
        "O joelho da frente não deve ultrapassar o pé",
        "Mantenha o peso distribuído",
      ],
    },
    {
      id: 7,
      name: "Ponte de Glúteos",
      description: "Exercício específico para glúteos e posterior da coxa",
      category: "Força",
      difficulty: "beginner",
      muscle_groups: ["Glúteos", "Isquiotibiais", "Core"],
      equipment: ["Nenhum"],
      met_value: 3.0,
      image_url: null,
      video_url: "https://www.youtube.com/watch?v=example7",
      instructions: [
        "Deite-se de costas com os joelhos flexionados",
        "Mantenha os pés no chão",
        "Contraia os glúteos e levante o quadril",
        "Mantenha a posição por um momento",
        "Desça controladamente",
      ],
      tips: [
        "Contraia os glúteos no topo",
        "Não arqueie demais a coluna",
        "Mantenha os pés firmes no chão",
      ],
    },
    {
      id: 8,
      name: "Pular Corda",
      description: "Exercício cardiovascular de alta intensidade",
      category: "Cardio",
      difficulty: "intermediate",
      muscle_groups: ["Panturrilhas", "Ombros", "Core"],
      equipment: ["Corda"],
      met_value: 12.0,
      image_url: null,
      video_url: "https://www.youtube.com/watch?v=example8",
      instructions: [
        "Segure a corda com as duas mãos",
        "Mantenha os cotovelos próximos ao corpo",
        "Pule com os dois pés juntos",
        "Mantenha um ritmo constante",
        "Aterre suavemente",
      ],
      tips: [
        "Comece devagar e aumente a velocidade",
        "Mantenha o core contraído",
        "Use sapatos com boa amortização",
      ],
    },
    {
      id: 9,
      name: "Tríceps no Banco",
      description: "Exercício para fortalecer o tríceps",
      category: "Força",
      difficulty: "intermediate",
      muscle_groups: ["Tríceps", "Ombros"],
      equipment: ["Banco"],
      met_value: 4.0,
      image_url: null,
      video_url: "https://www.youtube.com/watch?v=example9",
      instructions: [
        "Sente-se na borda de um banco",
        "Coloque as mãos na borda ao lado do quadril",
        "Deslize para frente",
        "Desça o corpo flexionando os cotovelos",
        "Empurre de volta à posição inicial",
      ],
      tips: [
        "Mantenha o corpo próximo ao banco",
        "Não desça muito baixo",
        "Controle o movimento",
      ],
    },
    {
      id: 10,
      name: "Superman",
      description: "Exercício para fortalecer a região lombar",
      category: "Força",
      difficulty: "beginner",
      muscle_groups: ["Lombar", "Glúteos", "Ombros"],
      equipment: ["Nenhum"],
      met_value: 2.5,
      image_url: null,
      video_url: "https://www.youtube.com/watch?v=example10",
      instructions: [
        "Deite-se de bruços",
        "Estenda os braços à frente",
        "Levante o peito e as pernas simultaneamente",
        "Mantenha a posição por um momento",
        "Desça controladamente",
      ],
      tips: [
        "Mantenha o pescoço neutro",
        "Não force demais a coluna",
        "Respire normalmente",
      ],
    },
  ];
  // Dados de exemplo removidos completamente - dados vêm da API

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

  // useEffect para carregar exercícios movido para cima (já implementado)

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
    // Implementar modal de detalhes
  };

  useEffect(() => {
    // Carregar favoritos do localStorage
    try {
      const savedFavorites = localStorage.getItem("exercise_favorites");
      if (savedFavorites) {
        setFavoriteExercises(JSON.parse(savedFavorites));
      }
    } catch (e) {
      console.error("Erro ao carregar favoritos:", e);
      setFavoriteExercises([]);
    }

    // Carregar exercícios recentes do localStorage (poderia vir da API também)
    try {
      const savedRecent = localStorage.getItem("recent_exercises");
      if (savedRecent) {
        const recent = JSON.parse(savedRecent);
        // Filtrar apenas últimos 7 dias
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const filtered = (Array.isArray(recent) ? recent : []).filter((e) => {
          const date = new Date(e?.created_at || e?.timestamp);
          return date >= sevenDaysAgo;
        });
        setRecentExercises(filtered);
      }
    } catch (e) {
      console.error("Erro ao carregar exercícios recentes:", e);
      setRecentExercises([]);
    }
  }, []);

  const handleAddToFavorite = (exercise) => {
    const isFavorite = favoriteExercises.some(
      (e) => (e.id || e.exercise_id) === exercise.id,
    );

    if (isFavorite) {
      const updated = favoriteExercises.filter(
        (e) => (e.id || e.exercise_id) !== exercise.id,
      );
      setFavoriteExercises(updated);
      localStorage.setItem("exercise_favorites", JSON.stringify(updated));
      toast.success("Removido dos favoritos");
    } else {
      const updated = [
        ...favoriteExercises,
        {
          id: exercise.id,
          exercise_id: exercise.id,
          created_at: new Date().toISOString(),
          ...exercise,
        },
      ];
      setFavoriteExercises(updated);
      localStorage.setItem("exercise_favorites", JSON.stringify(updated));
      toast.success("Adicionado aos favoritos");
    }
  };

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
    localStorage.setItem("recent_exercises", JSON.stringify(updated));
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
      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-6">
                <div className="h-48 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
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
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <Dumbbell className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Biblioteca de Exercícios
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Explore nossa coleção completa de exercícios para todos os níveis
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stats.total}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Total
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats.beginner}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Iniciante
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {stats.intermediate}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Intermediário
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">
                {stats.advanced}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Avançado
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {stats.noEquipment}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Sem Equipamento
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
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
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all" className="flex items-center space-x-2">
            <BookOpen className="w-4 h-4" />
            <span>Todos</span>
          </TabsTrigger>
          <TabsTrigger
            value="favorites"
            className="flex items-center space-x-2"
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

        <TabsContent value="favorites" className="mt-6">
          <div className="text-center py-12">
            <Star className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Nenhum exercício favorito
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Adicione exercícios aos seus favoritos para encontrá-los
              facilmente
            </p>
          </div>
        </TabsContent>

        <TabsContent value="recent" className="mt-6">
          <div className="text-center py-12">
            <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Nenhum exercício recente
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Exercícios que você visualizou recentemente aparecerão aqui
            </p>
          </div>
        </TabsContent>

        <TabsContent value="trending" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
      {filteredExercises.length === 0 && (
        <div className="text-center py-12">
          <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Nenhum exercício encontrado
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Tente ajustar os filtros para encontrar mais exercícios
          </p>
        </div>
      )}
    </div>
  );
};

export default ExercisesPage;
