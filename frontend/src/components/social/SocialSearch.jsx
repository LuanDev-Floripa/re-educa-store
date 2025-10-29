import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../Ui/card';
import { Button } from '../Ui/button';
import { Input } from '../Ui/input';
import { Badge } from '../Ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../Ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../Ui/tabs';
import { 
  Search,
  Filter,
  X,
  Users,
  Hash,
  Image,
  Video,
  MessageCircle,
  Heart,
  Share2,
  Calendar,
  MapPin,
  TrendingUp,
  Clock,
  Star,
  Check
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import apiClient from '@/services/apiClient';

const SocialSearch = ({ 
  searchResults, 
  onSearch, 
  onFilterChange,
  currentUser 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [filters, setFilters] = useState({
    type: 'all',
    dateRange: 'all',
    sortBy: 'relevance',
    verified: false,
    hasMedia: false,
    minLikes: 0,
    hashtags: [],
    location: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [trendingHashtags, setTrendingHashtags] = useState([]);

  // Carregar dados reais
  useEffect(() => {
    // Carregar buscas recentes do localStorage
    const savedSearches = localStorage.getItem('social_recent_searches');
    if (savedSearches) {
      try {
        setRecentSearches(JSON.parse(savedSearches));
      } catch (e) {
        console.error('Erro ao carregar buscas recentes:', e);
      }
    }

    // Buscar trending hashtags da API (simular busca em posts)
    loadTrendingHashtags();
  }, []);

  const loadTrendingHashtags = async () => {
    try {
      // Buscar posts recentes para extrair hashtags mais usadas
      // Por enquanto, usar hashtags comuns da área de fitness/saúde
      // Em produção, poderia buscar posts e contar hashtags
      const commonHashtags = [
        { tag: 'fitness', count: 0 },
        { tag: 'saude', count: 0 },
        { tag: 'exercicio', count: 0 },
        { tag: 'nutricao', count: 0 },
        { tag: 'bemestar', count: 0 },
        { tag: 'treino', count: 0 },
        { tag: 'hiit', count: 0 },
        { tag: 'cardio', count: 0 }
      ];
      
      // Tentar buscar posts reais para calcular trending
      try {
        const response = await apiClient.request('/api/social/posts?limit=100');
        if (response.posts) {
          // Extrair hashtags dos posts
          const hashtagCounts = {};
          response.posts.forEach(post => {
            if (post.content) {
              const hashtags = post.content.match(/#\w+/g) || [];
              hashtags.forEach(tag => {
                const cleanTag = tag.replace('#', '').toLowerCase();
                hashtagCounts[cleanTag] = (hashtagCounts[cleanTag] || 0) + 1;
              });
            }
          });
          
          // Converter para array e ordenar
          const trending = Object.entries(hashtagCounts)
            .map(([tag, count]) => ({ tag, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
          
          if (trending.length > 0) {
            setTrendingHashtags(trending);
            return;
          }
        }
      } catch (apiError) {
        console.log('API de posts não disponível, usando hashtags padrão');
      }
      
      // Fallback para hashtags padrão
      setTrendingHashtags(commonHashtags);
    } catch (err) {
      console.error('Erro ao carregar trending hashtags:', err);
      // Usar valores padrão em caso de erro
      setTrendingHashtags([
        { tag: 'fitness', count: 1250 },
        { tag: 'saude', count: 980 },
        { tag: 'exercicio', count: 750 },
        { tag: 'nutricao', count: 620 },
        { tag: 'bemestar', count: 580 }
      ]);
    }
  };

  const handleSearch = (query = searchQuery) => {
    if (!query.trim()) return;
    
    onSearch(query, filters);
    
    // Adicionar à busca recente e salvar no localStorage
    const updatedSearches = [query, ...recentSearches.filter(s => s !== query)].slice(0, 10);
    setRecentSearches(updatedSearches);
    localStorage.setItem('social_recent_searches', JSON.stringify(updatedSearches));
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const defaultFilters = {
      type: 'all',
      dateRange: 'all',
      sortBy: 'relevance',
      verified: false,
      hasMedia: false,
      minLikes: 0,
      hashtags: [],
      location: ''
    };
    setFilters(defaultFilters);
    onFilterChange(defaultFilters);
  };

  const getFilteredResults = () => {
    if (!searchResults) return [];
    
    let filtered = searchResults;
    
    // Filtrar por tipo
    if (filters.type !== 'all') {
      filtered = filtered.filter(item => {
        if (filters.type === 'posts') return item.type === 'post';
        if (filters.type === 'users') return item.type === 'user';
        if (filters.type === 'hashtags') return item.type === 'hashtag';
        if (filters.type === 'media') return item.media_url;
        return true;
      });
    }
    
    // Filtrar por data
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (filters.dateRange) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          filterDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      filtered = filtered.filter(item => 
        new Date(item.created_at) >= filterDate
      );
    }
    
    // Filtrar por verificados
    if (filters.verified) {
      filtered = filtered.filter(item => item.is_verified);
    }
    
    // Filtrar por mídia
    if (filters.hasMedia) {
      filtered = filtered.filter(item => item.media_url);
    }
    
    // Filtrar por likes mínimos
    if (filters.minLikes > 0) {
      filtered = filtered.filter(item => item.likes_count >= filters.minLikes);
    }
    
    // Filtrar por hashtags
    if (filters.hashtags.length > 0) {
      filtered = filtered.filter(item => 
        filters.hashtags.some(tag => 
          item.content?.toLowerCase().includes(tag.toLowerCase())
        )
      );
    }
    
    // Filtrar por localização
    if (filters.location) {
      filtered = filtered.filter(item => 
        item.location?.toLowerCase().includes(filters.location.toLowerCase())
      );
    }
    
    // Ordenar resultados
    switch (filters.sortBy) {
      case 'date':
        filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
      case 'likes':
        filtered.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
        break;
      case 'comments':
        filtered.sort((a, b) => (b.comments_count || 0) - (a.comments_count || 0));
        break;
      default:
        // Relevância (já ordenado pelo backend)
        break;
    }
    
    return filtered;
  };

  const renderPostResult = (post) => (
    <Card key={post.id} className="mb-4">
      <CardContent className="p-4">
        <div className="flex space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={post.user?.avatar_url} />
            <AvatarFallback>
              {post.user?.name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <h4 className="font-semibold text-sm">
                {post.user?.name || 'Usuário'}
              </h4>
              {post.user?.is_verified && (
                <Check className="h-4 w-4 text-blue-500" />
              )}
              <span className="text-xs text-gray-500">
                @{post.user?.username || 'usuario'}
              </span>
              <span className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(post.created_at), { 
                  addSuffix: true, 
                  locale: ptBR 
                })}
              </span>
            </div>
            
            <p className="text-sm text-gray-900 mb-3">
              {post.content}
            </p>
            
            {post.media_url && (
              <div className="mb-3">
                {post.media_type === 'image' ? (
                  <Image className="h-48 w-full object-cover rounded-lg" />
                ) : (
                  <Video className="h-48 w-full object-cover rounded-lg" />
                )}
              </div>
            )}
            
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <Heart className="h-4 w-4" />
                <span>{post.likes_count || 0}</span>
              </div>
              <div className="flex items-center space-x-1">
                <MessageCircle className="h-4 w-4" />
                <span>{post.comments_count || 0}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Share2 className="h-4 w-4" />
                <span>{post.shares_count || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderUserResult = (user) => (
    <Card key={user.id} className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-center space-x-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user.avatar_url} />
            <AvatarFallback>
              {user.name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h4 className="font-semibold text-sm">
                {user.name || 'Usuário'}
              </h4>
              {user.is_verified && (
                <Check className="h-4 w-4 text-blue-500" />
              )}
            </div>
            
            <p className="text-xs text-gray-500 mb-2">
              @{user.username || 'usuario'}
            </p>
            
            {user.bio && (
              <p className="text-sm text-gray-700 mb-2">
                {user.bio}
              </p>
            )}
            
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <Users className="h-4 w-4" />
                <span>{user.followers || 0} seguidores</span>
              </div>
              <div className="flex items-center space-x-1">
                <MessageCircle className="h-4 w-4" />
                <span>{user.posts_count || 0} posts</span>
              </div>
            </div>
          </div>
          
          <Button size="sm" variant="outline">
            Seguir
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderHashtagResult = (hashtag) => (
    <Card key={hashtag.id} className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <Hash className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-sm">
                #{hashtag.tag}
              </h4>
              <p className="text-xs text-gray-500">
                {hashtag.count} posts
              </p>
            </div>
          </div>
          
          <Button size="sm" variant="outline">
            Seguir
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const filteredResults = getFilteredResults();

  const searchTypes = [
    { id: 'all', label: 'Tudo', icon: Search },
    { id: 'posts', label: 'Posts', icon: MessageCircle },
    { id: 'users', label: 'Usuários', icon: Users },
    { id: 'hashtags', label: 'Hashtags', icon: Hash },
    { id: 'media', label: 'Mídia', icon: Image }
  ];

  return (
    <div className="space-y-6">
      {/* Barra de Busca */}
      <Card>
        <CardContent className="p-4">
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar posts, usuários, hashtags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={() => handleSearch()}>
              Buscar
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filtros Avançados */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Filtros Avançados</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Tipo de Conteúdo
                </label>
                <select
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="all">Todos</option>
                  <option value="posts">Posts</option>
                  <option value="users">Usuários</option>
                  <option value="hashtags">Hashtags</option>
                  <option value="media">Com Mídia</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Período
                </label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="all">Qualquer data</option>
                  <option value="today">Hoje</option>
                  <option value="week">Esta semana</option>
                  <option value="month">Este mês</option>
                  <option value="year">Este ano</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Ordenar por
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="relevance">Relevância</option>
                  <option value="date">Data</option>
                  <option value="likes">Curtidas</option>
                  <option value="comments">Comentários</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Likes Mínimos
                </label>
                <Input
                  type="number"
                  value={filters.minLikes}
                  onChange={(e) => handleFilterChange('minLikes', parseInt(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Localização
                </label>
                <Input
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  placeholder="Cidade, estado..."
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filters.verified}
                  onChange={(e) => handleFilterChange('verified', e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Apenas verificados</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filters.hasMedia}
                  onChange={(e) => handleFilterChange('hasMedia', e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Com mídia</span>
              </label>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={clearFilters}>
                Limpar Filtros
              </Button>
              <Button onClick={() => setShowFilters(false)}>
                Aplicar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resultados da Busca */}
      {searchQuery && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              Resultados para "{searchQuery}"
            </h3>
            <span className="text-sm text-gray-500">
              {filteredResults.length} resultados
            </span>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              {searchTypes.map(type => {
                const Icon = type.icon;
                return (
                  <TabsTrigger key={type.id} value={type.id} className="flex items-center space-x-2">
                    <Icon className="h-4 w-4" />
                    <span>{type.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <TabsContent value="all" className="mt-4">
              {filteredResults.map(item => {
                if (item.type === 'post') return renderPostResult(item);
                if (item.type === 'user') return renderUserResult(item);
                if (item.type === 'hashtag') return renderHashtagResult(item);
                return null;
              })}
            </TabsContent>

            <TabsContent value="posts" className="mt-4">
              {filteredResults.filter(item => item.type === 'post').map(renderPostResult)}
            </TabsContent>

            <TabsContent value="users" className="mt-4">
              {filteredResults.filter(item => item.type === 'user').map(renderUserResult)}
            </TabsContent>

            <TabsContent value="hashtags" className="mt-4">
              {filteredResults.filter(item => item.type === 'hashtag').map(renderHashtagResult)}
            </TabsContent>

            <TabsContent value="media" className="mt-4">
              {filteredResults.filter(item => item.media_url).map(renderPostResult)}
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Buscas Recentes */}
      {!searchQuery && recentSearches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Buscas Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((search, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery(search);
                    handleSearch(search);
                  }}
                >
                  {search}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hashtags em Tendência */}
      {!searchQuery && trendingHashtags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Hashtags em Tendência</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {trendingHashtags.map((hashtag, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                  onClick={() => {
                    setSearchQuery(`#${hashtag.tag}`);
                    handleSearch(`#${hashtag.tag}`);
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <Hash className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">#{hashtag.tag}</span>
                  </div>
                  <span className="text-sm text-gray-500">{hashtag.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SocialSearch;