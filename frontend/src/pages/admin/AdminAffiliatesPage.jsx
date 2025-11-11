import React, { useState, useEffect } from "react";
import logger from "@/utils/logger";
import apiClient from "@/services/apiClient";
import { toast } from "sonner";
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
import {
  Search,
  RefreshCw,
  Package,
  TrendingUp,
  DollarSign,
  Users,
  Download,
  Upload,
  CheckCircle,
  XCircle,
} from "lucide-react";

/**
 * AdminAffiliatesPage
 * Gestão de produtos afiliados e comissões.
 * @returns {JSX.Element}
 */
const AdminAffiliatesPage = () => {
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({
    total_products: 0,
    total_sales: 0,
    total_commission: 0,
    platforms: [],
  });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState("all");
  const [activeTab, setActiveTab] = useState("products");

  useEffect(() => {
    loadData();
  }, [selectedPlatform]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadProducts(), loadStats()]);
    } catch (error) {
      logger.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const params = { page: 1, limit: 100 };
      if (selectedPlatform !== "all") {
        params.platform = selectedPlatform;
      }

      const response = await apiClient.request(() => apiClient.get("/api/affiliates/products", { params }));

      const productsList =
        response?.products ||
        response?.data ||
        (Array.isArray(response) ? response : []);
      setProducts(productsList);
    } catch (error) {
      logger.error("Erro ao carregar produtos afiliados:", error);
      setProducts([]);
    }
  };

  const loadStats = async () => {
    try {
      // Estatísticas básicas dos produtos
      const response = await apiClient.request(() => apiClient.get("/api/affiliates/products", {
        params: { page: 1, limit: 1 },
      }));

      const total = response?.total || products.length;
      const platforms = [...new Set(products.map((p) => p.platform || p.product_source))].filter(Boolean);

      setStats({
        total_products: total,
        total_sales: 0, // Seria calculado de vendas reais
        total_commission: 0, // Seria calculado de comissões
        platforms,
      });
    } catch (error) {
      logger.error("Erro ao carregar estatísticas:", error);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      const response = await apiClient.post("/api/affiliates/products/sync");

      if (response?.success) {
        toast.success(
          `${response.total_products || 0} produtos sincronizados com sucesso!`
        );
        loadData();
      } else {
        throw new Error(response?.error || "Erro ao sincronizar produtos");
      }
    } catch (error) {
      logger.error("Erro ao sincronizar produtos:", error);
      toast.error(error.message || "Erro ao sincronizar produtos");
    } finally {
      setSyncing(false);
    }
  };

  const filteredProducts = products.filter((product) =>
    String(product.name || product.title || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando afiliados...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Gestão de Afiliados
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Gerencie produtos afiliados e comissões
          </p>
        </div>
        <Button onClick={handleSync} disabled={syncing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Sincronizando..." : "Sincronizar Produtos"}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Total de Produtos
                </p>
                <p className="text-xl sm:text-2xl font-bold mt-1">
                  {stats.total_products}
                </p>
              </div>
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Total de Vendas
                </p>
                <p className="text-xl sm:text-2xl font-bold mt-1">
                  {stats.total_sales}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Comissão Total
                </p>
                <p className="text-xl sm:text-2xl font-bold mt-1">
                  R$ {stats.total_commission.toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Plataformas
                </p>
                <p className="text-xl sm:text-2xl font-bold mt-1">
                  {stats.platforms.length}
                </p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="products">Produtos</TabsTrigger>
          <TabsTrigger value="commissions">Comissões</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar produtos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select
                  value={selectedPlatform}
                  onValueChange={setSelectedPlatform}
                >
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Plataforma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="hotmart">Hotmart</SelectItem>
                    <SelectItem value="kiwify">Kiwify</SelectItem>
                    <SelectItem value="eduzz">Eduzz</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Produtos Afiliados</CardTitle>
              <CardDescription>
                {filteredProducts.length} produto(s) encontrado(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-16 px-4">
                    <div className="relative mb-6 max-w-md mx-auto">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-24 h-24 rounded-full bg-primary/10 animate-pulse"></div>
                      </div>
                      <Package className="h-16 w-16 text-primary mx-auto relative z-10" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-3">
                      Nenhum produto afiliado encontrado
                    </h3>
                    <p className="text-muted-foreground/90 leading-relaxed max-w-md mx-auto">
                      {searchTerm || platformFilter !== "all"
                        ? "Tente ajustar os filtros de busca para encontrar produtos afiliados"
                        : "Configure produtos de afiliados para expandir seu catálogo e aumentar as vendas"}
                    </p>
                  </div>
                ) : (
                  filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        {product.image || product.thumbnail ? (
                          <img
                            src={product.image || product.thumbnail}
                            alt={product.name || product.title}
                            className="w-12 h-12 rounded object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                            <Package className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {product.name || product.title || "Produto sem nome"}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">
                              {product.platform || product.product_source || "N/A"}
                            </Badge>
                            {product.price && (
                              <span className="text-sm text-muted-foreground">
                                R$ {Number(product.price).toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="commissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Comissões</CardTitle>
              <CardDescription>
                Histórico de comissões de afiliados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <DollarSign className="h-12 w-12 mx-auto mb-4" />
                <p>Histórico de comissões será exibido aqui</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminAffiliatesPage;
