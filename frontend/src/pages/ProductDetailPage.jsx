import React, { useState, useEffect } from "react";
import logger from "@/utils/logger";
/**
 * ProductDetailPage
 * - Exibe detalhes do produto com fallbacks e ações (carrinho/favorito)
 */
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/Ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/Ui/card";
import { Badge } from "@/components/Ui/badge";
import { Separator } from "@/components/Ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/Ui/tabs";
import { useCart } from "../hooks/useCart";
import { apiService } from "../lib/api";
import { useAuth } from "../hooks/useAuth.jsx";
import { useProducts } from "../hooks/useProducts";
import { formatCurrency } from "../lib/utils";
import { toast } from "sonner";
import {
  ArrowLeft,
  Star,
  Heart,
  ShoppingCart,
  Truck,
  Shield,
  Award,
  Package,
  Tag,
  CheckCircle,
  Minus,
  Plus,
  Share2,
  MessageCircle,
  ThumbsUp,
} from "lucide-react";

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { refreshCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { getProductById, getRelatedProducts } = useProducts();

  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        const productId = Number.parseInt(id, 10);
        if (!Number.isFinite(productId)) {
          toast.error("ID de produto inválido");
          navigate("/catalog");
          return;
        }
        const productData = getProductById(productId);
        if (productData) {
          setProduct(productData);

          // Carregar produtos relacionados
          const related = getRelatedProducts(productId, 4) || [];
          setRelatedProducts(related);
        } else {
          toast.error("Produto não encontrado");
          navigate("/catalog");
        }
      } catch (error) {
        logger.error("Erro ao carregar produto:", error);
        toast.error("Erro ao carregar produto");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadProduct();
    }
  }, [id, getProductById, getRelatedProducts, navigate]);

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-5 h-5 ${
          i < Math.floor(Number(rating) || 0)
            ? "text-primary fill-current"
            : "text-muted"
        }`}
      />
    ));
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error("Faça login para adicionar produtos ao carrinho");
      navigate("/login");
      return;
    }

    if (isAddingToCart || !product) return;

    setIsAddingToCart(true);
    try {
      await apiService.cart.addItem({
        product_id: product.id,
        quantity: quantity
      });
      await refreshCart();
      toast.success(`${product?.name || "Produto"} adicionado ao carrinho!`);
    } catch (error) {
      toast.error(error?.message || "Erro ao adicionar produto ao carrinho");
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleAddToWishlist = () => {
    setIsWishlisted(!isWishlisted);
    toast.success(
      isWishlisted ? "Removido dos favoritos" : "Adicionado aos favoritos",
    );
  };

  const handleQuantityChange = (change) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && newQuantity <= Number(product?.stock || 0)) {
      setQuantity(newQuantity);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" role="status" aria-live="polite">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" aria-hidden="true"></div>
        <span className="sr-only">Carregando produto...</span>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Produto não encontrado
        </h3>
        <Button onClick={() => navigate("/catalog")}>Voltar ao Catálogo</Button>
      </div>
    );
  }

  const discountAmount = product?.originalPrice
    ? Number(product.originalPrice) - Number(product.price || 0)
    : 0;
  const isOutOfStock = Number(product?.stock || 0) === 0;

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-muted-foreground" aria-label="Breadcrumb">
        <Button variant="ghost" size="sm" onClick={() => navigate("/catalog")}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Voltar
        </Button>
        <span aria-hidden="true">/</span>
        <span>Produtos</span>
        <span aria-hidden="true">/</span>
        <span className="text-foreground font-medium">{product.name}</span>
      </nav>

      {/* Produto Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Imagens */}
        <div className="space-y-4">
          <div className="aspect-square overflow-hidden rounded-lg bg-muted">
              <img
              src={product?.image}
              alt={product?.name || "Produto"}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            {product?.isNew && (
              <Badge className="bg-primary text-white">
                <Award className="h-3 w-3 mr-1" />
                Novo
              </Badge>
            )}
            {product?.discount && (
              <Badge className="bg-destructive text-destructive-foreground">
                <Tag className="h-3 w-3 mr-1" />-{product.discount}%
              </Badge>
            )}
            {product?.freeShipping && (
              <Badge variant="secondary">
                <Truck className="h-3 w-3 mr-1" />
                Frete Grátis
              </Badge>
            )}
          </div>
        </div>

        {/* Informações do Produto */}
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
              {product?.name}
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground">
              {product?.brand}
            </p>
          </div>

          {/* Avaliação */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {renderStars(product?.rating)}
              <span className="text-sm font-medium text-foreground">
                {Number(product?.rating) || 0}
              </span>
            </div>
            <span className="text-sm text-muted-foreground">
              ({Number(product?.reviews) || 0} avaliações)
            </span>
          </div>

          {/* Preço */}
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <span className="text-3xl font-bold text-foreground">
                {formatCurrency(Number(product?.price || 0))}
              </span>
              {product?.originalPrice && (
                <span className="text-xl text-muted-foreground line-through">
                  {formatCurrency(Number(product.originalPrice))}
                </span>
              )}
            </div>
            {discountAmount > 0 && (
              <Badge variant="secondary" className="text-sm">
                Economize {formatCurrency(discountAmount)}
              </Badge>
            )}
          </div>

          {/* Descrição */}
          <p className="text-muted-foreground leading-relaxed">
            {product?.description}
          </p>

          {/* Estoque */}
          <div className="flex items-center space-x-2">
            <Package className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {isOutOfStock
                ? "Esgotado"
                : `${Number(product?.stock || 0)} unidades em estoque`}
            </span>
          </div>

          {/* Quantidade e Adicionar ao Carrinho */}
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium">Quantidade:</span>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= Number(product?.stock || 0)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button
                onClick={handleAddToCart}
                disabled={isOutOfStock || isAddingToCart}
                className="flex-1"
                size="lg"
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                {isAddingToCart ? "Adicionando..." : "Adicionar ao Carrinho"}
              </Button>
              <Button variant="outline" size="lg" onClick={handleAddToWishlist}>
                <Heart
                  className={`h-5 w-5 ${isWishlisted ? "fill-destructive text-destructive" : ""}`}
                />
              </Button>
              <Button variant="outline" size="lg">
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Garantias */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Shield className="h-5 w-5 text-primary" />
              <span>Garantia de 30 dias</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Truck className="h-5 w-5 text-primary" />
              <span>Entrega rápida</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs com Informações Detalhadas */}
      <Tabs defaultValue="description" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="description">Descrição</TabsTrigger>
          <TabsTrigger value="features">Características</TabsTrigger>
          <TabsTrigger value="reviews">Avaliações</TabsTrigger>
        </TabsList>

        <TabsContent value="description" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Sobre o Produto</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {product.description}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Características</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {product.features?.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <span className="text-foreground">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Avaliações dos Clientes</CardTitle>
              <CardDescription>
                {product.reviews} avaliações • Média: {product.rating}/5
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Seja o primeiro a avaliar este produto!
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Produtos Relacionados */}
      {relatedProducts.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-6">
            Produtos Relacionados
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((relatedProduct) => (
              <Card
                key={relatedProduct.id}
                className="group hover:shadow-lg transition-all duration-300"
              >
                <div className="relative overflow-hidden rounded-t-lg">
                  <img
                    src={relatedProduct.image}
                    alt={relatedProduct.name}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {relatedProduct.isNew && (
                    <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground">
                      Novo
                    </Badge>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
                    {relatedProduct.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {relatedProduct.brand}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-foreground">
                      {formatCurrency(relatedProduct.price)}
                    </span>
                    <Button
                      size="sm"
                      onClick={() => navigate(`/product/${relatedProduct.id}`)}
                    >
                      Ver
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ProductDetailPage;
