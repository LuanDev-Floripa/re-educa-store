import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/Ui/card";
import { Button } from "@/components/Ui/button";
import { Input } from "@/components/Ui/input";
import { Label } from "@/components/Ui/label";
import { Textarea } from "@/components/Ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/Ui/select";
import { Badge } from "@/components/Ui/badge";
import { Progress } from "@/components/Ui/progress";
import {
  Star,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Flag,
  CheckCircle,
  User,
  Calendar,
  Filter,
  SortAsc,
  SortDesc,
  Plus,
  Edit,
  Trash2,
  HelpCircle,
} from "lucide-react";

export const ProductReviews = ({ productId, productName }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [sortBy, setSortBy] = useState("newest");
  const [filterBy, setFilterBy] = useState("all");
  const [newReview, setNewReview] = useState({
    rating: 5,
    title: "",
    comment: "",
    pros: "",
    cons: "",
    verified: false,
  });

  // Dados de exemplo para avaliações
  const reviewsData = useMemo(() => [
    {
      id: 1,
      userId: 1,
      userName: "João Silva",
      userAvatar: "/api/placeholder/40/40",
      rating: 5,
      title: "Excelente produto!",
      comment:
        "Estou usando há 2 meses e já vejo resultados. A qualidade é excelente e o sabor é muito bom. Recomendo para quem quer ganhar massa muscular.",
      pros: "Sabor excelente, dissolve bem, resultados visíveis",
      cons: "Preço um pouco alto",
      verified: true,
      helpful: 12,
      notHelpful: 1,
      createdAt: "2024-01-15T10:30:00Z",
      updatedAt: "2024-01-15T10:30:00Z",
      images: ["/api/placeholder/200/200", "/api/placeholder/200/200"],
    },
    {
      id: 2,
      userId: 2,
      userName: "Maria Santos",
      userAvatar: "/api/placeholder/40/40",
      rating: 4,
      title: "Bom produto, mas poderia ser melhor",
      comment:
        "O produto é bom, mas o sabor poderia ser mais natural. Os resultados são satisfatórios, mas não são excepcionais.",
      pros: "Boa qualidade, resultados satisfatórios",
      cons: "Sabor artificial, preço alto",
      verified: true,
      helpful: 8,
      notHelpful: 2,
      createdAt: "2024-01-12T14:20:00Z",
      updatedAt: "2024-01-12T14:20:00Z",
      images: [],
    },
    {
      id: 3,
      userId: 3,
      userName: "Pedro Oliveira",
      userAvatar: "/api/placeholder/40/40",
      rating: 5,
      title: "Superou minhas expectativas",
      comment:
        "Produto de alta qualidade. Estou muito satisfeito com os resultados. O atendimento também foi excelente.",
      pros: "Alta qualidade, resultados excelentes, bom atendimento",
      cons: "Nenhum",
      verified: true,
      helpful: 15,
      notHelpful: 0,
      createdAt: "2024-01-10T09:15:00Z",
      updatedAt: "2024-01-10T09:15:00Z",
      images: ["/api/placeholder/200/200"],
    },
    {
      id: 4,
      userId: 4,
      userName: "Ana Costa",
      userAvatar: "/api/placeholder/40/40",
      rating: 3,
      title: "Produto mediano",
      comment:
        "O produto funciona, mas não é nada excepcional. O preço está adequado para a qualidade oferecida.",
      pros: "Preço justo, funciona",
      cons: "Resultados medianos, sabor não é dos melhores",
      verified: false,
      helpful: 5,
      notHelpful: 3,
      createdAt: "2024-01-08T16:45:00Z",
      updatedAt: "2024-01-08T16:45:00Z",
      images: [],
    },
    {
      id: 5,
      userId: 5,
      userName: "Carlos Ferreira",
      userAvatar: "/api/placeholder/40/40",
      rating: 2,
      title: "Não recomendo",
      comment:
        "Produto não atendeu às expectativas. O sabor é ruim e os resultados são mínimos. Preço muito alto para a qualidade.",
      pros: "Entrega rápida",
      cons: "Sabor ruim, resultados mínimos, preço alto",
      verified: true,
      helpful: 2,
      notHelpful: 8,
      createdAt: "2024-01-05T11:30:00Z",
      updatedAt: "2024-01-05T11:30:00Z",
      images: [],
    },
  ], []);

  useEffect(() => {
    loadReviews();
  }, [productId, loadReviews]);

  const loadReviews = useCallback(async () => {
    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        // Fallback para dados de exemplo se não autenticado
        setReviews(reviewsData);
        setLoading(false);
        return;
      }

      // Carregar avaliações reais da API
      const response = await fetch(`/api/products/${productId}/reviews`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
      } else {
        // Fallback para dados de exemplo se API falhar
        setReviews(reviewsData);
      }
    } catch (error) {
      console.error("Erro ao carregar avaliações:", error);
      // Fallback para dados de exemplo em caso de erro
      setReviews(reviewsData);
    } finally {
      setLoading(false);
    }
  }, [productId, reviewsData]);

  const getRatingStats = () => {
    const totalReviews = reviews.length;
    const averageRating =
      totalReviews > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
        : 0;

    const ratingDistribution = [5, 4, 3, 2, 1].map((star) => ({
      stars: star,
      count: reviews.filter((r) => r.rating === star).length,
      percentage:
        totalReviews > 0
          ? (reviews.filter((r) => r.rating === star).length / totalReviews) *
            100
          : 0,
    }));

    return {
      totalReviews,
      averageRating,
      ratingDistribution,
    };
  };

  const stats = getRatingStats();

  const handleSubmitReview = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Token de autenticação não encontrado");
      }

      // Enviar avaliação via API
      const response = await fetch(`/api/products/${productId}/reviews`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rating: newReview.rating,
          title: newReview.title,
          comment: newReview.comment,
          pros: newReview.pros,
          cons: newReview.cons,
          verified: newReview.verified,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        // Adicionar nova avaliação à lista
        setReviews((prev) => [data.review, ...prev]);

        // Limpar formulário
        setNewReview({
          rating: 5,
          title: "",
          comment: "",
          pros: "",
          cons: "",
          verified: false,
        });
        setShowReviewForm(false);

        alert("Avaliação enviada com sucesso!");
      } else {
        const error = await response.json();
        throw new Error(error.error || "Erro ao enviar avaliação");
      }
    } catch (error) {
      console.error("Erro ao enviar avaliação:", error);
      alert(error.message || "Erro ao enviar avaliação");
    }
  };

  const handleHelpful = (reviewId, isHelpful) => {
    setReviews((prev) =>
      prev.map((review) =>
        review.id === reviewId
          ? {
              ...review,
              helpful: isHelpful ? review.helpful + 1 : review.helpful,
              notHelpful: !isHelpful
                ? review.notHelpful + 1
                : review.notHelpful,
            }
          : review,
      ),
    );
  };

  const filteredAndSortedReviews = () => {
    let filtered = reviews;

    // Filtrar por rating
    if (filterBy !== "all") {
      const rating = parseInt(filterBy);
      filtered = filtered.filter((review) => review.rating === rating);
    }

    // Ordenar
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt) - new Date(a.createdAt);
        case "oldest":
          return new Date(a.createdAt) - new Date(b.createdAt);
        case "highest_rating":
          return b.rating - a.rating;
        case "lowest_rating":
          return a.rating - b.rating;
        case "most_helpful":
          return b.helpful - a.helpful;
        default:
          return 0;
      }
    });

    return filtered;
  };

  const renderStars = (rating, interactive = false, onRatingChange = null) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={
              interactive && onRatingChange
                ? () => onRatingChange(star)
                : undefined
            }
            className={interactive ? "cursor-pointer" : "cursor-default"}
            disabled={!interactive}
          >
            <Star
              className={`w-5 h-5 ${
                star <= rating
                  ? "text-yellow-400 fill-current"
                  : "text-gray-300 dark:text-gray-600"
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-32 bg-gray-200 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header e Estatísticas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Avaliações de {productName}</CardTitle>
              <CardDescription>
                {stats.totalReviews} avaliação(ões) de clientes
              </CardDescription>
            </div>
            <Button
              onClick={() => setShowReviewForm(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Escrever Avaliação
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Rating Geral */}
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {stats.averageRating.toFixed(1)}
              </div>
              <div className="flex justify-center mb-2">
                {renderStars(Math.round(stats.averageRating))}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Baseado em {stats.totalReviews} avaliação(ões)
              </p>
            </div>

            {/* Distribuição de Ratings */}
            <div className="space-y-2">
              {stats.ratingDistribution.map(({ stars, count, percentage }) => (
                <div key={stars} className="flex items-center space-x-2">
                  <span className="text-sm font-medium w-8">{stars}</span>
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <div className="flex-1">
                    <Progress value={percentage} className="h-2" />
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400 w-8">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filtros e Ordenação */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <Select value={filterBy} onValueChange={setFilterBy}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filtrar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as avaliações</SelectItem>
                  <SelectItem value="5">5 estrelas</SelectItem>
                  <SelectItem value="4">4 estrelas</SelectItem>
                  <SelectItem value="3">3 estrelas</SelectItem>
                  <SelectItem value="2">2 estrelas</SelectItem>
                  <SelectItem value="1">1 estrela</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <SortAsc className="w-4 h-4 text-gray-500" />
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Mais recentes</SelectItem>
                  <SelectItem value="oldest">Mais antigas</SelectItem>
                  <SelectItem value="highest_rating">Maior rating</SelectItem>
                  <SelectItem value="lowest_rating">Menor rating</SelectItem>
                  <SelectItem value="most_helpful">Mais úteis</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulário de Nova Avaliação */}
      {showReviewForm && (
        <Card>
          <CardHeader>
            <CardTitle>Escrever Avaliação</CardTitle>
            <CardDescription>
              Compartilhe sua experiência com este produto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <Label htmlFor="rating">Avaliação *</Label>
                <div className="mt-2">
                  {renderStars(newReview.rating, true, (rating) =>
                    setNewReview((prev) => ({ ...prev, rating })),
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="title">Título da Avaliação *</Label>
                <Input
                  id="title"
                  value={newReview.title}
                  onChange={(e) =>
                    setNewReview((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Resuma sua experiência"
                  required
                />
              </div>

              <div>
                <Label htmlFor="comment">Comentário *</Label>
                <Textarea
                  id="comment"
                  value={newReview.comment}
                  onChange={(e) =>
                    setNewReview((prev) => ({
                      ...prev,
                      comment: e.target.value,
                    }))
                  }
                  placeholder="Conte-nos mais sobre sua experiência com o produto"
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pros">Pontos Positivos</Label>
                  <Textarea
                    id="pros"
                    value={newReview.pros}
                    onChange={(e) =>
                      setNewReview((prev) => ({
                        ...prev,
                        pros: e.target.value,
                      }))
                    }
                    placeholder="O que você mais gostou?"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="cons">Pontos Negativos</Label>
                  <Textarea
                    id="cons"
                    value={newReview.cons}
                    onChange={(e) =>
                      setNewReview((prev) => ({
                        ...prev,
                        cons: e.target.value,
                      }))
                    }
                    placeholder="O que poderia ser melhorado?"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="verified"
                  checked={newReview.verified}
                  onChange={(e) =>
                    setNewReview((prev) => ({
                      ...prev,
                      verified: e.target.checked,
                    }))
                  }
                  className="rounded"
                />
                <Label htmlFor="verified" className="text-sm">
                  Confirme que você comprou este produto
                </Label>
              </div>

              <div className="flex space-x-2">
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Enviar Avaliação
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowReviewForm(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Lista de Avaliações */}
      <div className="space-y-4">
        {filteredAndSortedReviews().map((review) => (
          <Card key={review.id}>
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <img
                  src={review.userAvatar}
                  alt={review.userName}
                  className="w-10 h-10 rounded-full"
                />

                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-semibold">{review.userName}</h4>
                      <div className="flex items-center space-x-2">
                        {renderStars(review.rating)}
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(review.createdAt).toLocaleDateString(
                            "pt-BR",
                          )}
                        </span>
                        {review.verified && (
                          <Badge variant="secondary" className="text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Compra verificada
                          </Badge>
                        )}
                      </div>
                    </div>

                    <Button variant="ghost" size="sm">
                      <Flag className="w-4 h-4" />
                    </Button>
                  </div>

                  <h5 className="font-medium mb-2">{review.title}</h5>
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    {review.comment}
                  </p>

                  {(review.pros || review.cons) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {review.pros && (
                        <div>
                          <h6 className="font-medium text-green-600 mb-1">
                            Pontos Positivos:
                          </h6>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {review.pros}
                          </p>
                        </div>
                      )}
                      {review.cons && (
                        <div>
                          <h6 className="font-medium text-red-600 mb-1">
                            Pontos Negativos:
                          </h6>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {review.cons}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Esta avaliação foi útil?
                      </span>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleHelpful(review.id, true)}
                          className="text-green-600 hover:text-green-700"
                        >
                          <ThumbsUp className="w-4 h-4 mr-1" />
                          {review.helpful}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleHelpful(review.id, false)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <ThumbsDown className="w-4 h-4 mr-1" />
                          {review.notHelpful}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAndSortedReviews().length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Nenhuma avaliação encontrada
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Seja o primeiro a avaliar este produto
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
