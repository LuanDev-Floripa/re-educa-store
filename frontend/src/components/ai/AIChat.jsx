/**
 * AIChat Component - RE-EDUCA Store
 * 
 * Componente de chat com IA PREDITIVO usando contexto completo do usuário.
 * 
 * Funcionalidades:
 * - Chat interativo com IA preditiva
 * - Contexto completo do usuário (perfil, saúde, treinos, compras, objetivos)
 * - Histórico de conversas
 * - Sugestões inteligentes baseadas em contexto
 * - Scroll automático
 * 
 * @component
 * @returns {JSX.Element} Interface de chat com IA preditiva
 */
import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/Ui/card";
import { Button } from "@/components/Ui/button";
import { Input } from "@/components/Ui/input";
import { ScrollArea } from "@/components/Ui/scroll-area";
import { Badge } from "@/components/Ui/badge";
import { Avatar, AvatarFallback } from "@/components/Ui/avatar";
import {
  Bot,
  User,
  Send,
  Loader2,
  MessageSquare,
  Sparkles,
  Brain,
  Trash2,
} from "lucide-react";
import { useAIChat } from "@/hooks/ai/useAIChat";

const AIChat = () => {
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef(null);
  
  // Hook de chat preditivo com contexto completo
  const {
    messages,
    loading,
    isTyping,
    suggestions,
    contextLoading,
    sendMessage,
    clearChat,
  } = useAIChat({
    agentType: "platform_concierge",
    autoLoadHistory: true,
  });

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    const message = inputMessage.trim();
    if (!message || loading) return;
    
    setInputMessage("");
    await sendMessage(message);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setInputMessage(suggestion);
    handleSendMessage();
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const MessageBubble = ({ message }) => {
    const isUser = message.type === "user";

    return (
      <div className={`flex gap-3 mb-4 ${isUser ? "justify-end" : "justify-start"}`}>
        {!isUser && (
          <Avatar className="w-8 h-8 flex-shrink-0">
            <AvatarFallback className="bg-primary text-primary-foreground">
              <Bot className="w-4 h-4" />
            </AvatarFallback>
          </Avatar>
        )}

        <div className={`max-w-[80%] ${isUser ? "order-first" : ""}`}>
          <div
            className={`rounded-lg p-3 ${
              isUser
                ? "bg-primary text-primary-foreground"
                : message.isError
                  ? "bg-destructive text-destructive-foreground"
                  : "bg-muted"
            }`}
          >
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          </div>

          {/* Produtos sugeridos */}
          {message.products && message.products.length > 0 && (
            <div className="mt-2 space-y-2">
              {message.products.map((product) => (
                <div
                  key={product.id}
                  className="bg-background border rounded-lg p-2 text-sm"
                >
                  <p className="font-semibold">{product.name}</p>
                  <p className="text-muted-foreground">R$ {product.price?.toFixed(2)}</p>
                </div>
              ))}
            </div>
          )}

          {/* Sugestões */}
          {message.suggestions && message.suggestions.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {message.suggestions.map((suggestion, idx) => (
                <Badge
                  key={idx}
                  variant="outline"
                  className="text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </Badge>
              ))}
            </div>
          )}

          {/* Tópicos relacionados */}
          {message.relatedTopics && message.relatedTopics.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-muted-foreground mb-1">
                Tópicos relacionados:
              </p>
              <div className="flex flex-wrap gap-1">
                {message.relatedTopics.map((topic, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {topic}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground mt-1">
            {formatTimestamp(message.timestamp)}
          </p>
        </div>

        {isUser && (
          <Avatar className="w-8 h-8 flex-shrink-0">
            <AvatarFallback className="bg-muted">
              <User className="w-4 h-4" />
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    );
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            Assistente de IA Preditivo
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearChat}
            className="text-muted-foreground hover:text-foreground"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
        {contextLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Carregando contexto do usuário...
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 px-6">
          {contextLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
              <p className="text-muted-foreground">
                Carregando seus dados para respostas personalizadas...
              </p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="flex items-center gap-2 mb-4">
                <Bot className="w-12 h-12 text-primary" />
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Olá! Como posso ajudar?
              </h3>
              <p className="text-muted-foreground text-sm max-w-md mb-4">
                Sou seu assistente de IA personalizado. Tenho acesso ao seu perfil completo e posso ajudar com recomendações baseadas nos seus dados reais!
              </p>
              {suggestions.length > 0 ? (
                <div className="flex flex-wrap gap-2 justify-center max-w-md">
                  {suggestions.map((suggestion, idx) => (
                    <Badge
                      key={idx}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      {suggestion}
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 justify-center max-w-md">
                  {[
                    "Recomende exercícios para mim",
                    "Como melhorar minha alimentação?",
                    "Meu IMC está normal?",
                    "Quais produtos me ajudariam?",
                  ].map((suggestion, idx) => (
                    <Badge
                      key={idx}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      {suggestion}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="py-4">
              {messages.map((message, idx) => (
                <MessageBubble key={message.id || idx} message={message} />
              ))}
              {(loading || isTyping) && (
                <div className="flex gap-3 mb-4">
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <Bot className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">
                        {isTyping ? "IA está digitando..." : "IA está pensando..."}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        <div className="flex-shrink-0 p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua mensagem..."
              disabled={loading || contextLoading}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || loading || contextLoading}
              size="sm"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIChat;
