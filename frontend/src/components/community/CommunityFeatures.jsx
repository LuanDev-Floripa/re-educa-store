/**
 * CommunityFeatures Component - RE-EDUCA Store
 * 
 * Componente de funcionalidades da comunidade.
 * 
 * Funcionalidades:
 * - Posts e interações da comunidade
 * - Grupos e fóruns
 * - Sistema de likes e comentários
 * - Analytics de engajamento
 * 
 * @component
 * @returns {JSX.Element} Interface de funcionalidades da comunidade
 */
import React, { useState, useEffect, useCallback, useMemo } from "react";
import logger from "@/utils/logger";
import { getAuthToken } from "@/utils/storage";
import { apiService } from "@/lib/api";
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
  Users,
  MessageCircle,
  Heart,
  Share2,
  ThumbsUp,
  ThumbsDown,
  Flag,
  MoreHorizontal,
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
  MoreVertical,
  Menu,
  X as XIcon,
  Copy,
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
  UserPlus,
  Lightbulb,
  HelpCircle,
} from "lucide-react";

export const CommunityFeatures = ({
  userId,
  onPostCreate,
  onPostLike,
  onPostComment,
  onPostShare,
  onPostReport,
  onFollowUser,
  onJoinGroup,
  onCreateGroup,
}) => {
  const [communityData, setCommunityData] = useState({});
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("feed");
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Dados de exemplo da comunidade
  const defaultCommunityData = useMemo(
    () => ({
      user: {
        id: 1,
        name: "João Silva",
        username: "@joaosilva",
        avatar: "/images/avatar.jpg",
        followers: 1250,
        following: 340,
        posts: 45,
        level: 8,
        tier: "gold",
        verified: true,
      },
      posts: [
        {
          id: 1,
          user: {
            id: 2,
            name: "Maria Santos",
            username: "@mariasantos",
            avatar: "/images/avatar-maria.jpg",
            verified: true,
            level: 12,
            tier: "platinum",
          },
          content:
            "Acabei de completar meu treino de 60 minutos! 💪 Estou me sentindo incrível e mais forte a cada dia. O que vocês fizeram hoje?",
          images: ["/images/workout-1.jpg"],
          type: "workout",
          likes: 45,
          comments: 12,
          shares: 8,
          isLiked: false,
          isShared: false,
          createdAt: "2024-01-28T10:30:00Z",
          tags: ["treino", "força", "motivação"],
        },
        {
          id: 2,
          user: {
            id: 3,
            name: "Pedro Costa",
            username: "@pedrocosta",
            avatar: "/images/avatar-pedro.jpg",
            verified: false,
            level: 6,
            tier: "silver",
          },
          content:
            "Dica de hoje: Não subestime a importância do aquecimento! Sempre faça 10-15 minutos de aquecimento antes do treino principal. Seu corpo vai agradecer! 🏃‍♂️",
          images: [],
          type: "tip",
          likes: 23,
          comments: 5,
          shares: 15,
          isLiked: true,
          isShared: false,
          createdAt: "2024-01-28T09:15:00Z",
          tags: ["dica", "aquecimento", "treino"],
        },
        {
          id: 3,
          user: {
            id: 4,
            name: "Ana Silva",
            username: "@anasilva",
            avatar: "/images/avatar-ana.jpg",
            verified: true,
            level: 10,
            tier: "gold",
          },
          content:
            "Progresso de 6 meses! Perdi 8kg e ganhei muita massa muscular. A jornada não foi fácil, mas valeu cada gota de suor! 💪✨",
          images: ["/images/progress-1.jpg", "/images/progress-2.jpg"],
          type: "progress",
          likes: 89,
          comments: 25,
          shares: 32,
          isLiked: false,
          isShared: true,
          createdAt: "2024-01-28T08:00:00Z",
          tags: ["progresso", "transformação", "motivação"],
        },
        {
          id: 4,
          user: {
            id: 5,
            name: "Carlos Lima",
            username: "@carloslima",
            avatar: "/images/avatar-carlos.jpg",
            verified: false,
            level: 4,
            tier: "bronze",
          },
          content:
            "Alguém pode me ajudar com uma rotina de treino para iniciantes? Estou começando agora e não sei por onde começar. Obrigado! 🙏",
          images: [],
          type: "question",
          likes: 12,
          comments: 18,
          shares: 3,
          isLiked: false,
          isShared: false,
          createdAt: "2024-01-28T07:45:00Z",
          tags: ["ajuda", "iniciante", "treino"],
        },
      ],
      groups: [
        {
          id: 1,
          name: "Musculação para Iniciantes",
          description: "Grupo para quem está começando na musculação",
          members: 1250,
          posts: 45,
          isJoined: true,
          avatar: "/images/group-1.jpg",
          category: "fitness",
          level: "beginner",
        },
        {
          id: 2,
          name: "Corrida e Cardio",
          description: "Compartilhe suas corridas e treinos de cardio",
          members: 890,
          posts: 32,
          isJoined: false,
          avatar: "/images/group-2.jpg",
          category: "cardio",
          level: "all",
        },
        {
          id: 3,
          name: "Nutrição e Dieta",
          description: "Dicas e receitas para uma alimentação saudável",
          members: 2100,
          posts: 78,
          isJoined: true,
          avatar: "/images/group-3.jpg",
          category: "nutrition",
          level: "all",
        },
      ],
      events: [
        {
          id: 1,
          name: "Corrida 5K da Comunidade",
          description: "Corrida beneficente de 5km",
          date: "2024-02-15T08:00:00Z",
          location: "Parque Ibirapuera, São Paulo",
          attendees: 45,
          maxAttendees: 100,
          isAttending: true,
          organizer: {
            name: "Maria Santos",
            avatar: "/images/avatar-maria.jpg",
          },
        },
        {
          id: 2,
          name: "Workshop de Nutrição",
          description: "Aprenda sobre alimentação saudável",
          date: "2024-02-20T19:00:00Z",
          location: "Online",
          attendees: 23,
          maxAttendees: 50,
          isAttending: false,
          organizer: {
            name: "Ana Silva",
            avatar: "/images/avatar-ana.jpg",
          },
        },
      ],
      leaderboard: [
        {
          id: 1,
          name: "Maria Santos",
          avatar: "/images/avatar-maria.jpg",
          level: 12,
          tier: "platinum",
          points: 4500,
          rank: 1,
          stats: {
            posts: 45,
            likes: 1250,
            followers: 2100,
          },
        },
        {
          id: 2,
          name: "Pedro Costa",
          avatar: "/images/avatar-pedro.jpg",
          level: 10,
          tier: "gold",
          points: 3800,
          rank: 2,
          stats: {
            posts: 32,
            likes: 890,
            followers: 1200,
          },
        },
        {
          id: 3,
          name: "Ana Silva",
          avatar: "/images/avatar-ana.jpg",
          level: 9,
          tier: "gold",
          points: 3200,
          rank: 3,
          stats: {
            posts: 28,
            likes: 750,
            followers: 980,
          },
        },
      ],
      trending: [
        { tag: "treino", posts: 1250, trend: "up" },
        { tag: "motivação", posts: 890, trend: "up" },
        { tag: "progresso", posts: 650, trend: "stable" },
        { tag: "nutrição", posts: 420, trend: "down" },
        { tag: "cardio", posts: 380, trend: "up" },
      ],
    }),
    [],
  );

  useEffect(() => {
    loadCommunityData();
  }, [userId, loadCommunityData]);

  const loadCommunityData = useCallback(async () => {
    setLoading(true);

    try {
      const token = getAuthToken();
      
      // Tentar carregar da API se houver token
      if (token) {
        try {
          // Carregar posts sociais da API
          const postsResponse = await apiService.social.getPosts({ limit: 20, page: 1 });
          const groupsResponse = await apiService.social.getGroups({ limit: 10 });
          
          if (postsResponse?.success && Array.isArray(postsResponse.posts)) {
            // Transformar posts da API para o formato esperado
            const transformedPosts = postsResponse.posts.map(post => ({
              id: post.id,
              author: {
                id: post.user_id,
                name: post.user?.name || "Usuário",
                avatar: post.user?.avatar_url || "/default-avatar.png",
              },
              content: post.content || "",
              image: post.image_url || null,
              likes: post.reaction_count || 0,
              comments: post.comment_count || 0,
              shares: post.share_count || 0,
              isLiked: post.user_reacted || false,
              createdAt: post.created_at,
              type: post.post_type || "text",
            }));
            
            // Transformar grupos da API
            const transformedGroups = groupsResponse?.groups 
              ? groupsResponse.groups.map(group => ({
                  id: group.id,
                  name: group.name || "Grupo",
                  description: group.description || "",
                  members: group.member_count || 0,
                  image: group.image_url || null,
                  isMember: group.is_member || false,
                }))
              : [];
            
            setCommunityData(prev => ({
              ...prev,
              posts: transformedPosts,
              groups: transformedGroups,
            }));
            
            return; // Dados carregados com sucesso
          }
        } catch (apiError) {
          logger.warn("Erro ao carregar dados da comunidade da API, usando fallback:", apiError);
        }
      }
      
      // Fallback: usar dados padrão
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simular carregamento
      setCommunityData(defaultCommunityData);
    } catch (error) {
      logger.error("Erro ao carregar dados da comunidade:", error);
      setCommunityData(defaultCommunityData); // Garantir que sempre há dados
    } finally {
      setLoading(false);
    }
  }, [defaultCommunityData]);

  const handlePostLike = (postId) => {
    setCommunityData((prev) => ({
      ...prev,
      posts: prev.posts.map((post) =>
        post.id === postId
          ? {
              ...post,
              isLiked: !post.isLiked,
              likes: post.isLiked ? post.likes - 1 : post.likes + 1,
            }
          : post,
      ),
    }));

    if (onPostLike) {
      onPostLike(postId);
    }
  };

  const handlePostShare = (postId) => {
    setCommunityData((prev) => ({
      ...prev,
      posts: prev.posts.map((post) =>
        post.id === postId
          ? {
              ...post,
              isShared: !post.isShared,
              shares: post.isShared ? post.shares - 1 : post.shares + 1,
            }
          : post,
      ),
    }));

    if (onPostShare) {
      onPostShare(postId);
    }
  };

  const handleFollowUser = (userId) => {
    if (onFollowUser) {
      onFollowUser(userId);
    }
  };

  const handleJoinGroup = (groupId) => {
    setCommunityData((prev) => ({
      ...prev,
      groups: prev.groups.map((group) =>
        group.id === groupId ? { ...group, isJoined: !group.isJoined } : group,
      ),
    }));

    if (onJoinGroup) {
      onJoinGroup(groupId);
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
        return "text-primary";
      case "silver":
        return "text-muted-foreground";
      case "gold":
        return "text-primary";
      case "platinum":
        return "text-primary";
      default:
        return "text-muted-foreground";
    }
  };

  const getPostTypeIcon = (type) => {
    switch (type) {
      case "workout":
        return Activity;
      case "tip":
        return Lightbulb;
      case "progress":
        return TrendingUp;
      case "question":
        return HelpCircle;
      default:
        return MessageCircle;
    }
  };

  const getPostTypeColor = (type) => {
    switch (type) {
      case "workout":
        return "text-primary";
      case "tip":
        return "text-primary";
      case "progress":
        return "text-primary";
      case "question":
        return "text-primary";
      default:
        return "text-muted-foreground";
    }
  };

  const renderPost = (post) => {
    const PostTypeIcon = getPostTypeIcon(post.type);

    return (
      <Card key={post.id} className="hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center">
                  <span className="text-lg font-bold text-primary-foreground">
                    {post.user.name.charAt(0)}
                  </span>
                </div>
                {post.user.verified && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-semibold">{post.user.name}</h3>
                  <span className="text-sm text-muted-foreground">
                    {post.user.username}
                  </span>
                  <div className="flex items-center space-x-1">
                    <span className="text-xs text-muted-foreground">
                      Nível {post.user.level}
                    </span>
                    {(() => {
                      const TierIcon = getTierIcon(post.user.tier);
                      return (
                        <TierIcon
                          className={`w-3 h-3 ${getTierColor(post.user.tier)}`}
                        />
                      );
                    })()}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatTimestamp(post.createdAt)}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Badge
                variant="outline"
                className={`text-xs ${getPostTypeColor(post.type)}`}
              >
                <PostTypeIcon className="w-3 h-3 mr-1" />
                {post.type}
              </Badge>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleFollowUser(post.user.id)}
              >
                <UserPlus className="w-4 h-4 mr-1" />
                Seguir
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  // Menu de opções do post (pode abrir dropdown)
                  toast.info("Menu de opções do post");
                  // Aqui poderia abrir um dropdown com opções: Reportar, Salvar, etc.
                }}
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Conteúdo do Post */}
          <div>
            <p className="text-foreground">{post.content}</p>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {post.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Imagens */}
          {post.images && post.images.length > 0 && (
            <div className="grid grid-cols-1 gap-2">
              {post.images.map((image, index) => (
                <div
                  key={index}
                  className="aspect-video bg-muted rounded-lg flex items-center justify-center"
                >
                  <Image className="w-12 h-12 text-muted-foreground" />
                </div>
              ))}
            </div>
          )}

          {/* Ações */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center space-x-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handlePostLike(post.id)}
                className={post.isLiked ? "text-destructive" : "text-muted-foreground"}
              >
                <Heart
                  className={`w-4 h-4 mr-2 ${post.isLiked ? "fill-current" : ""}`}
                />
                {post.likes}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={() => onPostComment && onPostComment(post.id)}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                {post.comments}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handlePostShare(post.id)}
                className={post.isShared ? "text-primary" : "text-muted-foreground"}
              >
                <Share2 className="w-4 h-4 mr-2" />
                {post.shares}
              </Button>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={() => onPostReport && onPostReport(post.id)}
            >
              <Flag className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderFeed = () => (
    <div className="space-y-6">
      {/* Criar Post */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
              <span className="text-sm font-bold text-white">
                {communityData.user?.name.charAt(0)}
              </span>
            </div>
            <div className="flex-1">
              <Input
                placeholder="O que você está pensando?"
                onClick={() => setShowCreatePost(true)}
                className="cursor-pointer"
              />
            </div>
            <Button
              onClick={() => {
                setShowCreatePost(true);
                onPostCreate && onPostCreate();
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Postar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Posts */}
      {communityData.posts?.map(renderPost)}
    </div>
  );

  const renderGroups = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">
          Grupos
        </h2>
        <Button onClick={() => onCreateGroup && onCreateGroup()}>
          <Plus className="w-4 h-4 mr-2" />
          Criar Grupo
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {communityData.groups?.map((group) => (
          <Card key={group.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{group.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {group.members} membros
                  </p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-3">
                {group.description}
              </p>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <span>{group.posts} posts</span>
                  <Badge variant="outline" className="text-xs">
                    {group.category}
                  </Badge>
                </div>

                <Button
                  size="sm"
                  variant={group.isJoined ? "outline" : "default"}
                  onClick={() => handleJoinGroup(group.id)}
                >
                  {group.isJoined ? "Sair" : "Entrar"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderEvents = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">
        Eventos
      </h2>

      <div className="space-y-4">
        {communityData.events?.map((event) => (
          <Card key={event.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">{event.name}</h3>
                  <p className="text-muted-foreground mb-3">
                    {event.description}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>{new Date(event.date).toLocaleDateString()}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>{event.location}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span>
                        {event.attendees}/{event.maxAttendees} participantes
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end space-y-2">
                  <Button
                    size="sm"
                    variant={event.isAttending ? "outline" : "default"}
                    onClick={() => {
                      // Toggle participação no evento
                      setCommunityData(prev => ({
                        ...prev,
                        events: prev.events?.map(e => 
                          e.id === event.id 
                            ? { ...e, isAttending: !e.isAttending }
                            : e
                        ) || []
                      }));
                      toast.success(
                        event.isAttending 
                          ? "Você cancelou a participação no evento" 
                          : "Você confirmou participação no evento!"
                      );
                    }}
                  >
                    {event.isAttending ? "Participando" : "Participar"}
                  </Button>

                  <div className="text-xs text-muted-foreground">
                    Organizado por {event.organizer.name}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderLeaderboard = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">
        Ranking da Comunidade
      </h2>

      <div className="space-y-4">
        {communityData.leaderboard?.map((player, index) => {
          const TierIcon = getTierIcon(player.tier);
          return (
            <Card key={player.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-8 h-8 bg-muted rounded-full">
                    <span className="font-bold text-sm">#{index + 1}</span>
                  </div>

                  <div className="w-12 h-12 bg-gradient-primary-purple rounded-full flex items-center justify-center">
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
                    <p className="text-sm text-muted-foreground">
                      Nível {player.level} • {player.points} pontos
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-semibold">
                      {player.stats.posts} posts
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {player.stats.followers} seguidores
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );

  const renderTrending = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">
        Tendências
      </h2>

      <Card>
        <CardContent className="p-4">
          <div className="space-y-3">
            {communityData.trending?.map((trend, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">
                      #{index + 1}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold">#{trend.tag}</h3>
                    <p className="text-sm text-muted-foreground">
                      {trend.posts} posts
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {trend.trend === "up" && (
                    <TrendingUp className="w-4 h-4 text-primary" />
                  )}
                  {trend.trend === "down" && (
                    <TrendingDown className="w-4 h-4 text-destructive" />
                  )}
                  {trend.trend === "stable" && (
                    <div className="w-4 h-4 bg-muted-foreground rounded-full"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const tabs = [
    { id: "feed", label: "Feed", icon: MessageCircle },
    { id: "groups", label: "Grupos", icon: Users },
    { id: "events", label: "Eventos", icon: Calendar },
    { id: "leaderboard", label: "Ranking", icon: Trophy },
    { id: "trending", label: "Tendências", icon: TrendingUp },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" role="status" aria-label="Carregando comunidade">
            <span className="sr-only">Carregando comunidade...</span>
          </div>
          <p className="text-muted-foreground">
            Carregando comunidade...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Comunidade
              </h1>
              <p className="text-muted-foreground">
                Conecte-se com outros usuários e compartilhe sua jornada
              </p>
            </div>
          </div>

          <Button 
            variant="outline"
            onClick={async () => {
              setLoading(true);
              try {
                await loadCommunityData();
                toast.success("Dados atualizados!");
              } catch (error) {
                toast.error("Erro ao atualizar dados");
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? "Atualizando..." : "Atualizar"}
          </Button>
        </div>

        {/* Filtros e Busca */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Buscar posts, usuários, grupos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="workout">Treinos</SelectItem>
              <SelectItem value="tip">Dicas</SelectItem>
              <SelectItem value="progress">Progresso</SelectItem>
              <SelectItem value="question">Perguntas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-muted p-1 rounded-lg mb-6">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <IconComponent className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal de Criar Post */}
        {showCreatePost && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-card p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Criar Post</h3>
              <div className="space-y-4">
                <Input
                  placeholder="O que você está pensando?"
                  className="w-full"
                />
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowCreatePost(false)}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={() => setShowCreatePost(false)}>
                    Postar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        {activeTab === "feed" && renderFeed()}
        {activeTab === "groups" && renderGroups()}
        {activeTab === "events" && renderEvents()}
        {activeTab === "leaderboard" && renderLeaderboard()}
        {activeTab === "trending" && renderTrending()}
      </div>
    </div>
  );
};
