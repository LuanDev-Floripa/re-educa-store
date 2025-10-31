import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/Ui/card";
import { Button } from "@/components/Ui/button";
import { Progress } from "@/components/Ui/progress";
import { Badge } from "@/components/Ui/badge";
import { useApi, apiService } from "../lib/api";
import {
  Trophy,
  Target,
  Star,
  Award,
  Zap,
  Fire,
  Heart,
  Brain,
  Calendar,
  Clock,
  CheckCircle,
  Play,
  Pause,
  RotateCcw,
  Gift,
  Crown,
  Medal,
  Flag,
  Rocket,
  Lightbulb,
} from "lucide-react";
import { toast } from "sonner";

export const GamificationSystem = () => {
  const { request, loading } = useApi();
  const [userStats, setUserStats] = React.useState({
    level: 1,
    experience: 0,
    experienceToNext: 100,
    totalPoints: 0,
    streak: 0,
    achievements: [],
    challenges: [],
    rewards: [],
  });
  const [activeChallenges, setActiveChallenges] = React.useState([]);
  const [completedChallenges, setCompletedChallenges] = React.useState([]);
  const [showRewards, setShowRewards] = React.useState(false);
  const [gamificationData, setGamificationData] = React.useState(null);

  // Carregar dados de gamificação
  React.useEffect(() => {
    loadGamificationData();
  }, [loadGamificationData]);

  const loadGamificationData = React.useCallback(async () => {
    try {
      const [statsData, challengesData] = await Promise.all([
        request(() => apiService.gamification.getUserStats()),
        request(() => apiService.gamification.getChallenges()),
      ]);

      const userStatsData = statsData.stats || {
        level: 1,
        experience: 0,
        experienceToNext: 100,
        totalPoints: 0,
        streak: 0,
        achievements: [],
        challenges: [],
        rewards: [],
      };

      setUserStats(userStatsData);
      setActiveChallenges(challengesData.active || []);
      setCompletedChallenges(challengesData.completed || []);

      // Definir gamificationData para uso no modal
      setGamificationData({
        user: userStatsData,
        challenges: challengesData.active || [],
        achievements: [],
        rewards: [],
      });
    } catch (error) {
      console.error("Erro ao carregar dados de gamificação:", error);
    }
  }, [request]);

  const startChallenge = async (challengeId) => {
    try {
      await request(() => apiService.gamification.startChallenge(challengeId));
      toast.success("Desafio iniciado com sucesso!");
      loadGamificationData();
    } catch (error) {
      console.error("Erro ao iniciar desafio:", error);
      toast.error("Erro ao iniciar desafio. Tente novamente.");
    }
  };

  const completeChallenge = async (challengeId) => {
    try {
      const result = await request(() =>
        apiService.gamification.completeChallenge(challengeId),
      );

      if (result.success) {
        toast.success(`Desafio completado! +${result.points} pontos ganhos!`);
        if (result.levelUp) {
          toast.success(
            `Parabéns! Você subiu para o nível ${result.newLevel}!`,
          );
        }
        loadGamificationData();
      }
    } catch (error) {
      console.error("Erro ao completar desafio:", error);
      toast.error("Erro ao completar desafio. Tente novamente.");
    }
  };

  const claimReward = async (rewardId) => {
    try {
      const result = await request(() =>
        apiService.gamification.claimReward(rewardId),
      );

      if (result.success) {
        toast.success(`Recompensa resgatada: ${result.reward.name}!`);
        loadGamificationData();
      }
    } catch (error) {
      console.error("Erro ao resgatar recompensa:", error);
      toast.error("Erro ao resgatar recompensa. Tente novamente.");
    }
  };

  const getLevelProgress = () => {
    return (userStats.experience / userStats.experienceToNext) * 100;
  };

  const getLevelColor = (level) => {
    if (level >= 50) return "text-purple-600";
    if (level >= 30) return "text-blue-600";
    if (level >= 20) return "text-green-600";
    if (level >= 10) return "text-yellow-600";
    return "text-orange-600";
  };

  const getLevelIcon = (level) => {
    if (level >= 50) return <Crown className="w-6 h-6" />;
    if (level >= 30) return <Medal className="w-6 h-6" />;
    if (level >= 20) return <Trophy className="w-6 h-6" />;
    if (level >= 10) return <Star className="w-6 h-6" />;
    return <Target className="w-6 h-6" />;
  };

  const getChallengeStatus = (challenge) => {
    if (challenge.completed) return "completed";
    if (challenge.active) return "active";
    return "available";
  };

  const getChallengeIcon = (challenge) => {
    switch (challenge.type) {
      case "daily":
        return <Calendar className="w-5 h-5" />;
      case "weekly":
        return <Clock className="w-5 h-5" />;
      case "achievement":
        return <Award className="w-5 h-5" />;
      case "streak":
        return <Fire className="w-5 h-5" />;
      case "learning":
        return <Brain className="w-5 h-5" />;
      case "health":
        return <Heart className="w-5 h-5" />;
      default:
        return <Target className="w-5 h-5" />;
    }
  };

  const getChallengeColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 border-green-200 text-green-800";
      case "active":
        return "bg-blue-100 border-blue-200 text-blue-800";
      default:
        return "bg-gray-100 border-gray-200 text-gray-800";
    }
  };

  // Função para mostrar recompensas
  const handleShowRewards = () => {
    setShowRewards(true);
  };

  // Função para fechar recompensas
  const handleCloseRewards = () => {
    setShowRewards(false);
  };

  // Função para marcar desafio como completo
  const handleCompleteChallenge = (challengeId) => {
    setCompletedChallenges((prev) => [...prev, challengeId]);
    // Atualizar dados
    loadGamificationData();
  };

  // Usar completedChallenges para mostrar progresso
  const completedCount = completedChallenges.length;
  const totalChallenges = activeChallenges.length;
  const progressPercentage =
    totalChallenges > 0 ? (completedCount / totalChallenges) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header e Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Nível do Usuário */}
        <Card className="shadow-lg border-0">
          <CardContent className="p-6 text-center">
            <div
              className={`text-4xl font-bold mb-2 ${getLevelColor(userStats.level)}`}
            >
              {getLevelIcon(userStats.level)}
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Nível {userStats.level}
            </h3>
            <Progress value={getLevelProgress()} className="mb-2" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {userStats.experience} / {userStats.experienceToNext} XP
            </p>
          </CardContent>
        </Card>

        {/* Pontos Totais */}
        <Card className="shadow-lg border-0">
          <CardContent className="p-6 text-center">
            <div className="text-4xl font-bold text-yellow-600 mb-2">
              <Star className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {userStats.totalPoints.toLocaleString()}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Pontos Totais
            </p>
          </CardContent>
        </Card>

        {/* Sequência Atual */}
        <Card className="shadow-lg border-0">
          <CardContent className="p-6 text-center">
            <div className="text-4xl font-bold text-orange-600 mb-2">
              <Fire className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {userStats.streak}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Dias Seguidos
            </p>
          </CardContent>
        </Card>

        {/* Conquistas */}
        <Card className="shadow-lg border-0">
          <CardContent className="p-6 text-center">
            <div className="text-4xl font-bold text-purple-600 mb-2">
              <Award className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {userStats.achievements.length}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Conquistas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Desafios Ativos */}
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-6 h-6 text-blue-600" />
            Desafios Ativos
          </CardTitle>
          <CardDescription>
            Complete desafios para ganhar experiência e pontos
            <br />
            <span className="text-sm font-medium text-blue-600">
              Progresso: {completedCount}/{totalChallenges} completados (
              {Math.round(progressPercentage)}%)
            </span>
          </CardDescription>
          <Button onClick={handleShowRewards} size="sm" variant="outline">
            <Gift className="w-4 h-4 mr-2" />
            Ver Recompensas
          </Button>
        </CardHeader>
        <CardContent>
          {activeChallenges.length === 0 ? (
            <div className="text-center py-8">
              <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Nenhum desafio ativo</p>
              <p className="text-gray-400">
                Complete tarefas para desbloquear novos desafios!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeChallenges.map((challenge) => (
                <Card
                  key={challenge.id}
                  className="border-2 border-blue-200 bg-blue-50"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getChallengeIcon(challenge)}
                        <Badge
                          variant="secondary"
                          className={getChallengeColor(
                            getChallengeStatus(challenge),
                          )}
                        >
                          {challenge.type}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-blue-600">
                          +{challenge.points} XP
                        </p>
                      </div>
                    </div>
                    <CardTitle className="text-lg">{challenge.title}</CardTitle>
                    <CardDescription>{challenge.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span>Progresso:</span>
                        <span className="font-medium">
                          {challenge.current} / {challenge.target}
                        </span>
                      </div>
                      <Progress
                        value={(challenge.current / challenge.target) * 100}
                        className="h-2"
                      />

                      {challenge.current >= challenge.target ? (
                        <Button
                          onClick={() => {
                            completeChallenge(challenge.id);
                            handleCompleteChallenge(challenge.id);
                          }}
                          className="w-full bg-green-600 hover:bg-green-700"
                          disabled={loading}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Completar
                        </Button>
                      ) : (
                        <div className="flex gap-2">
                          <Button
                            onClick={() => startChallenge(challenge.id)}
                            className="flex-1 bg-blue-600 hover:bg-blue-700"
                            disabled={loading}
                          >
                            <Play className="w-4 h-4 mr-2" />
                            Continuar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              /* Implementar pausar */
                            }}
                          >
                            <Pause className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Desafios Disponíveis */}
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-6 h-6 text-yellow-600" />
            Desafios Disponíveis
          </CardTitle>
          <CardDescription>
            Novos desafios para você desbloquear
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userStats.challenges
              .filter((challenge) => !challenge.active && !challenge.completed)
              .slice(0, 6)
              .map((challenge) => (
                <Card key={challenge.id} className="border border-gray-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getChallengeIcon(challenge)}
                        <Badge variant="outline">{challenge.type}</Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-600">
                          +{challenge.points} XP
                        </p>
                      </div>
                    </div>
                    <CardTitle className="text-lg">{challenge.title}</CardTitle>
                    <CardDescription>{challenge.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-sm text-gray-600">
                        <p>Requisito: {challenge.requirement}</p>
                        <p>Prazo: {challenge.deadline}</p>
                      </div>

                      <Button
                        onClick={() => startChallenge(challenge.id)}
                        className="w-full"
                        disabled={loading || !challenge.available}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        {challenge.available ? "Iniciar" : "Bloqueado"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Conquistas */}
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-600" />
            Conquistas
          </CardTitle>
          <CardDescription>Suas conquistas e medalhas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {userStats.achievements.map((achievement) => (
              <Card
                key={achievement.id}
                className="text-center border-2 border-yellow-200 bg-yellow-50"
              >
                <CardContent className="p-4">
                  <div className="text-4xl mb-2">
                    {achievement.icon || "🏆"}
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                    {achievement.name}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {achievement.description}
                  </p>
                  <Badge
                    variant="secondary"
                    className="bg-yellow-200 text-yellow-800"
                  >
                    +{achievement.points} XP
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recompensas */}
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-6 h-6 text-green-600" />
            Recompensas Disponíveis
          </CardTitle>
          <CardDescription>Resgate suas recompensas por pontos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userStats.rewards
              .filter(
                (reward) =>
                  reward.available && userStats.totalPoints >= reward.cost,
              )
              .map((reward) => (
                <Card key={reward.id} className="border border-green-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="text-2xl">{reward.icon || "🎁"}</div>
                      <Badge
                        variant="outline"
                        className="bg-green-100 text-green-800"
                      >
                        {reward.cost} pts
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{reward.name}</CardTitle>
                    <CardDescription>{reward.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={() => claimReward(reward.id)}
                      className="w-full bg-green-600 hover:bg-green-700"
                      disabled={loading}
                    >
                      <Gift className="w-4 h-4 mr-2" />
                      Resgatar
                    </Button>
                  </CardContent>
                </Card>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Ranking e Competição */}
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="w-6 h-6 text-purple-600" />
            Ranking da Semana
          </CardTitle>
          <CardDescription>Compita com outros usuários</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((position) => (
              <div
                key={position}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      position === 1
                        ? "bg-yellow-400 text-yellow-900"
                        : position === 2
                          ? "bg-gray-300 text-gray-700"
                          : "bg-orange-400 text-orange-900"
                    }`}
                  >
                    {position}
                  </div>
                  <div>
                    <p className="font-medium">Usuário {position}</p>
                    <p className="text-sm text-gray-600">
                      Nível {10 + position}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">
                    {1000 - position * 100} pts
                  </p>
                  <p className="text-sm text-gray-600">Esta semana</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Modal de Recompensas */}
      {showRewards && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Suas Recompensas</h3>
              <Button onClick={handleCloseRewards} size="sm" variant="outline">
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-3">
              {gamificationData?.rewards?.map((reward) => (
                <div
                  key={reward.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <Gift className="w-5 h-5 text-yellow-600" />
                    <div>
                      <p className="font-medium">{reward.name}</p>
                      <p className="text-sm text-gray-600">
                        {reward.description}
                      </p>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => claimReward(reward.id)}>
                    Resgatar
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
