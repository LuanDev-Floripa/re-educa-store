import React, { useState, useEffect, useCallback, memo } from "react";
import logger from "@/utils/logger";
/**
 * Cartão de Post do Social.
 * - Exibe conteúdo, mídia, hashtags e ações
 * - Fallbacks seguros e a11y básico
 */
import { Card, CardContent, CardHeader } from "@/components/Ui/card";
import { Button } from "@/components/Ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/Ui/avatar";
import { Badge } from "@/components/Ui/badge";
import {
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  MapPin,
  Hash,
  UserPlus,
  UserMinus,
  Flag,
  Bookmark,
  ExternalLink,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import CommentsSection from "./CommentsSection";
import apiClient from "../../services/apiClient";

const PostCard = ({
  post,
  onReaction,
  onRemoveReaction,
  onFollow,
  currentUserId,
}) => {
  const [showComments, setShowComments] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  
  // Verificar status de seguimento ao carregar
  useEffect(() => {
    const abortController = new AbortController();
    
    const checkFollowStatus = async () => {
      try {
        const response = await apiClient.request(
          `/social/users/${post.user_id}/is-following`,
          { signal: abortController.signal }
        );
        if (response.is_following !== undefined) {
          setIsFollowing(response.is_following);
        }
      } catch (error) {
        // Ignorar erro se foi cancelado (componente desmontou)
        if (error.name === 'AbortError') {
          return;
        }
        logger.error("Erro ao verificar status de seguimento:", error);
      }
    };
    
    if (post?.user_id && currentUserId && post.user_id !== currentUserId) {
      checkFollowStatus();
    }
    
    return () => {
      abortController.abort();
    };
  }, [post?.user_id, currentUserId]);

  const handleReaction = (reactionType) => {
    if (!post) return;
    if (post.user_reacted) {
      onRemoveReaction?.(post.id);
    } else {
      onReaction?.(post.id, reactionType);
    }
  };

  const handleFollow = useCallback(async () => {
    if (!post?.user_id || !currentUserId) return;
    
    try {
      if (isFollowing) {
        await apiClient.delete(`/api/social/users/${post.user_id}/follow`);
        setIsFollowing(false);
        toast.success("Você deixou de seguir este usuário");
      } else {
        await apiClient.request(`/social/users/${post.user_id}/follow`, { method: "POST" });
        setIsFollowing(true);
        toast.success("Você está seguindo este usuário");
      }
      
      // Chamar callback se fornecido
      if (onFollow) {
        onFollow(post.user_id);
      }
    } catch (error) {
      logger.error("Erro ao seguir/deixar de seguir:", error);
      toast.error("Erro ao atualizar seguimento");
    }
  }, [post?.user_id, currentUserId, isFollowing, onFollow]);

  const handleBookmark = useCallback(() => {
    setIsBookmarked((prev) => {
      const newValue = !prev;
      toast.success(newValue ? "Salvo!" : "Removido dos salvos");
      return newValue;
    });
  }, []);

  const handleShare = useCallback(() => {
    if (navigator.share) {
      navigator.share({
        title: "Post do Re-Educa",
        text: post?.content || "",
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copiado!");
    }
  }, [post]);

  const getMoodEmoji = (mood) => {
    switch (mood) {
      case "happy":
        return "😊";
      case "motivated":
        return "💪";
      case "tired":
        return "😴";
      case "excited":
        return "🤩";
      case "grateful":
        return "🙏";
      case "focused":
        return "🎯";
      case "relaxed":
        return "😌";
      default:
        return null;
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={post?.avatar_url} />
              <AvatarFallback>
                {post?.user_name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <Link
                  to={`/social/profile/${post?.user_id}`}
                  className="font-semibold text-foreground hover:text-primary transition-colors"
                >
                  {post?.user_name || "Usuário"}
                </Link>
                {post.mood && (
                  <span className="text-lg" title={`Humor: ${post.mood}`}>
                    {getMoodEmoji(post.mood)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>
                  {formatDistanceToNow(new Date(post?.created_at ?? Date.now()), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </span>
                {post.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span>{post?.location}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {post.user_id !== currentUserId && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleFollow}
                className="text-xs"
              >
                {isFollowing ? (
                  <UserMinus className="w-3 h-3" />
                ) : (
                  <UserPlus className="w-3 h-3" />
                )}
                {isFollowing ? "Seguindo" : "Seguir"}
              </Button>
            )}

            <Button variant="ghost" size="sm">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Conteúdo do Post */}
        <div className="space-y-3">
          <p className="text-foreground whitespace-pre-wrap">
            {post.content}
          </p>

          {/* Mídia */}
            {Array.isArray(post?.media_urls) && post.media_urls.length > 0 && (
            <div className={`grid gap-2 ${post.media_urls.length === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
              {post.media_urls.map((url, index) => {
                // Detectar tipo de mídia pela URL ou post_type
                const isImage = post.post_type === "image" || 
                  /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(url) ||
                  url.includes('post-images');
                const isVideo = post.post_type === "video" || 
                  /\.(mp4|webm|ogg|mov|avi)(\?|$)/i.test(url) ||
                  url.includes('post-videos');
                
                return (
                  <div key={index} className="relative group">
                    {isImage ? (
                      <img
                        src={url}
                        alt={`Mídia ${index + 1} do post`}
                        className="w-full rounded-2xl object-cover cursor-pointer hover:opacity-90 transition-opacity duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
                        style={{ maxHeight: post.media_urls.length === 1 ? '500px' : '300px' }}
                        onClick={() => window.open(url, '_blank')}
                      />
                    ) : isVideo ? (
                      <video
                        src={url}
                        controls
                        className="w-full rounded-2xl object-cover"
                        style={{ maxHeight: post.media_urls.length === 1 ? '500px' : '300px' }}
                      >
                        Seu navegador não suporta vídeos.
                      </video>
                    ) : (
                      <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center">
                        <span className="text-muted-foreground">Mídia não suportada</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Hashtags */}
          {Array.isArray(post?.hashtags) && post.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {post.hashtags.map((hashtag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  <Hash className="w-3 h-3 mr-1" />
                  {hashtag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Estatísticas */}
        <div className="flex items-center justify-between text-sm text-muted-foreground border-t border-border pt-3">
          <div className="flex items-center gap-4">
            {Number(post?.reaction_count ?? 0) > 0 && (
              <span className="flex items-center gap-1">
                <Heart className="w-4 h-4 text-destructive" />
                {Number(post.reaction_count ?? 0)}
              </span>
            )}
            {Number(post?.comment_count ?? 0) > 0 && (
              <span className="flex items-center gap-1">
                <MessageCircle className="w-4 h-4" />
                {Number(post.comment_count ?? 0)}
              </span>
            )}
            {Number(post?.share_count ?? 0) > 0 && (
              <span className="flex items-center gap-1">
                <Share2 className="w-4 h-4" />
                {Number(post.share_count ?? 0)}
              </span>
            )}
          </div>
        </div>

        {/* Ações */}
        <div className="flex items-center justify-between border-t border-border pt-3">
          <div className="flex items-center gap-1">
            <Button
              variant={post.user_reacted ? "default" : "ghost"}
              size="sm"
              onClick={() => handleReaction("like")}
              className="flex-1"
            >
              <Heart
                className={`w-4 h-4 mr-2 ${post.user_reacted ? "text-white fill-current" : ""}`}
              />
              Curtir
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
              className="flex-1"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Comentar
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="flex-1"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Compartilhar
            </Button>
          </div>

          <Button variant="ghost" size="sm" onClick={handleBookmark}>
            <Bookmark
              className={`w-4 h-4 ${isBookmarked ? "fill-current text-primary" : ""}`}
            />
          </Button>
        </div>

        {/* Seção de Comentários */}
        {showComments && (
          <CommentsSection
            postId={post.id}
            postUserId={post.user_id}
            currentUserId={currentUserId}
          />
        )}
      </CardContent>
    </Card>
  );
};

// Memoize para evitar re-renderizações desnecessárias
// PostCard é renderizado múltiplas vezes em listas, otimização importante
export default memo(PostCard);
