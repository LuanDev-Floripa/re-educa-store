import React, { useState, useEffect } from "react";
/**
 * Centro de Notificações do Social.
 * - Filtro e busca; ações por tipo; toasts em interações
 */
import { Card, CardContent, CardHeader, CardTitle } from "../Ui/card";
import { Button } from "../Ui/button";
import { Badge } from "../Ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../Ui/avatar";
import {
  Bell,
  Heart,
  MessageCircle,
  UserPlus,
  Share2,
  Award,
  Settings,
  Check,
  X,
  MoreHorizontal,
  Filter,
  Search,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

const NotificationsCenter = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onFollowUser,
  onLikePost,
  onCommentPost,
}) => {
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSettings, setShowSettings] = useState(false);

  const notificationTypes = {
    like: {
      icon: Heart,
      color: "text-red-500",
      bgColor: "bg-red-50",
      label: "Curtida",
    },
    comment: {
      icon: MessageCircle,
      color: "text-blue-500",
      bgColor: "bg-blue-50",
      label: "Comentário",
    },
    follow: {
      icon: UserPlus,
      color: "text-green-500",
      bgColor: "bg-green-50",
      label: "Seguiu você",
    },
    share: {
      icon: Share2,
      color: "text-purple-500",
      bgColor: "bg-purple-50",
      label: "Compartilhou",
    },
    achievement: {
      icon: Award,
      color: "text-yellow-500",
      bgColor: "bg-yellow-50",
      label: "Conquista",
    },
  };

  const filteredNotifications = (Array.isArray(notifications) ? notifications : []).filter((notification) => {
    const matchesFilter = filter === "all" || notification.type === filter;
    const matchesSearch =
      notification.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.user?.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const unreadCount = (Array.isArray(notifications) ? notifications : []).filter((n) => !n.is_read).length;

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      onMarkAsRead(notification.id);
    }

    // Navegar para o conteúdo relacionado
    switch (notification.type) {
      case "like":
      case "comment":
      case "share":
        if (notification.post_id) {
          // Navegar para o post
          window.location.href = `/social/post/${notification.post_id}`;
        }
        break;
      case "follow":
        if (notification.user_id) {
          // Navegar para o perfil do usuário
          window.location.href = `/social/profile/${notification.user_id}`;
        }
        break;
      default:
        break;
    }
  };

  const handleFollowUser = (e, userId) => {
    e.stopPropagation();
    onFollowUser(userId);
    toast.success("Usuário seguido!");
  };

  const handleLikePost = (e, postId) => {
    e.stopPropagation();
    onLikePost(postId);
    toast.success("Post curtido!");
  };

  const handleCommentPost = (e, postId) => {
    e.stopPropagation();
    onCommentPost(postId);
  };

  const getNotificationIcon = (type) => {
    const config = notificationTypes[type] || notificationTypes.like;
    const Icon = config.icon;
    return <Icon className={`h-4 w-4 ${config.color}`} />;
  };

  const getNotificationBgColor = (type) => {
    const config = notificationTypes[type] || notificationTypes.like;
    return config.bgColor;
  };

  const getNotificationLabel = (type) => {
    const config = notificationTypes[type] || notificationTypes.like;
    return config.label;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <h2 className="text-xl font-semibold">Notificações</h2>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {unreadCount}
            </Badge>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(true)}
          >
            <Settings className="h-4 w-4" />
          </Button>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={onMarkAllAsRead}>
              <Check className="h-4 w-4 mr-2" />
              Marcar todas como lidas
            </Button>
          )}
        </div>
      </div>

      {/* Filtros e Busca */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Busca */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar notificações..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filtros */}
            <div className="flex space-x-2">
              <Button
                variant={filter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("all")}
              >
                Todas
              </Button>
              <Button
                variant={filter === "like" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("like")}
              >
                Curtidas
              </Button>
              <Button
                variant={filter === "comment" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("comment")}
              >
                Comentários
              </Button>
              <Button
                variant={filter === "follow" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("follow")}
              >
                Seguidores
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Notificações */}
      <Card>
        <CardContent className="p-0">
          {filteredNotifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhuma notificação encontrada</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                    !notification.is_read
                      ? "bg-blue-50 border-l-4 border-l-blue-500"
                      : ""
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {/* Avatar do usuário */}
                    <div className="flex-shrink-0">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={notification.user?.avatar_url} />
                        <AvatarFallback>
                          {notification.user?.name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                    </div>

                    {/* Conteúdo da notificação */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-gray-900">
                              {notification.user?.name}
                            </span>
                            <span className="text-sm text-gray-500">
                              {getNotificationLabel(notification.type)}
                            </span>
                            <div
                              className={`p-1 rounded-full ${getNotificationBgColor(notification.type)}`}
                            >
                              {getNotificationIcon(notification.type)}
                            </div>
                          </div>

                          <p className="text-sm text-gray-700 mb-2">
                            {notification.content}
                          </p>

                          <div className="flex items-center space-x-4">
                            <span className="text-xs text-gray-500">
                              {formatDistanceToNow(
                                new Date(notification.created_at),
                                {
                                  addSuffix: true,
                                  locale: ptBR,
                                },
                              )}
                            </span>

                            {/* Ações baseadas no tipo */}
                            {notification.type === "follow" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) =>
                                  handleFollowUser(e, notification.user_id)
                                }
                                className="text-xs"
                              >
                                Seguir
                              </Button>
                            )}

                            {notification.type === "like" &&
                              notification.post_id && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) =>
                                    handleLikePost(e, notification.post_id)
                                  }
                                  className="text-xs"
                                >
                                  <Heart className="h-3 w-3 mr-1" />
                                  Curtir
                                </Button>
                              )}

                            {notification.type === "comment" &&
                              notification.post_id && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) =>
                                    handleCommentPost(e, notification.post_id)
                                  }
                                  className="text-xs"
                                >
                                  <MessageCircle className="h-3 w-3 mr-1" />
                                  Comentar
                                </Button>
                              )}
                          </div>
                        </div>

                        {/* Ações da notificação */}
                        <div className="flex items-center space-x-1">
                          {!notification.is_read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteNotification(notification.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Configurações */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Configurações de Notificações
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSettings(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Curtidas</span>
                  <input type="checkbox" defaultChecked className="rounded" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Comentários</span>
                  <input type="checkbox" defaultChecked className="rounded" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Novos seguidores</span>
                  <input type="checkbox" defaultChecked className="rounded" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Compartilhamentos</span>
                  <input type="checkbox" defaultChecked className="rounded" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Conquistas</span>
                  <input type="checkbox" defaultChecked className="rounded" />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowSettings(false)}
                >
                  Cancelar
                </Button>
                <Button onClick={() => setShowSettings(false)}>Salvar</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default NotificationsCenter;
