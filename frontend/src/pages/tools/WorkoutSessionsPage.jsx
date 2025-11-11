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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/Ui/tabs";
import { WorkoutSession } from "../../components/workouts/WorkoutSession";
import { useApi, apiService } from "../../lib/api";
import { toast } from "sonner";
import {
  Play,
  Clock,
  Target,
  TrendingUp,
  Calendar,
  Flame,
  Trophy,
  BarChart3,
  History,
  Plus,
  Dumbbell,
  CheckCircle,
  Timer,
} from "lucide-react";

/**
 * WorkoutSessionsPage
 * Sessões de treino com histórico, execução e estatísticas (com guards e fallbacks).
 */
const WorkoutSessionsPage = () => {
  const { request, loading } = useApi();
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("active");
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Dados de exemplo para sessões de treino
  const workoutSessionsData = [
    {
      id: 1,
      name: "Iniciante Total",
      description: "Plano completo para quem está começando na academia",
      difficulty: "beginner",
      duration: 45,
      exercises: [
        {
          id: 1,
          name: "Agachamento",
          sets: 3,
          reps: "12-15",
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
          id: 2,
          name: "Flexão de Braço",
          sets: 3,
          reps: "8-12",
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
          id: 3,
          name: "Prancha",
          sets: 3,
          reps: "30-45s",
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
          name: "Lunges",
          sets: 3,
          reps: "10-12 cada",
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
      ],
    },
  ];

  const historyData = [
    {
      id: 1,
      workoutName: "Iniciante Total",
      date: "2024-01-20",
      duration: 42,
      caloriesBurned: 180,
      exercisesCompleted: 4,
      setsCompleted: 12,
      difficulty: "beginner",
      rating: 4.5,
    },
    {
      id: 2,
      workoutName: "Queima Gordura HIIT",
      date: "2024-01-18",
      duration: 28,
      caloriesBurned: 320,
      exercisesCompleted: 4,
      setsCompleted: 16,
      difficulty: "intermediate",
      rating: 4.8,
    },
    {
      id: 3,
      workoutName: "Funcional para Iniciantes",
      date: "2024-01-16",
      duration: 38,
      caloriesBurned: 150,
      exercisesCompleted: 4,
      setsCompleted: 12,
      difficulty: "beginner",
      rating: 4.3,
    },
    {
      id: 4,
      workoutName: "Iniciante Total",
      date: "2024-01-14",
      duration: 45,
      caloriesBurned: 200,
      exercisesCompleted: 4,
      setsCompleted: 12,
      difficulty: "beginner",
      rating: 4.6,
    },
  ];

  useEffect(() => {
    loadWorkoutHistory();
  }, []);

  const loadWorkoutHistory = async () => {
    try {
      if (typeof request !== "function") {
        throw new Error("Serviço de rede indisponível");
      }
      if (!apiService?.health?.getExerciseEntries) {
        throw new Error("Serviço de histórico indisponível");
      }
      const data = await request(() => apiService.health.getExerciseEntries());
      const list = Array.isArray(data?.entries) ? data.entries : [];
      setWorkoutHistory(list);
    } catch (error) {
      logger.error("Erro ao carregar histórico de treinos:", error);
      // Fallback para dados de exemplo se a API falhar
      setWorkoutHistory(historyData);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleStartWorkout = (workout) => {
    setActiveWorkout(workout);
    setActiveTab("active");
  };

  const handleCompleteWorkout = async (sessionData) => {
    try {
      if (!activeWorkout) {
        throw new Error("Treino ativo inválido");
      }
      if (typeof request !== "function") {
        throw new Error("Serviço de rede indisponível");
      }
      if (!apiService?.health?.addExerciseEntry) {
        throw new Error("Serviço de registro indisponível");
      }
      // Salvar no backend
      await request(() =>
        apiService.health.addExerciseEntry({
          exercise_name: activeWorkout?.name || "Treino",
          duration: Number(sessionData?.totalTime) || 0,
          intensity: activeWorkout?.difficulty || "beginner",
          calories_burned: Number(sessionData?.caloriesBurned) || 0,
          exercise_type: "workout",
          notes: `Treino completo: ${Number(sessionData?.exercisesCompleted) || 0} exercícios, ${Number(sessionData?.setsCompleted) || 0} séries`,
        }),
      );

      // Adicionar à história local
      const newSession = {
        id: Date.now(),
        workoutName: activeWorkout?.name || "Treino",
        date: new Date().toISOString().split("T")[0],
        duration: Number(sessionData?.totalTime) || 0,
        caloriesBurned: Number(sessionData?.caloriesBurned) || 0,
        exercisesCompleted: Number(sessionData?.exercisesCompleted) || 0,
        setsCompleted: Number(sessionData?.setsCompleted) || 0,
        difficulty: activeWorkout?.difficulty || "beginner",
        rating: 4.5,
      };

      setWorkoutHistory((prev) => [newSession, ...prev]);
      setActiveWorkout(null);
      setActiveTab("history");
      toast.success("Treino salvo com sucesso!");
    } catch (error) {
      logger.error("Erro ao salvar treino:", error);
      toast.error(error?.message || "Erro ao salvar treino. Tente novamente.");
    }
  };

  const handlePauseWorkout = async () => {
    if (!activeWorkout?.id) {
      toast.error("Nenhum treino ativo para pausar");
      return;
    }

    try {
      if (typeof request !== "function") {
        throw new Error("Serviço de rede indisponível");
      }
      if (!apiService?.weeklySessions?.updateStatus) {
        throw new Error("Serviço de atualização indisponível");
      }

      await request(() =>
        apiService.weeklySessions.updateStatus(activeWorkout.id, { status: "paused" })
      );

      toast.success("Treino pausado!");
      // Atualizar estado local se necessário
      setActiveWorkout((prev) => (prev ? { ...prev, status: "paused" } : null));
    } catch (error) {
      logger.error("Erro ao pausar treino:", error);
      toast.error(error?.message || "Erro ao pausar treino. Tente novamente.");
    }
  };

  const handleResumeWorkout = async () => {
    if (!activeWorkout?.id) {
      toast.error("Nenhum treino pausado para retomar");
      return;
    }

    try {
      if (typeof request !== "function") {
        throw new Error("Serviço de rede indisponível");
      }
      if (!apiService?.weeklySessions?.updateStatus) {
        throw new Error("Serviço de atualização indisponível");
      }

      await request(() =>
        apiService.weeklySessions.updateStatus(activeWorkout.id, { status: "in_progress" })
      );

      toast.success("Treino retomado!");
      // Atualizar estado local
      setActiveWorkout((prev) => (prev ? { ...prev, status: "in_progress" } : null));
    } catch (error) {
      logger.error("Erro ao retomar treino:", error);
      toast.error(error?.message || "Erro ao retomar treino. Tente novamente.");
    }
  };

  const getStats = () => {
    const safeHistory = Array.isArray(workoutHistory) ? workoutHistory : [];
    const totalWorkouts = safeHistory.length;
    const totalTime = safeHistory.reduce(
      (sum, session) => sum + Number(session?.duration || 0),
      0,
    );
    const totalCalories = safeHistory.reduce(
      (sum, session) => sum + Number(session?.caloriesBurned || 0),
      0,
    );
    const avgRatingBase =
      safeHistory.reduce((sum, session) => sum + Number(session?.rating || 0), 0) /
        (totalWorkouts || 1);
    const avgRating = Number.isFinite(avgRatingBase) ? avgRatingBase : 0;

    return {
      totalWorkouts,
      totalTime,
      totalCalories,
      avgRating: avgRating.toFixed(1),
    };
  };

  const stats = getStats();

  const formatTime = (minutes) => {
    const total = Number(minutes) || 0;
    const hours = Math.floor(total / 60);
    const mins = total % 60;
    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins}min`;
  };

  if (loadingHistory || loading) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
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
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Play className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                Sessões de Treino
              </h1>
              <p className="text-muted-foreground">
                Acompanhe seus treinos e progresso
              </p>
            </div>
          </div>
          <Button className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Novo Treino
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">
                {stats.totalWorkouts}
              </div>
              <div className="text-sm text-muted-foreground">
                Treinos
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">
                {formatTime(stats.totalTime)}
              </div>
              <div className="text-sm text-muted-foreground">
                Tempo Total
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">
                {stats.totalCalories}
              </div>
              <div className="text-sm text-muted-foreground">
                Calorias
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">
                {stats.avgRating}
              </div>
              <div className="text-sm text-muted-foreground">
                Avaliação
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active" className="flex items-center space-x-2">
            <Play className="w-4 h-4" />
            <span>Treino Ativo</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center space-x-2">
            <History className="w-4 h-4" />
            <span>Histórico</span>
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4" />
            <span>Estatísticas</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6">
          {activeWorkout ? (
            <WorkoutSession
              workout={activeWorkout}
              onComplete={handleCompleteWorkout}
              onPause={handlePauseWorkout}
              onResume={handleResumeWorkout}
            />
          ) : (
            <div className="text-center py-16 px-4">
              <div className="max-w-md mx-auto mb-8">
                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-primary/10 animate-pulse"></div>
                  </div>
                  <Play className="w-16 h-16 sm:w-20 sm:h-20 text-primary mx-auto relative z-10" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3">
                  Nenhum treino ativo
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground mb-6 leading-relaxed">
                  Escolha um plano de treino para começar sua sessão
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
                {workoutSessionsData.map((workout) => (
                  <Card
                    key={workout.id}
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                  >
                    <CardContent className="p-6">
                      <div className="text-center">
                        <Dumbbell className="w-12 h-12 text-primary mx-auto mb-3" />
                        <h4 className="font-semibold mb-2">{workout.name}</h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          {workout.description}
                        </p>
                        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                          <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {workout.duration} min
                          </span>
                          <Badge variant="outline">{workout.difficulty}</Badge>
                        </div>
                        <Button
                          onClick={() => handleStartWorkout(workout)}
                          className="w-full bg-primary hover:bg-primary/90"
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Iniciar Treino
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          {workoutHistory.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="max-w-md mx-auto">
                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-primary/10 animate-pulse"></div>
                  </div>
                  <History className="w-16 h-16 sm:w-20 sm:h-20 text-primary mx-auto relative z-10" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3">
                  Nenhum treino registrado
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground/90 leading-relaxed">
                  Complete seu primeiro treino para ver o histórico aqui
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {(Array.isArray(workoutHistory) ? workoutHistory : []).map((session) => (
              <Card key={session.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <CheckCircle className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg">
                          {session?.workoutName || "Treino"}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {session?.date ? new Date(session.date).toLocaleDateString("pt-BR") : "—"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span className="flex items-center">
                          <Timer className="w-4 h-4 mr-1" />
                          {formatTime(session?.duration)}
                        </span>
                        <span className="flex items-center">
                          <Flame className="w-4 h-4 mr-1" />
                          {Number(session?.caloriesBurned || 0)} cal
                        </span>
                        <span className="flex items-center">
                          <Target className="w-4 h-4 mr-1" />
                          {Number(session?.setsCompleted || 0)} sets
                        </span>
                        <div className="flex items-center">
                          <Trophy className="w-4 h-4 mr-1 text-primary" />
                          {Number(session?.rating || 0).toFixed(1)}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="stats" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Progresso Semanal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Gráfico de progresso será implementado aqui
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Conquistas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Trophy className="w-8 h-8 text-primary" />
                    <div>
                      <h4 className="font-semibold">Primeiro Treino</h4>
                      <p className="text-sm text-muted-foreground">
                        Complete seu primeiro treino
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Flame className="w-8 h-8 text-primary" />
                    <div>
                      <h4 className="font-semibold">Queimador de Calorias</h4>
                      <p className="text-sm text-muted-foreground">
                        Queime 1000 calorias
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <TrendingUp className="w-8 h-8 text-primary" />
                    <div>
                      <h4 className="font-semibold">Consistência</h4>
                      <p className="text-sm text-muted-foreground">
                        Treine por 7 dias seguidos
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WorkoutSessionsPage;
