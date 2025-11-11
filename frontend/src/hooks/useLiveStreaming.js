import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import logger from "../utils/logger";
import apiClient from '../services/apiClient';

export const useLiveStreaming = () => {
  const [streams, setStreams] = useState([]);
  const [currentStream, setCurrentStream] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isWatching, setIsWatching] = useState(false);
  const [viewers, setViewers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const wsRef = useRef(null);

  // WebSocket connection for real-time updates
  useEffect(() => {
    const reconnectTimeoutRef = { current: null };
    
    const connectWebSocket = () => {
      try {
        const wsUrl = apiClient.wsURL || (import.meta.env.VITE_WS_URL || 'ws://localhost:9001/ws');
        const ws = new WebSocket(`${wsUrl}/live`);

        ws.onopen = () => {
          // WebSocket conectado para live streaming
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            handleWebSocketMessage(data);
          } catch (e) {
            logger.error("Erro ao parsear mensagem WS:", e);
          }
        };

        ws.onclose = () => {
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
          reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
        };

        ws.onerror = (error) => {
          logger.error("WebSocket error:", error);
        };

        wsRef.current = ws;
      } catch (err) {
        logger.error("Erro ao conectar WS:", err);
      }
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case "stream_started":
        setStreams((prev) => [data.stream, ...prev]);
        break;
      case "stream_ended":
        setStreams((prev) => prev.filter((s) => s.id !== data.streamId));
        if (currentStream?.id === data.streamId) {
          setCurrentStream(null);
          setIsWatching(false);
        }
        break;
      case "viewer_joined":
        setViewers((prev) => [...prev, data.viewer]);
        break;
      case "viewer_left":
        setViewers((prev) => prev.filter((v) => v.id !== data.viewerId));
        break;
      case "message_received":
        setMessages((prev) => [...prev, data.message]);
        break;
      case "gift_received":
        setMessages((prev) => [...prev, data.gift]);
        break;
      case "stream_stats":
        if (currentStream?.id === data.streamId) {
          setCurrentStream((prev) => ({ ...prev, ...data.stats }));
        }
        break;
    }
  };

  const fetchStreams = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await apiClient.get("/social/streams");
      setStreams(Array.isArray(data.streams) ? data.streams : []);
    } catch (err) {
      setError(err.message);
      toast.error("Erro ao carregar streams: " + err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const startStream = async (streamData) => {
    setIsLoading(true);
    setError(null);

    try {
      const newStream = await apiClient.post("/social/streams", {
        body: streamData,
      });
      setCurrentStream(newStream || null);
      setIsStreaming(true);
      toast.success("Stream iniciado com sucesso!");
      return newStream;
    } catch (err) {
      setError(err.message);
      toast.error("Erro ao iniciar stream: " + err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const endStream = async (streamId) => {
    setIsLoading(true);
    setError(null);

    try {
      await apiClient.delete(`/social/streams/${streamId}`);
      setCurrentStream(null);
      setIsStreaming(false);
      toast.success("Stream encerrado com sucesso!");
    } catch (err) {
      setError(err.message);
      toast.error("Erro ao encerrar stream: " + err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const joinStream = async (streamId) => {
    setIsLoading(true);
    setError(null);

    try {
      const stream = await apiClient.post(`/social/streams/${streamId}/join`);
      setCurrentStream(stream || null);
      setIsWatching(true);
      setViewers(Array.isArray(stream?.viewers) ? stream.viewers : []);
      setMessages(Array.isArray(stream?.messages) ? stream.messages : []);
      toast.success("Entrou no stream com sucesso!");
      return stream;
    } catch (err) {
      setError(err.message);
      toast.error("Erro ao entrar no stream: " + err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const leaveStream = async (streamId) => {
    setIsLoading(true);
    setError(null);

    try {
      await apiClient.post(`/social/streams/${streamId}/leave`);
      setCurrentStream(null);
      setIsWatching(false);
      setViewers([]);
      setMessages([]);
      toast.success("Saiu do stream com sucesso!");
    } catch (err) {
      setError(err.message);
      toast.error("Erro ao sair do stream: " + err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (messageData) => {
    try {
      const message = await apiClient.post(
        `/social/streams/${messageData.streamId}/messages`,
        {
          body: messageData,
        }
      );
      setMessages((prev) => [...prev, message]);
    } catch (err) {
      toast.error("Erro ao enviar mensagem: " + err.message);
    }
  };

  const sendGift = async (giftData) => {
    try {
      const gift = await apiClient.post(
        `/social/streams/${giftData.streamId}/gifts`,
        {
          body: giftData,
        }
      );
      setMessages((prev) => [...prev, gift]);
      toast.success("Presente enviado com sucesso!");
    } catch (err) {
      toast.error("Erro ao enviar presente: " + err.message);
    }
  };

  const followUser = async (userId) => {
    try {
      await apiClient.post(`/social/follow/${userId}`);
      toast.success("Usuário seguido com sucesso!");
    } catch (err) {
      toast.error("Erro ao seguir usuário: " + err.message);
    }
  };

  const reportStream = async (streamId, reason) => {
    try {
      await apiClient.post(`/social/streams/${streamId}/report`, {
        body: { reason },
      });
      toast.success("Stream reportado com sucesso!");
    } catch (err) {
      toast.error("Erro ao reportar stream: " + err.message);
    }
  };

  useEffect(() => {
    fetchStreams();
  }, [fetchStreams]);

  return {
    streams,
    currentStream,
    isStreaming,
    isWatching,
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
    fetchStreams,
  };
};
