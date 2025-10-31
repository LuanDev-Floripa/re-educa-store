import React, { useState, useEffect, useRef } from "react";
/**
 * Mensagens Diretas - Componente de conversas 1:1.
 * 
 * Funcionalidades:
 * - Lista conversas e permite busca
 * - Envia mensagens de texto
 * - Indica digitação e status de mensagens
 * - Marca conversas como lidas
 * - Suporte a upload de arquivos (preparado)
 * 
 * @component
 * @param {Object} props - Props do componente
 * @param {Array} props.conversations - Lista de conversas
 * @param {Object} props.currentUser - Usuário atual
 * @param {Function} props.onSendMessage - Callback ao enviar mensagem
 * @param {Function} props.onStartConversation - Callback ao iniciar nova conversa
 * @param {Function} props.onMarkAsRead - Callback ao marcar como lida
 * @returns {JSX.Element} Componente de mensagens diretas
 */
import { Button } from "../Ui/button";
import { Input } from "../Ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "../Ui/avatar";
import { Badge } from "../Ui/badge";
import {
  Search,
  Send,
  Smile,
  Phone,
  Video,
  Info,
  ArrowLeft,
  Check,
  CheckCheck,
  Clock,
  Paperclip,
  Mic,
  MessageCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

const DirectMessages = ({
  conversations = [],
  currentUser,
  onSendMessage,
  onStartConversation,
  onMarkAsRead,
}) => {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  /**
   * Rola até o final das mensagens.
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [selectedConversation?.messages]);

  /**
   * Manipula o envio de mensagem.
   * 
   * @param {Event} e - Evento do formulário
   */
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    // Marcar como lida se disponível
    if (onMarkAsRead && selectedConversation.id) {
      onMarkAsRead(selectedConversation.id);
    }

    setIsTyping(true);

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Token de autenticação não encontrado");
      }

      // Enviar mensagem via API
      const response = await fetch("/api/social/messages", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversation_id: selectedConversation.id,
          content: newMessage.trim(),
          message_type: "text",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setNewMessage("");
        setIsTyping(false);
        toast.success("Mensagem enviada!");

        if (onSendMessage) {
          onSendMessage(selectedConversation.id, data);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Erro ao enviar mensagem");
      }
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      toast.error(error.message || "Erro ao enviar mensagem");
      setIsTyping(false);
    }
  };

  /**
   * Manipula upload de arquivo.
   * 
   * @param {Event} e - Evento de mudança no input de arquivo
   */
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // TODO: Implementar upload de arquivo
      toast.info("Upload de arquivo será implementado em breve!");
    }
  };

  /**
   * Manipula início de chamada de voz.
   */
  const handleStartCall = () => {
    toast.info("Funcionalidade de chamada em breve!");
  };

  /**
   * Manipula início de chamada de vídeo.
   */
  const handleStartVideoCall = () => {
    toast.info("Funcionalidade de vídeo chamada em breve!");
  };

  /**
   * Retorna ícone de status da mensagem.
   * 
   * @param {Object} message - Objeto da mensagem
   * @returns {JSX.Element|null} Ícone de status
   */
  const getMessageStatus = (message) => {
    if (message.status === "sent")
      return <Check className="h-3 w-3 text-gray-400" />;
    if (message.status === "delivered")
      return <CheckCheck className="h-3 w-3 text-gray-400" />;
    if (message.status === "read")
      return <CheckCheck className="h-3 w-3 text-blue-500" />;
    return <Clock className="h-3 w-3 text-gray-400" />;
  };

  /**
   * Filtra conversas baseado na busca.
   */
  const filteredConversations = Array.isArray(conversations)
    ? conversations.filter((conv) =>
        conv?.other_user?.name
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase())
      )
    : [];

  /**
   * Calcula total de mensagens não lidas.
   * Mantido para uso futuro ou exibição.
   */
  // eslint-disable-next-line no-unused-vars
  const unreadCount = Array.isArray(conversations)
    ? conversations.reduce((total, conv) => total + (conv.unread_count || 0), 0)
    : 0;

  /**
   * Marca uma conversa como lida.
   * 
   * @param {string} conversationId - ID da conversa
   */
  const markAsRead = (conversationId) => {
    if (onMarkAsRead && conversationId) {
      onMarkAsRead(conversationId);
    }
  };

  /**
   * Manipula clique em uma conversa.
   * 
   * @param {Object} conversation - Objeto da conversa
   */
  const handleConversationClick = (conversation) => {
    setSelectedConversation(conversation);
    if (conversation?.id) {
      markAsRead(conversation.id);
    }
  };

  /**
   * Manipula mudanças na entrada de mensagem.
   * 
   * @param {Event} e - Evento de mudança no input
   */
  const handleMessageChange = (e) => {
    setNewMessage(e.target.value);
  };

  return (
    <div className="flex h-[600px] bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Lista de Conversas */}
      <div className="w-1/3 border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Mensagens</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onStartConversation}
              className="text-blue-500 hover:text-blue-700"
            >
              Nova Conversa
            </Button>
          </div>

          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar conversas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Lista de Conversas */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <p>Nenhuma conversa encontrada</p>
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => handleConversationClick(conversation)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                  selectedConversation?.id === conversation.id
                    ? "bg-blue-50"
                    : ""
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={conversation.other_user?.avatar_url} />
                      <AvatarFallback>
                        {conversation.other_user?.name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    {conversation.other_user?.is_online && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900 truncate">
                        {conversation.other_user?.name || "Usuário"}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {conversation.last_message_at
                          ? formatDistanceToNow(
                              new Date(conversation.last_message_at),
                              {
                                addSuffix: true,
                                locale: ptBR,
                              }
                            )
                          : ""}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-1">
                      <p className="text-sm text-gray-600 truncate">
                        {conversation.last_message?.content || "Nenhuma mensagem"}
                      </p>
                      {(conversation.unread_count || 0) > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {conversation.unread_count}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Área de Mensagens */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Header da Conversa */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedConversation(null)}
                    className="lg:hidden"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>

                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={selectedConversation.other_user?.avatar_url}
                    />
                    <AvatarFallback>
                      {selectedConversation.other_user?.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>

                  <div>
                    <h3 className="font-medium text-gray-900">
                      {selectedConversation.other_user?.name || "Usuário"}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {selectedConversation.other_user?.is_online
                        ? "Online"
                        : "Offline"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" onClick={handleStartCall}>
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleStartVideoCall}
                  >
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Info className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Mensagens */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {Array.isArray(selectedConversation.messages) &&
                selectedConversation.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.sender_id === currentUser?.id
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.sender_id === currentUser?.id
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>

                      {message.media_url && (
                        <div className="mt-2">
                          {message.media_type === "image" ? (
                            <img
                              src={message.media_url}
                              alt="Mídia"
                              className="rounded-lg max-w-full h-auto"
                            />
                          ) : message.media_type === "video" ? (
                            <video
                              src={message.media_url}
                              className="rounded-lg max-w-full h-auto"
                              controls
                            />
                          ) : (
                            <div className="p-2 bg-white/20 rounded-lg">
                              <Paperclip className="h-4 w-4 inline mr-2" />
                              <span className="text-sm">{message.media_name}</span>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-end mt-1 space-x-1">
                        <span className="text-xs opacity-75">
                          {message.created_at
                            ? formatDistanceToNow(new Date(message.created_at), {
                                addSuffix: true,
                                locale: ptBR,
                              })
                            : ""}
                        </span>
                        {message.sender_id === currentUser?.id &&
                          getMessageStatus(message)}
                      </div>
                    </div>
                  </div>
                ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      />
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input de Mensagem */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <form
                onSubmit={handleSendMessage}
                className="flex items-center space-x-2"
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <Input
                  value={newMessage}
                  onChange={handleMessageChange}
                  placeholder="Digite uma mensagem..."
                  className="flex-1"
                />

                <Button type="button" variant="ghost" size="sm">
                  <Smile className="h-4 w-4" />
                </Button>

                <Button type="button" variant="ghost" size="sm">
                  <Mic className="h-4 w-4" />
                </Button>

                <Button type="submit" disabled={!newMessage.trim()} size="sm">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Selecione uma conversa para começar</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DirectMessages;
