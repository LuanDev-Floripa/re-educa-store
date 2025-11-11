import React from "react";
/**
 * Card de stream ao vivo/gravado.
 * - Fallbacks para campos opcionais e contagens
 * - A??es: assistir, seguir, compartilhar, reportar
 */
import { Card, CardContent } from "../../Ui/card";
import { Button } from "../../Ui/button";
import { Badge } from "../../Ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../../Ui/avatar";
import {
  Play,
  Eye,
  Heart,
  Share2,
  MoreHorizontal,
  Clock,
  Users,
  Verified,
  Flag,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const StreamCard = ({
  stream,
  onJoin,
  onFollow,
  onReport,
  onShare,
  isWatching = false,
  showActions = true,
}) => {
  const handleJoin = () => {
    if (onJoin) {
      onJoin(stream);
    }
  };

  const handleFollow = () => {
    if (onFollow) {
      onFollow(stream.user.id);
    }
  };

  const handleReport = () => {
    if (onReport) {
      onReport(stream.id, "inappropriate");
    }
  };

  const handleShare = () => {
    if (onShare) {
      onShare(stream);
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative">
        {/* Stream Thumbnail */}
        <div className="aspect-video bg-background flex items-center justify-center">
          <div className="text-center text-white">
            <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">Stream Preview</p>
            <p className="text-sm opacity-75">
              {(stream?.user?.name ?? "Usu?rio")} - {(stream?.title ?? "Stream")}
            </p>
          </div>
        </div>

        {/* Live Badge */}
        <div className="absolute top-2 left-2">
          <Badge variant="destructive" className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span>AO VIVO</span>
          </Badge>
        </div>

        {/* Viewer Count */}
        <div className="absolute top-2 right-2">
          <Badge variant="outline" className="bg-white/90">
            <Eye className="w-3 h-3 mr-1" />
            <span>{Number(stream?.viewer_count ?? 0).toLocaleString()}</span>
          </Badge>
        </div>

        {/* Category Badge */}
        <div className="absolute bottom-2 left-2">
          <Badge variant="secondary">{stream?.category ?? "Geral"}</Badge>
        </div>
      </div>

      <CardContent className="p-4">
        {/* User Info */}
        <div className="flex items-start space-x-3 mb-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={stream?.user?.avatar_url} />
            <AvatarFallback>{(stream?.user?.name ?? "U")[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h4 className="font-semibold text-foreground truncate">
              {stream?.user?.name ?? "Usu?rio"}
              </h4>
              {stream.user.is_verified && (
                <Verified className="w-4 h-4 text-primary" />
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              @{stream?.user?.username ?? "user"}
            </p>
          </div>
        </div>

        {/* Stream Title */}
        <h3 className="font-medium text-foreground mb-2 line-clamp-2">
          {stream?.title ?? "Transmiss?o"}
        </h3>

        {/* Stream Description */}
        {stream?.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {stream.description}
          </p>
        )}

        {/* Tags */}
        {Array.isArray(stream?.tags) && stream.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {stream.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1">
              <Heart className="w-3 h-3" />
              <span>{Number(stream?.like_count ?? 0).toLocaleString()}</span>
            </span>
            <span className="flex items-center space-x-1">
              <Share2 className="w-3 h-3" />
              <span>{Number(stream?.share_count ?? 0).toLocaleString()}</span>
            </span>
          </div>
          <span className="flex items-center space-x-1">
            <Clock className="w-3 h-3" />
            <span>
              {formatDistanceToNow(new Date(stream?.created_at ?? Date.now()), {
                addSuffix: true,
                locale: ptBR,
              })}
            </span>
          </span>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex items-center space-x-2">
            {isWatching ? (
              <Button onClick={handleJoin} variant="outline" className="flex-1">
                <Eye className="w-4 h-4 mr-2" />
                Assistindo
              </Button>
            ) : (
              <Button onClick={handleJoin} className="flex-1">
                <Play className="w-4 h-4 mr-2" />
                Assistir
              </Button>
            )}

            <Button onClick={handleFollow} variant="outline" size="sm">
              <Users className="w-4 h-4" />
            </Button>

            <Button onClick={handleShare} variant="outline" size="sm">
              <Share2 className="w-4 h-4" />
            </Button>

            <Button
              onClick={handleReport}
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-destructive"
            >
              <Flag className="w-4 h-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StreamCard;
