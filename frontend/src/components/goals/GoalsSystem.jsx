import React, { useState, useEffect, useCallback, useMemo } from "react";
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
import { Input } from "@/components/Ui/input";
import { Label } from "@/components/Ui/label";
import {
  Target,
  Plus,
  Edit,
  Trash2,
  Check,
  X,
  Calendar,
  Clock,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Activity,
  Heart,
  Dumbbell,
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
  AlertTriangle,
  Info,
  Download,
  Upload,
  Camera,
  Apple,
  Coffee,
  Utensils,
  Pill,
  Stethoscope,
  Shield,
  Trophy,
  Award,
  Star,
  Crown,
  Diamond,
  Medal,
  Zap,
  Sparkles,
  Gem,
  Coins,
  Banknote,
  Wallet,
  CreditCard as CreditCardIcon,
  ShoppingCart as ShoppingCartIcon,
  Package as PackageIcon,
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
  Minus,
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
  AlertTriangle as AlertTriangleIcon,
  Info as InfoIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Camera as CameraIcon,
  Apple as AppleIcon,
  Coffee as CoffeeIcon,
  Utensils as UtensilsIcon,
  Pill as PillIcon,
  Stethoscope as StethoscopeIcon,
  Shield as ShieldIcon,
  Trophy as TrophyIcon,
  Award as AwardIcon,
  Star as StarIcon,
  Crown as CrownIcon,
  Diamond as DiamondIcon,
  Medal as MedalIcon,
  Zap as ZapIcon,
  Sparkles as SparklesIcon,
  Gem as GemIcon,
  Coins as CoinsIcon,
  Banknote as BanknoteIcon,
  Wallet as WalletIcon,
} from "lucide-react";

/**
 * Sistema de Metas do usuário.
 * - Lista, cria, atualiza, conclui e arquiva metas
 * - Fallback com dados padrão quando API indisponível
 * - UI responsiva com filtros, busca e contadores por status
 */
export const GoalsSystem = ({
  userId,
  onGoalCreate,
  onGoalUpdate,
  onGoalDelete,
  onGoalComplete,
  onGoalArchive,
}) => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("active");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Dados de exemplo das metas
  const defaultGoals = useMemo(
    () => [
      {
        id: 1,
        name: "Perda de Peso",
        description: "Perder 5kg para atingir meu peso ideal",
        category: "weight",
        type: "decrease",
        target: 70,
        current: 75,
        unit: "kg",
        startDate: "2024-01-01",
        targetDate: "2024-06-01",
        status: "active",
        priority: "high",
        progress: 75,
        icon: TrendingDown,
        color: "text-green-600",
        bgColor: "bg-green-50",
        milestones: [
          {
            id: 1,
            name: "Primeiro kg",
            target: 74,
            achieved: true,
            achievedAt: "2024-01-15",
          },
          {
            id: 2,
            name: "Metade do caminho",
            target: 72.5,
            achieved: false,
            achievedAt: null,
          },
          {
            id: 3,
            name: "Meta final",
            target: 70,
            achieved: false,
            achievedAt: null,
          },
        ],
        reminders: [
          {
            id: 1,
            type: "weekly",
            message: "Verificar progresso semanal",
            enabled: true,
          },
          {
            id: 2,
            type: "monthly",
            message: "Avaliar metas mensais",
            enabled: true,
          },
        ],
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-28T10:00:00Z",
      },
      {
        id: 2,
        name: "Ganho de Massa Muscular",
        description: "Aumentar massa muscular em 5kg",
        category: "muscle",
        type: "increase",
        target: 70,
        current: 65,
        unit: "kg",
        startDate: "2024-01-01",
        targetDate: "2024-12-01",
        status: "active",
        priority: "high",
        progress: 65,
        icon: TrendingUp,
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        milestones: [
          {
            id: 1,
            name: "Primeiro kg",
            target: 66,
            achieved: false,
            achievedAt: null,
          },
          {
            id: 2,
            name: "Metade do caminho",
            target: 67.5,
            achieved: false,
            achievedAt: null,
          },
          {
            id: 3,
            name: "Meta final",
            target: 70,
            achieved: false,
            achievedAt: null,
          },
        ],
        reminders: [
          {
            id: 1,
            type: "weekly",
            message: "Verificar progresso semanal",
            enabled: true,
          },
          {
            id: 2,
            type: "monthly",
            message: "Avaliar metas mensais",
            enabled: true,
          },
        ],
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-28T10:00:00Z",
      },
      {
        id: 3,
        name: "Redução de Gordura Corporal",
        description: "Reduzir gordura corporal para 12%",
        category: "body_fat",
        type: "decrease",
        target: 12,
        current: 15,
        unit: "%",
        startDate: "2024-01-01",
        targetDate: "2024-08-01",
        status: "active",
        priority: "medium",
        progress: 80,
        icon: Target,
        color: "text-purple-600",
        bgColor: "bg-purple-50",
        milestones: [
          {
            id: 1,
            name: "Primeira redução",
            target: 14,
            achieved: true,
            achievedAt: "2024-01-20",
          },
          {
            id: 2,
            name: "Metade do caminho",
            target: 13.5,
            achieved: false,
            achievedAt: null,
          },
          {
            id: 3,
            name: "Meta final",
            target: 12,
            achieved: false,
            achievedAt: null,
          },
        ],
        reminders: [
          {
            id: 1,
            type: "weekly",
            message: "Verificar progresso semanal",
            enabled: true,
          },
          {
            id: 2,
            type: "monthly",
            message: "Avaliar metas mensais",
            enabled: true,
          },
        ],
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-28T10:00:00Z",
      },
      {
        id: 4,
        name: "100 Treinos",
        description: "Completar 100 treinos este ano",
        category: "workout",
        type: "increase",
        target: 100,
        current: 45,
        unit: "treinos",
        startDate: "2024-01-01",
        targetDate: "2024-12-31",
        status: "active",
        priority: "medium",
        progress: 45,
        icon: Activity,
        color: "text-orange-600",
        bgColor: "bg-orange-50",
        milestones: [
          {
            id: 1,
            name: "25 treinos",
            target: 25,
            achieved: true,
            achievedAt: "2024-01-15",
          },
          {
            id: 2,
            name: "50 treinos",
            target: 50,
            achieved: false,
            achievedAt: null,
          },
          {
            id: 3,
            name: "75 treinos",
            target: 75,
            achieved: false,
            achievedAt: null,
          },
          {
            id: 4,
            name: "100 treinos",
            target: 100,
            achieved: false,
            achievedAt: null,
          },
        ],
        reminders: [
          {
            id: 1,
            type: "weekly",
            message: "Verificar progresso semanal",
            enabled: true,
          },
          {
            id: 2,
            type: "monthly",
            message: "Avaliar metas mensais",
            enabled: true,
          },
        ],
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-28T10:00:00Z",
      },
      {
        id: 5,
        name: "Corrida 5K",
        description: "Correr 5km em menos de 25 minutos",
        category: "running",
        type: "improve",
        target: 25,
        current: 35,
        unit: "minutos",
        startDate: "2024-01-01",
        targetDate: "2024-05-01",
        status: "active",
        priority: "low",
        progress: 71,
        icon: Zap,
        color: "text-red-600",
        bgColor: "bg-red-50",
        milestones: [
          {
            id: 1,
            name: "30 minutos",
            target: 30,
            achieved: true,
            achievedAt: "2024-01-10",
          },
          {
            id: 2,
            name: "27 minutos",
            target: 27,
            achieved: false,
            achievedAt: null,
          },
          {
            id: 3,
            name: "25 minutos",
            target: 25,
            achieved: false,
            achievedAt: null,
          },
        ],
        reminders: [
          {
            id: 1,
            type: "weekly",
            message: "Verificar progresso semanal",
            enabled: true,
          },
          {
            id: 2,
            type: "monthly",
            message: "Avaliar metas mensais",
            enabled: true,
          },
        ],
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-28T10:00:00Z",
      },
      {
        id: 6,
        name: "Flexibilidade",
        description: "Tocar os pés sem dobrar os joelhos",
        category: "flexibility",
        type: "achievement",
        target: 1,
        current: 0,
        unit: "vez",
        startDate: "2024-01-01",
        targetDate: "2024-06-01",
        status: "completed",
        priority: "low",
        progress: 100,
        icon: Wind,
        color: "text-cyan-600",
        bgColor: "bg-cyan-50",
        milestones: [
          {
            id: 1,
            name: "Meta alcançada",
            target: 1,
            achieved: true,
            achievedAt: "2024-01-25",
          },
        ],
        reminders: [],
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-25T15:30:00Z",
        completedAt: "2024-01-25T15:30:00Z",
      },
    ],
    [],
  );

  const goalCategories = [
    { id: "weight", name: "Peso", icon: TrendingDown, color: "text-green-600" },
    {
      id: "muscle",
      name: "Massa Muscular",
      icon: TrendingUp,
      color: "text-blue-600",
    },
    {
      id: "body_fat",
      name: "Gordura Corporal",
      icon: Target,
      color: "text-purple-600",
    },
    {
      id: "workout",
      name: "Treinos",
      icon: Activity,
      color: "text-orange-600",
    },
    { id: "running", name: "Corrida", icon: Zap, color: "text-red-600" },
    {
      id: "flexibility",
      name: "Flexibilidade",
      icon: Wind,
      color: "text-cyan-600",
    },
    { id: "strength", name: "Força", icon: Dumbbell, color: "text-gray-600" },
    {
      id: "endurance",
      name: "Resistência",
      icon: Heart,
      color: "text-pink-600",
    },
    {
      id: "nutrition",
      name: "Nutrição",
      icon: Apple,
      color: "text-yellow-600",
    },
    { id: "sleep", name: "Sono", icon: Moon, color: "text-indigo-600" },
  ];

  const goalTypes = [
    {
      id: "increase",
      name: "Aumentar",
      icon: TrendingUp,
      color: "text-green-600",
    },
    {
      id: "decrease",
      name: "Diminuir",
      icon: TrendingDown,
      color: "text-red-600",
    },
    { id: "improve", name: "Melhorar", icon: Target, color: "text-blue-600" },
    { id: "achieve", name: "Alcançar", icon: Check, color: "text-purple-600" },
  ];

  const priorities = [
    { id: "high", name: "Alta", color: "text-red-600", bgColor: "bg-red-50" },
    {
      id: "medium",
      name: "Média",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    {
      id: "low",
      name: "Baixa",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
  ];

  useEffect(() => {
    loadGoals();
  }, [userId, loadGoals]);

  const loadGoals = useCallback(async () => {
    setLoading(true);

    try {
      // Simular carregamento de API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setGoals(defaultGoals);
    } catch (error) {
      console.error("Erro ao carregar metas:", error);
      toast.error("Falha ao carregar metas. Exibindo dados locais.");
    } finally {
      setLoading(false);
    }
  }, [defaultGoals]);

  const handleCreateGoal = async (goalData) => {
    const newGoal = {
      id: Date.now(),
      ...goalData,
      status: "active",
      progress: 0,
      milestones: [],
      reminders: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setGoals((prev) => [...prev, newGoal]);

    if (onGoalCreate) {
      onGoalCreate(newGoal);
    }
  };

  const handleUpdateGoal = async (goalId, updates) => {
    setGoals((prev) =>
      prev.map((goal) =>
        goal.id === goalId
          ? { ...goal, ...updates, updatedAt: new Date().toISOString() }
          : goal,
      ),
    );

    if (onGoalUpdate) {
      onGoalUpdate(goalId, updates);
    }
  };

  const handleDeleteGoal = async (goalId) => {
    setGoals((prev) => prev.filter((goal) => goal.id !== goalId));

    if (onGoalDelete) {
      onGoalDelete(goalId);
    }
  };

  const handleCompleteGoal = async (goalId) => {
    const goal = goals.find((g) => g.id === goalId);
    if (goal) {
      await handleUpdateGoal(goalId, {
        status: "completed",
        progress: 100,
        completedAt: new Date().toISOString(),
      });

      if (onGoalComplete) {
        onGoalComplete(goal);
      }
    }
  };

  const handleArchiveGoal = async (goalId) => {
    await handleUpdateGoal(goalId, { status: "archived" });

    if (onGoalArchive) {
      onGoalArchive(goalId);
    }
  };

  const getGoalIcon = (category) => {
    const categoryData = goalCategories.find((cat) => cat.id === category);
    return categoryData?.icon || Target;
  };

  const getGoalColor = (category) => {
    const categoryData = goalCategories.find((cat) => cat.id === category);
    return categoryData?.color || "text-gray-600";
  };

  const getGoalBgColor = (category) => {
    const categoryData = goalCategories.find((cat) => cat.id === category);
    return categoryData?.bgColor || "bg-gray-50";
  };

  const getPriorityColor = (priority) => {
    const priorityData = priorities.find((p) => p.id === priority);
    return priorityData?.color || "text-gray-600";
  };

  const getPriorityBgColor = (priority) => {
    const priorityData = priorities.find((p) => p.id === priority);
    return priorityData?.bgColor || "bg-gray-50";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "text-blue-600";
      case "completed":
        return "text-green-600";
      case "paused":
        return "text-yellow-600";
      case "archived":
        return "text-gray-600";
      default:
        return "text-gray-600";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "active":
        return "Ativa";
      case "completed":
        return "Concluída";
      case "paused":
        return "Pausada";
      case "archived":
        return "Arquivada";
      default:
        return "Desconhecida";
    }
  };

  const getProgressPercentage = (current, target, type) => {
    if (type === "decrease") {
      return Math.min(((target - current) / target) * 100, 100);
    }
    return Math.min((current / target) * 100, 100);
  };

  const getDaysRemaining = (targetDate) => {
    const target = new Date(targetDate);
    const now = new Date();
    const diff = target - now;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const safeGoals = Array.isArray(goals) ? goals : [];
  const filteredGoals = safeGoals.filter((goal) => {
    const matchesTab = activeTab === "all" || goal.status === activeTab;
    const matchesFilter = filter === "all" || goal.category === filter;
    const matchesSearch =
      searchTerm === "" ||
      goal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      goal.description.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesTab && matchesFilter && matchesSearch;
  });

  const renderGoalCard = (goal) => {
    const IconComponent = goal.icon || getGoalIcon(goal.category);
    const daysRemaining = getDaysRemaining(goal.targetDate);
    const progressPercentage = getProgressPercentage(
      goal.current,
      goal.target,
      goal.type,
    );

    return (
      <Card key={goal.id} className="hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div
                className={`p-2 ${getGoalBgColor(goal.category)} rounded-lg`}
              >
                <IconComponent
                  className={`w-6 h-6 ${getGoalColor(goal.category)}`}
                />
              </div>
              <div>
                <CardTitle className="text-lg">{goal.name}</CardTitle>
                <CardDescription>{goal.description}</CardDescription>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Badge
                variant="outline"
                className={`text-xs ${getStatusColor(goal.status)}`}
              >
                {getStatusText(goal.status)}
              </Badge>

              <Badge
                variant="outline"
                className={`text-xs ${getPriorityColor(goal.priority)} ${getPriorityBgColor(goal.priority)}`}
              >
                {priorities.find((p) => p.id === goal.priority)?.name}
              </Badge>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditingGoal(goal)}
              >
                Editar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleArchiveGoal(goal.id)}
              >
                Arquivar
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Progresso */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progresso</span>
              <span>
                {goal.current} / {goal.target} {goal.unit}
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            <div className="text-right text-sm text-gray-600 dark:text-gray-400">
              {Math.round(progressPercentage)}% concluído
            </div>
          </div>

          {/* Milestones */}
          {goal.milestones && goal.milestones.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Marcos</h4>
              <div className="space-y-1">
                {goal.milestones.map((milestone) => (
                  <div
                    key={milestone.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center space-x-2">
                      {milestone.achieved ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <div className="w-4 h-4 border-2 border-gray-300 rounded-full"></div>
                      )}
                      <span
                        className={
                          milestone.achieved ? "line-through text-gray-500" : ""
                        }
                      >
                        {milestone.name}
                      </span>
                    </div>
                    <span className="text-gray-600 dark:text-gray-400">
                      {milestone.target} {goal.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Informações */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">
                Data Limite:
              </span>
              <div className="font-medium">
                {new Date(goal.targetDate).toLocaleDateString()}
              </div>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">
                Dias Restantes:
              </span>
              <div
                className={`font-medium ${daysRemaining < 0 ? "text-red-600" : daysRemaining < 7 ? "text-yellow-600" : "text-green-600"}`}
              >
                {daysRemaining < 0 ? "Atrasado" : `${daysRemaining} dias`}
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="flex space-x-2 pt-2">
            {goal.status === "active" && (
              <Button
                size="sm"
                onClick={() => setEditingGoal(goal)}
                className="flex-1"
              >
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Button>
            )}

            {goal.status === "active" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCompleteGoal(goal.id)}
              >
                <Check className="w-4 h-4 mr-2" />
                Concluir
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDeleteGoal(goal.id)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderCreateModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>Criar Nova Meta</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const goalData = {
                name: formData.get("name"),
                description: formData.get("description"),
                category: formData.get("category"),
                type: formData.get("type"),
                target: parseFloat(formData.get("target")),
                current: parseFloat(formData.get("current")),
                unit: formData.get("unit"),
                startDate: formData.get("startDate"),
                targetDate: formData.get("targetDate"),
                priority: formData.get("priority"),
              };

              handleCreateGoal(goalData);
              setShowCreateModal(false);
            }}
          >
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome da Meta</Label>
                <Input
                  id="name"
                  name="name"
                  required
                  placeholder="Ex: Perder 5kg"
                />
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Input
                  id="description"
                  name="description"
                  placeholder="Descreva sua meta..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Categoria</Label>
                  <select
                    id="category"
                    name="category"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Selecione</option>
                    {goalCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="type">Tipo</Label>
                  <select
                    id="type"
                    name="type"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Selecione</option>
                    {goalTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="current">Valor Atual</Label>
                  <Input
                    id="current"
                    name="current"
                    type="number"
                    step="0.1"
                    required
                    placeholder="0"
                  />
                </div>

                <div>
                  <Label htmlFor="target">Meta</Label>
                  <Input
                    id="target"
                    name="target"
                    type="number"
                    step="0.1"
                    required
                    placeholder="0"
                  />
                </div>

                <div>
                  <Label htmlFor="unit">Unidade</Label>
                  <Input
                    id="unit"
                    name="unit"
                    required
                    placeholder="kg, %, etc"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Data de Início</Label>
                  <Input id="startDate" name="startDate" type="date" required />
                </div>

                <div>
                  <Label htmlFor="targetDate">Data Limite</Label>
                  <Input
                    id="targetDate"
                    name="targetDate"
                    type="date"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="priority">Prioridade</Label>
                <select
                  id="priority"
                  name="priority"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  {priorities.map((priority) => (
                    <option key={priority.id} value={priority.id}>
                      {priority.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex space-x-2 pt-4">
                <Button type="submit" className="flex-1">
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Meta
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );

  const tabs = [
    {
      id: "active",
      label: "Ativas",
      count: goals.filter((g) => g.status === "active").length,
    },
    {
      id: "completed",
      label: "Concluídas",
      count: goals.filter((g) => g.status === "completed").length,
    },
    {
      id: "paused",
      label: "Pausadas",
      count: goals.filter((g) => g.status === "paused").length,
    },
    {
      id: "archived",
      label: "Arquivadas",
      count: goals.filter((g) => g.status === "archived").length,
    },
    { id: "all", label: "Todas", count: goals.length },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Carregando metas...
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
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Sistema de Metas
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Defina e acompanhe seus objetivos de saúde e fitness
              </p>
            </div>
          </div>

          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Meta
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <span>{tab.label}</span>
              <Badge variant="secondary" className="text-xs">
                {tab.count}
              </Badge>
            </button>
          ))}
        </div>

        {/* Filtros e Busca */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar metas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">Todas as categorias</option>
            {goalCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Goals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGoals.map(renderGoalCard)}
        </div>

        {/* Empty State */}
        {filteredGoals.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Nenhuma meta encontrada
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {activeTab === "active"
                  ? "Você não tem metas ativas no momento"
                  : activeTab === "completed"
                    ? "Você não tem metas concluídas"
                    : "Não há metas para exibir"}
              </p>
              {activeTab === "active" && (
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeira Meta
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Create Modal */}
        {showCreateModal && renderCreateModal()}

        {/* Edit Modal */}
        {editingGoal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Editar Meta</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Editando: {editingGoal.name}
              </p>
              <div className="flex space-x-2">
                <Button onClick={() => setEditingGoal(null)} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={() => setEditingGoal(null)} className="flex-1">
                  Salvar
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
