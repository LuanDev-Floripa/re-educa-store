import React, { useState, useEffect, useMemo } from "react";
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
} from "lucide-react";

/**
 * AdminProductsPage
 * Listagem e gestão de produtos com filtros, ordenação e fallbacks seguros.
 * @returns {JSX.Element}
 */
const AdminProductsPage = () => {
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

  // Carregar produtos da API
  useEffect(() => {
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
        console.error("Erro ao carregar produtos:", err);
        toast.error("Erro ao carregar produtos");
        setProducts([]);
        setFilteredProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  // Dados de exemplo removidos - usar API real acima
  const productsDataFallback = [
    {
      id: 1,
      name: "Whey Protein Premium",
      description:
        "Proteína de soro do leite de alta qualidade para ganho de massa muscular",
      category: "Suplementos",
      subcategory: "Proteínas",
      price: 89.9,
      originalPrice: 119.9,
      stock: 45,
      minStock: 10,
      status: "active",
      rating: 4.8,
      reviews: 156,
      sales: 234,
      image: "/api/placeholder/300/300",
      images: ["/api/placeholder/300/300", "/api/placeholder/300/300"],
      tags: ["proteína", "whey", "massa muscular", "fitness"],
      brand: "MuscleTech",
      weight: "2kg",
      flavor: "Chocolate",
      ingredients: [
        "Whey Protein Concentrate",
        "Cocoa Powder",
        "Natural Flavors",
      ],
      benefits: [
        "Ganho de massa muscular",
        "Recuperação pós-treino",
        "Alto valor biológico",
      ],
      usage: "Misture 1 dose (30g) em 200-250ml de água ou leite",
      createdAt: "2024-01-15",
      updatedAt: "2024-01-20",
    },
    {
      id: 2,
      name: "Creatina Monohidratada",
      description: "Creatina pura para aumento de força e performance",
      category: "Suplementos",
      subcategory: "Performance",
      price: 45.9,
      originalPrice: 59.9,
      stock: 78,
      minStock: 15,
      status: "active",
      rating: 4.6,
      reviews: 89,
      sales: 156,
      image: "/api/placeholder/300/300",
      images: ["/api/placeholder/300/300"],
      tags: ["creatina", "força", "performance", "treino"],
      brand: "Optimum Nutrition",
      weight: "300g",
      flavor: "Sem sabor",
      ingredients: ["Creatine Monohydrate"],
      benefits: [
        "Aumento de força",
        "Melhora da performance",
        "Ganho de massa muscular",
      ],
      usage: "Tome 3g por dia, preferencialmente após o treino",
      createdAt: "2024-01-10",
      updatedAt: "2024-01-18",
    },
    {
      id: 3,
      name: "Multivitamínico Completo",
      description: "Complexo vitamínico e mineral para saúde geral",
      category: "Suplementos",
      subcategory: "Vitaminas",
      price: 32.9,
      originalPrice: 42.9,
      stock: 12,
      minStock: 20,
      status: "low_stock",
      rating: 4.4,
      reviews: 67,
      sales: 98,
      image: "/api/placeholder/300/300",
      images: ["/api/placeholder/300/300"],
      tags: ["vitaminas", "minerais", "saúde", "imunidade"],
      brand: "Centrum",
      weight: "60 cápsulas",
      flavor: "N/A",
      ingredients: [
        "Vitamin A",
        "Vitamin C",
        "Vitamin D",
        "Vitamin E",
        "B-Complex",
      ],
      benefits: ["Suporte imunológico", "Energia", "Saúde geral"],
      usage: "Tome 1 cápsula por dia com uma refeição",
      createdAt: "2024-01-05",
      updatedAt: "2024-01-15",
    },
    {
      id: 4,
      name: "BCAA 2:1:1",
      description: "Aminoácidos de cadeia ramificada para recuperação muscular",
      category: "Suplementos",
      subcategory: "Aminoácidos",
      price: 67.9,
      originalPrice: 89.9,
      stock: 0,
      minStock: 25,
      status: "out_of_stock",
      rating: 4.7,
      reviews: 123,
      sales: 187,
      image: "/api/placeholder/300/300",
      images: ["/api/placeholder/300/300"],
      tags: ["bcaa", "aminoácidos", "recuperação", "treino"],
      brand: "Dymatize",
      weight: "400g",
      flavor: "Frutas Tropicais",
      ingredients: ["L-Leucine", "L-Isoleucine", "L-Valine"],
      benefits: [
        "Recuperação muscular",
        "Redução da fadiga",
        "Preservação da massa muscular",
      ],
      usage: "Misture 1 dose (10g) em 200ml de água",
      createdAt: "2024-01-12",
      updatedAt: "2024-01-22",
    },
    {
      id: 5,
      name: "Óleo de Peixe Ômega 3",
      description: "Suplemento de ômega 3 para saúde cardiovascular",
      category: "Suplementos",
      subcategory: "Óleos",
      price: 54.9,
      originalPrice: 69.9,
      stock: 34,
      minStock: 15,
      status: "active",
      rating: 4.5,
      reviews: 45,
      sales: 67,
      image: "/api/placeholder/300/300",
      images: ["/api/placeholder/300/300"],
      tags: ["ômega 3", "saúde cardiovascular", "anti-inflamatório"],
      brand: "Nordic Naturals",
      weight: "120 cápsulas",
      flavor: "N/A",
      ingredients: ["Fish Oil", "EPA", "DHA"],
      benefits: [
        "Saúde cardiovascular",
        "Função cerebral",
        "Anti-inflamatório",
      ],
      usage: "Tome 2 cápsulas por dia com uma refeição",
      createdAt: "2024-01-08",
      updatedAt: "2024-01-16",
    },
  ];

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

  // useEffect para carregar produtos movido para cima (já implementado)

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
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "inactive":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      case "low_stock":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "out_of_stock":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
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
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-6">
                <div className="h-48 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
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
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Gerenciamento de Produtos
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Gerencie todos os produtos da loja
              </p>
            </div>
          </div>
          <Button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Produto
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stats.total}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Total
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats.active}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Ativos
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {stats.lowStock}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Estoque Baixo
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">
                {stats.outOfStock}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Sem Estoque
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {stats.totalSales}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Vendas
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-emerald-600">
                R$ {stats.totalRevenue.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
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
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
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
                  <div className="aspect-square overflow-hidden rounded-t-lg bg-gray-100">
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
                    <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {product.description}
                    </p>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Preço:
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-lg text-green-600">
                          R$ {product.price.toFixed(2)}
                        </span>
                        {Number(product.originalPrice) > Number(product.price) && (
                          <span className="text-sm text-gray-500 line-through">
                            R$ {product.originalPrice.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Estoque:
                      </span>
                      <span
                        className={`font-semibold ${
                          product.stock <= product.minStock
                            ? "text-red-600"
                            : "text-green-600"
                        }`}
                      >
                        {product.stock} unidades
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Vendas:
                      </span>
                      <span className="font-semibold text-blue-600">
                        {product.sales}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Avaliação:
                      </span>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="font-semibold">{product.rating}</span>
                        <span className="text-sm text-gray-500">
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
                      onClick={() => handleToggleStatus(product.id)}
                      variant="outline"
                      size="sm"
                      className={
                        product.status === "active"
                          ? "text-red-600 hover:text-red-700"
                          : "text-green-600 hover:text-green-700"
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
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Nenhum produto encontrado
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Tente ajustar os filtros para encontrar mais produtos
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="coupons" className="mt-6">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Cupons de Desconto
              </h2>
              <Button
                onClick={() => (window.location.href = "/admin/coupons")}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Tag className="w-4 h-4 mr-2" />
                Gerenciar Cupons
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                      <Tag className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Cupons Ativos
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        12
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <Percent className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Desconto Médio
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        15%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Usos Hoje
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
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
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                          <Tag className="w-4 h-4 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <h4 className="font-medium">BEMVINDO10</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            10% de desconto
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">45 usos</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Hoje
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                          <Tag className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h4 className="font-medium">FRETE15</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Frete grátis
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">23 usos</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Hoje
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                          <Tag className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <h4 className="font-medium">VIP20</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            20% de desconto
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">12 usos</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
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
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                              {index + 1}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-medium">{product.name}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {product.brand}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">
                            {product.sales} vendas
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
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
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span>Produtos Ativos</span>
                    </div>
                    <span className="font-semibold">{stats.active}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-5 h-5 text-yellow-500" />
                      <span>Estoque Baixo</span>
                    </div>
                    <span className="font-semibold">{stats.lowStock}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <XCircle className="w-5 h-5 text-red-500" />
                      <span>Sem Estoque</span>
                    </div>
                    <span className="font-semibold">{stats.outOfStock}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <XCircle className="w-5 h-5 text-gray-500" />
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
    </div>
  );
};

export default AdminProductsPage;
