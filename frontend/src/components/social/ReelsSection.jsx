import React, { useState, useEffect, useRef, memo } from "react";
/**
 * Seção de Reels (vídeos verticais curtos).
 * - Player com play/pause, mute, navegação; ações e criação (placeholder)
 * - Fallbacks e toasts em interações
 */
import { Card, CardContent } from "../Ui/card";
import { Button } from "../Ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../Ui/avatar";
import { Badge } from "../Ui/badge";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Music,
  Plus,
  ChevronLeft,
  ChevronRight,
  X,
  Upload,
  Video,
  Camera,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

const ReelsSection = ({
  reels,
  onLikeReel,
  onCommentReel,
  onShareReel,
  onFollowUser,
}) => {
  const [currentReelIndex, setCurrentReelIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const videoRefs = useRef([]);

  const list = Array.isArray(reels) ? reels : [];
  const currentReel = list[currentReelIndex];

  useEffect(() => {
    if (videoRefs.current[currentReelIndex]) {
      if (isPlaying) {
        videoRefs.current[currentReelIndex].play();
      } else {
        videoRefs.current[currentReelIndex].pause();
      }
    }
  }, [currentReelIndex, isPlaying]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
    if (videoRefs.current[currentReelIndex]) {
      videoRefs.current[currentReelIndex].muted = !isMuted;
    }
  };

  const handleNextReel = () => {
    if (currentReelIndex < list.length - 1) {
      setCurrentReelIndex(currentReelIndex + 1);
    }
  };

  const handlePrevReel = () => {
    if (currentReelIndex > 0) {
      setCurrentReelIndex(currentReelIndex - 1);
    }
  };

  const handleLikeReel = () => {
    if (currentReel) {
      onLikeReel(currentReel.id);
      toast.success("Reel curtido!");
    }
  };

  const handleCommentReel = () => {
    if (currentReel) {
      onCommentReel(currentReel.id);
    }
  };

  const handleShareReel = () => {
    if (currentReel) {
      onShareReel(currentReel.id);
      toast.success("Reel compartilhado!");
    }
  };

  const handleFollowUser = () => {
    if (currentReel) {
      onFollowUser(currentReel.user_id);
      toast.success("Usuário seguido!");
    }
  };

  const handleCreateReel = () => {
    setShowCreateModal(true);
  };

  const handleVideoEnd = () => {
    handleNextReel();
  };

  const handleVideoClick = () => {
    handlePlayPause();
  };

  if (list.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Video className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Nenhum Reel ainda</h3>
          <p className="text-muted-foreground mb-4">Seja o primeiro a criar um Reel!</p>
          <Button onClick={handleCreateReel}>
            <Plus className="h-4 w-4 mr-2" />
            Criar Reel
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header dos Reels */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Reels</h2>
        <Button onClick={handleCreateReel} variant="outline">
          <Camera className="h-4 w-4 mr-2" />
          Criar Reel
        </Button>
      </div>

      {/* Player de Reels */}
      <div className="relative bg-black rounded-lg overflow-hidden">
        <div className="relative aspect-[9/16] max-h-[600px]">
          {currentReel && (
            <>
              {/* Vídeo */}
              <video
                ref={(el) => (videoRefs.current[currentReelIndex] = el)}
                src={currentReel.video_url}
                className="w-full h-full object-cover"
                loop
                muted={isMuted}
                onClick={handleVideoClick}
                onEnded={handleVideoEnd}
                playsInline
              />

              {/* Overlay de Controles */}
              <div className="absolute inset-0 flex">
                {/* Área de navegação anterior */}
                <div
                  className="w-1/3 cursor-pointer flex items-center justify-start p-4"
                  onClick={handlePrevReel}
                >
                  {currentReelIndex > 0 && (
                    <ChevronLeft className="h-8 w-8 text-white opacity-0 hover:opacity-100 transition-opacity" />
                  )}
                </div>

                {/* Área central para play/pause */}
                <div
                  className="w-1/3 cursor-pointer flex items-center justify-center"
                  onClick={handlePlayPause}
                >
                  {!isPlaying && (
                    <Button
                      variant="ghost"
                      size="lg"
                      className="text-white hover:bg-white/20 rounded-full w-16 h-16"
                    >
                      <Play className="h-8 w-8" />
                    </Button>
                  )}
                </div>

                {/* Área de navegação próxima */}
                <div
                  className="w-1/3 cursor-pointer flex items-center justify-end p-4"
                  onClick={handleNextReel}
                >
                  {currentReelIndex < reels.length - 1 && (
                    <ChevronRight className="h-8 w-8 text-white opacity-0 hover:opacity-100 transition-opacity" />
                  )}
                </div>
              </div>

              {/* Controles superiores */}
              <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMuteToggle}
                    className="text-white hover:bg-white/20"
                  >
                    {isMuted ? (
                      <VolumeX className="h-5 w-5" />
                    ) : (
                      <Volume2 className="h-5 w-5" />
                    )}
                  </Button>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20"
                  >
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Informações do Reel */}
              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex justify-between items-end">
                  {/* Informações do usuário e conteúdo */}
                  <div className="flex-1 pr-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={currentReel.user?.avatar_url} />
                        <AvatarFallback>
                          {currentReel.user?.name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-white font-semibold text-sm">
                            {currentReel.user?.name}
                          </span>
                          {currentReel.user?.is_verified && (
                            <Badge variant="secondary" className="text-xs">
                              ✓
                            </Badge>
                          )}
                        </div>
                        <p className="text-white text-xs opacity-75">
                          {formatDistanceToNow(
                            new Date(currentReel.created_at),
                            {
                              addSuffix: true,
                              locale: ptBR,
                            },
                          )}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleFollowUser}
                        className="text-white border-white hover:bg-white hover:text-black"
                      >
                        Seguir
                      </Button>
                    </div>

                    {/* Descrição do Reel */}
                    <p className="text-white text-sm mb-2 line-clamp-3">
                      {currentReel.description}
                    </p>

                    {/* Hashtags */}
                    {currentReel.hashtags &&
                      currentReel.hashtags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {currentReel.hashtags.map((hashtag, index) => (
                            <span key={index} className="text-primary text-sm">
                              #{hashtag}
                            </span>
                          ))}
                        </div>
                      )}

                    {/* Música */}
                    {currentReel.music && (
                      <div className="flex items-center space-x-2 text-white text-sm">
                        <Music className="h-4 w-4" />
                        <span className="truncate">{currentReel.music}</span>
                      </div>
                    )}
                  </div>

                  {/* Ações laterais */}
                  <div className="flex flex-col items-center space-y-4">
                    <div className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleLikeReel}
                        className="text-white hover:bg-white/20 p-2"
                      >
                        <Heart
                          className={`h-6 w-6 ${currentReel.is_liked ? "fill-destructive text-destructive" : ""}`}
                        />
                      </Button>
                      <p className="text-white text-xs mt-1">
                        {currentReel.likes_count || 0}
                      </p>
                    </div>

                    <div className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCommentReel}
                        className="text-white hover:bg-white/20 p-2"
                      >
                        <MessageCircle className="h-6 w-6" />
                      </Button>
                      <p className="text-white text-xs mt-1">
                        {currentReel.comments_count || 0}
                      </p>
                    </div>

                    <div className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleShareReel}
                        className="text-white hover:bg-white/20 p-2"
                      >
                        <Share2 className="h-6 w-6" />
                      </Button>
                      <p className="text-white text-xs mt-1">
                        {currentReel.shares_count || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Indicador de Reel atual */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
          <div className="flex space-x-1">
            {list.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === currentReelIndex ? "bg-white" : "bg-white/50"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Modal de Criação de Reel */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <div className="text-center">
                <Video className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Criar Reel</h3>
                <p className="text-muted-foreground mb-4">
                  Funcionalidade em desenvolvimento
                </p>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={() => {
                      setShowCreateModal(false);
                      toast.info("Funcionalidade em breve!");
                    }}
                    className="flex-1"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

// Memoize para evitar re-renderizações desnecessárias
// ReelsSection pode ter muitos reels, otimização importante
export default memo(ReelsSection);
