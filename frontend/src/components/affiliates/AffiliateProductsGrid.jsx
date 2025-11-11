/**
 * AffiliateProductsGrid Component - RE-EDUCA Store
 * 
 * Grid de produtos afiliados com filtros e busca.
 * 
 * Funcionalidades:
 * - Lista de produtos afiliados
 * - Filtros por plataforma e categoria
 * - Busca de produtos
 * - Visualização em grid ou lista
 * - Paginação
 * 
 * @component
 * @param {Object} props - Props do componente
 * @param {Function} [props.onAddToCart] - Callback para adicionar ao carrinho
 * @param {Function} [props.onViewDetails] - Callback para ver detalhes
 * @returns {JSX.Element} Grid de produtos afiliados
 */
import React, { useCallback } from "react";
import logger from "@/utils/logger";
import { AffiliateProductCard } from "./AffiliateProductCard";
import { Button } from "@/components/Ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/Ui/select";
import { Input } from "@/components/Ui/input";
import { Search, Filter, RefreshCw, Grid, List } from "lucide-react";
import { apiService } from "../../lib/api";
import { toast } from "sonner";

export const AffiliateProductsGrid = ({ onAddToCart, onViewDetails }) => {
  const [products, setProducts] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [filters, setFilters] = React.useState({
    platform: "",
    category: "",
    search: "",
    page: 1,
    limit: 20,
  });
  const [viewMode, setViewMode] = React.useState("grid");

  React.useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        platform: filters.platform,
        category: filters.category,
        search: filters.search,
        page: filters.page,
        limit: filters.limit,
      };

      const data = await apiService.affiliates.getProducts(params);
      setProducts(data.products || []);
    } catch (error) {
      logger.error("Erro ao carregar produtos:", error);
      toast.error("Erro ao carregar produtos");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1, // Reset page when filters change
    }));
  };

  const handleSearch = (value) => {
    setFilters((prev) => ({
      ...prev,
      search: value,
      page: 1,
    }));
  };

  const handleRefresh = () => {
    loadProducts();
  };

  const platforms = [
    { value: "", label: "Todas as plataformas" },
    { value: "hotmart", label: "Hotmart" },
    { value: "kiwify", label: "Kiwify" },
    { value: "logs", label: "Logs" },
    { value: "braip", label: "Braip" },
  ];

  const categories = [
    { value: "", label: "Todas as categorias" },
    { value: "saude", label: "Saúde" },
    { value: "fitness", label: "Fitness" },
    { value: "nutricao", label: "Nutrição" },
    { value: "bem-estar", label: "Bem-estar" },
    { value: "educacao", label: "Educação" },
  ];

  return (
    <div className="space-y-6">
      {/* Filtros e Busca */}
      <div className="bg-card p-6 rounded-lg shadow-sm border">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Busca */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produtos..."
                value={filters.search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Filtros */}
          <div className="flex gap-4">
            <Select
              value={filters.platform}
              onValueChange={(value) => handleFilterChange("platform", value)}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Plataforma" />
              </SelectTrigger>
              <SelectContent>
                {platforms.map((platform) => (
                  <SelectItem key={platform.value} value={platform.value}>
                    {platform.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.category}
              onValueChange={(value) => handleFilterChange("category", value)}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Botão de atualizar */}
            <Button
              onClick={handleRefresh}
              variant="outline"
              disabled={loading}
              className="px-3"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </div>

        {/* Modo de visualização */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">
              {products.length} produtos encontrados
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Visualização:</span>
            <div className="flex border rounded-lg">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="rounded-r-none"
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="rounded-l-none"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de Produtos */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" role="status" aria-label="Carregando produtos">
              <span className="sr-only">Carregando produtos...</span>
            </RefreshCw>
            <p className="text-muted-foreground">Carregando produtos...</p>
          </div>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            <Search className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">
            Nenhum produto encontrado
          </h3>
          <p className="text-muted-foreground">
            Tente ajustar os filtros ou buscar por outros termos.
          </p>
        </div>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              : "space-y-4"
          }
        >
          {products.map((product) => (
            <AffiliateProductCard
              key={product.id}
              product={product}
              onAddToCart={onAddToCart}
              onViewDetails={onViewDetails}
            />
          ))}
        </div>
      )}

      {/* Paginação */}
      {products.length > 0 && (
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            onClick={() =>
              setFilters((prev) => ({
                ...prev,
                page: Math.max(1, prev.page - 1),
              }))
            }
            disabled={filters.page === 1}
          >
            Anterior
          </Button>

          <span className="px-4 py-2 text-sm text-muted-foreground">
            Página {filters.page}
          </span>

          <Button
            variant="outline"
            onClick={() =>
              setFilters((prev) => ({ ...prev, page: prev.page + 1 }))
            }
            disabled={products.length < filters.limit}
          >
            Próxima
          </Button>
        </div>
      )}
    </div>
  );
};
