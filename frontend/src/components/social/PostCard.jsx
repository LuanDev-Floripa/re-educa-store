import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/Ui/card';
import { Button } from '@/components/Ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/Ui/avatar';
import { Badge } from '@/components/Ui/badge';
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
  ExternalLink
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import CommentsSection from './CommentsSection';

const PostCard = ({ 
  post, 
  onReaction, 
  onRemoveReaction, 
  onFollow, 
  currentUserId 
}) => {
  const [showComments, setShowComments] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const handleReaction = (reactionType) => {
    if (post.user_reacted) {
      onRemoveReaction(post.id);
    } else {
      onReaction(post.id, reactionType);
    }
  };

  const handleFollow = () => {
    if (onFollow) {
      onFollow(post.user_id);
      setIsFollowing(!isFollowing);
    }
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    toast.success(isBookmarked ? 'Removido dos salvos' : 'Salvo!');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Post do Re-Educa',
        text: post.content,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copiado!');
    }
  };

  const getReactionIcon = (type) => {
    switch (type) {
      case 'like': return <Heart className="w-4 h-4" />;
      case 'love': return <Heart className="w-4 h-4 text-red-500 fill-current" />;
      case 'laugh': return '😂';
      case 'wow': return '😮';
      case 'sad': return '😢';
      case 'angry': return '😠';
      case 'support': return '💪';
      case 'motivate': return '🔥';
      default: return <Heart className="w-4 h-4" />;
    }
  };

  const getMoodEmoji = (mood) => {
    switch (mood) {
      case 'happy': return '😊';
      case 'motivated': return '💪';
      case 'tired': return '😴';
      case 'excited': return '🤩';
      case 'grateful': return '🙏';
      case 'focused': return '🎯';
      case 'relaxed': return '😌';
      default: return null;
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={post.avatar_url} />
              <AvatarFallback>
                {post.user_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  {post.user_name}
                </h4>
                {post.mood && (
                  <span className="text-lg" title={`Humor: ${post.mood}`}>
                    {getMoodEmoji(post.mood)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>
                  {formatDistanceToNow(new Date(post.created_at), { 
                    addSuffix: true, 
                    locale: ptBR 
                  })}
                </span>
                {post.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span>{post.location}</span>
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
                {isFollowing ? <UserMinus className="w-3 h-3" /> : <UserPlus className="w-3 h-3" />}
                {isFollowing ? 'Seguindo' : 'Seguir'}
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
          <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
            {post.content}
          </p>

          {/* Mídia */}
          {post.media_urls && post.media_urls.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {post.media_urls.map((url, index) => (
                <div key={index} className="relative">
                  {post.post_type === 'image' ? (
                    <img
                      src={url}
                      alt={`Mídia ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  ) : post.post_type === 'video' ? (
                    <video
                      src={url}
                      controls
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  ) : null}
                </div>
              ))}
            </div>
          )}

          {/* Hashtags */}
          {post.hashtags && post.hashtags.length > 0 && (
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
        <div className="flex items-center justify-between text-sm text-gray-500 border-t pt-3">
          <div className="flex items-center gap-4">
            {post.reaction_count > 0 && (
              <span className="flex items-center gap-1">
                <Heart className="w-4 h-4 text-red-500" />
                {post.reaction_count}
              </span>
            )}
            {post.comment_count > 0 && (
              <span className="flex items-center gap-1">
                <MessageCircle className="w-4 h-4" />
                {post.comment_count}
              </span>
            )}
            {post.share_count > 0 && (
              <span className="flex items-center gap-1">
                <Share2 className="w-4 h-4" />
                {post.share_count}
              </span>
            )}
          </div>
        </div>

        {/* Ações */}
        <div className="flex items-center justify-between border-t pt-3">
          <div className="flex items-center gap-1">
            <Button
              variant={post.user_reacted ? "default" : "ghost"}
              size="sm"
              onClick={() => handleReaction('like')}
              className="flex-1"
            >
              <Heart className={`w-4 h-4 mr-2 ${post.user_reacted ? 'text-white fill-current' : ''}`} />
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

          <Button
            variant="ghost"
            size="sm"
            onClick={handleBookmark}
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current text-blue-600' : ''}`} />
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

export default PostCard;