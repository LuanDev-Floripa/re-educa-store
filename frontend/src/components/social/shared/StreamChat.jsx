import React, { useState, useEffect, useRef } from "react";
/**
 * Chat de stream ao vivo.
 * - Envia mensagens, presentes e curtidas
 * - Fallbacks para dados opcionais e acessibilidade básica
 */
import { Card, CardContent, CardHeader, CardTitle } from "../../Ui/card";
import { Button } from "../../Ui/button";
import { Input } from "../../Ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "../../Ui/avatar";
import { Badge } from "../../Ui/badge";
import {
  Send,
  Heart,
  Gift,
  Smile,
  MoreHorizontal,
  Volume2,
  VolumeX,
  Settings,
  X,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const StreamChat = ({
  streamId,
  messages = [],
  onSendMessage,
  onSendGift,
  onLikeMessage,
  currentUser,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const [newMessage, setNewMessage] = useState("");
  const [showGifts, setShowGifts] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    onSendMessage?.({
      streamId,
      message: newMessage,
      user: currentUser,
    });
    setNewMessage("");
  };

  const handleSendGift = (gift) => {
    onSendGift?.({
      streamId,
      gift,
      user: currentUser,
    });
    setShowGifts(false);
  };

  const handleLikeMessage = (messageId) => {
    onLikeMessage?.(messageId);
  };

  const gifts = [
    { id: 1, name: "Coração", emoji: "❤️", cost: 10, color: "text-destructive" },
    { id: 2, name: "Estrela", emoji: "⭐", cost: 25, color: "text-primary" },
    { id: 3, name: "Diamante", emoji: "💎", cost: 50, color: "text-primary" },
    { id: 4, name: "Coroa", emoji: "👑", cost: 100, color: "text-primary" },
    {
      id: 5,
      name: "Foguete",
      emoji: "🚀",
      cost: 200,
      color: "text-primary",
    },
    {
      id: 6,
      name: "Presente",
      emoji: "🎁",
      cost: 500,
      color: "text-primary",
    },
  ];

  const emojis = ["😀", "😂", "😍", "🤔", "👏", "🔥", "💪", "🎉", "👍", "❤️"];

  if (isCollapsed) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={onToggleCollapse}
          className="rounded-full w-12 h-12 shadow-lg"
        >
          💬
        </Button>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-sm h-96 flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Chat</CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => setIsMuted(!isMuted)}
              variant="ghost"
              size="sm"
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </Button>
            <Button onClick={onToggleCollapse} variant="ghost" size="sm">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {(Array.isArray(messages) ? messages : []).map((message) => (
            <div key={message.id} className="flex items-start space-x-2">
              <Avatar className="w-6 h-6">
                <AvatarImage src={message?.user?.avatar} />
                <AvatarFallback>{message?.user?.name?.[0] ?? "U"}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-xs font-medium text-foreground">
                    {message?.user?.name ?? "Usuário"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(message?.created_at ?? Date.now()), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <p className="text-sm text-foreground">
                    {message?.message ?? ""}
                  </p>
                  {Number(message?.likes ?? 0) > 0 && (
                    <Badge variant="outline" className="text-xs">
                      ❤️ {Number(message?.likes ?? 0)}
                    </Badge>
                  )}
                </div>
              </div>
              <Button
                onClick={() => handleLikeMessage(message?.id)}
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive"
                aria-label="Curtir mensagem"
              >
                <Heart className="w-3 h-3" />
              </Button>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="p-4 border-t">
          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Digite sua mensagem..."
              className="flex-1"
            />
            <Button
              onClick={() => setShowEmojis(!showEmojis)}
              variant="outline"
              size="sm"
            >
              <Smile className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => setShowGifts(true)}
              variant="outline"
              size="sm"
            >
              <Gift className="w-4 h-4" />
            </Button>
            <Button type="submit" size="sm">
              <Send className="w-4 h-4" />
            </Button>
          </form>

          {/* Emoji Picker */}
          {showEmojis && (
            <div className="mt-2 p-2 bg-muted rounded-lg">
              <div className="flex flex-wrap gap-1">
                {emojis.map((emoji) => (
                  <Button
                    key={emoji}
                    onClick={() => {
                      setNewMessage((prev) => prev + emoji);
                      setShowEmojis(false);
                    }}
                    variant="ghost"
                    size="sm"
                    className="w-8 h-8 p-0"
                  >
                    {emoji}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>

      {/* Gifts Modal */}
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
                {gifts.map((gift) => (
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
                    <span className="text-xs text-muted-foreground">
                      {gift.cost} moedas
                    </span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </Card>
  );
};

export default StreamChat;
