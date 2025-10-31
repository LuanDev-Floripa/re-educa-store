import React, { useState } from "react";
/**
 * Seção de comentários para um post.
 * - Adiciona, responde, curte e exclui comentários
 * - Fallbacks em campos opcionais e toasts de erro
 */
import { Card, CardContent } from "../Ui/card";
import { Button } from "../Ui/button";
import { Input } from "../Ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "../Ui/avatar";
import { Badge } from "../Ui/badge";
import {
  Heart,
  MessageCircle,
  Reply,
  MoreHorizontal,
  Flag,
  Trash2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

const CommentsSection = ({
  postId,
  comments,
  onAddComment,
  onLikeComment,
  onDeleteComment,
  currentUser,
  isOpen,
  onClose,
}) => {
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [showReplies, setShowReplies] = useState({});

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Token de autenticação não encontrado");
      }

      // Adicionar comentário via API
      const response = await fetch("/api/social/comments", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          post_id: postId,
          content: newComment.trim(),
          parent_id: null,
        }),
      });

      if (response.ok) {
        // eslint-disable-next-line no-unused-vars
        const data = await response.json();
        setNewComment("");
        toast.success("Comentário adicionado!");

        if (onAddComment) {
          onAddComment(postId, newComment.trim());
        }
      } else {
        const error = await response.json();
        throw new Error(error.error || "Erro ao adicionar comentário");
      }
    } catch (error) {
      console.error("Erro ao adicionar comentário:", error);
      toast.error(error.message || "Erro ao adicionar comentário");
    }
  };

  const handleSubmitReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    try {
      await onAddComment(postId, replyText.trim(), replyingTo);
      setReplyText("");
      setReplyingTo(null);
      toast.success("Resposta adicionada!");
    } catch {
      toast.error("Erro ao adicionar resposta");
    }
  };

  const handleLikeComment = async (commentId) => {
    try {
      await onLikeComment(commentId);
    } catch {
      toast.error("Erro ao curtir comentário");
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (window.confirm("Tem certeza que deseja excluir este comentário?")) {
      try {
        await onDeleteComment(commentId);
        toast.success("Comentário excluído!");
      } catch {
        toast.error("Erro ao excluir comentário");
      }
    }
  };

  const toggleReplies = (commentId) => {
    setShowReplies((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  const renderComment = (comment, isReply = false) => {
    const isLiked = comment.likes?.some(
      (like) => like.user_id === currentUser?.id,
    );
    const likeCount = comment.likes?.length || 0;
    const replyCount = comment.replies?.length || 0;

    return (
      <div
        key={comment.id}
        className={`${isReply ? "ml-8 border-l-2 border-gray-200 pl-4" : ""}`}
      >
        <div className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
          <Avatar className="h-8 w-8">
            <AvatarImage src={comment.user?.avatar_url} />
            <AvatarFallback>
              {comment.user?.name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <span className="font-medium text-sm text-gray-900">
                {comment.user?.name || "Usuário"}
              </span>
              <span className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(comment.created_at), {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </span>
              {comment.is_verified && (
                <Badge variant="secondary" className="text-xs">
                  ✓ Verificado
                </Badge>
              )}
            </div>

            <p className="text-sm text-gray-700 mb-2">{comment.content}</p>

            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleLikeComment(comment.id)}
                className={`text-xs ${isLiked ? "text-red-500" : "text-gray-500"}`}
              >
                <Heart
                  className={`h-3 w-3 mr-1 ${isLiked ? "fill-current" : ""}`}
                />
                {likeCount > 0 && likeCount}
              </Button>

              {!isReply && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setReplyingTo(comment.id)}
                  className="text-xs text-gray-500"
                >
                  <Reply className="h-3 w-3 mr-1" />
                  Responder
                </Button>
              )}

            {replyCount > 0 && !isReply && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleReplies(comment.id)}
                  className="text-xs text-gray-500"
                >
                  <MessageCircle className="h-3 w-3 mr-1" />
                  {replyCount} {replyCount === 1 ? "resposta" : "respostas"}
                </Button>
              )}

              {comment.user_id === currentUser?.id && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteComment(comment.id)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>

            {/* Formulário de resposta */}
            {replyingTo === comment.id && (
              <form onSubmit={handleSubmitReply} className="mt-3">
                <div className="flex space-x-2">
                  <Input
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Escreva uma resposta..."
                    className="text-sm"
                  />
                  <Button type="submit" size="sm" disabled={!replyText.trim()}>
                    Enviar
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setReplyingTo(null);
                      setReplyText("");
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            )}

            {/* Respostas */}
            {showReplies[comment.id] && Array.isArray(comment.replies) && (
              <div className="mt-3 space-y-2">
                {comment.replies.map((reply) => renderComment(reply, true))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <CardContent className="p-0">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold">
              Comentários ({comments?.length || 0})
            </h3>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          </div>

          {/* Lista de comentários */}
          <div className="max-h-96 overflow-y-auto">
            {comments && comments.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {comments.map((comment) => renderComment(comment))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Nenhum comentário ainda</p>
                <p className="text-sm">Seja o primeiro a comentar!</p>
              </div>
            )}
          </div>

          {/* Formulário de novo comentário */}
          <div className="p-4 border-t bg-gray-50">
            <form onSubmit={handleSubmitComment} className="flex space-x-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={currentUser?.avatar_url} />
                <AvatarFallback>
                  {currentUser?.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <Input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Escreva um comentário..."
                className="flex-1"
              />
              <Button type="submit" disabled={!newComment.trim()}>
                Comentar
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CommentsSection;
