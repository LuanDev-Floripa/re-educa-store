import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/Ui/card';
import { Button } from '@/components/Ui/button';
import { Input } from '@/components/Ui/input';
import { DashboardLayout } from '../../components/layouts/PageLayout';
import { useApi, apiService } from '../../lib/api';
import { formatCurrency, formatPercentage } from '../../lib/utils';
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
  ThumbsDown
} from 'lucide-react';
import { toast } from 'sonner';

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
    title: '',
    comment: ''
  });

  // Carregar dados do produto
  React.useEffect(() => {
    if (productId) {
      loadProductData();
    }
  }, [productId]);

  const loadProductData = async () => {
    try {
      const [productData, reviewsData, relatedData] = await Promise.all([
        request(() => apiService.products.getById(productId)),
        request(() => apiService.products.getReviews(productId)),
        request(() => apiService.products.getRelated(productId)),
      ]);

      setProduct(productData.product);
      setReviews(reviewsData.reviews || []);
      setRelatedProducts(relatedData.products || []);
    } catch (error) {
      console.error('Erro ao carregar dados do produto:', error);
      toast.error('Erro ao carregar dados do produto. Tente novamente.');
    }
  };

  const addToCart = async () => {
    try {
      await request(() => 
        apiService.orders.addToCart({ 
          product_id: productId, 
          quantity: quantity 
        })
      );
      toast.success('Produto adicionado ao carrinho!');
    } catch {
      toast.error('Erro ao adicionar ao carrinho. Tente novamente.');
    }
  };

  const toggleWishlist = async () => {
    try {
      // Implementar toggle de wishlist
      setIsInWishlist(!isInWishlist);
      toast.success(isInWishlist ? 'Removido dos favoritos!' : 'Adicionado aos favoritos!');
    } catch {
      toast.error('Erro ao atualizar favoritos. Tente novamente.');
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
      toast.success('Link copiado para a área de transferência!');
    }
  };

  const handleQuantityChange = (type) => {
    if (type === 'increase') {
      setQuantity(prev => Math.min(prev + 1, product.stock || 99));
    } else if (type === 'decrease') {
      setQuantity(prev => Math.max(prev - 1, 1));
    }
  };

  const submitReview = async () => {
    try {
      await request(() => 
        apiService.products.addReview(productId, reviewForm)
      );
      toast.success('Avaliação enviada com sucesso!');
      setShowReviewForm(false);
      setReviewForm({ rating: 5, title: '', comment: '' });
      loadProductData(); // Recarregar reviews
    } catch {
      toast.error('Erro ao enviar avaliação. Tente novamente.');
    }
  };

  if (loading && !product) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="space-y-4">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
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
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Produto não encontrado
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              O produto que você está procurando não existe ou foi removido.
            </p>
            <Button onClick={() => navigate('/store')}>
              Voltar para a Loja
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  const averageRating = reviews.length > 0 
    ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length 
    : 0;

  const discountPrice = product.discount_percentage > 0 
    ? product.price * (1 - product.discount_percentage / 100)
    : product.price;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/store')}
            className="flex items-center space-x-1"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar para a Loja</span>
          </Button>
          <span>/</span>
          <span>{product.category?.name || 'Produto'}</span>
          <span>/</span>
          <span className="text-gray-900 dark:text-white">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Galeria de Imagens */}
          <div className="space-y-4">
            <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
              <img
                src={product.image_url || '/placeholder-product.jpg'}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Thumbnails */}
            {product.images && product.images.length > 1 && (
              <div className="flex space-x-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 ${
                      selectedImage === index 
                        ? 'border-blue-500' 
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Informações do Produto */}
          <div className="space-y-6">
            {/* Título e Avaliação */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {product.name}
              </h1>
              
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < Math.floor(averageRating)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                  <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                    {averageRating.toFixed(1)} ({reviews.length} avaliações)
                  </span>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={shareProduct}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Compartilhar
                </Button>
              </div>
            </div>

            {/* Preço */}
            <div className="space-y-2">
              {product.discount_percentage > 0 ? (
                <div className="flex items-center space-x-3">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(discountPrice)}
                  </span>
                  <span className="text-lg text-gray-500 line-through">
                    {formatCurrency(product.price)}
                  </span>
                  <span className="bg-red-500 text-white px-2 py-1 rounded-md text-sm font-medium">
                    -{formatPercentage(product.discount_percentage)}
                  </span>
                </div>
              ) : (
                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(product.price)}
                </span>
              )}
            </div>

            {/* Descrição */}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Descrição
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Especificações */}
            {product.specifications && (
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Especificações
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <div key={key} className="flex justify-between py-1 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400 capitalize">
                        {key.replace(/_/g, ' ')}:
                      </span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quantidade e Ações */}
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Quantidade:
                  </span>
                  <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-md">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleQuantityChange('decrease')}
                      disabled={quantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="px-4 py-2 text-center min-w-[60px]">
                      {quantity}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleQuantityChange('increase')}
                      disabled={quantity >= (product.stock || 99)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {product.stock || 0} unidades disponíveis
                </span>
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={addToCart}
                  disabled={loading || !product.stock}
                  className="flex-1"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Adicionar ao Carrinho
                </Button>
                
                <Button
                  variant="outline"
                  onClick={toggleWishlist}
                  className="px-4"
                >
                  <Heart className={`h-4 w-4 ${isInWishlist ? 'fill-current text-red-500' : ''}`} />
                </Button>
              </div>
            </div>

            {/* Benefícios */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Truck className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Entrega Rápida
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Em até 24h
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Garantia
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    30 dias
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Award className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Qualidade
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
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
              <div className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-4">
                  Sua Avaliação
                </h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Avaliação
                    </label>
                    <div className="flex space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setReviewForm(prev => ({ ...prev, rating: i + 1 }))}
                          className={`p-1 ${
                            i < reviewForm.rating
                              ? 'text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        >
                          <Star className="h-6 w-6 fill-current" />
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Título
                    </label>
                    <Input
                      value={reviewForm.title}
                      onChange={(e) => setReviewForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Resumo da sua experiência"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Comentário
                    </label>
                    <textarea
                      value={reviewForm.comment}
                      onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                      placeholder="Conte sua experiência com o produto..."
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                      rows={4}
                    />
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button onClick={submitReview}>
                      Enviar Avaliação
                    </Button>
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
                  <div key={index} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-b-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {review.title}
                        </h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            por {review.user_name}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(review.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 dark:text-gray-400">
                      {review.comment}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
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
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Produtos Relacionados
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {relatedProducts.map((relatedProduct) => (
                <Card key={relatedProduct.id} className="hover:shadow-lg transition-all duration-300 cursor-pointer">
                  <div className="relative">
                    <img
                      src={relatedProduct.image_url || '/placeholder-product.jpg'}
                      alt={relatedProduct.name}
                      className="w-full h-32 object-cover rounded-t-lg"
                    />
                    {relatedProduct.discount_percentage > 0 && (
                      <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-medium">
                        -{formatPercentage(relatedProduct.discount_percentage)}
                      </div>
                    )}
                  </div>
                  
                  <CardContent className="p-3">
                    <h3 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-2 mb-2">
                      {relatedProduct.name}
                    </h3>
                    
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900 dark:text-white">
                        {formatCurrency(relatedProduct.price)}
                      </span>
                      
                      <Button
                        size="sm"
                        onClick={() => navigate(`/store/product/${relatedProduct.id}`)}
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