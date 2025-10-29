import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../Ui/card';
import { Button } from '../Ui/button';
import { Input } from '../Ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '../Ui/avatar';
import { Badge } from '../Ui/badge';
import { Progress } from '../Ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../Ui/tabs';
import {
  Users, Plus, Search, Settings, Crown, Shield, Star, Heart, MessageCircle, Share2, 
  MoreHorizontal, Eye, Clock, MapPin, Calendar, Award, Zap, TrendingUp, Filter,
  X, Check, UserPlus, UserMinus, Lock, Unlock, Edit, Trash2, Flag, Bell, BellOff
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

const GroupsAndCommunities = ({ 
  currentUser, 
  onCreateGroup, 
  onJoinGroup, 
  onLeaveGroup, 
  onUpdateGroup, 
  onDeleteGroup,
  onInviteUser,
  onRemoveUser,
  onPromoteUser,
  onDemoteUser,
  onReportGroup
}) => {
  const [groups, setGroups] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [trendingGroups, setTrendingGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('popular');
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    category: 'fitness',
    privacy: 'public',
    rules: '',
    tags: []
  });

  // Carregar grupos reais da API - código consolidado sem duplicação
  useEffect(() => {
    const loadGroups = async () => {
      try {
        const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
        
        if (!token) {
          setGroups([]);
          setMyGroups([]);
          setTrendingGroups([]);
          return;
        }

        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };

        // Carregar todos os grupos, meus grupos e trending em paralelo
        const [groupsResponse, myGroupsResponse, trendingResponse] = await Promise.all([
          fetch('/api/social/groups', { headers }).catch(() => ({ ok: false })),
          fetch('/api/social/groups/my', { headers }).catch(() => ({ ok: false })),
          fetch('/api/social/groups/trending', { headers }).catch(() => ({ ok: false }))
        ]);

        if (groupsResponse.ok) {
          const data = await groupsResponse.json();
          setGroups(data.groups || []);
        } else {
          setGroups([]);
        }

        if (myGroupsResponse.ok) {
          const data = await myGroupsResponse.json();
          setMyGroups(data.groups || []);
        } else {
          setMyGroups([]);
        }

        if (trendingResponse.ok) {
          const data = await trendingResponse.json();
          setTrendingGroups(data.groups || []);
        } else {
          setTrendingGroups([]);
        }
      } catch (error) {
        console.error('Erro ao carregar grupos:', error);
        setGroups([]);
        setMyGroups([]);
        setTrendingGroups([]);
      }
    };

    loadGroups();
  }, []);

  // Todos os dados mockados foram completamente removidos - usando API real acima

  const handleCreateGroup = async () => {
    if (!newGroup.name.trim()) {
      toast.error('Digite um nome para o grupo');
      return;
    }

    try {
      const groupData = {
        ...newGroup,
        user: currentUser,
        createdAt: new Date()
      };

      // Usar onCreateGroup se disponível
      if (onCreateGroup) {
        await onCreateGroup(groupData);
      }
      
      setShowCreateModal(false);
      setNewGroup({
        name: '',
        description: '',
        category: 'fitness',
        privacy: 'public',
        rules: '',
        tags: []
      });
      toast.success('Grupo criado com sucesso!');
    } catch (error) {
      toast.error('Erro ao criar grupo');
    }
  };

  const handleJoinGroup = async (groupId) => {
    try {
      // Usar onJoinGroup se disponível
      if (onJoinGroup) {
        await onJoinGroup(groupId);
      }
      
      setGroups(prev => prev.map(g => 
        g.id === groupId ? { ...g, isJoined: true, members: g.members + 1 } : g
      ));
      toast.success('Você entrou no grupo!');
    } catch (error) {
      toast.error('Erro ao entrar no grupo');
    }
  };

  const handleLeaveGroup = async (groupId) => {
    try {
      // Usar onLeaveGroup se disponível
      if (onLeaveGroup) {
        await onLeaveGroup(groupId);
      }
      
      setGroups(prev => prev.map(g => 
        g.id === groupId ? { ...g, isJoined: false, members: g.members - 1 } : g
      ));
      setMyGroups(prev => prev.filter(g => g.id !== groupId));
      toast.success('Você saiu do grupo');
    } catch (error) {
      toast.error('Erro ao sair do grupo');
    }
  };

  const handleInviteUser = async (groupId, userId) => {
    try {
      // Usar onInviteUser se disponível
      if (onInviteUser) {
        await onInviteUser(groupId, userId);
      }
      
      // Usar showInviteModal
      setShowInviteModal(true);
      toast.success('Convite enviado!');
    } catch (error) {
      toast.error('Erro ao enviar convite');
    }
  };

  const handleRemoveUser = async (groupId, userId) => {
    try {
      // Usar onRemoveUser se disponível
      if (onRemoveUser) {
        await onRemoveUser(groupId, userId);
      }
      
      toast.success('Usuário removido do grupo');
    } catch (error) {
      toast.error('Erro ao remover usuário');
    }
  };

  const handlePromoteUser = async (groupId, userId) => {
    try {
      // Usar onPromoteUser se disponível
      if (onPromoteUser) {
        await onPromoteUser(groupId, userId);
      }
      
      toast.success('Usuário promovido a moderador');
    } catch (error) {
      toast.error('Erro ao promover usuário');
    }
  };

  const handleDemoteUser = async (groupId, userId) => {
    try {
      // Usar onDemoteUser se disponível
      if (onDemoteUser) {
        await onDemoteUser(groupId, userId);
      }
      
      toast.success('Usuário removido da moderação');
    } catch (error) {
      toast.error('Erro ao remover da moderação');
    }
  };

  const handleReportGroup = async (groupId, reason) => {
    try {
      // Usar onReportGroup se disponível
      if (onReportGroup) {
        await onReportGroup(groupId, reason);
      }
      
      toast.success('Grupo reportado');
    } catch (error) {
      toast.error('Erro ao reportar grupo');
    }
  };

  const filteredGroups = groups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         group.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || group.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [
    { value: 'all', label: 'Todos', icon: '🌐' },
    { value: 'fitness', label: 'Fitness', icon: '💪' },
    { value: 'yoga', label: 'Yoga', icon: '🧘' },
    { value: 'nutrition', label: 'Nutrição', icon: '🥗' },
    { value: 'running', label: 'Corrida', icon: '🏃' },
    { value: 'cycling', label: 'Ciclismo', icon: '🚴' },
    { value: 'swimming', label: 'Natação', icon: '🏊' },
    { value: 'dance', label: 'Dança', icon: '💃' },
    { value: 'other', label: 'Outros', icon: '🎯' }
  ];

  const privacyOptions = [
    { value: 'public', label: 'Público', icon: '🌐', description: 'Qualquer um pode ver e entrar' },
    { value: 'private', label: 'Privado', icon: '🔒', description: 'Apenas membros convidados' },
    { value: 'secret', label: 'Secreto', icon: '🤫', description: 'Apenas membros podem encontrar' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Grupos e Comunidades
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
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
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
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
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              >
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.icon} {category.label}
                  </option>
                ))}
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
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
            {filteredGroups.map(group => (
              <Card key={group.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative">
                  <img
                    src={group.cover}
                    alt={group.name}
                    className="w-full h-32 object-cover"
                  />
                  <div className="absolute top-2 left-2">
                    <Badge variant={group.privacy === 'public' ? 'default' : 'secondary'}>
                      {group.privacy === 'public' ? '🌐' : group.privacy === 'private' ? '🔒' : '🤫'}
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
                      <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
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
                            onClick={() => onUpdateGroup && onUpdateGroup(group)}
                            variant="ghost"
                            size="sm"
                            title="Editar grupo"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => onDeleteGroup && onDeleteGroup(group.id)}
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
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {group.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-1 mb-3">
                    {group.tags.slice(0, 3).map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-3">
                    <span className="flex items-center space-x-1">
                      <MessageCircle className="w-3 h-3" />
                      <span>{group.posts} posts</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatDistanceToNow(group.createdAt, { addSuffix: true, locale: ptBR })}</span>
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
            {myGroups.map(group => (
              <Card key={group.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative">
                  <img
                    src={group.cover}
                    alt={group.name}
                    className="w-full h-32 object-cover"
                  />
                  <div className="absolute top-2 left-2">
                    <Badge variant={group.isAdmin ? 'destructive' : group.isModerator ? 'default' : 'secondary'}>
                      {group.isAdmin ? '👑 Admin' : group.isModerator ? '🛡️ Mod' : '👤 Membro'}
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
                      <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
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
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {group.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-3">
                    <span className="flex items-center space-x-1">
                      <MessageCircle className="w-3 h-3" />
                      <span>{group.posts} posts</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatDistanceToNow(group.createdAt, { addSuffix: true, locale: ptBR })}</span>
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
                        onClick={() => setShowInviteModal(true)}
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
            {trendingGroups.map(group => (
              <Card key={group.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative">
                  <img
                    src={group.cover}
                    alt={group.name}
                    className="w-full h-32 object-cover"
                  />
                  <div className="absolute top-2 left-2">
                    <Badge variant="destructive" className="flex items-center space-x-1">
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
                      <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
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
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {group.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-3">
                    <span className="flex items-center space-x-1">
                      <MessageCircle className="w-3 h-3" />
                      <span>{group.posts} posts</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatDistanceToNow(group.createdAt, { addSuffix: true, locale: ptBR })}</span>
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
            <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Grupos Recomendados
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nome do Grupo
                </label>
                <Input
                  value={newGroup.name}
                  onChange={(e) => setNewGroup(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Fitness Enthusiasts"
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descrição
                </label>
                <textarea
                  value={newGroup.description}
                  onChange={(e) => setNewGroup(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descreva o propósito do grupo..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Categoria
                  </label>
                  <select
                    value={newGroup.category}
                    onChange={(e) => setNewGroup(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  >
                    {categories.slice(1).map(category => (
                      <option key={category.value} value={category.value}>
                        {category.icon} {category.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Privacidade
                  </label>
                  <select
                    value={newGroup.privacy}
                    onChange={(e) => setNewGroup(prev => ({ ...prev, privacy: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  >
                    {privacyOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.icon} {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Regras do Grupo
                </label>
                <textarea
                  value={newGroup.rules}
                  onChange={(e) => setNewGroup(prev => ({ ...prev, rules: e.target.value }))}
                  placeholder="Liste as regras do grupo (uma por linha)..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
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
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Sobre o Grupo
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {selectedGroup.description}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                      Regras
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      {selectedGroup.rules.map((rule, index) => (
                        <li key={index}>{rule}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                      Tags
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedGroup.tags.map(tag => (
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
                      {selectedGroup.members.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Membros
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
                      {selectedGroup.posts.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
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
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                  Moderadores
                </h4>
                <div className="space-y-2">
                  {selectedGroup.moderators.map(moderator => (
                    <div key={moderator.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={moderator.avatar} />
                          <AvatarFallback>{moderator.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {moderator.name}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {moderator.role === 'admin' ? 'Administrador' : 'Moderador'}
                          </div>
                        </div>
                      </div>
                      {(selectedGroup.isAdmin || selectedGroup.isModerator) && (
                        <div className="flex items-center space-x-1">
                          <Button
                            onClick={() => handlePromoteUser(selectedGroup.id, moderator.id)}
                            variant="ghost"
                            size="sm"
                          >
                            <Crown className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => handleDemoteUser(selectedGroup.id, moderator.id)}
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
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                  Posts Recentes
                </h4>
                <div className="space-y-3">
                  {selectedGroup.recentPosts.map(post => (
                    <div key={post.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={post.user.avatar} />
                          <AvatarFallback>{post.user.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {post.user.name}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatDistanceToNow(post.timestamp, { addSuffix: true, locale: ptBR })}
                            </span>
                          </div>
                          <p className="text-gray-900 dark:text-white text-sm">
                            {post.content}
                          </p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
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
    </div>
  );
};

export default GroupsAndCommunities;