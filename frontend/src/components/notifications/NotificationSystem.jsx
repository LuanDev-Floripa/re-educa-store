import React, { useState, useEffect, useCallback, useMemo } from "react";
/**
 * Centro de Notificações (global)
 * - Carrega da API com fallback; filtros, busca e configurações
 */
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/Ui/card";
import { Button } from "@/components/Ui/button";
import { Badge } from "@/components/Ui/badge";
import {
  Bell,
  Check,
  X,
  Eye,
  EyeOff,
  Settings,
  Filter,
  Search,
  Calendar,
  Clock,
  User,
  Heart,
  Activity,
  Target,
  Trophy,
  Award,
  Star,
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
  Apple,
  Coffee,
  Utensils,
  Pill,
  Stethoscope,
  Shield,
  Lock,
  Unlock,
  AlertTriangle,
  Info,
  Download,
  Upload,
  Camera,
  Dumbbell,
  Mail,
  Phone,
  MapPin,
  Edit as EditIcon,
  Save,
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
  Zap as ZapIcon,
  Crown as CrownIcon,
  Diamond as DiamondIcon,
  Medal as MedalIcon,
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
  Apple as AppleIcon,
  Coffee as CoffeeIcon,
  Utensils as UtensilsIcon,
  Pill as PillIcon,
  Stethoscope as StethoscopeIcon,
  Shield as ShieldIcon,
  Lock as LockIcon,
  Unlock as UnlockIcon,
  AlertTriangle as AlertTriangleIcon,
  Info as InfoIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Camera as CameraIcon,
  Dumbbell as DumbbellIcon,
  Mail as MailIcon,
  Phone as PhoneIcon,
  MapPin as MapPinIcon,
} from "lucide-react";

export const NotificationSystem = ({
  userId,
  onNotificationClick,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onUpdateSettings,
  showSettings = true,
}) => {
  const [notifications, setNotifications] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Dados de exemplo das notificações
  const defaultNotifications = useMemo(() => [
    {
      id: 1,
      type: "workout",
      title: "Hora do Treino!",
      message: "Seu treino de força está agendado para agora",
      timestamp: "2024-01-28T10:00:00Z",
      isRead: false,
      priority: "high",
      category: "reminder",
      icon: Activity,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      action: {
        type: "navigate",
        url: "/tools/workout-sessions",
      },
      metadata: {
        workoutId: 123,
        workoutName: "Treino de Força",
        duration: 60,
      },
    },
    {
      id: 2,
      type: "achievement",
      title: "Nova Conquista!",
      message: "Você completou 100 treinos! Parabéns!",
      timestamp: "2024-01-28T09:30:00Z",
      isRead: false,
      priority: "medium",
      category: "achievement",
      icon: Trophy,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      action: {
        type: "navigate",
        url: "/profile/achievements",
      },
      metadata: {
        achievementId: 456,
        achievementName: "100 Treinos",
        points: 100,
      },
    },
    {
      id: 3,
      type: "goal",
      title: "Meta Atingida!",
      message: "Você atingiu sua meta de perda de peso!",
      timestamp: "2024-01-28T08:15:00Z",
      isRead: true,
      priority: "high",
      category: "goal",
      icon: Target,
      color: "text-green-600",
      bgColor: "bg-green-50",
      action: {
        type: "navigate",
        url: "/profile/goals",
      },
      metadata: {
        goalId: 789,
        goalName: "Perda de Peso",
        targetValue: 70,
        currentValue: 70,
      },
    },
    {
      id: 4,
      type: "product",
      title: "Produto em Promoção",
      message: "Whey Protein Premium com 20% de desconto!",
      timestamp: "2024-01-28T07:00:00Z",
      isRead: true,
      priority: "low",
      category: "marketing",
      icon: Package,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      action: {
        type: "navigate",
        url: "/store/product/whey-protein-premium",
      },
      metadata: {
        productId: 101,
        productName: "Whey Protein Premium",
        discount: 20,
        originalPrice: 199.9,
        salePrice: 159.9,
      },
    },
    {
      id: 5,
      type: "social",
      title: "Novo Seguidor",
      message: "Maria Santos começou a seguir você",
      timestamp: "2024-01-27T18:30:00Z",
      isRead: true,
      priority: "low",
      category: "social",
      icon: Users,
      color: "text-cyan-600",
      bgColor: "bg-cyan-50",
      action: {
        type: "navigate",
        url: "/profile/followers",
      },
      metadata: {
        userId: 202,
        userName: "Maria Santos",
        userAvatar: "/images/avatar-maria.jpg",
      },
    },
    {
      id: 6,
      type: "system",
      title: "Atualização Disponível",
      message: "Nova versão do app com melhorias de performance",
      timestamp: "2024-01-27T12:00:00Z",
      isRead: true,
      priority: "medium",
      category: "system",
      icon: Settings,
      color: "text-gray-600",
      bgColor: "bg-gray-50",
      action: {
        type: "external",
        url: "https://play.google.com/store/apps/details?id=com.reeduca.app",
      },
      metadata: {
        version: "2.1.0",
        updateSize: "15MB",
        features: [
          "Melhorias de performance",
          "Novos exercícios",
          "Correções de bugs",
        ],
      },
    },
    {
      id: 7,
      type: "health",
      title: "Lembrete de Hidratação",
      message:
        "Não esqueça de beber água! Você está 2 copos atrás da meta diária",
      timestamp: "2024-01-27T15:00:00Z",
      isRead: true,
      priority: "medium",
      category: "health",
      icon: Droplets,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      action: {
        type: "navigate",
        url: "/tools/hydration-calculator",
      },
      metadata: {
        currentIntake: 1.5,
        targetIntake: 2.5,
        unit: "L",
      },
    },
    {
      id: 8,
      type: "order",
      title: "Pedido Enviado",
      message: "Seu pedido #12345 foi enviado e está a caminho",
      timestamp: "2024-01-27T10:30:00Z",
      isRead: true,
      priority: "medium",
      category: "order",
      icon: ShoppingCart,
      color: "text-green-600",
      bgColor: "bg-green-50",
      action: {
        type: "navigate",
        url: "/orders/12345",
      },
      metadata: {
        orderId: "12345",
        trackingNumber: "BR123456789",
        estimatedDelivery: "2024-01-30",
      },
    },
  ], []);

  const defaultSettings = useMemo(() => ({
    general: {
      enableNotifications: true,
      soundEnabled: true,
      vibrationEnabled: true,
      showBadges: true,
    },
    categories: {
      workout: true,
      achievement: true,
      goal: true,
      product: false,
      social: true,
      system: true,
      health: true,
      order: true,
      marketing: false,
    },
    timing: {
      quietHours: {
        enabled: false,
        start: "22:00",
        end: "08:00",
      },
      reminderFrequency: "daily",
    },
    channels: {
      push: true,
      email: true,
      sms: false,
    },
  }), []);

  useEffect(() => {
    loadNotifications();
    loadSettings();
  }, [userId, loadNotifications, loadSettings]);

  const loadNotifications = useCallback(async () => {
    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        // Fallback para notificações padrão se não autenticado
        setNotifications(defaultNotifications);
        return;
      }

      // Carregar notificações reais da API
      const response = await fetch("/api/notifications", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || defaultNotifications);
      } else {
        // Fallback para notificações padrão se API falhar
        setNotifications(defaultNotifications);
      }
    } catch (error) {
      console.error("Erro ao carregar notificações:", error);
      // Fallback para notificações padrão em caso de erro
      setNotifications(defaultNotifications);
    } finally {
      setLoading(false);
    }
  }, [defaultNotifications]);

  const loadSettings = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        // Fallback para configurações padrão se não autenticado
        setSettings(defaultSettings);
        return;
      }

      // Carregar configurações reais da API
      const response = await fetch("/api/user/settings", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings || defaultSettings);
      } else {
        // Fallback para configurações padrão se API falhar
        setSettings(defaultSettings);
      }
    } catch (error) {
      console.error("Erro ao carregar configurações:", error);
      // Fallback para configurações padrão em caso de erro
      setSettings(defaultSettings);
    }
  }, [defaultSettings]);

  const handleNotificationClick = (notification) => {
    // Marcar como lida
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }

    if (onNotificationClick) {
      onNotificationClick(notification);
    }
  };

  const handleMarkAsRead = (notificationId) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === notificationId ? { ...notif, isRead: true } : notif,
      ),
    );

    if (onMarkAsRead) {
      onMarkAsRead(notificationId);
    }
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notif) => ({ ...notif, isRead: true })),
    );

    if (onMarkAllAsRead) {
      onMarkAllAsRead();
    }
  };

  const handleDeleteNotification = (notificationId) => {
    setNotifications((prev) =>
      prev.filter((notif) => notif.id !== notificationId),
    );

    if (onDeleteNotification) {
      onDeleteNotification(notificationId);
    }
  };

  const handleUpdateSettings = (newSettings) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));

    if (onUpdateSettings) {
      onUpdateSettings(newSettings);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "workout":
        return Activity;
      case "achievement":
        return Trophy;
      case "goal":
        return Target;
      case "product":
        return Package;
      case "social":
        return Users;
      case "system":
        return Settings;
      case "health":
        return Heart;
      case "order":
        return ShoppingCart;
      case "marketing":
        return Tag;
      default:
        return Bell;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case "workout":
        return "text-blue-600";
      case "achievement":
        return "text-yellow-600";
      case "goal":
        return "text-green-600";
      case "product":
        return "text-purple-600";
      case "social":
        return "text-cyan-600";
      case "system":
        return "text-gray-600";
      case "health":
        return "text-red-600";
      case "order":
        return "text-orange-600";
      case "marketing":
        return "text-pink-600";
      default:
        return "text-gray-600";
    }
  };

  const getNotificationBgColor = (type) => {
    switch (type) {
      case "workout":
        return "bg-blue-50";
      case "achievement":
        return "bg-yellow-50";
      case "goal":
        return "bg-green-50";
      case "product":
        return "bg-purple-50";
      case "social":
        return "bg-cyan-50";
      case "system":
        return "bg-gray-50";
      case "health":
        return "bg-red-50";
      case "order":
        return "bg-orange-50";
      case "marketing":
        return "bg-pink-50";
      default:
        return "bg-gray-50";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "text-red-600";
      case "medium":
        return "text-yellow-600";
      case "low":
        return "text-gray-600";
      default:
        return "text-gray-600";
    }
  };

  const getPriorityText = (priority) => {
    switch (priority) {
      case "high":
        return "Alta";
      case "medium":
        return "Média";
      case "low":
        return "Baixa";
      default:
        return "Normal";
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) {
      // Menos de 1 minuto
      return "Agora";
    } else if (diff < 3600000) {
      // Menos de 1 hora
      return `${Math.floor(diff / 60000)} min atrás`;
    } else if (diff < 86400000) {
      // Menos de 1 dia
      return `${Math.floor(diff / 3600000)}h atrás`;
    } else if (diff < 604800000) {
      // Menos de 1 semana
      return `${Math.floor(diff / 86400000)} dias atrás`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const filteredNotifications = (Array.isArray(notifications) ? notifications : []).filter((notification) => {
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "unread" && !notification.isRead) ||
      (activeTab === "read" && notification.isRead);

    const matchesFilter = filter === "all" || notification.category === filter;

    const matchesSearch =
      searchTerm === "" ||
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesTab && matchesFilter && matchesSearch;
  });

  const unreadCount = (Array.isArray(notifications) ? notifications : []).filter((notif) => !notif.isRead).length;

  const renderNotificationCard = (notification) => {
    const IconComponent =
      notification.icon || getNotificationIcon(notification.type);

    return (
      <Card
        key={notification.id}
        className={`cursor-pointer transition-all hover:shadow-md ${
          !notification.isRead ? "ring-2 ring-blue-500 bg-blue-50/50" : ""
        }`}
        onClick={() => handleNotificationClick(notification)}
      >
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <div
              className={`p-2 ${getNotificationBgColor(notification.type)} rounded-lg`}
            >
              <IconComponent
                className={`w-5 h-5 ${getNotificationColor(notification.type)}`}
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-sm line-clamp-1">
                    {notification.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
                    {notification.message}
                  </p>
                </div>

                <div className="flex items-center space-x-2 ml-2">
                  {!notification.isRead && (
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  )}

                  <div className="flex items-center space-x-1">
                    <Badge
                      variant="outline"
                      className={`text-xs ${getPriorityColor(notification.priority)}`}
                    >
                      {getPriorityText(notification.priority)}
                    </Badge>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteNotification(notification.id);
                      }}
                      className="h-6 w-6 p-0 text-gray-400 hover:text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>{formatTimestamp(notification.timestamp)}</span>
                </div>

                {notification.action && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNotificationClick(notification);
                    }}
                    className="text-xs"
                  >
                    <ArrowRight className="w-3 h-3 mr-1" />
                    Ver
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderSettings = () => (
    <div className="space-y-6">
      {/* Configurações Gerais */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações Gerais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(settings.general || {}).map(([key, value]) => (
            <div
              key={key}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div>
                <h3 className="font-semibold capitalize">
                  {key.replace(/([A-Z])/g, " $1")}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {key === "enableNotifications" && "Ativar notificações"}
                  {key === "soundEnabled" && "Tocar som nas notificações"}
                  {key === "vibrationEnabled" && "Vibrar nas notificações"}
                  {key === "showBadges" && "Mostrar badges de notificação"}
                </p>
              </div>
              <input
                type="checkbox"
                checked={value}
                onChange={(e) =>
                  handleUpdateSettings({
                    general: { ...settings.general, [key]: e.target.checked },
                  })
                }
                className="w-5 h-5 text-blue-600 rounded"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Categorias */}
      <Card>
        <CardHeader>
          <CardTitle>Categorias de Notificação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(settings.categories || {}).map(([key, value]) => (
            <div
              key={key}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div>
                <h3 className="font-semibold capitalize">{key}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {key === "workout" && "Lembretes de treino"}
                  {key === "achievement" && "Conquistas e badges"}
                  {key === "goal" && "Metas e progresso"}
                  {key === "product" && "Produtos e ofertas"}
                  {key === "social" && "Atividade social"}
                  {key === "system" && "Atualizações do sistema"}
                  {key === "health" && "Lembretes de saúde"}
                  {key === "order" && "Status de pedidos"}
                  {key === "marketing" && "Promoções e marketing"}
                </p>
              </div>
              <input
                type="checkbox"
                checked={value}
                onChange={(e) =>
                  handleUpdateSettings({
                    categories: {
                      ...settings.categories,
                      [key]: e.target.checked,
                    },
                  })
                }
                className="w-5 h-5 text-blue-600 rounded"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Canais */}
      <Card>
        <CardHeader>
          <CardTitle>Canais de Notificação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(settings.channels || {}).map(([key, value]) => (
            <div
              key={key}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div>
                <h3 className="font-semibold capitalize">{key}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {key === "push" && "Notificações push no dispositivo"}
                  {key === "email" && "Notificações por email"}
                  {key === "sms" && "Notificações por SMS"}
                </p>
              </div>
              <input
                type="checkbox"
                checked={value}
                onChange={(e) =>
                  handleUpdateSettings({
                    channels: { ...settings.channels, [key]: e.target.checked },
                  })
                }
                className="w-5 h-5 text-blue-600 rounded"
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );

  const tabs = [
    { id: "all", label: "Todas", count: notifications.length },
    { id: "unread", label: "Não Lidas", count: unreadCount },
    { id: "read", label: "Lidas", count: notifications.length - unreadCount },
    { id: "settings", label: "Configurações", count: null },
  ];

  const categories = [
    { id: "all", label: "Todas" },
    { id: "reminder", label: "Lembretes" },
    { id: "achievement", label: "Conquistas" },
    { id: "goal", label: "Metas" },
    { id: "marketing", label: "Marketing" },
    { id: "social", label: "Social" },
    { id: "system", label: "Sistema" },
    { id: "health", label: "Saúde" },
    { id: "order", label: "Pedidos" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Carregando notificações...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Bell className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Notificações
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {unreadCount} não lidas de {notifications.length} total
              </p>
            </div>
          </div>

          <div className="flex space-x-2">
            {unreadCount > 0 && (
              <Button variant="outline" onClick={handleMarkAllAsRead}>
                <Check className="w-4 h-4 mr-2" />
                Marcar Todas como Lidas
              </Button>
            )}

            <Button variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
          </div>
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
              {tab.count !== null && (
                <Badge variant="secondary" className="text-xs">
                  {tab.count}
                </Badge>
              )}
            </button>
          ))}
        </div>

        {/* Filtros e Busca */}
        {activeTab !== "settings" && (
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar notificações..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Content */}
        {activeTab === "settings" && showSettings ? (
          renderSettings()
        ) : (
          <div className="space-y-4">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map(renderNotificationCard)
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Nenhuma notificação encontrada
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {activeTab === "unread"
                      ? "Você não tem notificações não lidas"
                      : activeTab === "read"
                        ? "Você não tem notificações lidas"
                        : "Não há notificações para exibir"}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
