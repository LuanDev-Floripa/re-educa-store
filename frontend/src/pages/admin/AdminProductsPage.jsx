import React, { useState, useEffect } from "react";
import logger from "@/utils/logger";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/Ui/card";
import { Button } from "@/components/Ui/button";
import { Badge } from "@/components/Ui/badge";
import { Input } from "@/components/Ui/input";
import { Label } from "@/components/Ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/Ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/Ui/tabs";
import apiClient from "@/services/apiClient";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Package,
  TrendingUp,
  TrendingDown,
  Star,
  ShoppingCart,
  DollarSign,
  Calendar,
  Tag,
  Image,
  AlertCircle,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  Copy,
  Download,
} from "lucide-react";

/**
 * AdminProductsPage
 * Listagem e gestão de produtos com filtros, ordenação e fallbacks seguros.
 * @returns {JSX.Element}
 */
const AdminProductsPage = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedSort, setSelectedSort] = useState("name");
  const [activeTab, setActiveTab] = useState("list");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // Carregar produtos da API
  const loadProducts = async () => {
      try {
        setLoading(true);
        if (!apiClient?.getProducts) {
          throw new Error("Serviço de produtos indisponível");
        }
        const response = await apiClient.getProducts();

        if (Array.isArray(response?.products) || Array.isArray(response?.data) || Array.isArray(response)) {
          const productsList = (Array.isArray(response?.products)
            ? response.products
            : Array.isArray(response?.data)
              ? response.data
              : Array.isArray(response)
                ? response
                : [])
            .map((p) => ({
              ...p,
              name: p?.name || "Produto",
              description: p?.description || "",
              brand: p?.brand || "",
              tags: Array.isArray(p?.tags) ? p.tags : [],
              price: Number(p?.price) || 0,
              originalPrice: Number(p?.originalPrice ?? p?.original_price) || 0,
              stock: Number(p?.stock) || 0,
              minStock: Number(p?.minStock ?? p?.min_stock ?? 0) || 0,
              image: p?.image || "/api/placeholder/300/300",
              sales: Number(p?.sales) || 0,
              rating: Number(p?.rating) || 0,
              reviews: Number(p?.reviews) || 0,
              status: p?.status || "inactive",
              createdAt: p?.createdAt || p?.created_at || new Date().toISOString(),
            }));
          setProducts(productsList);
          setFilteredProducts(productsList);
        } else {
          setProducts([]);
          setFilteredProducts([]);
        }
      } catch (err) {
        logger.error("Erro ao carregar produtos:", err);
        toast.error("Erro ao carregar produtos");
        setProducts([]);
        setFilteredProducts([]);
      } finally {
        setLoading(false);
      }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const categories = [
    { value: "all", label: "Todas as Categorias" },
    { value: "Suplementos", label: "Suplementos" },
    { value: "Equipamentos", label: "Equipamentos" },
    { value: "Roupas", label: "Roupas" },
    { value: "Acessórios", label: "Acessórios" },
  ];

  const statuses = [
    { value: "all", label: "Todos os Status" },
    { value: "active", label: "Ativo" },
    { value: "inactive", label: "Inativo" },
    { value: "low_stock", label: "Estoque Baixo" },
    { value: "out_of_stock", label: "Sem Estoque" },
  ];

  const sortOptions = [
    { value: "name", label: "Nome" },
    { value: "price", label: "Preço" },
    { value: "stock", label: "Estoque" },
    { value: "sales", label: "Vendas" },
    { value: "rating", label: "Avaliação" },
    { value: "created", label: "Data de Criação" },
  ];

  useEffect(() => {
    filterProducts();
  }, [searchTerm, selectedCategory, selectedStatus, selectedSort, products]);

  const filterProducts = () => {
    let filtered = products;

    // Filtro por busca
    if (searchTerm) {
      filtered = filtered.filter(
        (product) =>
          (product.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (product.description || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (product.brand || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (Array.isArray(product.tags) ? product.tags : []).some((tag) =>
            String(tag).toLowerCase().includes(searchTerm.toLowerCase()),
          ),
      );
    }

    // Filtro por categoria
    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (product) => product.category === selectedCategory,
      );
    }

    // Filtro por status
    if (selectedStatus !== "all") {
      filtered = filtered.filter(
        (product) => product.status === selectedStatus,
      );
    }

    // Ordenação
    filtered.sort((a, b) => {
      switch (selectedSort) {
        case "name":
          return (a.name || "").localeCompare(b.name || "");
        case "price":
          return Number(a.price) - Number(b.price);
        case "stock":
          return Number(a.stock) - Number(b.stock);
        case "sales":
          return Number(b.sales) - Number(a.sales);
        case "rating":
          return Number(b.rating) - Number(a.rating);
        case "created":
          return new Date(b.createdAt) - new Date(a.createdAt);
        default:
          return 0;
      }
    });

    setFilteredProducts(filtered);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-primary/10 text-primary";
      case "inactive":
        return "bg-muted text-foreground";
      case "low_stock":
        return "bg-primary/10 text-primary";
      case "out_of_stock":
        return "bg-destructive/10 text-destructive";
      default:
        return "bg-muted text-foreground";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "active":
        return "Ativo";
      case "inactive":
        return "Inativo";
      case "low_stock":
        return "Estoque Baixo";
      case "out_of_stock":
        return "Sem Estoque";
      default:
        return status;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-4 h-4" />;
      case "inactive":
        return <XCircle className="w-4 h-4" />;
      case "low_stock":
        return <AlertCircle className="w-4 h-4" />;
      case "out_of_stock":
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setShowEditModal(true);
  };

  const handleDeleteProduct = (productId) => {
    if (window.confirm("Tem certeza que deseja excluir este produto?")) {
      setProducts((prev) => prev.filter((p) => p.id !== productId));
    }
  };

  const handleToggleStatus = (productId) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? { ...p, status: p.status === "active" ? "inactive" : "active" }
          : p,
      ),
    );
  };

  const handleDuplicateProduct = async (productId) => {
    try {
      const { apiService } = await import("@/lib/api");
      const response = await apiService.products.duplicate(productId);
      toast.success("Produto duplicado com sucesso!");
      loadProducts();
    } catch (error) {
      logger.error("Erro ao duplicar produto:", error);
      toast.error(error.message || "Erro ao duplicar produto");
    }
  };

  const handleImportProducts = async (file) => {
    try {
      const fileContent = await file.text();
      const format = file.name.endsWith('.csv') ? 'csv' : 'json';
      let data;
      
      if (format === 'json') {
        data = JSON.parse(fileContent);
      } else {
        data = fileContent; // CSV será parseado no backend
      }
      
      const { apiService } = await import("@/lib/api");
      const response = await apiService.products.import({
        format,
        data,
      });
      
      toast.success(
        `Importação concluída: ${response.created || 0} criados, ${response.errors?.length || 0} erros`
      );
      loadProducts();
    } catch (error) {
      logger.error("Erro ao importar produtos:", error);
      toast.error(error.message || "Erro ao importar produtos");
    }
  };

  const getStats = () => {
    const totalProducts = products.length;
    const activeProducts = products.filter((p) => p.status === "active").length;
    const lowStockProducts = products.filter(
      (p) => p.status === "low_stock",
    ).length;
    const outOfStockProducts = products.filter(
      (p) => p.status === "out_of_stock",
    ).length;
    const totalSales = products.reduce((sum, p) => sum + p.sales, 0);
    const totalRevenue = products.reduce(
      (sum, p) => sum + p.sales * p.price,
      0,
    );

    return {
      total: totalProducts,
      active: activeProducts,
      lowStock: lowStockProducts,
      outOfStock: outOfStockProducts,
      totalSales,
      totalRevenue,
    };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-card rounded-lg p-4 sm:p-6">
                <div className="h-48 bg-muted rounded mb-4"></div>
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Package className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Gerenciamento de Produtos
              </h1>
              <p className="text-muted-foreground">
                Gerencie todos os produtos da loja
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.csv,.json';
                input.onchange = (e) => {
                  const file = e.target.files[0];
                  if (file) handleImportProducts(file);
                };
                input.click();
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              Importar
            </Button>
            <Button
              onClick={() => setShowAddModal(true)}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Produto
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">
                {stats.total}
              </div>
              <div className="text-sm text-muted-foreground/90">
                Total
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">
                {stats.active}
              </div>
              <div className="text-sm text-muted-foreground">
                Ativos
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">
                {stats.lowStock}
              </div>
              <div className="text-sm text-muted-foreground">
                Estoque Baixo
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-destructive">
                {stats.outOfStock}
              </div>
              <div className="text-sm text-muted-foreground">
                Sem Estoque
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">
                {stats.totalSales}
              </div>
              <div className="text-sm text-muted-foreground">
                Vendas
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">
                R$ {stats.totalRevenue.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">
                Receita
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger>
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

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedSort} onValueChange={setSelectedSort}>
              <SelectTrigger>
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="list" className="flex items-center space-x-2">
            <Package className="w-4 h-4" />
            <span>Lista de Produtos</span>
          </TabsTrigger>
          <TabsTrigger value="coupons" className="flex items-center space-x-2">
            <Tag className="w-4 h-4" />
            <span>Cupons</span>
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="flex items-center space-x-2"
          >
            <TrendingUp className="w-4 h-4" />
            <span>Analytics</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                className="group hover:shadow-lg transition-all duration-300"
              >
                <div className="relative">
                  <div className="aspect-square overflow-hidden rounded-t-lg bg-muted">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  <Badge
                    className={`absolute top-2 right-2 ${getStatusColor(product.status)}`}
                  >
                    {getStatusIcon(product.status)}
                    <span className="ml-1">
                      {getStatusLabel(product.status)}
                    </span>
                  </Badge>

                  {product.stock <= product.minStock && (
                    <Badge
                      variant="destructive"
                      className="absolute top-2 left-2"
                    >
                      Estoque Baixo
                    </Badge>
                  )}
                </div>

                <CardContent className="p-4">
                  <div className="mb-2">
                    <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {product.description}
                    </p>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground/90">
                        Preço:
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-lg text-primary">
                          R$ {product.price.toFixed(2)}
                        </span>
                        {Number(product.originalPrice) > Number(product.price) && (
                          <span className="text-sm text-muted-foreground/80 line-through">
                            R$ {product.originalPrice.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground/90">
                        Estoque:
                      </span>
                      <span
                        className={`font-semibold ${
                          product.stock <= product.minStock
                            ? "text-destructive"
                            : "text-primary"
                        }`}
                      >
                        {product.stock} unidades
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Vendas:
                      </span>
                      <span className="font-semibold text-primary">
                        {product.sales}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Avaliação:
                      </span>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-primary fill-current" />
                        <span className="font-semibold">{product.rating}</span>
                        <span className="text-sm text-muted-foreground">
                          ({product.reviews})
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      onClick={() => handleEditProduct(product)}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Editar
                    </Button>

                    <Button
                      onClick={() => handleDuplicateProduct(product.id)}
                      variant="outline"
                      size="sm"
                      title="Duplicar produto"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>

                    <Button
                      onClick={() => handleToggleStatus(product.id)}
                      variant="outline"
                      size="sm"
                      className={
                        product.status === "active"
                          ? "text-destructive hover:text-destructive/80"
                          : "text-primary hover:text-primary/80"
                      }
                    >
                      {product.status === "active" ? (
                        <>
                          <XCircle className="w-4 h-4 mr-1" />
                          Desativar
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Ativar
                        </>
                      )}
                    </Button>

                    <Button
                      onClick={() => handleDeleteProduct(product.id)}
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive/80"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-16 px-4">
              <div className="relative mb-6 max-w-md mx-auto">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full bg-primary/10 animate-pulse"></div>
                </div>
                <Package className="w-16 h-16 text-primary mx-auto relative z-10" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-3">
                Nenhum produto encontrado
              </h3>
              <p className="text-muted-foreground/90 leading-relaxed max-w-md mx-auto mb-6">
                {searchTerm || categoryFilter !== "all" || statusFilter !== "all"
                  ? "Tente ajustar os filtros de busca para encontrar produtos"
                  : "Adicione produtos ao sistema para começar a gerenciar sua loja"}
              </p>
              {(!searchTerm && categoryFilter === "all" && statusFilter === "all") && (
                <Button onClick={() => navigate("/admin/products")} className="gap-2 shadow-md hover:shadow-lg transition-all duration-200">
                  <Plus className="w-4 h-4" />
                  Adicionar Produto
                </Button>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="coupons" className="mt-6">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground">
                Cupons de Desconto
              </h2>
              <Button
                onClick={() => navigate("/admin/coupons")}
                className="bg-primary hover:bg-primary/90"
              >
                <Tag className="w-4 h-4 mr-2" />
                Gerenciar Cupons
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Tag className="w-5 h-5 text-primary text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Cupons Ativos
                      </p>
                      <p className="text-2xl font-bold text-foreground">
                        12
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Percent className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Desconto Médio
                      </p>
                      <p className="text-2xl font-bold text-foreground">
                        15%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-primary text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Usos Hoje
                      </p>
                      <p className="text-2xl font-bold text-foreground">
                        45
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Cupons Recentes</CardTitle>
                  <CardDescription>
                    Últimos cupons criados e mais utilizados
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <Tag className="w-4 h-4 text-primary text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium">BEMVINDO10</h4>
                          <p className="text-sm text-muted-foreground">
                            10% de desconto
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">45 usos</div>
                        <div className="text-sm text-muted-foreground">
                          Hoje
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <Tag className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium">FRETE15</h4>
                          <p className="text-sm text-muted-foreground">
                            Frete grátis
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">23 usos</div>
                        <div className="text-sm text-muted-foreground">
                          Hoje
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <Tag className="w-4 h-4 text-primary text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium">VIP20</h4>
                          <p className="text-sm text-muted-foreground">
                            20% de desconto
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">12 usos</div>
                        <div className="text-sm text-muted-foreground">
                          Hoje
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Produtos Mais Vendidos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {products
                    .sort((a, b) => b.sales - a.sales)
                    .slice(0, 5)
                    .map((product, index) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-sm font-semibold text-primary">
                              {index + 1}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-medium">{product.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {product.brand}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">
                            {product.sales} vendas
                          </div>
                          <div className="text-sm text-muted-foreground">
                            R${" "}
                            {(product.sales * product.price).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status dos Produtos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-primary" />
                      <span>Produtos Ativos</span>
                    </div>
                    <span className="font-semibold">{stats.active}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-5 h-5 text-primary" />
                      <span>Estoque Baixo</span>
                    </div>
                    <span className="font-semibold">{stats.lowStock}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <XCircle className="w-5 h-5 text-destructive" />
                      <span>Sem Estoque</span>
                    </div>
                    <span className="font-semibold">{stats.outOfStock}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <XCircle className="w-5 h-5 text-muted-foreground" />
                      <span>Inativos</span>
                    </div>
                    <span className="font-semibold">
                      {products.filter((p) => p.status === "inactive").length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal de Adicionar/Editar Produto */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                {showEditModal ? "Editar Produto" : "Adicionar Produto"}
              </CardTitle>
              <Button
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                  setSelectedProduct(null);
                }}
                variant="ghost"
                size="sm"
              >
                <XCircle className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  const productData = {
                    name: formData.get("name"),
                    description: formData.get("description"),
                    price: parseFloat(formData.get("price")),
                    category: formData.get("category"),
                    stock_quantity: parseInt(formData.get("stock_quantity") || "0"),
                    is_active: formData.get("is_active") === "true",
                    in_stock: formData.get("in_stock") === "true",
                  };

                  try {
                    if (showEditModal && selectedProduct) {
                      await apiClient.put(`/products/${selectedProduct.id}`, productData);
                      toast.success("Produto atualizado com sucesso!");
                    } else {
                      await apiClient.post("/products", productData);
                      toast.success("Produto criado com sucesso!");
                    }
                    setShowAddModal(false);
                    setShowEditModal(false);
                    setSelectedProduct(null);
                    // Recarregar produtos via API
                    await loadProducts();
                  } catch (error) {
                    logger.error("Erro ao salvar produto:", error);
                    toast.error(error.message || "Erro ao salvar produto");
                  }
                }}
                className="space-y-4"
              >
                <div>
                  <Label htmlFor="name">Nome do Produto *</Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={selectedProduct?.name || ""}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <textarea
                    id="description"
                    name="description"
                    defaultValue={selectedProduct?.description || ""}
                    className="w-full px-3 py-2 border border-border rounded-md"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">Preço *</Label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      step="0.01"
                      defaultValue={selectedProduct?.price || ""}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Categoria *</Label>
                    <Select
                      name="category"
                      defaultValue={selectedProduct?.category || ""}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="supplements">Suplementos</SelectItem>
                        <SelectItem value="equipment">Equipamentos</SelectItem>
                        <SelectItem value="clothing">Roupas</SelectItem>
                        <SelectItem value="nutrition">Nutrição</SelectItem>
                        <SelectItem value="other">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="stock_quantity">Quantidade em Estoque</Label>
                    <Input
                      id="stock_quantity"
                      name="stock_quantity"
                      type="number"
                      defaultValue={selectedProduct?.stock_quantity || "0"}
                    />
                  </div>
                  <div>
                    <Label htmlFor="in_stock">Em Estoque</Label>
                    <Select
                      name="in_stock"
                      defaultValue={selectedProduct?.in_stock ? "true" : "false"}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Sim</SelectItem>
                        <SelectItem value="false">Não</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="is_active">Status</Label>
                  <Select
                    name="is_active"
                    defaultValue={selectedProduct?.is_active !== false ? "true" : "false"}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Ativo</SelectItem>
                      <SelectItem value="false">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddModal(false);
                      setShowEditModal(false);
                      setSelectedProduct(null);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" className="gap-2.5">
                    {showEditModal ? "Atualizar" : "Criar"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminProductsPage;
