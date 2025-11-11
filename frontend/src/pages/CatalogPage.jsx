import React, { useState, useMemo } from "react";
/**
 * CatalogPage
 * - Busca, filtros e ordenação com fallbacks seguros
 */
import { useNavigate } from "react-router-dom";
import { Header } from "../components/layouts/Header";
import { Footer } from "../components/layouts/Footer";
import { Input } from "@/components/Ui/input";
import { Button } from "@/components/Ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/Ui/card";
import { Badge } from "@/components/Ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/Ui/select";
import ProductCard from "../components/products/ProductCard";
import { useCart } from "../hooks/useCart";
import { apiService } from "../lib/api";
import { useAuth } from "../hooks/useAuth.jsx";
import { useProducts } from "../hooks/useProducts";
import { toast } from "sonner";
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
  ArrowRight,
} from "lucide-react";
import { H1, H3 } from "@/components/Ui/typography";

const CatalogPage = () => {
  const navigate = useNavigate();
  const { refreshCart } = useCart();
  const { isAuthenticated } = useAuth();
  const {
    products,
    categories,
    featuredProducts,
    bestSellers,
    loading,
    filterProducts,
    sortProducts,
  } = useProducts();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [viewMode, setViewMode] = useState("grid");

  // Filtrar e ordenar produtos
  const filteredProducts = useMemo(() => {
    const filtered = typeof filterProducts === "function"
      ? filterProducts({ category: selectedCategory, search: searchQuery })
      : (Array.isArray(products) ? products : []);
    return typeof sortProducts === "function" ? sortProducts(filtered, sortBy) : filtered;
  }, [products, selectedCategory, searchQuery, sortBy, filterProducts, sortProducts]);

  const handleAddToCart = async (product) => {
    if (!isAuthenticated) {
      toast.error("Faça login para adicionar produtos ao carrinho");
      navigate("/login");
      return;
    }

    try {
      await apiService.cart.addItem({
        product_id: product.id,
        quantity: 1
      });
      await refreshCart();
      toast.success(`${product.name} adicionado ao carrinho!`);
    } catch (error) {
      toast.error(error?.message || "Erro ao adicionar produto ao carrinho");
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // A busca já é feita automaticamente pelo useMemo
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-muted py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          {/* Hero Section */}
          <div className="bg-gradient-primary rounded-2xl p-8 sm:p-10 text-primary-foreground shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)]">
            <div className="max-w-4xl mx-auto text-center">
              <H1 className="mb-3 sm:mb-4 text-primary-foreground">Catálogo de Produtos</H1>
              <p className="text-lg sm:text-xl mb-4 sm:mb-6 opacity-90">
                Descubra produtos de qualidade para sua saúde e bem-estar
              </p>

              {/* Busca Principal */}
              <form onSubmit={handleSearch} className="max-w-md mx-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground/80 h-5 w-5" />
                  <Input
                    placeholder="Buscar produtos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-background/95 backdrop-blur-sm text-foreground border-border/50"
                  />
                </div>
              </form>
            </div>
          </div>

          {/* Produtos em Destaque */}
          {(Array.isArray(featuredProducts) && featuredProducts.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2.5">
                  <Award className="h-5 w-5 text-primary" />
                  <span>Produtos em Destaque</span>
                </CardTitle>
                <CardDescription className="text-muted-foreground/90">
                  Os produtos mais populares e bem avaliados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {featuredProducts.slice(0, 3).map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAddToCart={handleAddToCart}
                      viewMode="grid"
                    />
                  ))}
                </div>
                <div className="text-center mt-8">
                  <Button
                    onClick={() => navigate("/store")}
                    className="gap-2.5"
                  >
                    Ver Todos os Produtos
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Filtros e Controles */}
          <Card>
            <CardContent className="p-8">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Categoria */}
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger className="w-full lg:w-48">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Array.isArray(categories) ? categories : []).map((category) => (
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
                <div className="flex items-center gap-3 ml-auto">
                  <span className="text-sm text-muted-foreground/90">
                    Visualização:
                  </span>
                  <Button
                    variant={viewMode === "grid" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resultados */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground/90">
              {(Array.isArray(filteredProducts) ? filteredProducts.length : 0)} produto(s) encontrado(s)
            </div>
            <Button
              onClick={() => navigate("/store")}
              variant="outline"
              size="sm"
              className="gap-2.5"
            >
              Ir para Loja Completa
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Lista de Produtos */}
          {(Array.isArray(filteredProducts) ? filteredProducts.length > 0 : false) ? (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
                  : "space-y-6"
              }
            >
              {(Array.isArray(filteredProducts) ? filteredProducts : []).map((product) => (
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
              <CardContent className="text-center py-16 px-4">
                <div className="relative mb-6 max-w-md mx-auto">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-24 h-24 rounded-full bg-primary/10 animate-pulse"></div>
                  </div>
                  <Package className="h-16 w-16 text-primary mx-auto relative z-10" />
                </div>
                <H3 className="mb-3">
                  Nenhum produto encontrado
                </H3>
                <p className="text-muted-foreground/90 leading-relaxed max-w-md mx-auto mb-6">
                  Tente ajustar os filtros de busca ou explorar outras categorias para encontrar o que procura
                </p>
                <Button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("all");
                  }}
                >
                  Limpar Filtros
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Mais Vendidos */}
          {(Array.isArray(bestSellers) && bestSellers.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
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
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
            <CardContent className="text-center py-8">
              <H3 className="mb-4">
                Não encontrou o que procura?
              </H3>
              <p className="text-muted-foreground mb-6">
                Explore nossa loja completa com mais produtos e funcionalidades
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={() => navigate("/store")}
                >
                  <Package className="h-4 w-4 mr-2" />
                  Ir para Loja
                </Button>
                <Button variant="outline" onClick={() => navigate("/tools")}>
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
