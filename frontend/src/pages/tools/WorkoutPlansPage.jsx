import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/Ui/card';
import { Button } from '@/components/Ui/button';
import { Badge } from '@/components/Ui/badge';
import { Input } from '@/components/Ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/Ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/Ui/tabs';
import { WorkoutPlanCard } from '../../components/workouts/WorkoutPlanCard';
import apiClient from '@/services/apiClient';
import { toast } from 'sonner';
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
  Award
} from 'lucide-react';

const WorkoutPlansPage = () => {
  const [plans, setPlans] = useState([]);
  const [filteredPlans, setFilteredPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [selectedGoal, setSelectedGoal] = useState('all');
  const [selectedDuration, setSelectedDuration] = useState('all');
  const [activeTab, setActiveTab] = useState('all');
  const [favoritePlans, setFavoritePlans] = useState([]);
  const [userPlans, setUserPlans] = useState([]);

  // Carregar planos de treino da API
  useEffect(() => {
    const loadWorkoutPlans = async () => {
      try {
        setLoading(true);
        // Tentar buscar da API (se endpoint existir)
        try {
          const response = await apiClient.request('/api/exercises/workout-plans');
          if (response.plans || response.data || Array.isArray(response)) {
            const plansList = response.plans || response.data || response;
            setPlans(plansList);
            setFilteredPlans(plansList);
          } else {
            setPlans([]);
            setFilteredPlans([]);
          }
        } catch (apiError) {
          console.log('Endpoint de workout plans não disponível, usando array vazio');
          setPlans([]);
          setFilteredPlans([]);
        }
      } catch (err) {
        console.error('Erro ao carregar planos de treino:', err);
        toast.error('Erro ao carregar planos de treino');
        setPlans([]);
        setFilteredPlans([]);
      } finally {
        setLoading(false);
      }
    };

    loadWorkoutPlans();
  }, []);

  // Dados de exemplo removidos - usar API real ou array vazio
  const workoutPlansDataFallback = [
    {
      id: 1,
      name: "Iniciante Total",
      description: "Plano completo para quem está começando na academia. Foco em aprender os movimentos básicos e criar uma base sólida.",
      category: "Iniciante",
      difficulty: "beginner",
      duration: 8,
      workouts_per_week: 3,
      workout_duration: 45,
      exercises_count: 12,
      goals: ["muscle_gain", "strength"],
      rating: 4.8,
      participants_count: 1250,
      created_at: "2024-01-15",
      image_url: null,
      exercises: [
        { name: "Agachamento", sets: 3, reps: "12-15" },
        { name: "Flexão de Braço", sets: 3, reps: "8-12" },
        { name: "Prancha", sets: 3, reps: "30-45s" },
        { name: "Lunges", sets: 3, reps: "10-12 cada" }
      ],
      schedule: [
        { day: "Segunda", focus: "Corpo Inteiro" },
        { day: "Quarta", focus: "Corpo Inteiro" },
        { day: "Sexta", focus: "Corpo Inteiro" }
      ]
    },
    {
      id: 2,
      name: "Queima Gordura HIIT",
      description: "Treino de alta intensidade para queimar gordura rapidamente. Perfeito para quem tem pouco tempo mas quer resultados.",
      category: "Cardio",
      difficulty: "intermediate",
      duration: 6,
      workouts_per_week: 4,
      workout_duration: 30,
      exercises_count: 8,
      goals: ["weight_loss", "endurance"],
      rating: 4.6,
      participants_count: 890,
      created_at: "2024-01-10",
      image_url: null,
      exercises: [
        { name: "Burpee", sets: 4, reps: "30s" },
        { name: "Mountain Climber", sets: 4, reps: "30s" },
        { name: "Jumping Jacks", sets: 4, reps: "30s" },
        { name: "High Knees", sets: 4, reps: "30s" }
      ],
      schedule: [
        { day: "Segunda", focus: "HIIT Cardio" },
        { day: "Terça", focus: "HIIT Cardio" },
        { day: "Quinta", focus: "HIIT Cardio" },
        { day: "Sábado", focus: "HIIT Cardio" }
      ]
    },
    {
      id: 3,
      name: "Ganho de Massa Avançado",
      description: "Plano intensivo para atletas experientes que buscam ganho de massa muscular significativo.",
      category: "Força",
      difficulty: "advanced",
      duration: 12,
      workouts_per_week: 5,
      workout_duration: 75,
      exercises_count: 20,
      goals: ["muscle_gain", "strength"],
      rating: 4.9,
      participants_count: 650,
      created_at: "2024-01-05",
      image_url: null,
      exercises: [
        { name: "Supino Reto", sets: 4, reps: "6-8" },
        { name: "Agachamento Livre", sets: 4, reps: "6-8" },
        { name: "Levantamento Terra", sets: 4, reps: "5-6" },
        { name: "Desenvolvimento", sets: 4, reps: "6-8" }
      ],
      schedule: [
        { day: "Segunda", focus: "Peito e Tríceps" },
        { day: "Terça", focus: "Costas e Bíceps" },
        { day: "Quarta", focus: "Pernas" },
        { day: "Sexta", focus: "Ombros" },
        { day: "Sábado", focus: "Braços" }
      ]
    },
    {
      id: 4,
      name: "Funcional para Iniciantes",
      description: "Movimentos funcionais que melhoram a força, equilíbrio e coordenação para atividades do dia a dia.",
      category: "Funcional",
      difficulty: "beginner",
      duration: 6,
      workouts_per_week: 3,
      workout_duration: 40,
      exercises_count: 10,
      goals: ["strength", "endurance"],
      rating: 4.7,
      participants_count: 980,
      created_at: "2024-01-12",
      image_url: null,
      exercises: [
        { name: "Agachamento Funcional", sets: 3, reps: "12-15" },
        { name: "Prancha Lateral", sets: 3, reps: "20-30s" },
        { name: "Ponte de Glúteos", sets: 3, reps: "12-15" },
        { name: "Flexão Inclinada", sets: 3, reps: "8-12" }
      ],
      schedule: [
        { day: "Segunda", focus: "Movimentos Funcionais" },
        { day: "Quarta", focus: "Movimentos Funcionais" },
        { day: "Sexta", focus: "Movimentos Funcionais" }
      ]
    },
    {
      id: 5,
      name: "Resistência Cardio",
      description: "Foco em melhorar a capacidade cardiovascular e resistência através de exercícios de longa duração.",
      category: "Cardio",
      difficulty: "intermediate",
      duration: 8,
      workouts_per_week: 4,
      workout_duration: 50,
      exercises_count: 6,
      goals: ["endurance", "weight_loss"],
      rating: 4.5,
      participants_count: 720,
      created_at: "2024-01-08",
      image_url: null,
      exercises: [
        { name: "Corrida Estacionária", sets: 1, reps: "20 min" },
        { name: "Pular Corda", sets: 4, reps: "5 min" },
        { name: "Burpee", sets: 3, reps: "10-15" },
        { name: "Mountain Climber", sets: 3, reps: "1 min" }
      ],
      schedule: [
        { day: "Segunda", focus: "Cardio Longo" },
        { day: "Terça", focus: "Cardio Intervalado" },
        { day: "Quinta", focus: "Cardio Longo" },
        { day: "Sábado", focus: "Cardio Intervalado" }
      ]
    },
    {
      id: 6,
      name: "Força Máxima",
      description: "Plano focado em desenvolver força máxima através de exercícios compostos pesados.",
      category: "Força",
      difficulty: "advanced",
      duration: 10,
      workouts_per_week: 4,
      workout_duration: 90,
      exercises_count: 15,
      goals: ["strength"],
      rating: 4.8,
      participants_count: 420,
      created_at: "2024-01-03",
      image_url: null,
      exercises: [
        { name: "Levantamento Terra", sets: 5, reps: "3-5" },
        { name: "Agachamento com Barra", sets: 5, reps: "3-5" },
        { name: "Supino Reto", sets: 5, reps: "3-5" },
        { name: "Remada Curvada", sets: 4, reps: "5-6" }
      ],
      schedule: [
        { day: "Segunda", focus: "Levantamento Terra" },
        { day: "Terça", focus: "Agachamento" },
        { day: "Quinta", focus: "Supino" },
        { day: "Sábado", focus: "Remada" }
      ]
    }
  ];

  const difficulties = [
    { value: 'all', label: 'Todas as Dificuldades' },
    { value: 'beginner', label: 'Iniciante' },
    { value: 'intermediate', label: 'Intermediário' },
    { value: 'advanced', label: 'Avançado' }
  ];

  const goals = [
    { value: 'all', label: 'Todos os Objetivos' },
    { value: 'weight_loss', label: 'Perda de Peso' },
    { value: 'muscle_gain', label: 'Ganho de Massa' },
    { value: 'endurance', label: 'Resistência' },
    { value: 'strength', label: 'Força' }
  ];

  const durations = [
    { value: 'all', label: 'Todas as Durações' },
    { value: '4', label: '4 semanas' },
    { value: '6', label: '6 semanas' },
    { value: '8', label: '8 semanas' },
    { value: '10', label: '10 semanas' },
    { value: '12', label: '12 semanas' }
  ];

  // useEffect para carregar planos movido para cima (já implementado)

  useEffect(() => {
    filterPlans();
  }, [searchTerm, selectedDifficulty, selectedGoal, selectedDuration, activeTab, plans]);

  const filterPlans = () => {
    let filtered = plans;

    // Filtro por busca
    if (searchTerm) {
      filtered = filtered.filter(plan =>
        plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plan.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plan.goals.some(goal => 
          goal.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Filtro por dificuldade
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(plan => plan.difficulty === selectedDifficulty);
    }

    // Filtro por objetivo
    if (selectedGoal !== 'all') {
      filtered = filtered.filter(plan => 
        plan.goals.includes(selectedGoal)
      );
    }

    // Filtro por duração
    if (selectedDuration !== 'all') {
      filtered = filtered.filter(plan => 
        plan.duration.toString() === selectedDuration
      );
    }

    // Filtro por aba
    if (activeTab === 'my_plans') {
      // Filtrar planos do usuário
      const userPlanIds = new Set(userPlans.map(p => p.id || p.plan_id));
      filtered = filtered.filter(plan => userPlanIds.has(plan.id));
    } else if (activeTab === 'favorites') {
      // Filtrar favoritos
      const favoriteIds = new Set(favoritePlans.map(p => p.id || p.plan_id));
      filtered = filtered.filter(plan => favoriteIds.has(plan.id));
    } else if (activeTab === 'popular') {
      // Ordenar por popularidade
      filtered = filtered.sort((a, b) => (b.participants_count || 0) - (a.participants_count || 0));
    }

    setFilteredPlans(filtered);
  };

  const handleStartPlan = (plan) => {
    // Implementar início do plano
  };

  const handleViewDetails = (plan) => {
    // Implementar modal de detalhes
  };

  useEffect(() => {
    // Carregar favoritos do localStorage
    const savedFavorites = localStorage.getItem('workout_plan_favorites');
    if (savedFavorites) {
      try {
        setFavoritePlans(JSON.parse(savedFavorites));
      } catch (e) {
        console.error('Erro ao carregar favoritos:', e);
      }
    }
    
    // Carregar planos do usuário (se houver endpoint)
    // Por enquanto, usar localStorage também
    const savedUserPlans = localStorage.getItem('user_workout_plans');
    if (savedUserPlans) {
      try {
        setUserPlans(JSON.parse(savedUserPlans));
      } catch (e) {
        console.error('Erro ao carregar planos do usuário:', e);
      }
    }
  }, []);

  const handleAddToFavorites = (plan) => {
    const isFavorite = favoritePlans.some(p => (p.id || p.plan_id) === plan.id);
    
    if (isFavorite) {
      // Remover dos favoritos
      const updated = favoritePlans.filter(p => (p.id || p.plan_id) !== plan.id);
      setFavoritePlans(updated);
      localStorage.setItem('workout_plan_favorites', JSON.stringify(updated));
      toast.success('Removido dos favoritos');
    } else {
      // Adicionar aos favoritos
      const updated = [...favoritePlans, { id: plan.id, ...plan }];
      setFavoritePlans(updated);
      localStorage.setItem('workout_plan_favorites', JSON.stringify(updated));
      toast.success('Adicionado aos favoritos');
    }
    
    // Reaplicar filtros
    setTimeout(() => {
      const event = new Event('filterChange');
      window.dispatchEvent(event);
    }, 100);
  };

  const getStats = () => {
    const totalPlans = plans.length;
    const beginnerCount = plans.filter(p => p.difficulty === 'beginner').length;
    const intermediateCount = plans.filter(p => p.difficulty === 'intermediate').length;
    const advancedCount = plans.filter(p => p.difficulty === 'advanced').length;
    const totalParticipants = plans.reduce((sum, plan) => sum + plan.participants_count, 0);

    return {
      total: totalPlans,
      beginner: beginnerCount,
      intermediate: intermediateCount,
      advanced: advancedCount,
      participants: totalParticipants
    };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
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
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Dumbbell className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Planos de Treino
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Escolha o plano perfeito para seus objetivos
                </p>
              </div>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Criar Plano
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Planos</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{stats.beginner}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Iniciante</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats.intermediate}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Intermediário</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{stats.advanced}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Avançado</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.participants.toLocaleString()}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Participantes</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar planos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                <SelectTrigger>
                  <SelectValue placeholder="Dificuldade" />
                </SelectTrigger>
                <SelectContent>
                  {difficulties.map(difficulty => (
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
                  {goals.map(goal => (
                    <SelectItem key={goal.value} value={goal.value}>
                      {goal.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedDuration} onValueChange={setSelectedDuration}>
                <SelectTrigger>
                  <SelectValue placeholder="Duração" />
                </SelectTrigger>
                <SelectContent>
                  {durations.map(duration => (
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
            <TabsTrigger value="favorites" className="flex items-center space-x-2">
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
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Nenhum plano ativo
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Comece um plano de treino para acompanhar seu progresso
              </p>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Escolher Plano
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="favorites" className="mt-6">
            <div className="text-center py-12">
              <Star className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Nenhum plano favorito
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Adicione planos aos seus favoritos para encontrá-los facilmente
              </p>
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
        {filteredPlans.length === 0 && (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Nenhum plano encontrado
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Tente ajustar os filtros para encontrar mais planos
            </p>
          </div>
        )}
    </div>
  );
};

export default WorkoutPlansPage;