import React, { useState, useEffect } from "react";
import logger from "@/utils/logger";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/Ui/card";
import { Button } from "@/components/Ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/Ui/avatar";
import { Badge } from "@/components/Ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/Ui/tabs";
import {
  User,
  ArrowLeft,
  UserPlus,
  UserMinus,
  MessageCircle,
  Heart,
  Share2,
  Users,
  Users2,
  Calendar,
  Check,
  Grid3x3,
  List,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { useAuth } from "../../hooks/useAuth";
import apiClient from "../../services/apiClient";
import PostCard from "../../components/social/PostCard";

const UserPublicProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");

  useEffect(() => {
    if (userId) {
      loadProfile();
      loadPosts();
    }
  }, [userId]);

  useEffect(() => {
    if (profile?.relationship) {
      setIsFollowing(profile.relationship.is_following || false);
    }
  }, [profile]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/api/social/users/${userId}/profile`);
      if (response.profile) {
        setProfile(response.profile);
      } else {
        toast.error("Perfil não encontrado");
        navigate("/social");
      }
    } catch (error) {
      logger.error("Erro ao carregar perfil:", error);
      toast.error("Erro ao carregar perfil");
      navigate("/social");
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async (page = 1) => {
    try {
      setPostsLoading(true);
      const response = await apiClient.get(`/api/social/users/${userId}/posts`, {
        params: { page, limit: 20 },
      });
      if (response.posts) {
        setPosts(response.posts);
      }
    } catch (error) {
      logger.error("Erro ao carregar posts:", error);
      toast.error("Erro ao carregar posts");
    } finally {
      setPostsLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!currentUser) {
      toast.error("Você precisa estar logado para seguir usuários");
      return;
    }

    try {
      if (isFollowing) {
        await apiClient.delete(`/api/social/users/${userId}/follow`);
        setIsFollowing(false);
        toast.success("Você deixou de seguir este usuário");
        
        // Atualizar contador
        if (profile) {
          setProfile({
            ...profile,
            stats: {
              ...profile.stats,
              followers: Math.max(0, profile.stats.followers - 1),
            },
          });
        }
      } else {
        await apiClient.post(`/api/social/users/${userId}/follow`);
        setIsFollowing(true);
        toast.success("Você está seguindo este usuário");
        
        // Atualizar contador
        if (profile) {
          setProfile({
            ...profile,
            stats: {
              ...profile.stats,
              followers: profile.stats.followers + 1,
            },
          });
        }
      }
    } catch (error) {
      logger.error("Erro ao seguir/deixar de seguir:", error);
      toast.error("Erro ao atualizar seguimento");
    }
  };

  const handleReaction = async (postId, reactionType) => {
    try {
      await apiClient.post(`/api/social/posts/${postId}/reactions`, {
        reaction_type: reactionType,
      });
      // Atualizar post localmente
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                user_reacted: true,
                reaction_count: (post.reaction_count || 0) + 1,
              }
            : post,
        ),
      );
    } catch (error) {
      logger.error("Erro ao reagir:", error);
      toast.error("Erro ao reagir ao post");
    }
  };

  const handleRemoveReaction = async (postId) => {
    try {
      await apiClient.delete(`/api/social/posts/${postId}/reactions`);
      // Atualizar post localmente
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                user_reacted: false,
                reaction_count: Math.max(0, (post.reaction_count || 0) - 1),
              }
            : post,
        ),
      );
    } catch (error) {
      logger.error("Erro ao remover reação:", error);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="space-y-6">
          <Card className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-muted rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-6 bg-muted rounded w-1/3"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Perfil não encontrado</p>
            <Button onClick={() => navigate("/social")} className="mt-4">
              Voltar para o Feed
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isOwnProfile = profile.relationship?.is_own_profile || false;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/social")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
      </div>

      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
            {/* Avatar */}
            <Avatar className="w-24 h-24">
              <AvatarImage src={profile.avatar_url} />
              <AvatarFallback className="text-2xl">
                {profile.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h1 className="text-2xl font-bold">{profile.name}</h1>
                {profile.is_verified && (
                  <Badge variant="secondary">
                    <Check className="w-3 h-3 mr-1" />
                    Verificado
                  </Badge>
                )}
              </div>

              {profile.bio && (
                <p className="text-muted-foreground mb-4">
                  {profile.bio}
                </p>
              )}

              {/* Stats */}
              <div className="flex items-center space-x-6 text-sm">
                <div className="flex items-center space-x-1">
                  <MessageCircle className="w-4 h-4" />
                  <span className="font-semibold">{profile.stats.posts}</span>
                  <span className="text-muted-foreground">posts</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span className="font-semibold">
                    {profile.stats.followers}
                  </span>
                  <span className="text-muted-foreground">seguidores</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users2 className="w-4 h-4" />
                  <span className="font-semibold">
                    {profile.stats.following}
                  </span>
                  <span className="text-muted-foreground">seguindo</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Heart className="w-4 h-4" />
                  <span className="font-semibold">
                    {profile.stats.total_likes}
                  </span>
                  <span className="text-muted-foreground">curtidas</span>
                </div>
                {profile.created_at && (
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-muted-foreground">
                      Desde{" "}
                      {formatDistanceToNow(new Date(profile.created_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              {isOwnProfile ? (
                <Link to="/profile">
                  <Button variant="outline">
                    <User className="w-4 h-4 mr-2" />
                    Editar Perfil
                  </Button>
                </Link>
              ) : (
                <Button
                  onClick={handleFollow}
                  variant={isFollowing ? "outline" : "default"}
                >
                  {isFollowing ? (
                    <>
                      <UserMinus className="w-4 h-4 mr-2" />
                      Seguindo
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Seguir
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="posts">
            <Grid3x3 className="w-4 h-4 mr-2" />
            Posts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="space-y-4">
          {postsLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="flex space-x-4">
                      <div className="w-12 h-12 bg-muted rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-1/4"></div>
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  Nenhum post ainda
                </h3>
                <p className="text-muted-foreground">
                  {isOwnProfile
                    ? "Você ainda não criou nenhum post"
                    : "Este usuário ainda não criou nenhum post"}
                </p>
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
                  currentUserId={currentUser?.id}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserPublicProfile;
