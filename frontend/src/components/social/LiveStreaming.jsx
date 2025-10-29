import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../Ui/card';
import { Button } from '../Ui/button';
import { Input } from '../Ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '../Ui/avatar';
import { Badge } from '../Ui/badge';
import { Progress } from '../Ui/progress';
import StreamCard from './shared/StreamCard';
import StreamChat from './shared/StreamChat';
import { useLiveStreaming } from '../../hooks/useLiveStreaming';
import { useWebSocket } from '../../hooks/useWebSocket';
import {
  Play, Pause, Square, Mic, MicOff, Video, VideoOff, Settings, Users, Heart, MessageCircle, Share2,
  MoreHorizontal, Eye, Clock, Wifi, WifiOff, AlertCircle, CheckCircle, X, Plus, Camera,
  Volume2, VolumeX, Maximize, Minimize, RotateCcw, RotateCw, Zap, Star, Gift, Crown
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

const LiveStreaming = ({ 
  currentUser, 
  onStartStream, 
  onEndStream, 
  onJoinStream, 
  onLeaveStream, 
  onSendMessage, 
  onSendGift, 
  onFollowUser, 
  onReportStream
}) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isWatching, setIsWatching] = useState(false);
  const [streamTitle, setStreamTitle] = useState('');
  const [streamCategory, setStreamCategory] = useState('fitness');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [streamQuality, setStreamQuality] = useState('auto');
  const [showSettings, setShowSettings] = useState(false);
  const [showGifts, setShowGifts] = useState(false);
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Use custom hooks
  const {
    streams,
    currentStream,
    isStreaming: hookIsStreaming,
    isWatching: hookIsWatching,
    viewers,
    messages,
    isLoading,
    error,
    startStream,
    endStream,
    joinStream,
    leaveStream,
    sendMessage,
    sendGift,
    followUser,
    reportStream,
    fetchStreams
  } = useLiveStreaming();

  // WebSocket for real-time updates
  const { isConnected, sendMessage: sendWSMessage } = useWebSocket('/live', (data) => {
    // Handle real-time updates
  });

  // Carregar streams reais via hook (useLiveStreaming já faz isso)
  useEffect(() => {
    if (fetchStreams) {
      fetchStreams();
    }
  }, [fetchStreams]);

  // Mensagens e espectadores serão carregados via WebSocket quando um stream for selecionado
  // Remove mocks - dados reais vêm via WebSocket ou API quando necessário

  const handleStartStream = async () => {
    if (!streamTitle.trim()) {
      toast.error('Digite um título para a transmissão');
      return;
    }

    try {
      const streamData = {
        title: streamTitle,
        category: streamCategory,
        description: `Transmissão de ${streamCategory}`,
        tags: [streamCategory, 'ao-vivo']
      };

      await startStream(streamData);
      setIsStreaming(true);
      toast.success('Transmissão iniciada!');
    } catch (error) {
      toast.error('Erro ao iniciar transmissão');
    }
  };

  const handleEndStream = async () => {
    try {
      await endStream(currentStream?.id);
      setIsStreaming(false);
      toast.success('Transmissão encerrada');
    } catch (error) {
      toast.error('Erro ao encerrar transmissão');
    }
  };

  const handleJoinStream = async (stream) => {
    try {
      await joinStream(stream.id);
      setIsWatching(true);
      toast.success(`Assistindo ${stream.user.name}`);
    } catch (error) {
      toast.error('Erro ao entrar na transmissão');
    }
  };

  const handleLeaveStream = async () => {
    try {
      await leaveStream(currentStream?.id);
      setIsWatching(false);
    } catch (error) {
      toast.error('Erro ao sair da transmissão');
    }
  };

  const handleSendMessage = async (messageData) => {
    try {
      await sendMessage(messageData);
    } catch (error) {
      toast.error('Erro ao enviar mensagem');
    }
  };

  const handleSendGift = async (giftData) => {
    try {
      await sendGift(giftData);
      toast.success(`Enviou ${giftData.gift.name} para ${currentStream.user.name}`);
    } catch (error) {
      toast.error('Erro ao enviar presente');
    }
  };

  const handleFollowUser = async (userId) => {
    try {
      await followUser(userId);
      toast.success('Usuário seguido!');
    } catch (error) {
      toast.error('Erro ao seguir usuário');
    }
  };

  const handleReportStream = async (streamId, reason) => {
    try {
      await reportStream(streamId, reason);
      toast.success('Transmissão reportada');
    } catch (error) {
      toast.error('Erro ao reportar transmissão');
    }
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const gifts = [
    { id: 1, name: 'Coração', emoji: '❤️', cost: 1, color: 'text-red-500' },
    { id: 2, name: 'Estrela', emoji: '⭐', cost: 5, color: 'text-yellow-500' },
    { id: 3, name: 'Diamante', emoji: '💎', cost: 10, color: 'text-blue-500' },
    { id: 4, name: 'Coroa', emoji: '👑', cost: 25, color: 'text-purple-500' },
    { id: 5, name: 'Foguete', emoji: '🚀', cost: 50, color: 'text-orange-500' },
    { id: 6, name: 'Presente', emoji: '🎁', cost: 100, color: 'text-green-500' }
  ];

  const categories = [
    { value: 'fitness', label: 'Fitness', icon: '💪' },
    { value: 'nutrition', label: 'Nutrição', icon: '🥗' },
    { value: 'yoga', label: 'Yoga', icon: '🧘' },
    { value: 'running', label: 'Corrida', icon: '🏃' },
    { value: 'cycling', label: 'Ciclismo', icon: '🚴' },
    { value: 'swimming', label: 'Natação', icon: '🏊' },
    { value: 'dance', label: 'Dança', icon: '💃' },
    { value: 'other', label: 'Outros', icon: '🎯' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Live Streaming
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Transmita ao vivo e conecte-se com sua comunidade
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="destructive" className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span>AO VIVO</span>
          </Badge>
        </div>
      </div>

      {/* Controles de Transmissão */}
      {!isStreaming && !isWatching && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Camera className="w-5 h-5" />
              <span>Iniciar Transmissão</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Título da Transmissão
                </label>
                <Input
                  value={streamTitle}
                  onChange={(e) => setStreamTitle(e.target.value)}
                  placeholder="Ex: Treino HIIT - Queima de Gordura"
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Categoria
                </label>
                <select
                  value={streamCategory}
                  onChange={(e) => setStreamCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                >
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.icon} {category.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <Button 
              onClick={handleStartStream}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >
              <Play className="w-4 h-4 mr-2" />
              Iniciar Transmissão
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Controles da Transmissão Ativa */}
      {isStreaming && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span>Transmissão Ativa</span>
              </span>
              <div className="flex items-center space-x-2">
                <Badge variant="destructive">AO VIVO</Badge>
                <Button
                  onClick={handleEndStream}
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                >
                  <Square className="w-4 h-4 mr-1" />
                  Encerrar
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {streamStats.viewers}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Espectadores
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {streamStats.likes}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Curtidas
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {streamStats.shares}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Compartilhamentos
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatDuration(streamStats.duration)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Duração
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-center space-x-4">
              <Button
                onClick={() => setIsMuted(!isMuted)}
                variant={isMuted ? "destructive" : "outline"}
                size="sm"
              >
                {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
              <Button
                onClick={() => setIsVideoOff(!isVideoOff)}
                variant={isVideoOff ? "destructive" : "outline"}
                size="sm"
              >
                {isVideoOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
              </Button>
              <Button
                onClick={() => setShowSettings(!showSettings)}
                variant="outline"
                size="sm"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Player de Vídeo */}
      {isWatching && currentStream && (
        <Card>
          <CardContent className="p-0">
            <div className="relative bg-black rounded-lg overflow-hidden">
              <div className="aspect-video bg-gray-900 flex items-center justify-center">
                <div className="text-center text-white">
                  <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Player de Vídeo</p>
                  <p className="text-sm opacity-75">
                    {currentStream.user.name} - {currentStream.title}
                  </p>
                </div>
              </div>
              
              {/* Controles do Player */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center space-x-4">
                    <Button
                      onClick={() => setIsMuted(!isMuted)}
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/20"
                    >
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </Button>
                    <Button
                      onClick={() => setShowSettings(!showSettings)}
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/20"
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={handleLeaveStream}
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/20"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

             {/* Lista de Streams Ativos */}
             {!isStreaming && !isWatching && (
               <div className="space-y-4">
                 <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                   Transmissões Ao Vivo
                 </h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                   {streams.map(stream => (
                     <StreamCard
                       key={stream.id}
                       stream={stream}
                       onJoin={handleJoinStream}
                       onFollow={handleFollowUser}
                       onReport={handleReportStream}
                     />
                   ))}
                 </div>
               </div>
             )}

      {/* Chat da Transmissão */}
      {isWatching && currentStream && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {/* Player de Vídeo já renderizado acima */}
          </div>

          <div className="space-y-4">
            {/* Informações da Transmissão */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span>{currentStream.title}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={currentStream.user.avatar_url} />
                    <AvatarFallback>{currentStream.user.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {currentStream.user.name}
                      </h4>
                      {currentStream.user.is_verified && (
                        <Badge variant="secondary" className="text-xs">
                          ✓
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      @{currentStream.user.username}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    {currentStream.viewer_count} espectadores
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {formatDistanceToNow(new Date(currentStream.created_at), {
                      addSuffix: true,
                      locale: ptBR
                    })}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => handleFollowUser(currentStream.user.id)}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Seguir
                  </Button>
                  <Button
                    onClick={() => setShowGifts(true)}
                    variant="outline"
                    size="sm"
                  >
                    <Gift className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Chat Component */}
            <StreamChat
              streamId={currentStream.id}
              messages={messages}
              onSendMessage={handleSendMessage}
              onSendGift={handleSendGift}
              currentUser={currentUser}
              isCollapsed={isChatCollapsed}
              onToggleCollapse={() => setIsChatCollapsed(!isChatCollapsed)}
            />

            {/* Espectadores */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Espectadores ({viewers.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {viewers.map(viewer => (
                    <div key={viewer.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={viewer.avatar} />
                          <AvatarFallback>{viewer.name[0]}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-gray-900 dark:text-white">
                          {viewer.name}
                        </span>
                      </div>
                      {viewer.isFollowing && (
                        <Badge variant="secondary" className="text-xs">
                          Seguindo
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Modal de Presentes */}
      {showGifts && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Enviar Presente</CardTitle>
              <Button
                onClick={() => setShowGifts(false)}
                variant="ghost"
                size="sm"
              >
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {gifts.map(gift => (
                  <Button
                    key={gift.id}
                    onClick={() => handleSendGift(gift)}
                    variant="outline"
                    className="flex flex-col items-center space-y-2 p-4 h-auto"
                  >
                    <span className={`text-2xl ${gift.color}`}>
                      {gift.emoji}
                    </span>
                    <span className="text-sm font-medium">{gift.name}</span>
                    <span className="text-xs text-gray-500">{gift.cost} moedas</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Configurações */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Configurações</CardTitle>
              <Button
                onClick={() => setShowSettings(false)}
                variant="ghost"
                size="sm"
              >
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Qualidade da Transmissão
                </label>
                <select
                  value={streamQuality}
                  onChange={(e) => setStreamQuality(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                >
                  <option value="auto">Automática</option>
                  <option value="720p">720p HD</option>
                  <option value="1080p">1080p Full HD</option>
                  <option value="480p">480p SD</option>
                </select>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Microfone
                </span>
                <Button
                  onClick={() => setIsMuted(!isMuted)}
                  variant={isMuted ? "destructive" : "outline"}
                  size="sm"
                >
                  {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Câmera
                </span>
                <Button
                  onClick={() => setIsVideoOff(!isVideoOff)}
                  variant={isVideoOff ? "destructive" : "outline"}
                  size="sm"
                >
                  {isVideoOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default LiveStreaming;
