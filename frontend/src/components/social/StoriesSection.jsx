import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '../Ui/card';
import { Button } from '../Ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../Ui/avatar';
import { Badge } from '../Ui/badge';
import { 
  Plus, 
  Play, 
  Pause, 
  ChevronLeft, 
  ChevronRight, 
  X,
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Eye,
  Clock
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

const StoriesSection = ({ 
  stories, 
  currentUser, 
  onCreateStory, 
  onViewStory,
  onLikeStory,
  onReplyStory 
}) => {
  const [activeStory, setActiveStory] = useState(null);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [viewedStories, setViewedStories] = useState(new Set());
  const intervalRef = useRef(null);
  const videoRef = useRef(null);

  const storyDuration = 5000; // 5 segundos por story

  useEffect(() => {
    if (activeStory && isPlaying) {
      intervalRef.current = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            handleNextStory();
            return 0;
          }
          return prev + (100 / (storyDuration / 100));
        });
      }, 100);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [activeStory, isPlaying]);

  const handleNextStory = () => {
    if (activeStory) {
      const currentUserStories = stories.filter(s => s.user_id === activeStory.user_id);
      const currentIndex = currentUserStories.findIndex(s => s.id === activeStory.id);
      
      if (currentIndex < currentUserStories.length - 1) {
        setActiveStory(currentUserStories[currentIndex + 1]);
        setProgress(0);
      } else {
        // Próximo usuário
        const currentUserIndex = stories.findIndex(s => s.user_id === activeStory.user_id);
        const nextUserStories = stories.slice(currentUserIndex + 1);
        if (nextUserStories.length > 0) {
          setActiveStory(nextUserStories[0]);
          setProgress(0);
        } else {
          handleCloseStory();
        }
      }
    }
  };

  const handlePrevStory = () => {
    if (activeStory) {
      const currentUserStories = stories.filter(s => s.user_id === activeStory.user_id);
      const currentIndex = currentUserStories.findIndex(s => s.id === activeStory.id);
      
      if (currentIndex > 0) {
        setActiveStory(currentUserStories[currentIndex - 1]);
        setProgress(0);
      } else {
        // Usuário anterior
        const currentUserIndex = stories.findIndex(s => s.user_id === activeStory.user_id);
        const prevUserStories = stories.slice(0, currentUserIndex).reverse();
        if (prevUserStories.length > 0) {
          setActiveStory(prevUserStories[0]);
          setProgress(0);
        }
      }
    }
  };

  const handleCloseStory = () => {
    setActiveStory(null);
    setIsPlaying(true);
    setProgress(0);
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleLikeStory = () => {
    if (activeStory) {
      onLikeStory(activeStory.id);
      toast.success('Story curtido!');
    }
  };

  const handleReplyStory = () => {
    if (activeStory) {
      onReplyStory(activeStory.id);
    }
  };

  const handleShareStory = () => {
    if (activeStory) {
      navigator.share({
        title: `Story de ${activeStory.user?.name}`,
        text: activeStory.content,
        url: window.location.href
      }).catch(() => {
        navigator.clipboard.writeText(window.location.href);
        toast.success('Link copiado!');
      });
    }
  };

  const handleViewStory = (story) => {
    setActiveStory(story);
    setProgress(0);
    setIsPlaying(true);
    
    // Marcar como visualizado
    setViewedStories(prev => new Set([...prev, story.id]));
    onViewStory(story.id);
  };

  const getStoryProgress = (storyId) => {
    return viewedStories.has(storyId) ? 100 : 0;
  };

  const isStoryViewed = (storyId) => {
    return viewedStories.has(storyId);
  };

  const getStoriesByUser = () => {
    const userStories = {};
    stories.forEach(story => {
      if (!userStories[story.user_id]) {
        userStories[story.user_id] = {
          user: story.user,
          stories: [],
          hasUnviewed: false
        };
      }
      userStories[story.user_id].stories.push(story);
      if (!isStoryViewed(story.id)) {
        userStories[story.user_id].hasUnviewed = true;
      }
    });
    return userStories;
  };

  const userStories = getStoriesByUser();

  return (
    <div className="space-y-4">
      {/* Lista de Stories */}
      <Card>
        <CardContent className="p-4">
          <div className="flex space-x-4 overflow-x-auto pb-2">
            {/* Botão Criar Story */}
            <div className="flex-shrink-0 text-center">
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onCreateStory}
                  className="w-16 h-16 rounded-full p-0 border-2 border-dashed border-gray-300 hover:border-blue-500"
                >
                  <Plus className="h-6 w-6 text-gray-500" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Criar</p>
            </div>

            {/* Stories dos usuários */}
            {Object.values(userStories).map((userStory) => (
              <div key={userStory.user.id} className="flex-shrink-0 text-center">
                <div className="relative">
                  <div 
                    className={`w-16 h-16 rounded-full p-0.5 ${
                      userStory.hasUnviewed 
                        ? 'bg-gradient-to-tr from-yellow-400 via-red-500 to-pink-500' 
                        : 'bg-gray-300'
                    }`}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewStory(userStory.stories[0])}
                      className="w-full h-full rounded-full p-0 bg-white"
                    >
                      <Avatar className="w-full h-full">
                        <AvatarImage src={userStory.user.avatar_url} />
                        <AvatarFallback>
                          {userStory.user.name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </div>
                  {userStory.hasUnviewed && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-xs text-white font-bold">!</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-700 mt-1 truncate w-16">
                  {userStory.user.name}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Modal de Visualização de Story */}
      {activeStory && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
          <div className="relative w-full h-full max-w-md mx-auto">
            {/* Header do Story */}
            <div className="absolute top-0 left-0 right-0 z-10 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={activeStory.user?.avatar_url} />
                    <AvatarFallback>
                      {activeStory.user?.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-white font-medium text-sm">
                      {activeStory.user?.name}
                    </p>
                    <p className="text-white text-xs opacity-75">
                      {formatDistanceToNow(new Date(activeStory.created_at), { 
                        addSuffix: true, 
                        locale: ptBR 
                      })}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCloseStory}
                  className="text-white hover:bg-white/20"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Barra de Progresso */}
            <div className="absolute top-16 left-4 right-4 z-10">
              <div className="flex space-x-1">
                {stories.filter(s => s.user_id === activeStory.user_id).map((story, index) => (
                  <div key={story.id} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-white rounded-full transition-all duration-100"
                      style={{ 
                        width: story.id === activeStory.id ? `${progress}%` : 
                               getStoryProgress(story.id) > 0 ? '100%' : '0%'
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Conteúdo do Story */}
            <div className="relative w-full h-full">
              {activeStory.media_type === 'image' ? (
                <img
                  src={activeStory.media_url}
                  alt="Story"
                  className="w-full h-full object-cover"
                />
              ) : activeStory.media_type === 'video' ? (
                <video
                  ref={videoRef}
                  src={activeStory.media_url}
                  className="w-full h-full object-cover"
                  autoPlay
                  muted
                  loop
                  onEnded={handleNextStory}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <p className="text-white text-lg font-medium text-center px-8">
                    {activeStory.content}
                  </p>
                </div>
              )}

              {/* Overlay de Controles */}
              <div className="absolute inset-0 flex">
                {/* Área de navegação anterior */}
                <div 
                  className="w-1/3 cursor-pointer"
                  onClick={handlePrevStory}
                />
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
                  className="w-1/3 cursor-pointer"
                  onClick={handleNextStory}
                />
              </div>
            </div>

            {/* Footer do Story */}
            <div className="absolute bottom-0 left-0 right-0 z-10 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLikeStory}
                    className="text-white hover:bg-white/20"
                  >
                    <Heart className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleReplyStory}
                    className="text-white hover:bg-white/20"
                  >
                    <MessageCircle className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleShareStory}
                    className="text-white hover:bg-white/20"
                  >
                    <Share2 className="h-5 w-5" />
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20"
                >
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoriesSection;
