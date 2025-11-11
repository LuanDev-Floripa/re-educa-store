import React, { useState, useEffect, useRef } from "react";
import logger from "@/utils/logger";
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
 * @returns {JSX.Element} Componente de mensagens diretas
 */
import { Button } from "../Ui/button";
import { Input } from "../Ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "../Ui/avatar";
import { Badge } from "../Ui/badge";
import { H3 } from "../Ui/typography";
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
  Image as ImageIcon,
  File,
  Download,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { apiService } from "../../lib/api";

const DirectMessages = ({
  conversations: propConversations = [],
  currentUser,
  onSendMessage,
  onStartConversation,
}) => {
  const [conversations, setConversations] = useState(propConversations);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  /**
   * Rola até o final das mensagens.
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Carregar conversas ao montar
  useEffect(() => {
    const loadConversations = async () => {
      try {
        setLoading(true);
        const response = await apiService.social.getConversations();
        if (response.conversations) {
          setConversations(response.conversations);
        }
      } catch (error) {
        logger.error("Erro ao carregar conversas:", error);
        // Se propConversations foi passado, usar ele
        if (propConversations.length > 0) {
          setConversations(propConversations);
        }
      } finally {
        setLoading(false);
      }
    };
    
    // Só carregar se não foram passadas via props
    if (propConversations.length === 0) {
      loadConversations();
    }
  }, [propConversations]);

  // Carregar mensagens quando seleciona conversa
  useEffect(() => {
    const loadMessages = async () => {
      if (!selectedConversation?.user_id) return;
      
      try {
        setLoading(true);
        const response = await apiService.social.getMessages(selectedConversation.user_id, { limit: 50 });
        if (response.messages) {
          setMessages(response.messages);
          // Marcar conversa como lida
          await apiService.social.markConversationRead(selectedConversation.user_id);
          // Atualizar conversas para remover unread_count
          setConversations(prev => prev.map(conv => 
            conv.user_id === selectedConversation.user_id 
              ? { ...conv, unread_count: 0 }
              : conv
          ));
        }
      } catch (error) {
        logger.error("Erro ao carregar mensagens:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadMessages();
  }, [selectedConversation?.user_id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  /**
   * Manipula o envio de mensagem.
   * 
   * @param {Event} e - Evento do formulário
   */
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation?.user_id) return;

    setIsTyping(true);

    try {
      // Enviar mensagem via API - backend espera recipient_id
      const response = await apiService.social.sendMessage({
        recipient_id: selectedConversation.user_id,
        content: newMessage.trim(),
      });

      if (response.success && response.message) {
        // Adicionar mensagem à lista local
        setMessages(prev => [...prev, response.message]);
        setNewMessage("");
        toast.success("Mensagem enviada!");

        // Callback opcional
        if (onSendMessage) {
          onSendMessage(selectedConversation.user_id, response.message);
        }
      } else {
        throw new Error(response.error || "Erro ao enviar mensagem");
      }
    } catch (error) {
      logger.error("Erro ao enviar mensagem:", error);
      toast.error(error.message || "Erro ao enviar mensagem");
    } finally {
      setIsTyping(false);
    }
  };

  /**
   * Envia mensagem com anexo (chamado após upload bem-sucedido).
   */
  const sendMessageWithAttachment = async (attachmentUrl, attachmentType, attachmentFilename, attachmentSize) => {
    if (!selectedConversation?.user_id) {
      toast.error("Selecione uma conversa para enviar o arquivo");
      return;
    }

    try {
      setIsTyping(true);
      
      const response = await apiService.social.sendMessage({
        recipient_id: selectedConversation.user_id,
        content: "", // Mensagem vazia quando há anexo
        attachment_url: attachmentUrl,
        attachment_type: attachmentType,
        attachment_filename: attachmentFilename,
        attachment_size: attachmentSize
      });

      if (response.success && response.message) {
        setMessages(prev => [...prev, response.message]);
        toast.success("Arquivo enviado com sucesso!");
        
        if (onSendMessage) {
          onSendMessage(selectedConversation.user_id, response.message);
        }
      } else {
        throw new Error(response.error || "Erro ao enviar arquivo");
      }
    } catch (error) {
      logger.error("Erro ao enviar mensagem com anexo:", error);
      toast.error(error.message || "Erro ao enviar arquivo");
    } finally {
      setIsTyping(false);
    }
  };

  /**
   * Manipula upload de arquivo.
   * 
   * @param {Event} e - Evento de mudança no input de arquivo
   */
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validar tamanho (máximo 25MB)
    const MAX_SIZE = 25 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      toast.error("Arquivo muito grande. Máximo: 25MB");
      return;
    }
    
    // Validar tipo
    const allowedExtensions = /\.(jpg|jpeg|png|gif|webp|pdf|doc|docx|txt|mp4|mp3|zip)$/i;
    if (!allowedExtensions.test(file.name)) {
      toast.error("Formato de arquivo não permitido");
      return;
    }
    
    try {
      setLoading(true);
      
      // Criar FormData
      const formData = new FormData();
      formData.append('file', file);
      
      // Obter token de autenticação
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:9001';
      
      // Fazer upload
      const uploadResponse = await fetch(`${apiUrl}/api/social/messages/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({ error: 'Erro ao fazer upload' }));
        throw new Error(errorData.error || 'Erro ao fazer upload');
      }
      
      const uploadData = await uploadResponse.json();
      
      if (uploadData.success) {
        // Enviar mensagem com anexo
        await sendMessageWithAttachment(
          uploadData.attachment_url,
          uploadData.attachment_type,
          uploadData.attachment_filename,
          uploadData.attachment_size
        );
      } else {
        throw new Error(uploadData.error || 'Erro ao fazer upload');
      }
      
      // Limpar input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      logger.error("Erro ao fazer upload de arquivo:", error);
      toast.error(error?.message || "Erro ao fazer upload do arquivo. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Manipula início de chamada de voz.
   */
  const handleStartCall = () => {
    // Funcionalidade em desenvolvimento
    toast.info("Chamadas de voz estarão disponíveis em breve!", {
      description: "Estamos trabalhando para trazer essa funcionalidade em breve.",
    });
  };

  /**
   * Manipula início de chamada de vídeo.
   */
  const handleStartVideoCall = () => {
    // Funcionalidade em desenvolvimento
    toast.info("Chamadas de vídeo estarão disponíveis em breve!", {
      description: "Estamos trabalhando para trazer essa funcionalidade em breve.",
    });
  };


  /**
   * Filtra conversas baseado na busca.
   */
  const filteredConversations = Array.isArray(conversations)
    ? conversations.filter((conv) =>
        (conv?.user_name || conv?.other_user?.name || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      )
    : [];


  /**
   * Manipula clique em uma conversa.
   * 
   * @param {Object} conversation - Objeto da conversa
   */
  const handleConversationClick = (conversation) => {
    setSelectedConversation(conversation);
    // Marcar como lida será feito automaticamente ao carregar mensagens
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
    <div className="flex h-[600px] bg-background rounded-2xl shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)] overflow-hidden border border-border/30">
      {/* Lista de Conversas */}
      <div className="w-1/3 border-r border-border/30 flex flex-col bg-background/95 backdrop-blur-sm">
        {/* Header */}
        <div className="p-5 border-b border-border/30">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Mensagens</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onStartConversation}
              className="text-primary hover:text-primary/80"
            >
              Nova Conversa
            </Button>
          </div>

          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground/80" />
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
          {loading ? (
            <div className="p-4 text-center text-muted-foreground dark:text-muted-foreground">
              <p>Carregando conversas...</p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground dark:text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
              <p>Nenhuma conversa encontrada</p>
              <p className="text-sm mt-2">Comece uma nova conversa!</p>
            </div>
          ) : (
            filteredConversations.map((conversation) => {
              const userName = conversation.user_name || conversation.other_user?.name || "Usuário";
              const avatarUrl = conversation.avatar_url || conversation.other_user?.avatar_url;
              const isSelected = selectedConversation?.user_id === conversation.user_id;
              
              return (
                <div
                  key={conversation.user_id || conversation.id}
                  onClick={() => handleConversationClick(conversation)}
                  className={`p-4 border-b border-border cursor-pointer hover:bg-accent ${
                    isSelected
                      ? "bg-primary/10"
                      : ""
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={avatarUrl} />
                        <AvatarFallback>
                          {userName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-foreground truncate">
                          {userName}
                        </h3>
                        <span className="text-xs text-muted-foreground/90">
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
                        <p className="text-sm text-muted-foreground dark:text-muted-foreground truncate">
                          {conversation.last_message || "Nenhuma mensagem"}
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
              );
            })
          )}
        </div>
      </div>

      {/* Área de Mensagens */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Header da Conversa */}
            <div className="p-5 border-b border-border/30 bg-background/95 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
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
                      src={selectedConversation.avatar_url || selectedConversation.other_user?.avatar_url}
                    />
                    <AvatarFallback>
                      {(selectedConversation.user_name || selectedConversation.other_user?.name || "U").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div>
                    <h3 className="font-medium text-foreground">
                      {selectedConversation.user_name || selectedConversation.other_user?.name || "Usuário"}
                    </h3>
                    <p className="text-sm text-muted-foreground/90">
                      Online
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleStartCall}
                    className="relative group"
                    title="Chamada de voz (em breve)"
                  >
                    <Phone className="h-4 w-4" />
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full opacity-75"></span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleStartVideoCall}
                    className="relative group"
                    title="Chamada de vídeo (em breve)"
                  >
                    <Video className="h-4 w-4" />
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full opacity-75"></span>
                  </Button>
                  <Button variant="ghost" size="sm" title="Informações da conversa">
                    <Info className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Mensagens */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted">
              {loading && messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-muted-foreground/90">Carregando mensagens...</div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-muted-foreground/90 text-center">
                    <MessageCircle className="h-12 w-12 mx-auto mb-2 text-muted-foreground/60" />
                    <p>Nenhuma mensagem ainda</p>
                    <p className="text-sm">Comece a conversar!</p>
                  </div>
                </div>
              ) : (
                messages.map((message) => {
                  // Verificar se mensagem tem sender ou sender_id
                  const sender = message.sender || {};
                  const senderId = message.sender_id || sender.id;
                  const isOwnMessage = senderId === currentUser?.id;
                  
                  return (
                    <div
                      key={message.id}
                      className={`flex ${
                        isOwnMessage
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          isOwnMessage
                            ? "bg-primary text-primary-foreground"
                            : "bg-card text-foreground border border-border/30"
                        }`}
                      >
                        {message.content && <p className="text-sm">{message.content}</p>}

                        {/* Exibir anexo se existir */}
                        {message.attachment_url && (
                          <div className="mt-2">
                            {message.attachment_type === "image" ? (
                              <div>
                                <img
                                  src={message.attachment_url}
                                  alt={message.attachment_filename || "Imagem"}
                                  className="rounded-lg max-w-full h-auto max-h-64 cursor-pointer"
                                  onClick={() => window.open(message.attachment_url, '_blank')}
                                />
                                {message.attachment_filename && (
                                  <p className="text-xs mt-1 opacity-75">{message.attachment_filename}</p>
                                )}
                              </div>
                            ) : message.attachment_type === "video" ? (
                              <div>
                                <video
                                  src={message.attachment_url}
                                  className="rounded-lg max-w-full h-auto max-h-64"
                                  controls
                                />
                                {message.attachment_filename && (
                                  <p className="text-xs mt-1 opacity-75">{message.attachment_filename}</p>
                                )}
                              </div>
                            ) : (
                              <div className={`p-3 rounded-lg border ${isOwnMessage ? 'bg-white/20 border-white/30' : 'bg-muted border-border'}`}>
                                <div className="flex items-center space-x-2">
                                  <File className="h-5 w-5" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">
                                      {message.attachment_filename || "Arquivo"}
                                    </p>
                                    {message.attachment_size && (
                                      <p className="text-xs opacity-75">
                                        {(message.attachment_size / 1024).toFixed(1)} KB
                                      </p>
                                    )}
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => window.open(message.attachment_url, '_blank')}
                                    className="ml-2"
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Suporte legado para media_url (compatibilidade) */}
                        {!message.attachment_url && message.media_url && (
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
                              <div className={`p-2 rounded-lg ${isOwnMessage ? 'bg-primary/20' : 'bg-muted'}`}>
                                <Paperclip className="h-4 w-4 inline mr-2" />
                                <span className="text-sm">{message.media_name}</span>
                              </div>
                            )}
                          </div>
                        )}

                      <div className="flex items-center justify-end mt-1 space-x-1">
                        <span className={`text-xs ${isOwnMessage ? 'opacity-75' : 'text-muted-foreground dark:text-muted-foreground'}`}>
                          {message.created_at
                            ? formatDistanceToNow(new Date(message.created_at), {
                                addSuffix: true,
                                locale: ptBR,
                              })
                            : ""}
                        </span>
                        {isOwnMessage && (
                          message.read_at ? (
                            <CheckCheck className="h-3 w-3 text-primary" />
                          ) : (
                            <Check className="h-3 w-3 text-primary" />
                          )
                        )}
                      </div>
                    </div>
                  </div>
                  );
                })
              )}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-card text-foreground border border-border px-4 py-2 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                      <div
                        className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      />
                      <div
                        className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input de Mensagem */}
            <div className="p-4 border-t border-border bg-background">
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
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.zip"
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
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p>Selecione uma conversa para começar</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DirectMessages;
