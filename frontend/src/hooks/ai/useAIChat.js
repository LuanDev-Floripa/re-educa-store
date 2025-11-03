/**
 * useAIChat - Hook para Chat com IA Predativa
 * 
 * Hook que gerencia o estado e intera??es do chat com IA preditiva,
 * incluindo contexto completo do usu?rio.
 * 
 * @param {Object} options
 * @param {string} options.agentType - Tipo de agente IA
 * @param {boolean} options.autoLoadHistory - Carregar hist?rico automaticamente
 * @returns {Object} Estado e fun??es do chat
 */
import { useState, useEffect, useCallback } from "react";
import apiClient from "../../services/apiClient";
import { toast } from "sonner";

export const useAIChat = ({ agentType = "platform_concierge", autoLoadHistory = true } = {}) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [contextLoading, setContextLoading] = useState(false);

  // Carregar hist?rico inicial
  useEffect(() => {
    if (autoLoadHistory) {
      loadChatHistory();
    }
  }, [autoLoadHistory]);

  const loadChatHistory = async () => {
    try {
      setContextLoading(true);
      const response = await apiClient.get("/api/ai/chat/history");
      if (response.data && response.data.length > 0) {
        const formattedMessages = response.data.map((msg) => ({
          id: msg.id,
          type: msg.user_message ? "user" : "assistant",
          content: msg.user_message || msg.response || "",
          timestamp: msg.created_at,
          intent: msg.intent,
        }));
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error("Erro ao carregar hist?rico:", error);
      // N?o mostra erro se n?o houver hist?rico ainda
    } finally {
      setContextLoading(false);
    }
  };

  const sendMessage = useCallback(async (message) => {
    if (!message.trim()) return;

    // Adicionar mensagem do usu?rio
    const userMessage = {
      id: Date.now().toString(),
      type: "user",
      content: message,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);
    setIsTyping(true);

    try {
      const response = await apiClient.post("/api/ai/chat", {
        message,
        agent_type: agentType,
      });

      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: response.data.response || response.data.message || "Desculpe, n?o consegui processar sua mensagem.",
        timestamp: new Date().toISOString(),
        intent: response.data.intent,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Atualizar sugest?es se dispon?veis
      if (response.data.suggestions && Array.isArray(response.data.suggestions)) {
        setSuggestions(response.data.suggestions);
      }
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: "Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.",
        timestamp: new Date().toISOString(),
        isError: true,
      };

      setMessages((prev) => [...prev, errorMessage]);
      toast.error("Erro ao enviar mensagem");
    } finally {
      setLoading(false);
      setIsTyping(false);
    }
  }, [agentType]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setSuggestions([]);
  }, []);

  return {
    messages,
    loading,
    isTyping,
    suggestions,
    contextLoading,
    sendMessage,
    clearChat,
  };
};
