import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  Trophy,
  Award,
  Star,
  Crown,
  Diamond,
  Medal,
  Target,
  Zap,
  Flame,
  Activity,
  Heart,
  Users,
  Calendar,
  Clock,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Gift,
  Package,
  ShoppingCart,
  CreditCard,
  Tag,
  Percent,
  DollarSign,
  Calculator,
  FileText,
  Image,
  File,
  Folder,
  Archive,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Grid,
  List,
  RefreshCw,
  ExternalLink,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ChevronLeft,
  MoreHorizontal,
  MoreVertical,
  Menu,
  X as XIcon,
  Plus,
  Minus,
  Edit,
  Trash2,
  Copy,
  Share2,
  MessageCircle,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  Headphones,
  Mic,
  Video,
  Bookmark,
  Flag,
  Bell,
  Settings,
  User,
  Mail,
  Phone,
  MapPin,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Check,
  AlertTriangle,
  Info,
  Download,
  Upload,
  Camera,
  Dumbbell,
  Apple,
  Coffee,
  Utensils,
  Pill,
  Stethoscope,
  Shield,
  Droplets,
  Moon,
  Sun,
  Cloud,
  Wind,
  Snow,
  Umbrella,
  TreePine,
  Mountain,
  Waves,
  Fish,
  Bird,
  Cat,
  Dog,
  Rabbit,
  Car,
  Bike,
  Bus,
  Train,
  Plane,
  Ship,
  Rocket,
  Gamepad2,
  Music,
  Sparkles,
  Gem,
  Coins,
  Banknote,
  Wallet,
} from "lucide-react";

/**
 * Sistema de Gamificação - Componente principal.
 * 
 * @component
 * @param {string} [userId] - ID do usuário (prop opcional, pode ser usado no futuro)
 * @param {Function} [onLevelUp] - Callback ao subir de nível
 * @param {Function} [onAchievementUnlock] - Callback ao desbloquear conquista
 * @param {Function} [onRewardClaim] - Callback ao reivindicar recompensa
 * @param {Function} [onLeaderboardUpdate] - Callback ao atualizar leaderboard
 */
export const GamificationSystem = ({
  userId: _userId, // eslint-disable-line no-unused-vars
  onLevelUp,
  onAchievementUnlock,
  onRewardClaim,
  onLeaderboardUpdate,
}) => {
  const [gamificationData, setGamificationData] = useState({});
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Dados de exemplo do sistema de gamificação
  const defaultGamificationData = useMemo(
    () => ({
      user: {
        id: 1,
        name: "João Silva",
        level: 8,
        experience: 2450,
        nextLevel: 3000,
        totalExperience: 12450,
        rank: 15,
        tier: "gold",
        avatar: "/images/avatar.jpg",
      },
      stats: {
        totalWorkouts: 156,
        totalDuration: 7800,
        totalCalories: 78000,
        currentStreak: 7,
        longestStreak: 45,
        averageWorkoutDuration: 50,
        workoutFrequency: 4.2,
        goalCompletion: 75,
        achievements: 12,
        points: 2450,
        coins: 1250,
        gems: 45,
      },
      achievements: [
        {
          id: 1,
          name: "Primeiro Passo",
          description: "Complete seu primeiro treino",
          icon: Trophy,
          color: "text-yellow-600",
          bgColor: "bg-yellow-50",
          points: 100,
          coins: 50,
          gems: 5,
          unlocked: true,
          unlockedAt: "2023-01-20",
          rarity: "common",
          category: "workout",
        },
        {
          id: 2,
          name: "Maratonista",
          description: "Complete 100 treinos",
          icon: Award,
          color: "text-blue-600",
          bgColor: "bg-blue-50",
          points: 500,
          coins: 250,
          gems: 25,
          unlocked: true,
          unlockedAt: "2023-06-15",
          rarity: "rare",
          category: "workout",
        },
        {
          id: 3,
          name: "Meta Atingida",
          description: "Atinga sua primeira meta de peso",
          icon: Target,
          color: "text-green-600",
          bgColor: "bg-green-50",
          points: 300,
          coins: 150,
          gems: 15,
          unlocked: true,
          unlockedAt: "2023-09-10",
          rarity: "uncommon",
          category: "goal",
        },
        {
          id: 4,
          name: "Lenda",
          description: "Complete 1000 treinos",
          icon: Crown,
          color: "text-purple-600",
          bgColor: "bg-purple-50",
          points: 1000,
          coins: 500,
          gems: 50,
          unlocked: false,
          unlockedAt: null,
          rarity: "legendary",
          category: "workout",
          progress: 156,
          target: 1000,
        },
        {
          id: 5,
          name: "Força Pura",
          description: "Levante 10.000 kg em uma sessão",
          icon: Dumbbell,
          color: "text-red-600",
          bgColor: "bg-red-50",
          points: 400,
          coins: 200,
          gems: 20,
          unlocked: false,
          unlockedAt: null,
          rarity: "epic",
          category: "strength",
          progress: 7500,
          target: 10000,
        },
        {
          id: 6,
          name: "Queimador de Calorias",
          description: "Queime 100.000 calorias",
          icon: Flame,
          color: "text-orange-600",
          bgColor: "bg-orange-50",
          points: 600,
          coins: 300,
          gems: 30,
          unlocked: false,
          unlockedAt: null,
          rarity: "epic",
          category: "cardio",
          progress: 78000,
          target: 100000,
        },
      ],
      challenges: [
        {
          id: 1,
          name: "Desafio Semanal",
          description: "Complete 5 treinos esta semana",
          icon: Calendar,
          color: "text-blue-600",
          bgColor: "bg-blue-50",
          points: 200,
          coins: 100,
          gems: 10,
          startDate: "2024-01-22",
          endDate: "2024-01-28",
          progress: 3,
          target: 5,
          completed: false,
          category: "weekly",
        },
        {
          id: 2,
          name: "Desafio de Força",
          description: "Faça 3 treinos de força esta semana",
          icon: Dumbbell,
          color: "text-red-600",
          bgColor: "bg-red-50",
          points: 150,
          coins: 75,
          gems: 8,
          startDate: "2024-01-22",
          endDate: "2024-01-28",
          progress: 2,
          target: 3,
          completed: false,
          category: "strength",
        },
        {
          id: 3,
          name: "Desafio de Resistência",
          description: "Complete 2 treinos de cardio",
          icon: Heart,
          color: "text-pink-600",
          bgColor: "bg-pink-50",
          points: 100,
          coins: 50,
          gems: 5,
          startDate: "2024-01-22",
          endDate: "2024-01-28",
          progress: 1,
          target: 2,
          completed: false,
          category: "cardio",
        },
      ],
      rewards: [
        {
          id: 1,
          name: "Cupom de Desconto",
          description: "10% de desconto em suplementos",
          icon: Tag,
          color: "text-green-600",
          bgColor: "bg-green-50",
          cost: 100,
          currency: "coins",
          available: true,
          category: "discount",
        },
        {
          id: 2,
          name: "Frete Grátis",
          description: "Frete grátis no próximo pedido",
          icon: Package,
          color: "text-blue-600",
          bgColor: "bg-blue-50",
          cost: 200,
          currency: "coins",
          available: true,
          category: "shipping",
        },
        {
          id: 3,
          name: "Produto Grátis",
          description: "Amostra grátis de Whey Protein",
          icon: Gift,
          color: "text-purple-600",
          bgColor: "bg-purple-50",
          cost: 50,
          currency: "gems",
          available: true,
          category: "product",
        },
        {
          id: 4,
          name: "Avatar Exclusivo",
          description: "Avatar dourado exclusivo",
          icon: Crown,
          color: "text-yellow-600",
          bgColor: "bg-yellow-50",
          cost: 100,
          currency: "gems",
          available: true,
          category: "avatar",
        },
      ],
      leaderboard: [
        {
          id: 1,
          name: "Maria Santos",
          level: 12,
          experience: 4500,
          avatar: "/images/avatar-maria.jpg",
          tier: "platinum",
          rank: 1,
          stats: {
            workouts: 245,
            streak: 28,
            points: 4500,
          },
        },
        {
          id: 2,
          name: "Pedro Costa",
          level: 11,
          experience: 4200,
          avatar: "/images/avatar-pedro.jpg",
          tier: "gold",
          rank: 2,
          stats: {
            workouts: 230,
            streak: 21,
            points: 4200,
          },
        },
        {
          id: 3,
          name: "Ana Silva",
          level: 10,
          experience: 3800,
          avatar: "/images/avatar-ana.jpg",
          tier: "gold",
          rank: 3,
          stats: {
            workouts: 215,
            streak: 18,
            points: 3800,
          },
        },
        {
          id: 4,
          name: "Carlos Lima",
          level: 9,
          experience: 3200,
          avatar: "/images/avatar-carlos.jpg",
          tier: "gold",
          rank: 4,
          stats: {
            workouts: 198,
            streak: 15,
            points: 3200,
          },
        },
        {
          id: 5,
          name: "Julia Oliveira",
          level: 9,
          experience: 3100,
          avatar: "/images/avatar-julia.jpg",
          tier: "gold",
          rank: 5,
          stats: {
            workouts: 185,
            streak: 12,
            points: 3100,
          },
        },
      ],
      quests: [
        {
          id: 1,
          name: "Missão Diária",
          description: "Complete um treino hoje",
          icon: Activity,
          color: "text-green-600",
          bgColor: "bg-green-50",
          points: 50,
          coins: 25,
          gems: 2,
          progress: 1,
          target: 1,
          completed: true,
          category: "daily",
          expiresAt: "2024-01-29T23:59:59Z",
        },
        {
          id: 2,
          name: "Missão Semanal",
          description: "Complete 7 treinos esta semana",
          icon: Calendar,
          color: "text-blue-600",
          bgColor: "bg-blue-50",
          points: 300,
          coins: 150,
          gems: 15,
          progress: 4,
          target: 7,
          completed: false,
          category: "weekly",
          expiresAt: "2024-02-04T23:59:59Z",
        },
        {
          id: 3,
          name: "Missão Mensal",
          description: "Complete 30 treinos este mês",
          icon: Target,
          color: "text-purple-600",
          bgColor: "bg-purple-50",
          points: 1000,
          coins: 500,
          gems: 50,
          progress: 18,
          target: 30,
          completed: false,
          category: "monthly",
          expiresAt: "2024-02-29T23:59:59Z",
        },
      ],
      levels: [
        {
          level: 1,
          experience: 0,
          title: "Iniciante",
          color: "text-gray-600",
          icon: Star,
        },
        {
          level: 2,
          experience: 100,
          title: "Novato",
          color: "text-green-600",
          icon: Star,
        },
        {
          level: 3,
          experience: 250,
          title: "Aprendiz",
          color: "text-blue-600",
          icon: Star,
        },
        {
          level: 4,
          experience: 500,
          title: "Intermediário",
          color: "text-purple-600",
          icon: Award,
        },
        {
          level: 5,
          experience: 750,
          title: "Avançado",
          color: "text-orange-600",
          icon: Award,
        },
        {
          level: 6,
          experience: 1000,
          title: "Experiente",
          color: "text-red-600",
          icon: Award,
        },
        {
          level: 7,
          experience: 1500,
          title: "Expert",
          color: "text-yellow-600",
          icon: Trophy,
        },
        {
          level: 8,
          experience: 2000,
          title: "Mestre",
          color: "text-yellow-600",
          icon: Trophy,
        },
        {
          level: 9,
          experience: 2500,
          title: "Lenda",
          color: "text-purple-600",
          icon: Crown,
        },
        {
          level: 10,
          experience: 3000,
          title: "Ícone",
          color: "text-purple-600",
          icon: Diamond,
        },
      ],
    }),
    [],
  );

  const loadGamificationData = useCallback(async () => {
    setLoading(true);

    try {
      // Simular carregamento de API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setGamificationData(defaultGamificationData);
    } catch (error) {
      console.error("Erro ao carregar dados de gamificação:", error);
    } finally {
      setLoading(false);
    }
  }, [defaultGamificationData]);

  useEffect(() => {
    loadGamificationData();
  }, [loadGamificationData]);

  const handleLevelUp = () => {
    if (onLevelUp) {
      onLevelUp(gamificationData.user);
    }
  };

  const handleAchievementUnlock = (achievement) => {
    if (onAchievementUnlock) {
      onAchievementUnlock(achievement);
    }
  };

  const handleRewardClaim = (reward) => {
    if (onRewardClaim) {
      onRewardClaim(reward);
    }
  };

  const handleLeaderboardUpdate = () => {
    if (onLeaderboardUpdate) {
      onLeaderboardUpdate();
    }
  };

  const getTierIcon = (tier) => {
    switch (tier) {
      case "bronze":
        return Medal;
      case "silver":
        return Award;
      case "gold":
        return Crown;
      case "platinum":
        return Diamond;
      default:
        return Star;
    }
  };

  const getTierColor = (tier) => {
    switch (tier) {
      case "bronze":
        return "text-orange-600";
      case "silver":
        return "text-gray-600";
      case "gold":
        return "text-yellow-600";
      case "platinum":
        return "text-purple-600";
      default:
        return "text-gray-600";
    }
  };

  const getTierBgColor = (tier) => {
    switch (tier) {
      case "bronze":
        return "bg-orange-50";
      case "silver":
        return "bg-gray-50";
      case "gold":
        return "bg-yellow-50";
      case "platinum":
        return "bg-purple-50";
      default:
        return "bg-gray-50";
    }
  };

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case "common":
        return "text-gray-600";
      case "uncommon":
        return "text-green-600";
      case "rare":
        return "text-blue-600";
      case "epic":
        return "text-purple-600";
      case "legendary":
        return "text-yellow-600";
      default:
        return "text-gray-600";
    }
  };

  const getRarityBgColor = (rarity) => {
    switch (rarity) {
      case "common":
        return "bg-gray-50";
      case "uncommon":
        return "bg-green-50";
      case "rare":
        return "bg-blue-50";
      case "epic":
        return "bg-purple-50";
      case "legendary":
        return "bg-yellow-50";
      default:
        return "bg-gray-50";
    }
  };

  const getProgressPercentage = (current, target) => {
    return Math.min((current / target) * 100, 100);
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Status do Usuário */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Crown className="w-6 h-6 text-yellow-600" />
            <span>Seu Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-white">
                  {gamificationData.user?.level}
                </span>
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-white">
                  #{gamificationData.user?.rank}
                </span>
              </div>
            </div>

            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {gamificationData.user?.name}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Nível {gamificationData.user?.level} •{" "}
                {gamificationData.user?.tier?.toUpperCase()}
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={handleLevelUp}
                className="mt-2"
              >
                Level Up
              </Button>

              <div className="mt-3">
                <div className="flex justify-between text-sm mb-1">
                  <span>Experiência</span>
                  <span>
                    {gamificationData.user?.experience} /{" "}
                    {gamificationData.user?.nextLevel}
                  </span>
                </div>
                <Progress
                  value={getProgressPercentage(
                    gamificationData.user?.experience,
                    gamificationData.user?.nextLevel,
                  )}
                  className="h-2"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Coins className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {gamificationData.stats?.coins}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Moedas
              </div>
            </div>

            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Gem className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {gamificationData.stats?.gems}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Gemas
              </div>
            </div>

            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Star className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {gamificationData.stats?.points}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Pontos
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Missões Ativas */}
      <Card>
        <CardHeader>
          <CardTitle>Missões Ativas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {gamificationData.quests?.map((quest) => {
              const IconComponent = quest.icon;
              return (
                <div key={quest.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <IconComponent className={`w-6 h-6 ${quest.color}`} />
                      <div>
                        <h3 className="font-semibold">{quest.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {quest.description}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center space-x-2">
                        <Coins className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm font-medium">
                          {quest.coins}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Gem className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-medium">
                          {quest.gems}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progresso</span>
                      <span>
                        {quest.progress} / {quest.target}
                      </span>
                    </div>
                    <Progress
                      value={getProgressPercentage(
                        quest.progress,
                        quest.target,
                      )}
                      className="h-2"
                    />
                  </div>

                  {quest.completed && (
                    <div className="mt-3 flex items-center space-x-2 text-green-600">
                      <Check className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        Missão Concluída!
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Desafios */}
      <Card>
        <CardHeader>
          <CardTitle>Desafios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {gamificationData.challenges?.map((challenge) => {
              const IconComponent = challenge.icon;
              return (
                <div key={challenge.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <IconComponent className={`w-6 h-6 ${challenge.color}`} />
                      <div>
                        <h3 className="font-semibold">{challenge.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {challenge.description}
                        </p>
                      </div>
                    </div>

                    <Badge variant="outline" className="text-xs">
                      {challenge.category}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progresso</span>
                      <span>
                        {challenge.progress} / {challenge.target}
                      </span>
                    </div>
                    <Progress
                      value={getProgressPercentage(
                        challenge.progress,
                        challenge.target,
                      )}
                      className="h-2"
                    />
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center space-x-1">
                        <Coins className="w-4 h-4 text-yellow-600" />
                        <span>{challenge.coins}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Gem className="w-4 h-4 text-purple-600" />
                        <span>{challenge.gems}</span>
                      </div>
                    </div>

                    <div className="text-xs text-gray-500">
                      Expira em{" "}
                      {new Date(challenge.endDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAchievements = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {gamificationData.achievements?.map((achievement) => {
          const IconComponent = achievement.icon;
          return (
            <Card
              key={achievement.id}
              className={`${achievement.unlocked ? "ring-2 ring-green-500" : "opacity-60"}`}
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className={`p-2 ${achievement.bgColor} rounded-lg`}>
                    <IconComponent className={`w-6 h-6 ${achievement.color}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{achievement.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {achievement.description}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAchievementUnlock(achievement)}
                      className="mt-2"
                    >
                      Desbloquear
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Raridade</span>
                    <Badge
                      variant="outline"
                      className={`text-xs ${getRarityColor(achievement.rarity)}`}
                    >
                      {achievement.rarity}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span>Recompensa</span>
                    <div className="flex items-center space-x-2">
                      <Coins className="w-4 h-4 text-yellow-600" />
                      <span>{achievement.coins}</span>
                      <Gem className="w-4 h-4 text-purple-600" />
                      <span>{achievement.gems}</span>
                    </div>
                  </div>

                  {!achievement.unlocked &&
                    achievement.progress !== undefined && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Progresso</span>
                          <span>
                            {achievement.progress} / {achievement.target}
                          </span>
                        </div>
                        <Progress
                          value={getProgressPercentage(
                            achievement.progress,
                            achievement.target,
                          )}
                          className="h-2"
                        />
                      </div>
                    )}

                  {achievement.unlocked && (
                    <div className="flex items-center space-x-2 text-green-600">
                      <Check className="w-4 h-4" />
                      <span className="text-sm font-medium">Desbloqueado!</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );

  const renderRewards = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {gamificationData.rewards?.map((reward) => {
          const IconComponent = reward.icon;
          return (
            <Card key={reward.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div
                    className={`p-2 ${getRarityBgColor(reward.rarity)} rounded-lg`}
                  >
                    <IconComponent className={`w-6 h-6 ${reward.color}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{reward.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {reward.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {reward.currency === "coins" ? (
                      <>
                        <Coins className="w-5 h-5 text-yellow-600" />
                        <span className="font-semibold">{reward.cost}</span>
                      </>
                    ) : (
                      <>
                        <Gem className="w-5 h-5 text-purple-600" />
                        <span className="font-semibold">{reward.cost}</span>
                      </>
                    )}
                  </div>

                  <Button
                    size="sm"
                    disabled={!reward.available}
                    onClick={() => handleRewardClaim(reward)}
                  >
                    Resgatar
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );

  const renderLeaderboard = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Ranking Global</CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={handleLeaderboardUpdate}
            >
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {gamificationData.leaderboard?.map((player, index) => {
              const TierIcon = getTierIcon(player.tier);
              return (
                <div
                  key={player.id}
                  className={`flex items-center space-x-4 p-4 border rounded-lg ${getTierBgColor(player.tier)}`}
                >
                  <div className="flex items-center justify-center w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full">
                    <span className="font-bold text-sm">#{index + 1}</span>
                  </div>

                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-lg font-bold text-white">
                      {player.name.charAt(0)}
                    </span>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold">{player.name}</h3>
                      <TierIcon
                        className={`w-4 h-4 ${getTierColor(player.tier)}`}
                      />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Nível {player.level} • {player.experience} XP
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-semibold">
                      {player.stats.workouts} treinos
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {player.stats.streak} dias seguidos
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const tabs = [
    { id: "overview", label: "Visão Geral", icon: BarChart3 },
    { id: "achievements", label: "Conquistas", icon: Trophy },
    { id: "rewards", label: "Recompensas", icon: Gift },
    { id: "leaderboard", label: "Ranking", icon: Crown },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Carregando sistema de gamificação...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Trophy className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Sistema de Gamificação
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Complete desafios, desbloqueie conquistas e suba de nível
              </p>
            </div>
          </div>

          <Button variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg mb-6">
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
              </button>
            );
          })}
        </div>

        {/* Content */}
        {activeTab === "overview" && renderOverview()}
        {activeTab === "achievements" && renderAchievements()}
        {activeTab === "rewards" && renderRewards()}
        {activeTab === "leaderboard" && renderLeaderboard()}
      </div>
    </div>
  );
};
