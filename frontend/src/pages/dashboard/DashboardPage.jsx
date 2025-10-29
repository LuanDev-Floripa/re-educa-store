import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/Ui/card';
import { Button } from '@/components/Ui/button';
import { 
  TrendingUp, 
  Users, 
  ShoppingCart, 
  DollarSign,
  Activity,
  Target,
  Award,
  Clock,
  BarChart3,
  PieChart,
  LineChart,
  Eye,
  RefreshCw,
  Bot
} from 'lucide-react';

export const DashboardPage = () => {
  const [selectedPeriod, setSelectedPeriod] = React.useState('week');
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // Dados da API
  const [metrics, setMetrics] = React.useState({
    totalUsers: 0,
    activeUsers: 0,
    totalRevenue: 0,
    totalOrders: 0,
    conversionRate: 0,
    averageOrderValue: 0
  });
  const [loading, setLoading] = React.useState(true);

  const [chartData, setChartData] = React.useState([]);

  const [recentActivity, setRecentActivity] = React.useState([]);

  React.useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:9001';
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${API_URL}/api/admin/dashboard`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setMetrics({
            totalUsers: data.users?.total || 0,
            activeUsers: data.users?.active || 0,
            totalRevenue: data.revenue?.month || 0,
            totalOrders: data.orders?.total || 0,
            conversionRate: data.orders?.total > 0 
              ? ((data.orders?.completed / data.orders?.total) * 100 || 0).toFixed(1)
              : 0,
            averageOrderValue: data.orders?.completed > 0
              ? (data.revenue?.month / data.orders?.completed || 0).toFixed(2)
              : 0
          });
          setRecentActivity(data.recent_activity || []);
        } else {
          // Em caso de erro, manter valores zerados ao invés de usar mocks
          console.error('Erro ao buscar dashboard:', response.status, response.statusText);
          setMetrics({
            totalUsers: 0,
            activeUsers: 0,
            totalRevenue: 0,
            totalOrders: 0,
            conversionRate: 0,
            averageOrderValue: 0
          });
          setRecentActivity([]);
        }
      } catch (error) {
        console.error('Erro ao buscar dados do dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [selectedPeriod]);

  const getActivityIcon = (type) => {
    switch (type) {
      case 'purchase': return <ShoppingCart className="w-4 h-4 text-green-600" />;
      case 'health': return <Activity className="w-4 h-4 text-blue-600" />;
      case 'subscription': return <Award className="w-4 h-4 text-purple-600" />;
      case 'gamification': return <Target className="w-4 h-4 text-orange-600" />;
      default: return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'purchase': return 'bg-green-50 border-green-200';
      case 'health': return 'bg-blue-50 border-blue-200';
      case 'subscription': return 'bg-purple-50 border-purple-200';
      case 'gamification': return 'bg-orange-50 border-orange-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header do Dashboard */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Visão geral da plataforma e métricas de performance
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Seletor de Período */}
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="today">Hoje</option>
            <option value="week">Esta Semana</option>
            <option value="month">Este Mês</option>
            <option value="quarter">Este Trimestre</option>
            <option value="year">Este Ano</option>
          </select>

          {/* Botão de Atualizar */}
          <Button
            onClick={() => setIsRefreshing(!isRefreshing)}
            disabled={isRefreshing}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Atualizando...' : 'Atualizar'}
          </Button>

          {/* Botão de IA */}
          <Button 
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            <Bot className="w-5 h-5 mr-2" />
            Assistente IA
          </Button>
        </div>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total de Usuários</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{metrics.totalUsers.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
              <span className="text-green-600">+12%</span>
              <span className="text-gray-500 ml-1">vs. mês anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Usuários Ativos</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{metrics.activeUsers.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
              <span className="text-green-600">+8%</span>
              <span className="text-gray-500 ml-1">vs. mês anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Receita Total</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(metrics.totalRevenue)}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-full">
                <DollarSign className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
              <span className="text-green-600">+23%</span>
              <span className="text-gray-500 ml-1">vs. mês anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pedidos</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{metrics.totalOrders.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-full">
                <ShoppingCart className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
              <span className="text-green-600">+15%</span>
              <span className="text-gray-500 ml-1">vs. mês anterior</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Atividade Recente */}
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Atividade Recente
          </CardTitle>
          <CardDescription>
            Últimas ações dos usuários na plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className={`flex items-center gap-4 p-4 rounded-lg border ${getActivityColor(activity.type)}`}
              >
                <div className="flex-shrink-0">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {activity.user}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {activity.action}
                  </p>
                </div>
                <div className="text-sm text-gray-500">
                  {activity.time}
                </div>
                <Button variant="ghost" size="sm">
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;