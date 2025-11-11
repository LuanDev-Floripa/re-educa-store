import React, { useState, useEffect } from "react";
import logger from "@/utils/logger";
import apiClient from "@/services/apiClient";
/**
 * Grupos e Comunidades do Social.
 * - Descoberta, meus grupos, trending e recomendados
 * - Fallbacks para listas e handlers opcionais
 */
import { Card, CardContent, CardHeader, CardTitle } from "../Ui/card";
import { Button } from "../Ui/button";
import { Input } from "../Ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "../Ui/avatar";
import { Badge } from "../Ui/badge";
import { Progress } from "../Ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../Ui/tabs";
import {
  Users,
  Plus,
  Search,
  Settings,
  Crown,
  Shield,
  Star,
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Eye,
  Clock,
  MapPin,
  Calendar,
  Award,
  Zap,
  TrendingUp,
  Filter,
  X,
  Check,
  UserPlus,
  UserMinus,
  Lock,
  Unlock,
  Edit,
  Trash2,
  Flag,
  Bell,
  BellOff,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { apiService } from "../../lib/api";

const GroupsAndCommunities = ({
  onCreateGroup,
  onJoinGroup,
  onLeaveGroup,
  onUpdateGroup,
  onDeleteGroup,
  onPromoteUser,
  onDemoteUser,
}) => {
  const [groups, setGroups] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [trendingGroups, setTrendingGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortBy, setSortBy] = useState("popular");
  const [newGroup, setNewGroup] = useState({
    name: "",
    description: "",
    category: "fitness",
    privacy: "public",
    rules: "",
    tags: [],
  });

  // Carregar grupos reais da API - código consolidado sem duplicação
  const loadGroups = async () => {
    try {
      if (!apiClient.token) {
        setGroups([]);
        setMyGroups([]);
        setTrendingGroups([]);
        return;
      }

      // Carregar todos os grupos e meus grupos em paralelo
      const [groupsResponse, myGroupsResponse] = await Promise.all([
        apiService.social.getGroups({ privacy: 'public' }).catch(() => ({ groups: [] })),
        apiService.social.getMyGroups().catch(() => ({ groups: [] })),
      ]);

      // Grupos públicos
      if (groupsResponse.groups) {
        setGroups(groupsResponse.groups || []);
        // Trending = grupos mais recentes (primeiros 5)
        setTrendingGroups(groupsResponse.groups.slice(0, 5) || []);
      } else {
        setGroups([]);
        setTrendingGroups([]);
      }

      // Meus grupos
      if (myGroupsResponse.groups) {
        setMyGroups(myGroupsResponse.groups || []);
      } else {
        setMyGroups([]);
      }
    } catch (error) {
      logger.error("Erro ao carregar grupos:", error);
      setGroups([]);
      setMyGroups([]);
      setTrendingGroups([]);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);


  const handleCreateGroup = async () => {
    if (!newGroup.name.trim()) {
      toast.error("Digite um nome para o grupo");
      return;
    }

    try {
      const groupData = {
        name: newGroup.name,
        description: newGroup.description,
        category: newGroup.category,
        privacy: newGroup.privacy,
        rules: newGroup.rules,
        tags: newGroup.tags,
      };

      const response = await apiService.social.createGroup(groupData);

      if (response.success && response.group) {
        // Atualizar lista de grupos
        setGroups(prev => [response.group, ...prev]);
        setMyGroups(prev => [response.group, ...prev]);
        
        setShowCreateModal(false);
        setNewGroup({
          name: "",
          description: "",
          category: "fitness",
          privacy: "public",
          rules: "",
          tags: [],
        });
        toast.success("Grupo criado com sucesso!");
        
        // Recarregar grupos
        await loadGroups();
        
        // Callback opcional
        if (onCreateGroup) {
          onCreateGroup(response.group);
        }
      } else {
        throw new Error(response.error || "Erro ao criar grupo");
      }
    } catch (error) {
      logger.error("Erro ao criar grupo:", error);
      toast.error(error.message || "Erro ao criar grupo");
    }
  };

  const handleJoinGroup = async (groupId) => {
    try {
      const response = await apiService.social.joinGroup(groupId);

      if (response.success) {
        // Atualizar estado local
        setGroups((prev) =>
          prev.map((g) =>
            g.id === groupId
              ? { ...g, isJoined: true, members_count: (g.members_count || 0) + 1 }
              : g,
          ),
        );
        setMyGroups((prev) => {
          const group = groups.find(g => g.id === groupId);
          if (group && !prev.find(g => g.id === groupId)) {
            return [...prev, { ...group, isJoined: true }];
          }
          return prev;
        });
        
        toast.success(response.message || "Você entrou no grupo!");
        
        // Callback opcional
        if (onJoinGroup) {
          onJoinGroup(groupId);
        }
      } else {
        throw new Error(response.error || "Erro ao entrar no grupo");
      }
    } catch (error) {
      logger.error("Erro ao entrar no grupo:", error);
      toast.error(error.message || "Erro ao entrar no grupo");
    }
  };

  const handleLeaveGroup = async (groupId) => {
    try {
      const response = await apiService.social.leaveGroup(groupId);

      if (response.success) {
        // Atualizar estado local
        setGroups((prev) =>
          prev.map((g) =>
            g.id === groupId
              ? { ...g, isJoined: false, members_count: Math.max((g.members_count || 1) - 1, 0) }
              : g,
          ),
        );
        setMyGroups((prev) => prev.filter((g) => g.id !== groupId));
        
        toast.success(response.message || "Você saiu do grupo");
        
        // Recarregar grupos
        await loadGroups();
        
        // Callback opcional
        if (onLeaveGroup) {
          onLeaveGroup(groupId);
        }
      } else {
        throw new Error(response.error || "Erro ao sair do grupo");
      }
    } catch (error) {
      logger.error("Erro ao sair do grupo:", error);
      toast.error(error.message || "Erro ao sair do grupo");
    }
  };


  const handlePromoteUser = async (groupId, userId) => {
    try {
      // Usar onPromoteUser se disponível
      if (onPromoteUser) {
        await onPromoteUser(groupId, userId);
      }

      toast.success("Usuário promovido a moderador");
    } catch {
      toast.error("Erro ao promover usuário");
    }
  };

  const handleDemoteUser = async (groupId, userId) => {
    try {
      // Usar onDemoteUser se disponível
      if (onDemoteUser) {
        await onDemoteUser(groupId, userId);
      }

      toast.success("Usuário removido da moderação");
    } catch {
      toast.error("Erro ao remover da moderação");
    }
  };


  const filteredGroups = groups.filter((group) => {
    const matchesSearch =
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      filterCategory === "all" || group.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [
    { value: "all", label: "Todos", icon: "🌐" },
    { value: "fitness", label: "Fitness", icon: "💪" },
    { value: "yoga", label: "Yoga", icon: "🧘" },
    { value: "nutrition", label: "Nutrição", icon: "🥗" },
    { value: "running", label: "Corrida", icon: "🏃" },
    { value: "cycling", label: "Ciclismo", icon: "🚴" },
    { value: "swimming", label: "Natação", icon: "🏊" },
    { value: "dance", label: "Dança", icon: "💃" },
    { value: "other", label: "Outros", icon: "🎯" },
  ];

  const privacyOptions = [
    {
      value: "public",
      label: "Público",
      icon: "🌐",
      description: "Qualquer um pode ver e entrar",
    },
    {
      value: "private",
      label: "Privado",
      icon: "🔒",
      description: "Apenas membros convidados",
    },
    {
      value: "secret",
      label: "Secreto",
      icon: "🤫",
      description: "Apenas membros podem encontrar",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Grupos e Comunidades
          </h2>
          <p className="text-muted-foreground dark:text-muted-foreground">
            Conecte-se com pessoas que compartilham seus interesses
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Criar Grupo
        </Button>
      </div>

      {/* Filtros e Busca */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar grupos..."
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background border-border text-foreground"
              >
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.icon} {category.label}
                  </option>
                ))}
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background border-border text-foreground"
              >
                <option value="popular">Mais Populares</option>
                <option value="recent">Mais Recentes</option>
                <option value="members">Mais Membros</option>
                <option value="activity">Mais Ativos</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="discover" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="discover">Descobrir</TabsTrigger>
          <TabsTrigger value="my-groups">Meus Grupos</TabsTrigger>
          <TabsTrigger value="trending">Em Alta</TabsTrigger>
          <TabsTrigger value="recommended">Recomendados</TabsTrigger>
        </TabsList>

        {/* Descobrir Grupos */}
        <TabsContent value="discover" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGroups.map((group) => (
              <Card
                key={group.id}
                className="overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="relative">
                  <img
                    src={group.cover}
                    alt={group.name}
                    className="w-full h-32 object-cover"
                  />
                  <div className="absolute top-2 left-2">
                    <Badge
                      variant={
                        group.privacy === "public" ? "default" : "secondary"
                      }
                    >
                      {group.privacy === "public"
                        ? "🌐"
                        : group.privacy === "private"
                          ? "🔒"
                          : "🤫"}
                    </Badge>
                  </div>
                  <div className="absolute top-2 right-2">
                    <Badge variant="outline" className="bg-white/90">
                      <Users className="w-3 h-3 mr-1" />
                      {group.members.toLocaleString()}
                    </Badge>
                  </div>
                  <div className="absolute -bottom-6 left-4">
                    <Avatar className="w-12 h-12 border-4 border-white">
                      <AvatarImage src={group.avatar} />
                      <AvatarFallback>{group.name[0]}</AvatarFallback>
                    </Avatar>
                  </div>
                </div>
                <CardContent className="pt-8">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground text-lg">
                        {group.name}
                      </h3>
                      {group.isVerified && (
                        <Badge variant="secondary" className="text-xs mt-1">
                          ✓ Verificado
                        </Badge>
                      )}
                    </div>
                    <div className="flex space-x-1">
                      {group.isAdmin && (
                        <>
                          <Button
                            onClick={() =>
                              onUpdateGroup && onUpdateGroup(group)
                            }
                            variant="ghost"
                            size="sm"
                            title="Editar grupo"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() =>
                              onDeleteGroup && onDeleteGroup(group.id)
                            }
                            variant="ghost"
                            size="sm"
                            title="Excluir grupo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      <Button
                        onClick={() => setSelectedGroup(group)}
                        variant="ghost"
                        size="sm"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground dark:text-muted-foreground mb-3 line-clamp-2">
                    {group.description}
                  </p>

                  <div className="flex flex-wrap gap-1 mb-3">
                    {(group.tags || []).slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-sm text-muted-foreground dark:text-muted-foreground mb-3">
                    <span className="flex items-center space-x-1">
                      <MessageCircle className="w-3 h-3" />
                      <span>{group.posts} posts</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>
                        {formatDistanceToNow(group.createdAt, {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </span>
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {group.isJoined ? (
                      <Button
                        onClick={() => handleLeaveGroup(group.id)}
                        variant="outline"
                        className="flex-1"
                      >
                        <UserMinus className="w-4 h-4 mr-2" />
                        Sair
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleJoinGroup(group.id)}
                        className="flex-1"
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Entrar
                      </Button>
                    )}
                    <Button
                      onClick={() => setSelectedGroup(group)}
                      variant="outline"
                      size="sm"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Meus Grupos */}
        <TabsContent value="my-groups" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myGroups.map((group) => (
              <Card
                key={group.id}
                className="overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="relative">
                  <img
                    src={group.cover}
                    alt={group.name}
                    className="w-full h-32 object-cover"
                  />
                  <div className="absolute top-2 left-2">
                    <Badge
                      variant={
                        group.isAdmin
                          ? "destructive"
                          : group.isModerator
                            ? "default"
                            : "secondary"
                      }
                    >
                      {group.isAdmin
                        ? "👑 Admin"
                        : group.isModerator
                          ? "🛡️ Mod"
                          : "👤 Membro"}
                    </Badge>
                  </div>
                  <div className="absolute top-2 right-2">
                    <Badge variant="outline" className="bg-white/90">
                      <Users className="w-3 h-3 mr-1" />
                      {group.members.toLocaleString()}
                    </Badge>
                  </div>
                  <div className="absolute -bottom-6 left-4">
                    <Avatar className="w-12 h-12 border-4 border-white">
                      <AvatarImage src={group.avatar} />
                      <AvatarFallback>{group.name[0]}</AvatarFallback>
                    </Avatar>
                  </div>
                </div>
                <CardContent className="pt-8">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground text-lg">
                        {group.name}
                      </h3>
                      {group.isVerified && (
                        <Badge variant="secondary" className="text-xs mt-1">
                          ✓ Verificado
                        </Badge>
                      )}
                    </div>
                    <Button
                      onClick={() => setSelectedGroup(group)}
                      variant="ghost"
                      size="sm"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>

                  <p className="text-sm text-muted-foreground dark:text-muted-foreground mb-3 line-clamp-2">
                    {group.description}
                  </p>

                  <div className="flex items-center justify-between text-sm text-muted-foreground dark:text-muted-foreground mb-3">
                    <span className="flex items-center space-x-1">
                      <MessageCircle className="w-3 h-3" />
                      <span>{group.posts} posts</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>
                        {formatDistanceToNow(group.createdAt, {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </span>
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => setSelectedGroup(group)}
                      className="flex-1"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Ver Grupo
                    </Button>
                    {(group.isAdmin || group.isModerator) && (
                      <Button
                        onClick={() => {
                          setSelectedGroup(group);
                          setShowInviteModal(true);
                        }}
                        variant="outline"
                        size="sm"
                      >
                        <UserPlus className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Em Alta */}
        <TabsContent value="trending" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trendingGroups.map((group) => (
              <Card
                key={group.id}
                className="overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="relative">
                  <img
                    src={group.cover}
                    alt={group.name}
                    className="w-full h-32 object-cover"
                  />
                  <div className="absolute top-2 left-2">
                    <Badge
                      variant="destructive"
                      className="flex items-center space-x-1"
                    >
                      <TrendingUp className="w-3 h-3" />
                      <span>Em Alta</span>
                    </Badge>
                  </div>
                  <div className="absolute top-2 right-2">
                    <Badge variant="outline" className="bg-white/90">
                      <Users className="w-3 h-3 mr-1" />
                      {group.members.toLocaleString()}
                    </Badge>
                  </div>
                  <div className="absolute -bottom-6 left-4">
                    <Avatar className="w-12 h-12 border-4 border-white">
                      <AvatarImage src={group.avatar} />
                      <AvatarFallback>{group.name[0]}</AvatarFallback>
                    </Avatar>
                  </div>
                </div>
                <CardContent className="pt-8">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground text-lg">
                        {group.name}
                      </h3>
                      {group.isVerified && (
                        <Badge variant="secondary" className="text-xs mt-1">
                          ✓ Verificado
                        </Badge>
                      )}
                    </div>
                    <Button
                      onClick={() => setSelectedGroup(group)}
                      variant="ghost"
                      size="sm"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>

                  <p className="text-sm text-muted-foreground dark:text-muted-foreground mb-3 line-clamp-2">
                    {group.description}
                  </p>

                  <div className="flex items-center justify-between text-sm text-muted-foreground dark:text-muted-foreground mb-3">
                    <span className="flex items-center space-x-1">
                      <MessageCircle className="w-3 h-3" />
                      <span>{group.posts} posts</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>
                        {formatDistanceToNow(group.createdAt, {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </span>
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {group.isJoined ? (
                      <Button
                        onClick={() => handleLeaveGroup(group.id)}
                        variant="outline"
                        className="flex-1"
                      >
                        <UserMinus className="w-4 h-4 mr-2" />
                        Sair
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleJoinGroup(group.id)}
                        className="flex-1"
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Entrar
                      </Button>
                    )}
                    <Button
                      onClick={() => setSelectedGroup(group)}
                      variant="outline"
                      size="sm"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Recomendados */}
        <TabsContent value="recommended" className="space-y-4">
          <div className="text-center py-8">
            <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Grupos Recomendados
            </h3>
            <p className="text-muted-foreground dark:text-muted-foreground">
              Baseado nos seus interesses e atividade
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal de Criar Grupo */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Criar Novo Grupo</CardTitle>
              <Button
                onClick={() => setShowCreateModal(false)}
                variant="ghost"
                size="sm"
              >
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground dark:text-muted-foreground mb-2">
                  Nome do Grupo
                </label>
                <Input
                  value={newGroup.name}
                  onChange={(e) =>
                    setNewGroup((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Ex: Fitness Enthusiasts"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground dark:text-muted-foreground mb-2">
                  Descrição
                </label>
                <textarea
                  value={newGroup.description}
                  onChange={(e) =>
                    setNewGroup((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Descreva o propósito do grupo..."
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background border-border text-foreground"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground dark:text-muted-foreground mb-2">
                    Categoria
                  </label>
                  <select
                    value={newGroup.category}
                    onChange={(e) =>
                      setNewGroup((prev) => ({
                        ...prev,
                        category: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background border-border text-foreground"
                  >
                    {categories.slice(1).map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.icon} {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground dark:text-muted-foreground mb-2">
                    Privacidade
                  </label>
                  <select
                    value={newGroup.privacy}
                    onChange={(e) =>
                      setNewGroup((prev) => ({
                        ...prev,
                        privacy: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background border-border text-foreground"
                  >
                    {privacyOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.icon} {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground dark:text-muted-foreground mb-2">
                  Regras do Grupo
                </label>
                <textarea
                  value={newGroup.rules}
                  onChange={(e) =>
                    setNewGroup((prev) => ({ ...prev, rules: e.target.value }))
                  }
                  placeholder="Liste as regras do grupo (uma por linha)..."
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background border-border text-foreground"
                  rows={4}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  onClick={() => setShowCreateModal(false)}
                  variant="outline"
                >
                  Cancelar
                </Button>
                <Button onClick={handleCreateGroup}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Grupo
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Detalhes do Grupo */}
      {selectedGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={selectedGroup.avatar} />
                  <AvatarFallback>{selectedGroup.name[0]}</AvatarFallback>
                </Avatar>
                <span>{selectedGroup.name}</span>
              </CardTitle>
              <Button
                onClick={() => setSelectedGroup(null)}
                variant="ghost"
                size="sm"
              >
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Informações do Grupo */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Sobre o Grupo
                    </h3>
                    <p className="text-muted-foreground dark:text-muted-foreground">
                      {selectedGroup.description}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-foreground mb-2">
                      Regras
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground dark:text-muted-foreground">
                      {(selectedGroup.rules || []).map((rule, index) => (
                        <li key={index}>{rule}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium text-foreground mb-2">
                      Tags
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {(selectedGroup.tags || []).map((tag) => (
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-foreground">
                      {selectedGroup.members.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground dark:text-muted-foreground">
                      Membros
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-3xl font-bold text-foreground">
                      {selectedGroup.posts.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground dark:text-muted-foreground">
                      Posts
                    </div>
                  </div>

                  <div className="flex items-center justify-center space-x-2">
                    {selectedGroup.isJoined ? (
                      <Button
                        onClick={() => handleLeaveGroup(selectedGroup.id)}
                        variant="outline"
                        className="flex-1"
                      >
                        <UserMinus className="w-4 h-4 mr-2" />
                        Sair
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleJoinGroup(selectedGroup.id)}
                        className="flex-1"
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Entrar
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Moderadores */}
              <div>
                <h4 className="font-medium text-foreground mb-3">
                  Moderadores
                </h4>
                <div className="space-y-2">
                  {(selectedGroup.moderators || []).map((moderator) => (
                    <div
                      key={moderator.id}
                      className="flex items-center justify-between p-2 bg-muted rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={moderator.avatar} />
                          <AvatarFallback>{moderator.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-foreground">
                            {moderator.name}
                          </div>
                          <div className="text-sm text-muted-foreground dark:text-muted-foreground">
                            {moderator.role === "admin"
                              ? "Administrador"
                              : "Moderador"}
                          </div>
                        </div>
                      </div>
                      {(selectedGroup.isAdmin || selectedGroup.isModerator) && (
                        <div className="flex items-center space-x-1">
                          <Button
                            onClick={() =>
                              handlePromoteUser(selectedGroup.id, moderator.id)
                            }
                            variant="ghost"
                            size="sm"
                          >
                            <Crown className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() =>
                              handleDemoteUser(selectedGroup.id, moderator.id)
                            }
                            variant="ghost"
                            size="sm"
                          >
                            <UserMinus className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Posts Recentes */}
              <div>
                <h4 className="font-medium text-foreground mb-3">
                  Posts Recentes
                </h4>
                <div className="space-y-3">
                  {(selectedGroup.recentPosts || []).map((post) => (
                    <div
                      key={post.id}
                      className="p-3 bg-muted rounded-lg"
                    >
                      <div className="flex items-start space-x-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={post.user.avatar} />
                          <AvatarFallback>{post.user.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-foreground">
                              {post.user.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(post.timestamp, {
                                addSuffix: true,
                                locale: ptBR,
                              })}
                            </span>
                          </div>
                          <p className="text-foreground text-sm">
                            {post.content}
                          </p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center space-x-1">
                              <Heart className="w-3 h-3" />
                              <span>{post.likes}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <MessageCircle className="w-3 h-3" />
                              <span>{post.comments}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Convite de Usuário */}
      {showInviteModal && selectedGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Convidar Usuário para {selectedGroup.name}</CardTitle>
              <Button
                onClick={() => {
                  setShowInviteModal(false);
                  setSelectedGroup(null);
                }}
                variant="ghost"
                size="sm"
              >
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  const userId = formData.get("user_id");

                  try {
                    const response = await apiClient.post(
                      `/social/groups/${selectedGroup.id}/invite`,
                      { user_id: userId }
                    );

                    if (response.success) {
                      toast.success("Usuário convidado com sucesso!");
                      setShowInviteModal(false);
                      setSelectedGroup(null);
                    } else {
                      toast.error(response.error || "Erro ao convidar usuário");
                    }
                  } catch (error) {
                    logger.error("Erro ao convidar usuário:", error);
                    toast.error("Erro ao convidar usuário");
                  }
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium mb-2">
                    ID do Usuário
                  </label>
                  <Input
                    name="user_id"
                    placeholder="Digite o ID do usuário"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowInviteModal(false);
                      setSelectedGroup(null);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Convidar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default GroupsAndCommunities;
