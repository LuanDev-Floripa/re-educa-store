/**
 * PersonalizedDashboard Component - RE-EDUCA Store
 * 
 * Dashboard altamente personalizado com múltiplos widgets e layouts.
 * 
 * Funcionalidades:
 * - Widgets personalizáveis (métricas, gráficos, etc.)
 * - Drag and drop para reorganizar
 * - Temas e cores personalizáveis
 * - Múltiplos tipos de visualizações
 * 
 * @component
 * @returns {JSX.Element} Dashboard personalizado completo
 */
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
  Activity,
  Heart,
  Target,
  Trophy,
  Award,
  Star,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Calendar,
  Clock,
  Flame,
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
  Package,
  ShoppingCart,
  CreditCard,
  Gift,
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
  Users,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  Headphones,
  Mic,
  Video,
  Bookmark,
  Flag,
  Zap,
  Crown,
  Diamond,
  Medal,
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
  Zap as ZapIcon,
  Target as TargetIcon,
  Activity as ActivityIcon,
  Heart as HeartIcon,
  Trophy as TrophyIcon,
  Award as AwardIcon,
  Star as StarIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  BarChart3 as BarChart3Icon,
  PieChart as PieChartIcon,
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  Flame as FlameIcon,
  Droplets as DropletsIcon,
  Moon as MoonIcon,
  Sun as SunIcon,
  Cloud as CloudIcon,
  Wind as WindIcon,
  Snow as SnowIcon,
  Umbrella as UmbrellaIcon,
  TreePine as TreePineIcon,
  Mountain as MountainIcon,
  Waves as WavesIcon,
  Fish as FishIcon,
  Bird as BirdIcon,
  Cat as CatIcon,
  Dog as DogIcon,
  Rabbit as RabbitIcon,
  Car as CarIcon,
  Bike as BikeIcon,
  Bus as BusIcon,
  Train as TrainIcon,
  Plane as PlaneIcon,
  Ship as ShipIcon,
  Rocket as RocketIcon,
  Gamepad2 as Gamepad2Icon,
  Music as MusicIcon,
  Package as PackageIcon,
  ShoppingCart as ShoppingCartIcon,
  CreditCard as CreditCardIcon,
  Gift as GiftIcon,
  Tag as TagIcon,
  Percent as PercentIcon,
  DollarSign as DollarSignIcon,
  Calculator as CalculatorIcon,
  FileText as FileTextIcon,
  Image as ImageIcon,
  File as FileIcon,
  Folder as FolderIcon,
  Archive as ArchiveIcon,
  Search as SearchIcon,
  Filter as FilterIcon,
  SortAsc as SortAscIcon,
  SortDesc as SortDescIcon,
  Grid as GridIcon,
  List as ListIcon,
  RefreshCw as RefreshCwIcon,
  ExternalLink as ExternalLinkIcon,
  ArrowRight as ArrowRightIcon,
  ArrowLeft as ArrowLeftIcon,
  ChevronDown as ChevronDownIcon,
  ChevronUp as ChevronUpIcon,
  ChevronRight as ChevronRightIcon,
  ChevronLeft as ChevronLeftIcon,
  MoreHorizontal as MoreHorizontalIcon,
  MoreVertical as MoreVerticalIcon,
  Menu as MenuIcon,
  X as XIconIcon,
  Plus as PlusIcon,
  Minus as MinusIcon,
  Edit as EditIcon,
  Trash2 as Trash2Icon,
  Copy as CopyIcon,
  Share2 as Share2Icon,
  MessageCircle as MessageCircleIcon,
  Users as UsersIcon,
  Globe as GlobeIcon,
  Smartphone as SmartphoneIcon,
  Monitor as MonitorIcon,
  Tablet as TabletIcon,
  Headphones as HeadphonesIcon,
  Mic as MicIcon,
  Video as VideoIcon,
  Bookmark as BookmarkIcon,
  Flag as FlagIcon,
  Zap as ZapIconIcon,
  Crown as CrownIcon,
  Diamond as DiamondIcon,
  Medal as MedalIcon,
  Bell as BellIcon,
  Settings as SettingsIcon,
  User as UserIcon,
  Mail as MailIcon,
  Phone as PhoneIcon,
  MapPin as MapPinIcon,
  Eye as EyeIcon,
  EyeOff as EyeOffIcon,
  Lock as LockIcon,
  Unlock as UnlockIcon,
  Check as CheckIcon,
  AlertTriangle as AlertTriangleIcon,
  Info as InfoIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Camera as CameraIcon,
  Dumbbell as DumbbellIcon,
  Apple as AppleIcon,
  Coffee as CoffeeIcon,
  Utensils as UtensilsIcon,
  Pill as PillIcon,
  Stethoscope as StethoscopeIcon,
  Shield as ShieldIcon,
} from "lucide-react";

export const PersonalizedDashboard = ({
  userProfile = {},
  onWidgetUpdate,
  onLayoutChange,
  showCustomization = true,
}) => {
  const [dashboardData, setDashboardData] = useState({});
  const [widgets, setWidgets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);

  // Dados de exemplo do dashboard
  const defaultDashboardData = useMemo(
    () => ({
      user: {
        name: "João Silva",
        avatar: "/images/avatar.jpg",
        tier: "gold",
        level: 8,
        experience: 2450,
        nextLevel: 3000,
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
      },
      today: {
        workouts: 1,
        duration: 60,
        calories: 450,
        steps: 8500,
        water: 2.2,
        sleep: 7.5,
        mood: 8,
      },
      goals: [
        {
          id: 1,
          name: "Perda de Peso",
          target: 70,
          current: 75,
          unit: "kg",
          progress: 75,
          deadline: "2024-06-01",
        },
        {
          id: 2,
          name: "Ganho de Massa",
          target: 70,
          current: 65,
          unit: "kg",
          progress: 65,
          deadline: "2024-12-01",
        },
        {
          id: 3,
          name: "Redução de Gordura",
          target: 12,
          current: 15,
          unit: "%",
          progress: 80,
          deadline: "2024-08-01",
        },
      ],
      recentWorkouts: [
        {
          id: 1,
          name: "Treino de Força",
          date: "2024-01-28",
          duration: 60,
          exercises: 8,
          calories: 450,
          type: "strength",
        },
        {
          id: 2,
          name: "Cardio HIIT",
          date: "2024-01-27",
          duration: 30,
          exercises: 5,
          calories: 300,
          type: "cardio",
        },
        {
          id: 3,
          name: "Yoga",
          date: "2024-01-26",
          duration: 45,
          exercises: 12,
          calories: 200,
          type: "flexibility",
        },
      ],
      achievements: [
        {
          id: 1,
          name: "Primeiro Treino",
          date: "2023-01-20",
          icon: Trophy,
          color: "text-yellow-600",
        },
        {
          id: 2,
          name: "100 Treinos",
          date: "2023-06-15",
          icon: Award,
          color: "text-blue-600",
        },
        {
          id: 3,
          name: "Meta de Peso",
          date: "2023-09-10",
          icon: Target,
          color: "text-green-600",
        },
      ],
      recommendations: [
        {
          id: 1,
          name: "Whey Protein Premium",
          type: "product",
          reason: "Baseado no seu objetivo de ganho de massa",
          confidence: 95,
        },
        {
          id: 2,
          name: "Supino Reto",
          type: "exercise",
          reason: "Perfeito para seu nível intermediário",
          confidence: 88,
        },
        {
          id: 3,
          name: "Ganho de Massa Avançado",
          type: "workout_plan",
          reason: "Alinhado com seus objetivos",
          confidence: 90,
        },
      ],
      weather: {
        temperature: 25,
        condition: "sunny",
        humidity: 60,
        windSpeed: 15,
      },
      nutrition: {
        today: {
          calories: 2200,
          protein: 150,
          carbs: 200,
          fat: 80,
          water: 2.5,
        },
        goals: {
          calories: 2500,
          protein: 180,
          carbs: 250,
          fat: 90,
          water: 3.0,
        },
      },
      health: {
        bmr: 1800,
        tdee: 2400,
        bodyFat: 15,
        muscleMass: 65,
        hydration: 85,
        sleep: 7.5,
        stress: 3,
        energy: 8,
      },
    }),
    [],
  );

  const defaultWidgets = useMemo(
    () => [
      {
        id: "welcome",
        type: "welcome",
        title: "Bem-vindo",
        size: "large",
        position: { x: 0, y: 0 },
        visible: true,
        data: {},
      },
      {
        id: "stats",
        type: "stats",
        title: "Estatísticas",
        size: "medium",
        position: { x: 0, y: 1 },
        visible: true,
        data: {},
      },
      {
        id: "goals",
        type: "goals",
        title: "Objetivos",
        size: "medium",
        position: { x: 1, y: 1 },
        visible: true,
        data: {},
      },
      {
        id: "recent_workouts",
        type: "recent_workouts",
        title: "Treinos Recentes",
        size: "large",
        position: { x: 0, y: 2 },
        visible: true,
        data: {},
      },
      {
        id: "achievements",
        type: "achievements",
        title: "Conquistas",
        size: "small",
        position: { x: 1, y: 2 },
        visible: true,
        data: {},
      },
      {
        id: "recommendations",
        type: "recommendations",
        title: "Recomendações",
        size: "medium",
        position: { x: 2, y: 2 },
        visible: true,
        data: {},
      },
      {
        id: "nutrition",
        type: "nutrition",
        title: "Nutrição",
        size: "medium",
        position: { x: 0, y: 3 },
        visible: true,
        data: {},
      },
      {
        id: "health",
        type: "health",
        title: "Saúde",
        size: "medium",
        position: { x: 1, y: 3 },
        visible: true,
        data: {},
      },
      {
        id: "weather",
        type: "weather",
        title: "Clima",
        size: "small",
        position: { x: 2, y: 3 },
        visible: true,
        data: {},
      },
    ],
    [],
  );

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);

    try {
      // Simular carregamento de API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setDashboardData(defaultDashboardData);
      setWidgets(defaultWidgets);
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
    } finally {
      setLoading(false);
    }
  }, [defaultDashboardData, defaultWidgets]);

  const handleWidgetUpdate = (widgetId, updates) => {
    setWidgets((prev) =>
      prev.map((widget) =>
        widget.id === widgetId ? { ...widget, ...updates } : widget,
      ),
    );

    if (onWidgetUpdate) {
      onWidgetUpdate(widgetId, updates);
    }
  };

  const handleLayoutChange = (newLayout) => {
    setWidgets(newLayout);

    if (onLayoutChange) {
      onLayoutChange(newLayout);
    }
  };

  const getWidgetIcon = (type) => {
    switch (type) {
      case "welcome":
        return User;
      case "stats":
        return BarChart3;
      case "goals":
        return Target;
      case "recent_workouts":
        return Activity;
      case "achievements":
        return Trophy;
      case "recommendations":
        return Star;
      case "nutrition":
        return Apple;
      case "health":
        return Heart;
      case "weather":
        return Sun;
      default:
        return Grid;
    }
  };

  const getWidgetColor = (type) => {
    switch (type) {
      case "welcome":
        return "text-blue-600 dark:text-blue-400";
      case "stats":
        return "text-green-600 dark:text-green-400";
      case "goals":
        return "text-purple-600 dark:text-purple-400";
      case "recent_workouts":
        return "text-orange-600 dark:text-orange-400";
      case "achievements":
        return "text-yellow-600 dark:text-yellow-400";
      case "recommendations":
        return "text-pink-600 dark:text-pink-400";
      case "nutrition":
        return "text-red-600 dark:text-red-400";
      case "health":
        return "text-cyan-600 dark:text-cyan-400";
      case "weather":
        return "text-indigo-600 dark:text-indigo-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const getWidgetBgColor = (type) => {
    switch (type) {
      case "welcome":
        return "bg-blue-50 dark:bg-blue-900/20";
      case "stats":
        return "bg-green-50 dark:bg-green-900/20";
      case "goals":
        return "bg-purple-50 dark:bg-purple-900/20";
      case "recent_workouts":
        return "bg-orange-50 dark:bg-orange-900/20";
      case "achievements":
        return "bg-yellow-50 dark:bg-yellow-900/20";
      case "recommendations":
        return "bg-pink-50 dark:bg-pink-900/20";
      case "nutrition":
        return "bg-red-50 dark:bg-red-900/20";
      case "health":
        return "bg-cyan-50 dark:bg-cyan-900/20";
      case "weather":
        return "bg-indigo-50 dark:bg-indigo-900/20";
      default:
        return "bg-gray-50 dark:bg-gray-800/50";
    }
  };

  const renderWelcomeWidget = () => (
    <Card className={`h-full ${getWidgetBgColor("welcome")}`}>
      <CardContent className="p-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Olá, {userProfile.name || dashboardData.user?.name || "Usuário"}!
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Pronto para mais um dia de conquistas?
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {dashboardData.today?.workouts || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Treinos Hoje
            </div>
          </div>

          <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {dashboardData.today?.calories || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Calorias Queimadas
            </div>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progresso do Nível</span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {dashboardData.user?.experience} / {dashboardData.user?.nextLevel}
            </span>
          </div>
          <Progress
            value={
              (dashboardData.user?.experience / dashboardData.user?.nextLevel) *
              100
            }
            className="h-2"
          />
        </div>
      </CardContent>
    </Card>
  );

  const renderStatsWidget = () => (
    <Card className={`h-full ${getWidgetBgColor("stats")}`}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <BarChart3 className="w-5 h-5 text-green-600" />
          <span>Estatísticas</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-blue-600" />
              <span className="text-sm">Treinos Totais</span>
            </div>
            <span className="font-semibold">
              {dashboardData.stats?.totalWorkouts}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-green-600" />
              <span className="text-sm">Tempo Total</span>
            </div>
            <span className="font-semibold">
              {Math.round(dashboardData.stats?.totalDuration / 60)}h
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Flame className="w-4 h-4 text-red-600" />
              <span className="text-sm">Calorias</span>
            </div>
            <span className="font-semibold">
              {dashboardData.stats?.totalCalories.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Trophy className="w-4 h-4 text-yellow-600" />
              <span className="text-sm">Sequência</span>
            </div>
            <span className="font-semibold">
              {dashboardData.stats?.currentStreak} dias
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderGoalsWidget = () => (
    <Card className={`h-full ${getWidgetBgColor("goals")}`}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Target className="w-5 h-5 text-purple-600" />
          <span>Objetivos</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {dashboardData.goals?.map((goal) => (
            <div key={goal.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{goal.name}</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {goal.current} / {goal.target} {goal.unit}
                </span>
              </div>
              <Progress value={goal.progress} className="h-2" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const renderRecentWorkoutsWidget = () => (
    <Card className={`h-full ${getWidgetBgColor("recent_workouts")}`}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Activity className="w-5 h-5 text-orange-600" />
          <span>Treinos Recentes</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {dashboardData.recentWorkouts?.map((workout) => (
            <div
              key={workout.id}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div>
                <h3 className="font-semibold">{workout.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {workout.exercises} exercícios • {workout.duration} min
                </p>
              </div>
              <div className="text-right">
                <div className="font-semibold text-green-600">
                  {workout.calories} cal
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date(workout.date).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const renderAchievementsWidget = () => (
    <Card className={`h-full ${getWidgetBgColor("achievements")}`}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Trophy className="w-5 h-5 text-yellow-600" />
          <span>Conquistas</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {dashboardData.achievements?.map((achievement) => {
            const IconComponent = achievement.icon;
            return (
              <div key={achievement.id} className="flex items-center space-x-3">
                <IconComponent className={`w-6 h-6 ${achievement.color}`} />
                <div>
                  <h3 className="font-semibold text-sm">{achievement.name}</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {new Date(achievement.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );

  const renderRecommendationsWidget = () => (
    <Card className={`h-full ${getWidgetBgColor("recommendations")}`}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Star className="w-5 h-5 text-pink-600" />
          <span>Recomendações</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {dashboardData.recommendations?.map((rec) => (
            <div key={rec.id} className="p-3 border rounded-lg">
              <h3 className="font-semibold text-sm">{rec.name}</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                {rec.reason}
              </p>
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs">
                  {rec.type === "product"
                    ? "Produto"
                    : rec.type === "exercise"
                      ? "Exercício"
                      : "Plano"}
                </Badge>
                <span className="text-xs text-green-600">
                  {rec.confidence}% confiança
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const renderNutritionWidget = () => (
    <Card className={`h-full ${getWidgetBgColor("nutrition")}`}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Apple className="w-5 h-5 text-red-600" />
          <span>Nutrição</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">Calorias</span>
            <span className="font-semibold">
              {dashboardData.nutrition?.today?.calories} /{" "}
              {dashboardData.nutrition?.goals?.calories}
            </span>
          </div>
          <Progress
            value={
              (dashboardData.nutrition?.today?.calories /
                dashboardData.nutrition?.goals?.calories) *
              100
            }
            className="h-2"
          />

          <div className="flex items-center justify-between">
            <span className="text-sm">Proteína</span>
            <span className="font-semibold">
              {dashboardData.nutrition?.today?.protein}g /{" "}
              {dashboardData.nutrition?.goals?.protein}g
            </span>
          </div>
          <Progress
            value={
              (dashboardData.nutrition?.today?.protein /
                dashboardData.nutrition?.goals?.protein) *
              100
            }
            className="h-2"
          />

          <div className="flex items-center justify-between">
            <span className="text-sm">Água</span>
            <span className="font-semibold">
              {dashboardData.nutrition?.today?.water}L /{" "}
              {dashboardData.nutrition?.goals?.water}L
            </span>
          </div>
          <Progress
            value={
              (dashboardData.nutrition?.today?.water /
                dashboardData.nutrition?.goals?.water) *
              100
            }
            className="h-2"
          />
        </div>
      </CardContent>
    </Card>
  );

  const renderHealthWidget = () => (
    <Card className={`h-full ${getWidgetBgColor("health")}`}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Heart className="w-5 h-5 text-cyan-600" />
          <span>Saúde</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">BMR</span>
            <span className="font-semibold">
              {dashboardData.health?.bmr} kcal
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">TDEE</span>
            <span className="font-semibold">
              {dashboardData.health?.tdee} kcal
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">Gordura Corporal</span>
            <span className="font-semibold">
              {dashboardData.health?.bodyFat}%
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">Massa Muscular</span>
            <span className="font-semibold">
              {dashboardData.health?.muscleMass} kg
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderWeatherWidget = () => (
    <Card className={`h-full ${getWidgetBgColor("weather")}`}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Sun className="w-5 h-5 text-indigo-600" />
          <span>Clima</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center">
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {dashboardData.weather?.temperature}°C
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Ensolarado
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Umidade</span>
              <span>{dashboardData.weather?.humidity}%</span>
            </div>
            <div className="flex justify-between">
              <span>Vento</span>
              <span>{dashboardData.weather?.windSpeed} km/h</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderWidget = (widget) => {
    switch (widget.type) {
      case "welcome":
        return renderWelcomeWidget();
      case "stats":
        return renderStatsWidget();
      case "goals":
        return renderGoalsWidget();
      case "recent_workouts":
        return renderRecentWorkoutsWidget();
      case "achievements":
        return renderAchievementsWidget();
      case "recommendations":
        return renderRecommendationsWidget();
      case "nutrition":
        return renderNutritionWidget();
      case "health":
        return renderHealthWidget();
      case "weather":
        return renderWeatherWidget();
      default:
        return null;
    }
  };

  const getWidgetSize = (size) => {
    switch (size) {
      case "small":
        return "col-span-1 row-span-1";
      case "medium":
        return "col-span-1 row-span-2";
      case "large":
        return "col-span-2 row-span-2";
      default:
        return "col-span-1 row-span-1";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Carregando dashboard...
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
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Sua visão geral personalizada
            </p>
          </div>

          <div className="flex space-x-2">
            {showCustomization && (
              <Button
                variant="outline"
                onClick={() => {
                  setEditing(!editing);
                  if (editing) {
                    handleLayoutChange(widgets);
                  }
                }}
              >
                <Edit className="w-4 h-4 mr-2" />
                {editing ? "Salvar" : "Personalizar"}
              </Button>
            )}

            <Button variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {widgets
            .filter((widget) => widget.visible)
            .map((widget) => (
              <div
                key={widget.id}
                className={`${getWidgetSize(widget.size)} ${editing ? "ring-2 ring-blue-500" : ""}`}
              >
                {renderWidget(widget)}
              </div>
            ))}
        </div>

        {/* Widget Customization Panel */}
        {editing && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Personalizar Widgets</CardTitle>
              <CardDescription>
                Adicione, remova ou reorganize os widgets do seu dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {defaultWidgets.map((widget) => {
                  const IconComponent = getWidgetIcon(widget.type);
                  const isVisible = widgets.find(
                    (w) => w.id === widget.id,
                  )?.visible;

                  return (
                    <div
                      key={widget.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        isVisible
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() =>
                        handleWidgetUpdate(widget.id, { visible: !isVisible })
                      }
                    >
                      <div className="flex items-center space-x-3">
                        <IconComponent
                          className={`w-5 h-5 ${getWidgetColor(widget.type)}`}
                        />
                        <div>
                          <h3 className="font-semibold">{widget.title}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {widget.size} • {widget.type}
                          </p>
                        </div>
                        {isVisible && (
                          <Check className="w-5 h-5 text-blue-600 ml-auto" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
