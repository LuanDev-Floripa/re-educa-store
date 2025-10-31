import React from "react";
/**
 * StorePage
 * - Loja completa com filtros/ordenação e fallbacks seguros
 */
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/Ui/card";
import { Button } from "@/components/Ui/button";
import { Input } from "@/components/Ui/input";
import { Badge } from "@/components/Ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/Ui/select";
import { Checkbox } from "@/components/Ui/checkbox";
import ProductCard from "../../components/products/ProductCard";
import { useProducts } from "../../hooks/useProducts";
import { useCart } from "../../contexts/CartContext";
import { formatCurrency } from "../../lib/utils";
import { toast } from "sonner";
import {
  Search,
  Filter,
  Grid,
  List,
  Star,
  ShoppingCart,
  Heart,
  Eye,
  TrendingUp,
  Tag,
  Package,
  Truck,
  Shield,
  Award,
  SlidersHorizontal,
  X,
} from "lucide-react";

export const StorePage = () => {
  const {
    products,
    categories,
    featuredProducts,
    bestSellers,
    discountedProducts,
    loading,
    filterProducts,
    sortProducts,
  } = useProducts();

  const { addToCart } = useCart();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("all");
  const [viewMode, setViewMode] = React.useState("grid");
  const [sortBy, setSortBy] = React.useState("name");
  const [showFilters, setShowFilters] = React.useState(false);
  const [priceRange, setPriceRange] = React.useState({ min: 0, max: 1000 });
  const [filters, setFilters] = React.useState({
    inStock: false,
    freeShipping: false,
  });

  // Filtrar e ordenar produtos
  const filteredProducts = React.useMemo(() => {
    const base = typeof filterProducts === "function"
      ? filterProducts({
          category: selectedCategory,
          search: searchQuery,
          minPrice: priceRange.min,
          maxPrice: priceRange.max,
          ...filters,
        })
      : (Array.isArray(products) ? products : []);
    return typeof sortProducts === "function" ? sortProducts(base, sortBy) : base;
  }, [products, selectedCategory, searchQuery, priceRange, filters, sortBy, filterProducts, sortProducts]);

  const handleAddToCart = (product) => {
    try {
      if (typeof addToCart !== "function") {
        throw new Error("Carrinho indisponível");
      }
      addToCart(product, 1);
      toast.success(`${product?.name || "Produto"} adicionado ao carrinho!`);
    } catch (e) {
      toast.error(e?.message || "Erro ao adicionar ao carrinho");
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // A busca já é feita automaticamente pelo useMemo
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setPriceRange({ min: 0, max: 1000 });
    setFilters({ inStock: false, freeShipping: false });
    setSortBy("name");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Loja Re-Educa
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Produtos de qualidade para sua saúde e bem-estar
          </p>
        </div>
        <div className="flex items-center space-x-2">
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

      {/* Produtos em Destaque */}
      {(Array.isArray(featuredProducts) && featuredProducts.length > 0) && (
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
          </CardContent>
        </Card>
      )}

      {/* Filtros e Busca */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Busca */}
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar produtos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </form>

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

            {/* Botão de Filtros */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="w-full lg:w-auto"
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filtros
            </Button>
          </div>

          {/* Filtros Avançados */}
          {showFilters && (
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Filtros Avançados</h3>
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Limpar
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Preço */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Faixa de Preço
                  </label>
                  <div className="flex space-x-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={priceRange.min}
                      onChange={(e) =>
                        setPriceRange((prev) => ({
                          ...prev,
                          min: Number(e.target.value),
                        }))
                      }
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={priceRange.max}
                      onChange={(e) =>
                        setPriceRange((prev) => ({
                          ...prev,
                          max: Number(e.target.value),
                        }))
                      }
                    />
                  </div>
                </div>

                {/* Filtros de Checkbox */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="inStock"
                      checked={filters.inStock}
                      onCheckedChange={(checked) =>
                        setFilters((prev) => ({ ...prev, inStock: checked }))
                      }
                    />
                    <label htmlFor="inStock" className="text-sm">
                      Apenas em estoque
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="freeShipping"
                      checked={filters.freeShipping}
                      onCheckedChange={(checked) =>
                        setFilters((prev) => ({
                          ...prev,
                          freeShipping: checked,
                        }))
                      }
                    />
                    <label htmlFor="freeShipping" className="text-sm">
                      Frete grátis
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resultados */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {(Array.isArray(filteredProducts) ? filteredProducts.length : 0)} produto(s) encontrado(s)
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">
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

      {/* Lista de Produtos */}
      {(Array.isArray(filteredProducts) ? filteredProducts.length > 0 : false) ? (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              : "space-y-4"
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
          <CardContent className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Nenhum produto encontrado
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Tente ajustar os filtros para encontrar mais produtos
            </p>
            <Button onClick={clearFilters}>Limpar Filtros</Button>
          </CardContent>
        </Card>
      )}

      {/* Produtos com Desconto */}
      {(Array.isArray(discountedProducts) && discountedProducts.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Tag className="h-5 w-5 text-red-500" />
              <span>Ofertas Especiais</span>
            </CardTitle>
            <CardDescription>Produtos com desconto imperdível</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {discountedProducts.slice(0, 3).map((product) => (
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
    </div>
  );
};
