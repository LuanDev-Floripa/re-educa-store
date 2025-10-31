import React, { useState, useEffect, useCallback } from "react";
/**
 * Feed Social - lista e cria posts.
 * - Busca paginada com filtros e buscas
 * - Toasts para erros e UI de carregamento
 */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/Ui/card";
import { Button } from "@/components/Ui/button";
import { Input } from "@/components/Ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/Ui/avatar";
import { Badge } from "@/components/Ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/Ui/tabs";
import {
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Image as ImageIcon,
  Video,
  MapPin,
  Hash,
  Users,
  TrendingUp,
  Filter,
  Search,
  Plus,
  Smile,
  Camera,
  Send,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useApi } from "../../lib/api";
import { toast } from "sonner";
import PostCard from "./PostCard";
import CreatePostModal from "./CreatePostModal";

const SocialFeed = () => {
  const { user } = useAuth();
  const { request } = useApi();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Carregar posts
  const loadPosts = useCallback(async (pageNum = 1, reset = false) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: "10",
      });

      if (activeTab !== "all") {
        params.append("type", activeTab);
      }

      if (searchQuery) {
        params.append("search", searchQuery);
      }

      const data = await request(() =>
        fetch(`/api/social/posts?${params}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }).then((res) => res.json()),
      );

      if (reset) {
        setPosts(data.posts || []);
      } else {
        setPosts((prev) => [...prev, ...(data.posts || [])]);
      }

      setHasMore(data.posts?.length === 10);
      setPage(pageNum);
    } catch (error) {
      console.error("Erro ao carregar posts:", error);
      toast.error("Erro ao carregar posts");
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery]);

  // Carregar mais posts
  const loadMore = () => {
    if (!loading && hasMore) {
      loadPosts(page + 1, false);
    }
  };

  // Buscar posts
  const handleSearch = (e) => {
    e.preventDefault();
    loadPosts(1, true);
  };

  // Criar novo post
  const handleCreatePost = async (postData) => {
    try {
      const data = await request(() =>
        fetch("/api/social/posts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(postData),
        }).then((res) => res.json()),
      );

      if (data.success) {
        toast.success("Post criado com sucesso!");
        setShowCreatePost(false);
        loadPosts(1, true); // Recarregar feed
      } else {
        throw new Error(data.error || "Erro ao criar post");
      }
    } catch (error) {
      console.error("Erro ao criar post:", error);
      toast.error("Erro ao criar post");
    }
  };

  // Reagir a um post
  const handleReaction = async (postId, reactionType) => {
    try {
      const data = await request(() =>
        fetch(`/api/social/posts/${postId}/reactions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ reaction_type: reactionType }),
        }).then((res) => res.json()),
      );

      if (data.success) {
        // Atualizar estado local
        setPosts((prev) =>
          prev.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  user_reacted: true,
                  reaction_count: post.reaction_count + 1,
                }
              : post,
          ),
        );
      }
    } catch (error) {
      console.error("Erro ao reagir:", error);
      toast.error("Erro ao reagir ao post");
    }
  };

  // Remover reação
  const handleRemoveReaction = async (postId) => {
    try {
      const data = await request(() =>
        fetch(`/api/social/posts/${postId}/reactions`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }).then((res) => res.json()),
      );

      if (data.success) {
        // Atualizar estado local
        setPosts((prev) =>
          prev.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  user_reacted: false,
                  reaction_count: Math.max(0, post.reaction_count - 1),
                }
              : post,
          ),
        );
      }
    } catch (error) {
      console.error("Erro ao remover reação:", error);
      toast.error("Erro ao remover reação");
    }
  };

  // Seguir usuário
  const handleFollow = async (userId) => {
    try {
      const data = await request(() =>
        fetch(`/api/social/users/${userId}/follow`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }).then((res) => res.json()),
      );

      if (data.success) {
        toast.success("Usuário seguido!");
        // Atualizar estado se necessário
      }
    } catch (error) {
      console.error("Erro ao seguir usuário:", error);
      toast.error("Erro ao seguir usuário");
    }
  };

  useEffect(() => {
    loadPosts(1, true);
  }, [activeTab, loadPosts]);

  const tabs = [
    { id: "all", label: "Todos", icon: TrendingUp },
    { id: "text", label: "Textos", icon: MessageCircle },
    { id: "image", label: "Imagens", icon: ImageIcon },
    { id: "video", label: "Vídeos", icon: Video },
    { id: "achievement", label: "Conquistas", icon: Heart },
    { id: "workout", label: "Treinos", icon: Users },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Feed Social
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Conecte-se com a comunidade Re-Educa
          </p>
        </div>

        <Button
          onClick={() => setShowCreatePost(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Post
        </Button>
      </div>

      {/* Busca */}
      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar posts, usuários ou hashtags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit" variant="outline">
              <Search className="w-4 h-4 mr-2" />
              Buscar
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="flex items-center gap-2"
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {/* Posts */}
          {loading && posts.length === 0 ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="flex space-x-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Nenhum post encontrado
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {searchQuery
                    ? "Tente ajustar sua busca"
                    : "Seja o primeiro a compartilhar algo!"}
                </p>
                {!searchQuery && (
                  <Button onClick={() => setShowCreatePost(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Primeiro Post
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onReaction={handleReaction}
                  onRemoveReaction={handleRemoveReaction}
                  onFollow={handleFollow}
                  currentUserId={user?.id}
                />
              ))}

              {/* Load More */}
              {hasMore && (
                <div className="text-center py-4">
                  <Button
                    onClick={loadMore}
                    disabled={loading}
                    variant="outline"
                  >
                    {loading ? "Carregando..." : "Carregar Mais"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal de Criar Post */}
      {showCreatePost && (
        <CreatePostModal
          isOpen={showCreatePost}
          onClose={() => setShowCreatePost(false)}
          onSubmit={handleCreatePost}
          user={user}
        />
      )}
    </div>
  );
};

export default SocialFeed;
