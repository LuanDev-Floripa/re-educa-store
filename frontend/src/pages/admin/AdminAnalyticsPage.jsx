import React, { useState, useEffect, useCallback } from "react";
import logger from "@/utils/logger";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/Ui/card";
import { Button } from "@/components/Ui/button";
import {
  BarChart3,
  TrendingUp,
  Users,
  ShoppingBag,
  DollarSign,
  Eye,
  Download,
  Filter,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  RefreshCw,
} from "lucide-react";
import apiClient from "@/services/apiClient";
import { toast } from "sonner";

/**
 * AdminAnalyticsPage
 * Página de analytics administrativos com carregamento seguro e feedbacks.
 * @returns {JSX.Element}
 */
const AdminAnalyticsPage = () => {
  const [timeRange, setTimeRange] = useState("month");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analyticsData, setAnalyticsData] = useState({
    overview: {
      totalRevenue: 125430.5,
      totalOrders: 3421,
      totalUsers: 1247,
      conversionRate: 3.2,
      averageOrderValue: 195.2,
      revenueGrowth: 15.2,
      ordersGrowth: 8.3,
      usersGrowth: 12.5,
    },
    chartData: [
      { date: "2024-01-01", revenue: 2400, orders: 24, users: 40 },
      { date: "2024-01-02", revenue: 1398, orders: 22, users: 30 },
      { date: "2024-01-03", revenue: 9800, orders: 29, users: 20 },
      { date: "2024-01-04", revenue: 3908, orders: 20, users: 27 },
      { date: "2024-01-05", revenue: 4800, orders: 18, users: 18 },
      { date: "2024-01-06", revenue: 3800, orders: 25, users: 23 },
      { date: "2024-01-07", revenue: 4300, orders: 30, users: 34 },
    ],
    topProducts: [
      {
        name: "Whey Protein Premium",
        sales: 234,
        revenue: 21060,
        growth: 12.5,
      },
      {
        name: "Multivitamínico Completo",
        sales: 189,
        revenue: 8599.5,
        growth: 8.3,
      },
      {
        name: "Óleo de Coco Extra Virgem",
        sales: 156,
        revenue: 5132.4,
        growth: -2.1,
      },
      { name: "Termogênico Natural", sales: 98, revenue: 6644.4, growth: 15.7 },
      { name: "Chá Verde Detox", sales: 87, revenue: 2479.5, growth: 5.2 },
    ],
    userMetrics: {
      newUsers: 45,
      activeUsers: 892,
      returningUsers: 355,
      churnRate: 2.1,
    },
    trafficSources: [],
  });

  // Converter timeRange para formato da API
  const getPeriodForAPI = (range) => {
    const map = {
      "7d": "week",
      "30d": "month",
      "90d": "quarter",
      "1y": "year",
    };
    return map[range] || "month";
  };

  // Carregar dados da API
  const loadAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const period = getPeriodForAPI(timeRange);

      // Carregar analytics de vendas
      if (!apiClient?.getAdminSalesAnalytics) {
        throw new Error("Serviço de analytics de vendas indisponível");
      }
      const salesData = await apiClient.getAdminSalesAnalytics(period);

      // Carregar analytics de usuários
      if (!apiClient?.getAdminUsersAnalytics) {
        throw new Error("Serviço de analytics de usuários indisponível");
      }
      const usersData = await apiClient.getAdminUsersAnalytics(period);

      // Carregar analytics de produtos
      if (!apiClient?.getAdminProductsAnalytics) {
        throw new Error("Serviço de analytics de produtos indisponível");
      }
      const productsData = await apiClient.getAdminProductsAnalytics(period);

      // Formatar dados combinados
      const formattedData = {
        overview: {
          totalRevenue: Number(salesData?.metrics?.total_revenue) || 0,
          totalOrders: Number(salesData?.metrics?.total_orders) || 0,
          totalUsers: Number(usersData?.total_users) || 0,
          conversionRate: Number(salesData?.metrics?.conversion_rate) || 0,
          averageOrderValue: Number(salesData?.metrics?.average_ticket) || 0,
          revenueGrowth: Number(salesData?.comparison?.revenue_growth) || 0,
          ordersGrowth: Number(salesData?.comparison?.orders_growth) || 0,
          usersGrowth: Number(usersData?.growth_rate) || 0,
        },
        chartData:
          (Array.isArray(salesData?.sales_by_day) ? salesData.sales_by_day : [])?.map((item, index) => ({
            date:
              item?.date ||
              item?.day ||
              new Date(
                Date.now() -
                  ((Array.isArray(salesData?.sales_by_day) ? salesData.sales_by_day.length : 0) - index) * 24 * 60 * 60 * 1000,
              )
                .toISOString()
                .split("T")[0],
            revenue: Number(item?.revenue ?? item?.total_revenue ?? 0) || 0,
            orders: Number(item?.orders ?? item?.total_orders ?? 0) || 0,
            users: 0, // Pode ser calculado separadamente
          })) || [],
        topProducts:
          (Array.isArray(productsData?.top_products) ? productsData.top_products : [])?.map((product) => ({
            name: product?.name || product?.product_name || "Produto",
            sales: Number(product?.sales_count ?? product?.total_sales ?? 0) || 0,
            revenue: Number(product?.total_revenue ?? product?.revenue ?? 0) || 0,
            growth: Number(product?.growth ?? 0) || 0,
          })) || [],
        userMetrics: {
          newUsers: Number(usersData?.new_users) || 0,
          activeUsers: Number(usersData?.active_users) || 0,
          returningUsers: Number(usersData?.returning_users) || 0,
          churnRate: Number(usersData?.churn_rate) || 0,
        },
        trafficSources: [], // Não disponível nos analytics atuais
      };

      setAnalyticsData(formattedData);
    } catch (err) {
      logger.error("Erro ao carregar analytics:", err);
      setError(err?.message || "Erro ao carregar dados de analytics");
      toast.error("Erro ao carregar analytics");
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    loadAnalyticsData();
  }, [loadAnalyticsData]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat("pt-BR").format(value);
  };

  const formatPercentage = (value) => {
    return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-4" />
            <p className="text-muted-foreground">
              Carregando analytics...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-destructive text-destructive mb-4" role="alert" aria-live="assertive">{error}</p>
            <Button onClick={loadAnalyticsData} variant="outline">
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <BarChart3 className="w-7 h-7 text-primary" />
            Analytics
          </h1>
          <p className="text-muted-foreground">
            Análise detalhada de performance e métricas
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <Button
            onClick={loadAnalyticsData}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Atualizar
          </Button>
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <select
              value={timeRange}
              onChange={(e) => {
                setTimeRange(e.target.value);
                loadAnalyticsData();
              }}
              className="border border-border rounded-md px-3 py-1 text-sm bg-background text-foreground"
            >
              <option value="7d">Últimos 7 dias</option>
              <option value="30d">Últimos 30 dias</option>
              <option value="90d">Últimos 90 dias</option>
              <option value="1y">Último ano</option>
            </select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              toast.info("Funcionalidade de exportação em desenvolvimento")
            }
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(analyticsData.overview.totalRevenue)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <ArrowUpRight className="h-3 w-3 text-primary mr-1" />
              <span className="text-primary">
                {formatPercentage(analyticsData.overview.revenueGrowth)}
              </span>
              <span className="ml-1">vs período anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Pedidos
            </CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(analyticsData.overview.totalOrders)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <ArrowUpRight className="h-3 w-3 text-primary mr-1" />
              <span className="text-primary">
                {formatPercentage(analyticsData.overview.ordersGrowth)}
              </span>
              <span className="ml-1">vs período anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Usuários
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(analyticsData.overview.totalUsers)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <ArrowUpRight className="h-3 w-3 text-primary mr-1" />
              <span className="text-primary">
                {formatPercentage(analyticsData.overview.usersGrowth)}
              </span>
              <span className="ml-1">vs período anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(analyticsData.overview.averageOrderValue)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <ArrowUpRight className="h-3 w-3 text-primary mr-1" />
              <span className="text-primary">+5.2%</span>
              <span className="ml-1">vs período anterior</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Receita por Período</CardTitle>
            <CardDescription>
              Evolução da receita nos últimos dias
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-muted rounded-lg">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">
                  Gráfico de Receita
                </p>
                <p className="text-sm text-muted-foreground">
                  Integração com biblioteca de gráficos
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Pedidos por Período</CardTitle>
            <CardDescription>
              Volume de pedidos nos últimos dias
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-muted rounded-lg">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">
                  Gráfico de Pedidos
                </p>
                <p className="text-sm text-muted-foreground">
                  Integração com biblioteca de gráficos
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Products */}
      <Card>
        <CardHeader>
          <CardTitle>Produtos Mais Vendidos</CardTitle>
          <CardDescription>
            Ranking dos produtos por performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analyticsData.topProducts.map((product, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 border border-border rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-bold text-primary">
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">
                      {product.name}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {product.sales} vendas
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-foreground">
                    {formatCurrency(product.revenue)}
                  </div>
                  <div
                    className={`text-sm flex items-center ${
                      product.growth > 0 ? "text-primary" : "text-destructive"
                    }`}
                  >
                    {product.growth > 0 ? (
                      <ArrowUpRight className="w-3 h-3 mr-1" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3 mr-1" />
                    )}
                    {formatPercentage(product.growth)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* User Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-primary mr-3" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Novos Usuários
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {formatNumber(analyticsData.userMetrics.newUsers)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Eye className="h-8 w-8 text-primary mr-3" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Usuários Ativos
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {formatNumber(analyticsData.userMetrics.activeUsers)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-primary mr-3" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Usuários Retornando
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {formatNumber(analyticsData.userMetrics.returningUsers)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <ArrowDownRight className="h-8 w-8 text-destructive mr-3" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Taxa de Churn
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {analyticsData.userMetrics.churnRate}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Traffic Sources */}
      <Card>
        <CardHeader>
          <CardTitle>Fontes de Tráfego</CardTitle>
          <CardDescription>Origem dos visitantes do site</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analyticsData.trafficSources.map((source, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full bg-primary"></div>
                  <span className="font-medium text-foreground">
                    {source.source}
                  </span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-muted-foreground">
                    {formatNumber(source.visitors)} visitantes
                  </div>
                  <div className="text-sm font-medium text-foreground">
                    {source.percentage}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAnalyticsPage;
