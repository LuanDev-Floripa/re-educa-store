import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.topsupplementslab.com/api';

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
  const streamRef = useRef(null);

  // WebSocket connection for real-time updates
  useEffect(() => {
    const connectWebSocket = () => {
      const ws = new WebSocket(`wss://api.topsupplementslab.com/ws/live`);
      
      ws.onopen = () => {
        console.log('WebSocket connected');
      };
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      };
      
      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setTimeout(connectWebSocket, 3000); // Reconnect after 3 seconds
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      wsRef.current = ws;
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'stream_started':
        setStreams(prev => [data.stream, ...prev]);
        break;
      case 'stream_ended':
        setStreams(prev => prev.filter(s => s.id !== data.streamId));
        if (currentStream?.id === data.streamId) {
          setCurrentStream(null);
          setIsWatching(false);
        }
        break;
      case 'viewer_joined':
        setViewers(prev => [...prev, data.viewer]);
        break;
      case 'viewer_left':
        setViewers(prev => prev.filter(v => v.id !== data.viewerId));
        break;
      case 'message_received':
        setMessages(prev => [...prev, data.message]);
        break;
      case 'gift_received':
        setMessages(prev => [...prev, data.gift]);
        break;
      case 'stream_stats':
        if (currentStream?.id === data.streamId) {
          setCurrentStream(prev => ({ ...prev, ...data.stats }));
        }
        break;
    }
  };

  const fetchStreams = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/social/streams`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar streams');
      }

      const data = await response.json();
      setStreams(data.streams);
    } catch (err) {
      setError(err.message);
      toast.error('Erro ao carregar streams: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const startStream = async (streamData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/social/streams`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(streamData)
      });

      if (!response.ok) {
        throw new Error('Erro ao iniciar stream');
      }

      const newStream = await response.json();
      setCurrentStream(newStream);
      setIsStreaming(true);
      toast.success('Stream iniciado com sucesso!');
      return newStream;
    } catch (err) {
      setError(err.message);
      toast.error('Erro ao iniciar stream: ' + err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const endStream = async (streamId) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/social/streams/${streamId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao encerrar stream');
      }

      setCurrentStream(null);
      setIsStreaming(false);
      toast.success('Stream encerrado com sucesso!');
    } catch (err) {
      setError(err.message);
      toast.error('Erro ao encerrar stream: ' + err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const joinStream = async (streamId) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/social/streams/${streamId}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao entrar no stream');
      }

      const stream = await response.json();
      setCurrentStream(stream);
      setIsWatching(true);
      setViewers(stream.viewers || []);
      setMessages(stream.messages || []);
      toast.success('Entrou no stream com sucesso!');
      return stream;
    } catch (err) {
      setError(err.message);
      toast.error('Erro ao entrar no stream: ' + err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const leaveStream = async (streamId) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/social/streams/${streamId}/leave`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao sair do stream');
      }

      setCurrentStream(null);
      setIsWatching(false);
      setViewers([]);
      setMessages([]);
      toast.success('Saiu do stream com sucesso!');
    } catch (err) {
      setError(err.message);
      toast.error('Erro ao sair do stream: ' + err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (messageData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/social/streams/${messageData.streamId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(messageData)
      });

      if (!response.ok) {
        throw new Error('Erro ao enviar mensagem');
      }

      const message = await response.json();
      setMessages(prev => [...prev, message]);
    } catch (err) {
      toast.error('Erro ao enviar mensagem: ' + err.message);
    }
  };

  const sendGift = async (giftData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/social/streams/${giftData.streamId}/gifts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(giftData)
      });

      if (!response.ok) {
        throw new Error('Erro ao enviar presente');
      }

      const gift = await response.json();
      setMessages(prev => [...prev, gift]);
      toast.success('Presente enviado com sucesso!');
    } catch (err) {
      toast.error('Erro ao enviar presente: ' + err.message);
    }
  };

  const followUser = async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/social/follow/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao seguir usuário');
      }

      toast.success('Usuário seguido com sucesso!');
    } catch (err) {
      toast.error('Erro ao seguir usuário: ' + err.message);
    }
  };

  const reportStream = async (streamId, reason) => {
    try {
      const response = await fetch(`${API_BASE_URL}/social/streams/${streamId}/report`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });

      if (!response.ok) {
        throw new Error('Erro ao reportar stream');
      }

      toast.success('Stream reportado com sucesso!');
    } catch (err) {
      toast.error('Erro ao reportar stream: ' + err.message);
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
    fetchStreams
  };
};