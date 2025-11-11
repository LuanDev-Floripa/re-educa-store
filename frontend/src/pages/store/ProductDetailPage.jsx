import React from "react";
import logger from "@/utils/logger";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/Ui/card";
import { Button } from "@/components/Ui/button";
import { Input } from "@/components/Ui/input";
import { H1, H2, H3 } from "@/components/Ui/typography";
import { DashboardLayout } from "../../components/layouts/PageLayout";
import { useApi, apiService } from "../../lib/api";
import { formatCurrency, formatPercentage } from "../../lib/utils";
import {
  Star,
  ShoppingCart,
  Heart,
  Share2,
  Truck,
  Shield,
  Award,
  Package,
  ArrowLeft,
  Minus,
  Plus,
  MessageCircle,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { toast } from "sonner";

export const ProductDetailPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { request, loading } = useApi();

  const [product, setProduct] = React.useState(null);
  const [reviews, setReviews] = React.useState([]);
  const [relatedProducts, setRelatedProducts] = React.useState([]);
  const [quantity, setQuantity] = React.useState(1);
  const [selectedImage, setSelectedImage] = React.useState(0);
  const [isInWishlist, setIsInWishlist] = React.useState(false);
  const [showReviewForm, setShowReviewForm] = React.useState(false);
  const [reviewForm, setReviewForm] = React.useState({
    rating: 5,
    title: "",
    comment: "",
  });

  // Carregar dados do produto
  React.useEffect(() => {
    if (productId) {
      loadProductData();
    }
  }, [productId]);

  const loadProductData = async () => {
    try {
      const [productData, reviewsData, relatedData] = await Promise.allSettled([
        request(() => apiService.products.getById(productId)),
        request(() => apiService.products.getReviews(productId)),
        request(() => apiService.products.getRelated(productId)).catch(() => ({ products: [] })), // Fallback se endpoint não existir
      ]);

      if (productData.status === 'fulfilled') {
        setProduct(productData.value?.product || productData.value);
      }
      if (reviewsData.status === 'fulfilled') {
        setReviews(reviewsData.value?.reviews || reviewsData.value || []);
      }
      if (relatedData.status === 'fulfilled') {
        setRelatedProducts(relatedData.value?.products || relatedData.value || []);
      }
    } catch (error) {
      logger.error("Erro ao carregar dados do produto:", error);
      toast.error("Erro ao carregar dados do produto. Tente novamente.");
    }
  };

  const addToCart = async () => {
    try {
      await request(() =>
        apiService.cart.addItem({
          product_id: productId,
          quantity: quantity,
        }),
      );
      toast.success("Produto adicionado ao carrinho!");
    } catch {
      toast.error("Erro ao adicionar ao carrinho. Tente novamente.");
    }
  };

  const toggleWishlist = async () => {
    try {
      // Implementar toggle de wishlist
      setIsInWishlist(!isInWishlist);
      toast.success(
        isInWishlist ? "Removido dos favoritos!" : "Adicionado aos favoritos!",
      );
    } catch {
      toast.error("Erro ao atualizar favoritos. Tente novamente.");
    }
  };

  const shareProduct = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: product.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copiado para a área de transferência!");
    }
  };

  const handleQuantityChange = (type) => {
    if (type === "increase") {
      setQuantity((prev) => Math.min(prev + 1, product.stock || 99));
    } else if (type === "decrease") {
      setQuantity((prev) => Math.max(prev - 1, 1));
    }
  };

  const submitReview = async () => {
    try {
      await request(() => apiService.products.addReview(productId, reviewForm));
      toast.success("Avaliação enviada com sucesso!");
      setShowReviewForm(false);
      setReviewForm({ rating: 5, title: "", comment: "" });
      loadProductData(); // Recarregar reviews
    } catch {
      toast.error("Erro ao enviar avaliação. Tente novamente.");
    }
  };

  if (loading && !product) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-96 bg-muted rounded"></div>
            <div className="space-y-4">
              <div className="h-6 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-8 bg-muted rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!product) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <H3 className="mb-2">
              Produto não encontrado
            </H3>
            <p className="text-muted-foreground mb-4">
              O produto que você está procurando não existe ou foi removido.
            </p>
            <Button onClick={() => navigate("/store")}>
              Voltar para a Loja
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length
      : 0;

  const discountPrice =
    product.discount_percentage > 0
      ? product.price * (1 - product.discount_percentage / 100)
      : product.price;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/store")}
            className="flex items-center space-x-1"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar para a Loja</span>
          </Button>
          <span>/</span>
          <span>{product.category?.name || "Produto"}</span>
          <span>/</span>
          <span className="text-foreground">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Galeria de Imagens */}
          <div className="space-y-6">
            <div className="aspect-square rounded-2xl overflow-hidden bg-muted border border-border/30 shadow-[0_1px_2px_0_rgba(0,0,0,0.05),0_1px_3px_0_rgba(0,0,0,0.1)]">
              <img
                src={product.image_url || "/placeholder-product.jpg"}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect fill='%23f3f4f6' width='400' height='400'/%3E%3Ctext fill='%239ca3af' font-family='sans-serif' font-size='24' dy='10.5' font-weight='bold' x='50%25' y='50%25' text-anchor='middle'%3EProduto%3C/text%3E%3C/svg%3E";
                }}
                loading="lazy"
              />
            </div>

            {/* Thumbnails */}
            {product.images && product.images.length > 1 && (
              <div className="flex gap-3">
                {product.images.map((image, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedImage(index)}
                    className={`h-20 w-20 rounded-lg overflow-hidden border-2 p-0 transition-all duration-200 ${
                      selectedImage === index
                        ? "border-primary shadow-[0_2px_4px_0_rgba(0,0,0,0.1)]"
                        : "border-border/30"
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Informações do Produto */}
          <div className="space-y-8">
            {/* Título e Avaliação */}
            <div>
              <H1 className="mb-2">
                {product.name}
              </H1>

              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < Math.floor(averageRating)
                          ? "text-primary fill-current"
                          : "text-muted-foreground"
                      }`}
                    />
                  ))}
                  <span className="text-sm text-muted-foreground ml-2">
                    {averageRating.toFixed(1)} ({reviews.length} avaliações)
                  </span>
                </div>

                <Button variant="outline" size="sm" onClick={shareProduct}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Compartilhar
                </Button>
              </div>
            </div>

            {/* Preço */}
            <div className="space-y-2">
              {product.discount_percentage > 0 ? (
                <div className="flex items-center space-x-3">
                  <span className="text-3xl font-bold text-foreground">
                    {formatCurrency(discountPrice)}
                  </span>
                  <span className="text-lg text-muted-foreground line-through">
                    {formatCurrency(product.price)}
                  </span>
                  <span className="bg-destructive text-destructive-foreground px-2 py-1 rounded-md text-sm font-medium">
                    -{formatPercentage(product.discount_percentage)}
                  </span>
                </div>
              ) : (
                <span className="text-3xl font-bold text-foreground">
                  {formatCurrency(product.price)}
                </span>
              )}
            </div>

            {/* Descrição */}
            <div>
              <H3 className="mb-4">
                Descrição
              </H3>
              <p className="text-muted-foreground/90 leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Especificações */}
            {product.specifications && (
              <div>
                <H3 className="mb-4">
                  Especificações
                </H3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(product.specifications).map(
                    ([key, value]) => (
                      <div
                        key={key}
                        className="flex justify-between py-2 border-b border-border/30"
                      >
                        <span className="text-muted-foreground/90 capitalize">
                          {key.replace(/_/g, " ")}:
                        </span>
                        <span className="text-foreground font-medium">
                          {value}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}

            {/* Quantidade e Ações */}
            <div className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-foreground">
                    Quantidade:
                  </span>
                  <div className="flex items-center border border-border/50 rounded-lg">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleQuantityChange("decrease")}
                      disabled={quantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="px-5 py-2 text-center min-w-[60px]">
                      {quantity}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleQuantityChange("increase")}
                      disabled={quantity >= (product.stock || 99)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <span className="text-sm text-muted-foreground/90">
                  {product.stock || 0} unidades disponíveis
                </span>
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={addToCart}
                  disabled={loading || !product.stock}
                  className="flex-1 gap-2.5"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Adicionar ao Carrinho
                </Button>

                <Button
                  variant="outline"
                  onClick={toggleWishlist}
                  className="px-4"
                >
                  <Heart
                    className={`h-4 w-4 ${isInWishlist ? "fill-current text-destructive" : ""}`}
                  />
                </Button>
              </div>
            </div>

            {/* Benefícios */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Truck className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Entrega Rápida
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Em até 24h
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Garantia
                  </p>
                  <p className="text-xs text-muted-foreground">
                    30 dias
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Award className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Qualidade
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Certificada
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Avaliações */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <MessageCircle className="h-5 w-5" />
                <span>Avaliações ({reviews.length})</span>
              </CardTitle>
              <Button
                variant="outline"
                onClick={() => setShowReviewForm(!showReviewForm)}
              >
                Escrever Avaliação
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            {/* Formulário de Avaliação */}
            {showReviewForm && (
              <div className="mb-6 p-4 border border-border rounded-lg">
                <h4 className="font-medium text-foreground mb-4">
                  Sua Avaliação
                </h4>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Avaliação
                    </label>
                    <div className="flex space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <Button
                          key={i}
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            setReviewForm((prev) => ({
                              ...prev,
                              rating: i + 1,
                            }))
                          }
                          className={`p-1 ${
                            i < reviewForm.rating
                              ? "text-primary"
                              : "text-muted-foreground"
                          }`}
                        >
                          <Star className="h-6 w-6 fill-current" />
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Título
                    </label>
                    <Input
                      value={reviewForm.title}
                      onChange={(e) =>
                        setReviewForm((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      placeholder="Resumo da sua experiência"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Comentário
                    </label>
                    <textarea
                      value={reviewForm.comment}
                      onChange={(e) =>
                        setReviewForm((prev) => ({
                          ...prev,
                          comment: e.target.value,
                        }))
                      }
                      placeholder="Conte sua experiência com o produto..."
                      className="w-full border border-border rounded-md px-3 py-2 bg-background text-foreground resize-none"
                      rows={4}
                    />
                  </div>

                  <div className="flex space-x-2">
                    <Button onClick={submitReview}>Enviar Avaliação</Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowReviewForm(false)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Lista de Avaliações */}
            <div className="space-y-4">
              {reviews.length > 0 ? (
                reviews.map((review, index) => (
                  <div
                    key={index}
                    className="border-b border-border pb-4 last:border-b-0"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-foreground">
                          {review.title}
                        </h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating
                                    ? "text-primary fill-current"
                                    : "text-muted-foreground"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            por {review.user_name}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {new Date(review.created_at).toLocaleDateString(
                              "pt-BR",
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-muted-foreground">
                      {review.comment}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Nenhuma avaliação ainda. Seja o primeiro a avaliar!
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Produtos Relacionados */}
        {relatedProducts.length > 0 && (
          <div className="space-y-4">
            <H2>
              Produtos Relacionados
            </H2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {relatedProducts.map((relatedProduct) => (
                <Card
                  key={relatedProduct.id}
                  className="hover:shadow-lg transition-all duration-300 cursor-pointer"
                >
                  <div className="relative">
                    <img
                      src={
                        relatedProduct.image_url || "/placeholder-product.jpg"
                      }
                      alt={relatedProduct.name}
                      className="w-full h-32 object-cover rounded-t-lg"
                    />
                    {relatedProduct.discount_percentage > 0 && (
                      <div className="absolute top-2 left-2 bg-destructive text-destructive-foreground px-2 py-1 rounded-md text-xs font-medium">
                        -{formatPercentage(relatedProduct.discount_percentage)}
                      </div>
                    )}
                  </div>

                  <CardContent className="p-3">
                    <h3 className="font-medium text-foreground text-sm line-clamp-2 mb-2">
                      {relatedProduct.name}
                    </h3>

                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground">
                        {formatCurrency(relatedProduct.price)}
                      </span>

                      <Button
                        size="sm"
                        onClick={() =>
                          navigate(`/store/product/${relatedProduct.id}`)
                        }
                      >
                        Ver
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
