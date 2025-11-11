import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
/**
 * useSocialPosts
 * - CRUD, like/unlike/share, pagina??o e refresh com fallbacks
 */

// Usar apiClient ao invés de URL hardcoded
import apiClient from '../services/apiClient';

export const useSocialPosts = () => {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const fetchPosts = useCallback(async (pageNum = 1, filters = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: pageNum,
        limit: 10,
        ...filters,
      });

      const data = await apiClient.get(`/social/posts?${params}`);
      const list = Array.isArray(data?.posts) ? data.posts : [];

      if (pageNum === 1) {
        setPosts(list);
      } else {
        setPosts((prev) => [...prev, ...list]);
      }

      setHasMore(Boolean(data?.hasMore));
      setPage(pageNum);
    } catch (err) {
      setError(err.message);
      toast.error("Erro ao carregar posts: " + err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createPost = async (postData) => {
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("content", postData.content);
      formData.append("type", postData.type);

      if (postData.media) {
        formData.append("media", postData.media);
      }

      if (postData.tags) {
        formData.append("tags", JSON.stringify(postData.tags));
      }

      const newPost = await apiClient.request("/social/posts", {
        method: "POST",
        body: formData,
        isFormData: true,
      });

      setPosts((prev) => [newPost, ...prev]);
      toast.success("Post criado com sucesso!");
      return newPost;
    } catch (err) {
      setError(err.message);
      toast.error("Erro ao criar post: " + err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updatePost = async (postId, postData) => {
    setIsLoading(true);
    setError(null);

    try {
      const updatedPost = await apiClient.put(`/social/posts/${postId}`, {
        body: postData,
      });

      setPosts((prev) =>
        prev.map((post) => (post.id === postId ? updatedPost : post)),
      );
      toast.success("Post atualizado com sucesso!");
      return updatedPost;
    } catch (err) {
      setError(err.message);
      toast.error("Erro ao atualizar post: " + err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deletePost = async (postId) => {
    setIsLoading(true);
    setError(null);

    try {
      await apiClient.delete(`/social/posts/${postId}`);
      setPosts((prev) => prev.filter((post) => post.id !== postId));
      toast.success("Post deletado com sucesso!");
    } catch (err) {
      setError(err.message);
      toast.error("Erro ao deletar post: " + err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const likePost = async (postId) => {
    try {
      const data = await apiClient.post(`/social/posts/${postId}/like`);
      setPosts((prev) =>
        prev.map((post) => (post.id === postId ? { ...post, ...data } : post)),
      );
    } catch (err) {
      toast.error("Erro ao curtir post: " + err.message);
    }
  };

  const unlikePost = async (postId) => {
    try {
      const data = await apiClient.post(`/social/posts/${postId}/unlike`);
      setPosts((prev) =>
        prev.map((post) => (post.id === postId ? { ...post, ...data } : post)),
      );
    } catch (err) {
      toast.error("Erro ao descurtir post: " + err.message);
    }
  };

  const sharePost = async (postId) => {
    try {
      const data = await apiClient.post(`/social/posts/${postId}/share`);
      setPosts((prev) =>
        prev.map((post) => (post.id === postId ? { ...post, ...data } : post)),
      );
      toast.success("Post compartilhado com sucesso!");
    } catch (err) {
      toast.error("Erro ao compartilhar post: " + err.message);
    }
  };

  const loadMore = () => {
    if (hasMore && !isLoading) {
      fetchPosts(page + 1);
    }
  };

  const refreshPosts = () => {
    setPage(1);
    fetchPosts(1);
  };

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return {
    posts,
    isLoading,
    error,
    hasMore,
    createPost,
    updatePost,
    deletePost,
    likePost,
    unlikePost,
    sharePost,
    loadMore,
    refreshPosts,
    fetchPosts,
  };
};
