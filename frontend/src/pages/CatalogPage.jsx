import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layouts/Header';
import { Footer } from '../components/layouts/Footer';
import { Input } from '@/components/Ui/input';
import { Button } from '@/components/Ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/Ui/card';
import { Badge } from '@/components/Ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/Ui/select';
import ProductCard from '../components/products/ProductCard';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../hooks/useAuth.jsx';
import { useProducts } from '../hooks/useProducts';
import { toast } from 'sonner';
import { 
  Search, 
  Filter, 
  Grid, 
  List,
  SlidersHorizontal,
  Star,
  TrendingUp,
  Award,
  Shield,
  Package,
  ArrowRight
} from 'lucide-react';

const CatalogPage = () => {
  const navigate = useNavigate();
  const { addToCart, openCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { 
    products, 
    categories, 
    featuredProducts, 
    bestSellers,
    loading, 
    filterProducts, 
    sortProducts 
  } = useProducts();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState('grid');

  // Filtrar e ordenar produtos
  const filteredProducts = useMemo(() => {
    const filtered = filterProducts({
      category: selectedCategory,
      search: searchQuery
    });
    return sortProducts(filtered, sortBy);
  }, [products, selectedCategory, searchQuery, sortBy, filterProducts, sortProducts]);

  const handleAddToCart = (product) => {
    if (!isAuthenticated) {
      toast.error('Faça login para adicionar produtos ao carrinho');
      navigate('/login');
      return;
    }
    
    addToCart(product, 1);
    toast.success(`${product.name} adicionado ao carrinho!`);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // A busca já é feita automaticamente pelo useMemo
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Hero Section */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">
            Catálogo de Produtos
          </h1>
          <p className="text-xl mb-6 opacity-90">
            Descubra produtos de qualidade para sua saúde e bem-estar
          </p>
          
          {/* Busca Principal */}
          <form onSubmit={handleSearch} className="max-w-md mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="Buscar produtos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white text-gray-900"
              />
            </div>
          </form>
        </div>
      </div>

      {/* Produtos em Destaque */}
      {featuredProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-yellow-500" />
              <span>Produtos em Destaque</span>
            </CardTitle>
            <CardDescription>
              Os produtos mais populares e bem avaliados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProducts.slice(0, 3).map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                  viewMode="grid"
                />
              ))}
            </div>
            <div className="text-center mt-6">
              <Button 
                onClick={() => navigate('/store')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Ver Todos os Produtos
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtros e Controles */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Categoria */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name} ({category.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Ordenação */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Nome</SelectItem>
                <SelectItem value="price-low">Menor Preço</SelectItem>
                <SelectItem value="price-high">Maior Preço</SelectItem>
                <SelectItem value="rating">Avaliação</SelectItem>
                <SelectItem value="reviews">Mais Avaliados</SelectItem>
                <SelectItem value="newest">Mais Novos</SelectItem>
                <SelectItem value="discount">Maior Desconto</SelectItem>
              </SelectContent>
            </Select>

            {/* Visualização */}
            <div className="flex items-center space-x-2 ml-auto">
              <span className="text-sm text-gray-600 dark:text-gray-400">Visualização:</span>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {filteredProducts.length} produto(s) encontrado(s)
        </div>
        <Button 
          onClick={() => navigate('/store')}
          variant="outline"
          size="sm"
        >
          Ir para Loja Completa
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      {/* Lista de Produtos */}
      {filteredProducts.length > 0 ? (
        <div className={
          viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            : "space-y-4"
        }>
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={handleAddToCart}
              viewMode={viewMode}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Nenhum produto encontrado
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Tente ajustar os filtros ou buscar por outros termos
            </p>
            <Button onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
            }}>
              Limpar Filtros
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Mais Vendidos */}
      {bestSellers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <span>Mais Vendidos</span>
            </CardTitle>
            <CardDescription>
              Os produtos mais populares entre nossos clientes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bestSellers.slice(0, 3).map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                  viewMode="grid"
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Call to Action */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20">
        <CardContent className="text-center py-8">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Não encontrou o que procura?
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Explore nossa loja completa com mais produtos e funcionalidades
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => navigate('/store')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Package className="h-4 w-4 mr-2" />
              Ir para Loja
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate('/tools')}
            >
              <Star className="h-4 w-4 mr-2" />
              Ferramentas de Saúde
            </Button>
          </div>
        </CardContent>
      </Card>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default CatalogPage;