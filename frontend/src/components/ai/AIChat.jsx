import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Ui/card';
import { Button } from '@/components/Ui/button';
import { Input } from '@/components/Ui/input';
import { ScrollArea } from '@/components/Ui/scroll-area';
import { Badge } from '@/components/Ui/badge';
import { 
  Bot, 
  User, 
  Send, 
  Image, 
  Loader2,
  MessageSquare,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';

const AIChat = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const scrollAreaRef = useRef(null);

  useEffect(() => {
    loadChatHistory();
  }, []);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const loadChatHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/ai/chat/history?limit=50', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setChatHistory(data.data);
          // Convert chat history to messages format
          const formattedMessages = data.data.map(chat => [
            { type: 'user', content: chat.user_message, timestamp: chat.created_at },
            { type: 'ai', content: chat.ai_response, timestamp: chat.created_at }
          ]).flat();
          setMessages(formattedMessages);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

    const userMessage = {
      type: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: inputMessage })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const aiMessage = {
            type: 'ai',
            content: data.data.response,
            timestamp: new Date().toISOString(),
            suggestions: data.data.suggestions || [],
            relatedTopics: data.data.related_topics || []
          };
          setMessages(prev => [...prev, aiMessage]);
        } else {
          throw new Error(data.error || 'Erro na resposta da IA');
        }
      } else {
        throw new Error('Erro na comunicação com a IA');
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error('Erro ao comunicar com a IA');
      
      const errorMessage = {
        type: 'ai',
        content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.',
        timestamp: new Date().toISOString(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    console.log("Limpando chat com", chatHistory.length, "conversas no histórico");
    setMessages([]);
    setChatHistory([]);
    toast.success('Chat limpo com sucesso');
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const MessageBubble = ({ message }) => (
    <div className={`flex gap-3 mb-4 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
      {message.type === 'ai' && (
        <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
          <Bot className="w-4 h-4 text-primary-foreground" />
        </div>
      )}
      
      <div className={`max-w-[80%] ${message.type === 'user' ? 'order-first' : ''}`}>
        <div className={`rounded-lg p-3 ${
          message.type === 'user' 
            ? 'bg-primary text-primary-foreground' 
            : message.isError 
              ? 'bg-destructive text-destructive-foreground'
              : 'bg-muted'
        }`}>
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>
        
        {message.suggestions && message.suggestions.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {message.suggestions.map((suggestion, idx) => (
              <Badge 
                key={idx} 
                variant="outline" 
                className="text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground"
                onClick={() => setInputMessage(suggestion)}
              >
                {suggestion}
              </Badge>
            ))}
          </div>
        )}
        
        {message.relatedTopics && message.relatedTopics.length > 0 && (
          <div className="mt-2">
            <p className="text-xs text-muted-foreground mb-1">Tópicos relacionados:</p>
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
      
      {message.type === 'user' && (
        <div className="flex-shrink-0 w-8 h-8 bg-muted rounded-full flex items-center justify-center">
          <User className="w-4 h-4" />
        </div>
      )}
    </div>
  );

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Assistente de IA
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
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 px-6" ref={scrollAreaRef}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Bot className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Olá! Como posso ajudar?</h3>
              <p className="text-muted-foreground text-sm max-w-md">
                Sou seu assistente de IA personalizado. Posso ajudar com recomendações de saúde, 
                exercícios, nutrição e muito mais!
              </p>
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                {[
                  "Recomende exercícios para mim",
                  "Como melhorar minha alimentação?",
                  "Meu IMC está normal?",
                  "Quais produtos me ajudariam?"
                ].map((suggestion, idx) => (
                  <Badge 
                    key={idx} 
                    variant="outline" 
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                    onClick={() => setInputMessage(suggestion)}
                  >
                    {suggestion}
                  </Badge>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-4">
              {messages.map((message, idx) => (
                <MessageBubble key={idx} message={message} />
              ))}
              {loading && (
                <div className="flex gap-3 mb-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <Bot className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <div className="bg-muted rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">IA está pensando...</span>
                    </div>
                  </div>
                </div>
              )}
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
              disabled={loading}
              className="flex-1"
            />
            <Button 
              onClick={sendMessage} 
              disabled={!inputMessage.trim() || loading}
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