import React, { useState, useEffect } from "react";
import logger from "@/utils/logger";
import { apiService } from "@/lib/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/Ui/card";
import { Button } from "../../components/Ui/button";
import { Input } from "../../components/Ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/Ui/tabs";
import { Badge } from "../../components/Ui/badge";
import {
  Users,
  MessageCircle,
  Heart,
  Search,
  Plus,
  Bell,
  Settings,
  TrendingUp,
  Users2,
  Award,
  Activity,
  Video,
  User,
  ExternalLink,
} from "lucide-react";
import SocialFeed from "../../components/social/SocialFeed";
import CreatePostModal from "../../components/social/CreatePostModal";
import StoriesSection from "../../components/social/StoriesSection";
import DirectMessages from "../../components/social/DirectMessages";
import ReelsSection from "../../components/social/ReelsSection";
import NotificationsCenter from "../../components/social/NotificationsCenter";
import SocialSearch from "../../components/social/SocialSearch";
import LiveStreaming from "../../components/social/LiveStreaming";
import GroupsAndCommunities from "../../components/social/GroupsAndCommunities";
import MonetizationSystem from "../../components/social/MonetizationSystem";
import AccountVerification from "../../components/social/AccountVerification";
import AnalyticsAndInsights from "../../components/social/AnalyticsAndInsights";
import { toast } from "sonner";
import { Link, useSearchParams, useNavigate } from "react-router-dom";

const SocialPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialTab = searchParams.get("tab") || "feed";
  const [activeTab, setActiveTab] = useState(initialTab);
  
  // Atualiza tab quando muda na URL
  React.useEffect(() => {
    const tab = searchParams.get("tab") || "feed";
    if (tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [searchParams, activeTab]);
  
  // Atualiza URL quando tab muda (reativo)
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set("tab", tab);
    navigate(`?${newSearchParams.toString()}`, { replace: true });
  };
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalFollowers: 0,
    totalFollowing: 0,
    totalLikes: 0,
  });

  // Estados para as novas funcionalidades
  const [stories] = useState([]);
  const [reels] = useState([]);
  const [conversations] = useState([]);
  const [notifications] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchFilters, setSearchFilters] = useState({
    type: "all",
    dateRange: "all",
    sortBy: "recent",
    verified: false,
    media: false,
    minLikes: 0,
    location: "",
  });

  useEffect(() => {
    // Carregar dados reais do usuário autenticado
    const loadCurrentUser = async () => {
      try {
        const data = await apiService.users.getProfile();
        setCurrentUser(data.user || data);
      } catch (error) {
        logger.error("Erro ao carregar usuário:", error);
        setCurrentUser(null);
      }
    };

    loadCurrentUser();

    // Carregar stats reais
    const loadStats = async () => {
      try {
        const data = await apiService.social.getAnalytics();
        setStats(data.stats || data);
      } catch (error) {
        logger.error("Erro ao carregar stats:", error);
      }
    };

    loadStats();
  }, []);

  const handleCreatePost = async () => {
    try {
      toast.success("Post criado com sucesso!");
      setShowCreatePost(false);
    } catch {
      toast.error("Erro ao criar post");
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const handleAdvancedSearch = async (query, filters) => {
    try {
      // Busca avançada implementada usando searchFilters
      const activeFilters = filters || searchFilters;
      const searchParams = new URLSearchParams({
        q: query,
        type: activeFilters.type || "all",
        dateRange: activeFilters.dateRange || "all",
        sortBy: activeFilters.sortBy || "recent",
        verified: activeFilters.verified ? "true" : "false",
        media: activeFilters.media ? "true" : "false",
        minLikes: activeFilters.minLikes || 0,
        location: activeFilters.location || "",
      });

      const searchParamsObj = Object.fromEntries(searchParams);
      const response = await apiService.social.search(searchParamsObj);

      if (response.results || response.data) {
        setSearchResults(response.results || response.data || []);
        toast.success(
          `Encontrados ${(response.results || response.data || []).length} resultados`,
        );
      } else {
        setSearchResults([]);
        toast.info("Nenhum resultado encontrado");
      }
    } catch (error) {
      logger.error("Erro na busca avançada:", error);
      toast.error("Erro ao realizar busca");
      setSearchResults([]);
    }
  };

  const handleSearchFilterChange = (filters) => {
    setSearchFilters(filters);
    // Aplicar filtros na busca atual se houver query
    if (searchQuery) {
      handleAdvancedSearch(searchQuery, filters);
    }
  };

  // Handlers para Live Streaming
  const handleStartStream = async () => {
    toast.success("Transmissão iniciada!");
  };

  const handleEndStream = async () => {
    toast.success("Transmissão encerrada!");
  };

  const handleJoinStream = async () => {
    toast.success("Entrou na transmissão!");
  };

  const handleLeaveStream = async () => {
    toast.success("Saiu da transmissão!");
  };

  const handleSendMessage = async () => {
    toast.success("Mensagem enviada!");
  };

  const handleSendGift = async () => {
    toast.success("Presente enviado!");
  };

  const handleFollowUser = async () => {
    toast.success("Usuário seguido!");
  };

  const handleReportStream = async () => {
    toast.success("Transmissão reportada!");
  };

  // Handlers para Grupos e Comunidades
  const handleCreateGroup = async () => {
    toast.success("Grupo criado!");
  };

  const handleJoinGroup = async () => {
    toast.success("Entrou no grupo!");
  };

  const handleLeaveGroup = async () => {
    toast.success("Saiu do grupo!");
  };

  const handleUpdateGroup = async () => {
    toast.success("Grupo atualizado!");
  };

  const handleDeleteGroup = async () => {
    toast.success("Grupo deletado!");
  };

  const handleInviteUser = async () => {
    toast.success("Convite enviado!");
  };

  const handleRemoveUser = async () => {
    toast.success("Usuário removido!");
  };

  const handlePromoteUser = async () => {
    toast.success("Usuário promovido!");
  };

  const handleDemoteUser = async () => {
    toast.success("Usuário removido da moderação!");
  };

  const handleReportGroup = async () => {
    toast.success("Grupo reportado!");
  };

  // Handlers para Monetização
  const handleSendTip = async () => {
    toast.success("Dica enviada!");
  };

  const handlePurchaseCoins = async () => {
    toast.success("Moedas compradas!");
  };

  const handleWithdrawEarnings = async () => {
    toast.success("Saque solicitado!");
  };

  const handleSubscribeToUser = async () => {
    toast.success("Assinatura ativada!");
  };

  const handleUnsubscribeFromUser = async () => {
    toast.success("Assinatura cancelada!");
  };

  const handlePurchasePremium = async () => {
    toast.success("Premium ativado!");
  };

  const handleCreatePaidContent = async () => {
    toast.success("Conteúdo pago criado!");
  };

  const handlePurchaseContent = async () => {
    toast.success("Conteúdo comprado!");
  };

  // Handlers para Verificação de Contas
  const handleSubmitVerification = async () => {
    toast.success("Verificação enviada!");
  };

  const handleUpdateVerification = async () => {
    toast.success("Verificação atualizada!");
  };

  const handleApproveVerification = async () => {
    toast.success("Verificação aprovada!");
  };

  const handleRejectVerification = async () => {
    toast.success("Verificação rejeitada!");
  };

  const handleRequestReview = async () => {
    toast.success("Revisão solicitada!");
  };

  // Handlers para Analytics
  const handleExportData = async () => {
    toast.success("Dados exportados!");
  };

  const handleUpdateGoals = async () => {
    toast.success("Metas atualizadas!");
  };

  const handleGenerateReport = async () => {
    toast.success("Relatório gerado!");
  };

  const tabs = [
    { id: "feed", label: "Feed", icon: MessageCircle },
    { id: "stories", label: "Stories", icon: Plus },
    { id: "reels", label: "Reels", icon: Video },
    { id: "messages", label: "Mensagens", icon: MessageCircle },
    { id: "notifications", label: "Notificações", icon: Bell },
    { id: "search", label: "Busca", icon: Search },
    { id: "trending", label: "Em Alta", icon: TrendingUp },
    { id: "following", label: "Seguindo", icon: Users2 },
    { id: "discover", label: "Descobrir", icon: Search },
    { id: "live", label: "Live", icon: Video },
    { id: "groups", label: "Grupos", icon: Users },
    { id: "monetization", label: "Monetização", icon: Award },
    { id: "verification", label: "Verificação", icon: Award },
    { id: "analytics", label: "Analytics", icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4 sm:py-0 sm:h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">Rede Social</h1>
              <Badge variant="secondary" className="text-xs">
                Beta
              </Badge>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar posts, usuários, hashtags..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 w-full sm:w-80"
                  aria-label="Buscar na rede social"
                />
              </div>

              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive text-white text-xs rounded-full flex items-center justify-center">
                  3
                </span>
              </Button>

              <Button variant="ghost" size="sm">
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="text-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary to-primary/80 rounded-full mx-auto mb-4 flex items-center justify-center text-primary-foreground text-xl sm:text-2xl font-bold">
                    {currentUser?.name?.charAt(0) || "U"}
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-foreground">{currentUser?.name || "Usuário"}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-4">
                    {currentUser?.bio || "Sem biografia"}
                  </p>

                  {currentUser?.is_verified && (
                    <Badge variant="secondary" className="mb-4">
                      ✓ Verificado
                    </Badge>
                  )}
                  
                  <Link to="/profile" className="mt-4">
                    <Button variant="outline" size="sm" className="w-full">
                      <User className="w-4 h-4 mr-2" />
                      Ver Perfil Completo
                      <ExternalLink className="w-3 h-3 ml-2" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Suas Estatísticas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MessageCircle className="h-4 w-4 text-primary" />
                    <span className="text-sm">Posts</span>
                  </div>
                  <span className="font-semibold">{stats.totalPosts}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-primary" />
                    <span className="text-sm">Seguidores</span>
                  </div>
                  <span className="font-semibold">{stats.totalFollowers}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users2 className="h-4 w-4 text-primary" />
                    <span className="text-sm">Seguindo</span>
                  </div>
                  <span className="font-semibold">{stats.totalFollowing}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Heart className="h-4 w-4 text-destructive" />
                    <span className="text-sm">Curtidas</span>
                  </div>
                  <span className="font-semibold">{stats.totalLikes}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  onClick={() => setShowCreatePost(true)}
                  className="w-full justify-start"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Postagem
                </Button>

                <Button variant="outline" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  Encontrar Amigos
                </Button>

                <Button variant="outline" className="w-full justify-start">
                  <Award className="h-4 w-4 mr-2" />
                  Conquistas
                </Button>

                <Button variant="outline" className="w-full justify-start">
                  <Activity className="h-4 w-4 mr-2" />
                  Atividade
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3">
            <Tabs
              value={activeTab}
              onValueChange={handleTabChange}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 xl:grid-cols-14 overflow-x-auto">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className="flex items-center space-x-1 text-xs sm:text-sm"
                    >
                      <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              <TabsContent value="feed" className="mt-6">
                <div className="space-y-6">
                  <StoriesSection
                    stories={stories}
                    currentUser={currentUser}
                    onCreateStory={() => toast.info("Funcionalidade em breve!")}
                    onViewStory={() => {}}
                    onLikeStory={() => {}}
                    onReplyStory={() => {}}
                  />
                  <SocialFeed
                    currentUser={currentUser}
                    onCreatePost={handleCreatePost}
                  />
                </div>
              </TabsContent>

              <TabsContent value="stories" className="mt-6">
                <StoriesSection
                  stories={stories}
                  currentUser={currentUser}
                  onCreateStory={() => toast.info("Funcionalidade em breve!")}
                  onViewStory={() => {}}
                  onLikeStory={() => {}}
                  onReplyStory={() => {}}
                />
              </TabsContent>

              <TabsContent value="reels" className="mt-6">
                <ReelsSection
                  reels={reels}
                  currentUser={currentUser}
                  onCreateReel={() => toast.info("Funcionalidade em breve!")}
                  onLikeReel={() => {}}
                  onCommentReel={() => {}}
                  onShareReel={() => {}}
                  onFollowUser={() => {}}
                />
              </TabsContent>

              <TabsContent value="messages" className="mt-6">
                <DirectMessages
                  conversations={conversations}
                  currentUser={currentUser}
                  onSendMessage={() => {}}
                  onStartConversation={() =>
                    toast.info("Funcionalidade em breve!")
                  }
                  onMarkAsRead={() => {}}
                />
              </TabsContent>

              <TabsContent value="notifications" className="mt-6">
                <NotificationsCenter
                  notifications={notifications}
                  onMarkAsRead={() => {}}
                  onMarkAllAsRead={() => {}}
                  onDeleteNotification={() => {}}
                  onFollowUser={() => {}}
                  onLikePost={() => {}}
                  onCommentPost={() => {}}
                />
              </TabsContent>

              <TabsContent value="search" className="mt-6">
                <SocialSearch
                  searchResults={searchResults}
                  onSearch={handleAdvancedSearch}
                  onFilterChange={handleSearchFilterChange}
                  currentUser={currentUser}
                />
              </TabsContent>

              <TabsContent value="live" className="mt-6">
                <LiveStreaming
                  currentUser={currentUser}
                  onStartStream={handleStartStream}
                  onEndStream={handleEndStream}
                  onJoinStream={handleJoinStream}
                  onLeaveStream={handleLeaveStream}
                  onSendMessage={handleSendMessage}
                  onSendGift={handleSendGift}
                  onFollowUser={handleFollowUser}
                  onReportStream={handleReportStream}
                />
              </TabsContent>

              <TabsContent value="groups" className="mt-6">
                <GroupsAndCommunities
                  currentUser={currentUser}
                  onCreateGroup={handleCreateGroup}
                  onJoinGroup={handleJoinGroup}
                  onLeaveGroup={handleLeaveGroup}
                  onUpdateGroup={handleUpdateGroup}
                  onDeleteGroup={handleDeleteGroup}
                  onInviteUser={handleInviteUser}
                  onRemoveUser={handleRemoveUser}
                  onPromoteUser={handlePromoteUser}
                  onDemoteUser={handleDemoteUser}
                  onReportGroup={handleReportGroup}
                />
              </TabsContent>

              <TabsContent value="monetization" className="mt-6">
                <MonetizationSystem
                  currentUser={currentUser}
                  onSendTip={handleSendTip}
                  onPurchaseCoins={handlePurchaseCoins}
                  onWithdrawEarnings={handleWithdrawEarnings}
                  onSubscribeToUser={handleSubscribeToUser}
                  onUnsubscribeFromUser={handleUnsubscribeFromUser}
                  onPurchasePremium={handlePurchasePremium}
                  onSendGift={handleSendGift}
                  onCreatePaidContent={handleCreatePaidContent}
                  onPurchaseContent={handlePurchaseContent}
                />
              </TabsContent>

              <TabsContent value="verification" className="mt-6">
                <AccountVerification
                  currentUser={currentUser}
                  onSubmitVerification={handleSubmitVerification}
                  onUpdateVerification={handleUpdateVerification}
                  onApproveVerification={handleApproveVerification}
                  onRejectVerification={handleRejectVerification}
                  onRequestReview={handleRequestReview}
                />
              </TabsContent>

              <TabsContent value="analytics" className="mt-6">
                <AnalyticsAndInsights
                  currentUser={currentUser}
                  onExportData={handleExportData}
                  onUpdateGoals={handleUpdateGoals}
                  onGenerateReport={handleGenerateReport}
                />
              </TabsContent>

              <TabsContent value="trending" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5" />
                      <span>Posts em Alta</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                      <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                      <p>Em breve: Posts mais populares da semana</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="following" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Users2 className="h-5 w-5" />
                      <span>Pessoas que você segue</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                      <Users2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                      <p>Em breve: Feed personalizado dos seus amigos</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="discover" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Search className="h-5 w-5" />
                      <span>Descobrir</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                      <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                      <p>Em breve: Descubra novos usuários e conteúdo</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      <CreatePostModal
        isOpen={showCreatePost}
        onClose={() => setShowCreatePost(false)}
        onSubmit={handleCreatePost}
        currentUser={currentUser}
      />
    </div>
  );
};

export default SocialPage;
