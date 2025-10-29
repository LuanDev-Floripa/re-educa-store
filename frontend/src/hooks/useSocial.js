import { useState, useCallback } from 'react';
import apiClient from '../services/apiClient';

export const useSocial = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getPosts = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.getSocialPosts(filters);
      return { success: true, data: response };
    } catch (err) {
      const errorMessage = err.message || 'Erro ao carregar posts';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const createPost = useCallback(async (postData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.createPost(postData);
      return { success: true, data: response };
    } catch (err) {
      const errorMessage = err.message || 'Erro ao criar post';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const likePost = useCallback(async (postId) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.likePost(postId);
      return { success: true, data: response };
    } catch (err) {
      const errorMessage = err.message || 'Erro ao curtir post';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const commentPost = useCallback(async (postId, comment) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.commentPost(postId, comment);
      return { success: true, data: response };
    } catch (err) {
      const errorMessage = err.message || 'Erro ao comentar post';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const getLiveStreams = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.getLiveStreams();
      return { success: true, data: response };
    } catch (err) {
      const errorMessage = err.message || 'Erro ao carregar streams';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const createStream = useCallback(async (streamData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.createStream(streamData);
      return { success: true, data: response };
    } catch (err) {
      const errorMessage = err.message || 'Erro ao criar stream';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const joinStream = useCallback(async (streamId) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.joinStream(streamId);
      return { success: true, data: response };
    } catch (err) {
      const errorMessage = err.message || 'Erro ao entrar no stream';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    getPosts,
    createPost,
    likePost,
    commentPost,
    getLiveStreams,
    createStream,
    joinStream,
  };
};