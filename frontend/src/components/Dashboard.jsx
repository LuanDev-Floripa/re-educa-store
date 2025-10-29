import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  Activity,
  Heart,
  Target,
  TrendingUp,
  Calendar,
  Award,
  Users,
  ShoppingCart,
  Bell,
  Settings,
  User,
  BarChart3,
  PieChart,
  LineChart,
  Zap,
  Star,
  Trophy,
  Gift,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Filter,
  Search,
  Download,
  Share,
  MoreHorizontal,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Brain,
  Dumbbell,
  Apple,
  Moon,
  Sun,
  Flame,
  Droplets,
  Wind
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/Ui/card';
import { Button } from '@/components/Ui/button';
import { Badge } from '@/components/Ui/badge';
import { Progress } from '@/components/Ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/Ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/Ui/avatar';
import { Input } from '@/components/Ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/Ui/select';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell, BarChart, Bar, AreaChart, Area } from 'recharts';
import {
  AnimatedGradient,
  FloatingElement,
  MagneticButton,
  MorphingCard,
  ParticleSystem,
  GlowingBorder,
  TypingAnimation,
  RippleEffect,
  StaggerContainer
} from '@/components/magic-ui';

// ================================
// DASHBOARD PRINCIPAL
// ================================

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('7d');
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalUsers: 12847,
      activeUsers: 8934,
      revenue: 89420,
      conversionRate: 12.4,
      healthScore: 87,
      streakDays: 15,
      caloriesBurned: 2340,
      waterIntake: 2.1
    },
    charts: {
      healthProgress: [
        { date: '2024-01-01', weight: 75, muscle: 45, fat: 18 },
        { date: '2024-01-08', weight: 74.5, muscle: 45.5, fat: 17.5 },
        { date: '2024-01-15', weight: 74, muscle: 46, fat: 17 },
        { date: '2024-01-22', weight: 73.5, muscle: 46.5, fat: 16.5 },
        { date: '2024-01-29', weight: 73, muscle: 47, fat: 16 }
      ],
      activityData: [
        { name: 'Seg', steps: 8400, calories: 420, water: 2.1 },
        { name: 'Ter', steps: 9200, calories: 480, water: 2.3 },
        { name: 'Qua', steps: 7800, calories: 390, water: 1.9 },
        { name: 'Qui', steps: 10500, calories: 520, water: 2.5 },
        { name: 'Sex', steps: 9800, calories: 490, water: 2.2 },
        { name: 'Sab', steps: 11200, calories: 560, water: 2.8 },
        { name: 'Dom', steps: 6500, calories: 320, water: 1.8 }
      ],
      nutritionBreakdown: [
        { name: 'Proteínas', value: 30, color: '#22c55e' },
        { name: 'Carboidratos', value: 45, color: '#3b82f6' },
        { name: 'Gorduras', value: 25, color: '#f59e0b' }
      ]
    },
    achievements: [
      { id: 1, title: 'Primeira Semana', description: '7 dias consecutivos', icon: '🏆', unlocked: true },
      { id: 2, title: 'Hidratação Master', description: '2L de água por dia', icon: '💧', unlocked: true },
      { id: 3, title: 'Queimador de Calorias', description: '500 cal em um dia', icon: '🔥', unlocked: false },
      { id: 4, title: 'Maratonista', description: '10.000 passos', icon: '👟', unlocked: true }
    ],
    recentActivities: [
      { id: 1, type: 'workout', title: 'Treino de Força', duration: '45 min', calories: 320, time: '2h atrás' },
      { id: 2, type: 'meal', title: 'Almoço Saudável', calories: 450, protein: 35, time: '4h atrás' },
      { id: 3, type: 'water', title: 'Meta de Hidratação', amount: '2.1L', time: '6h atrás' },
      { id: 4, type: 'sleep', title: 'Sono Reparador', duration: '8h 15min', quality: 'Excelente', time: '12h atrás' }
    ]
  });

  useEffect(() => {
    // Carregar dados reais da API
    const loadDashboardData = async () => {
      try {
        // Carregar dashboard do usuário
        const response = await apiClient.getUserDashboard();
        
        if (response) {
          // Formatar dados do dashboard
          if (response.health_score) {
            const healthScore = response.health_score.score || 0;
            setDashboardData(prev => ({
              ...prev,
              stats: {
                ...prev.stats,
                healthScore: healthScore,
                caloriesBurned: response.workout_summary?.total_calories || 0,
                waterIntake: response.nutrition_summary?.water || 0
              },
              nutrition_summary: response.nutrition_summary || prev.nutrition_summary
            }));
          }
        }

        // Carregar perfil do usuário
        const profile = await apiClient.getUserProfile();
        if (profile?.user) {
          setUser({
            id: profile.user.id,
            name: profile.user.name || profile.user.full_name || profile.user.email?.split('@')[0],
            email: profile.user.email,
            avatar: profile.user.avatar_url || '/api/placeholder/80/80',
            level: profile.user.level || 1,
            xp: profile.user.xp || 0,
            nextLevelXp: profile.user.next_level_xp || 1000,
            healthScore: dashboardData.stats.healthScore || 0,
            streak: profile.user.streak_days || 0,
            joinDate: profile.user.created_at
          });
        }
      } catch (err) {
        console.error('Erro ao carregar dashboard:', err);
        // Em caso de erro, usar dados padrão
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <AnimatedGradient className="min-h-screen">
      <ParticleSystem count={30} />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <DashboardHeader user={user} />
        
        {/* Quick Stats */}
        <QuickStats stats={dashboardData.stats} />
        
        {/* Main Content */}
        <div className="mt-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:grid-cols-5">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Visão Geral</span>
              </TabsTrigger>
              <TabsTrigger value="health" className="flex items-center gap-2">
                <Heart className="w-4 h-4" />
                <span className="hidden sm:inline">Saúde</span>
              </TabsTrigger>
              <TabsTrigger value="nutrition" className="flex items-center gap-2">
                <Apple className="w-4 h-4" />
                <span className="hidden sm:inline">Nutrição</span>
              </TabsTrigger>
              <TabsTrigger value="fitness" className="flex items-center gap-2">
                <Dumbbell className="w-4 h-4" />
                <span className="hidden sm:inline">Fitness</span>
              </TabsTrigger>
              <TabsTrigger value="achievements" className="flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                <span className="hidden sm:inline">Conquistas</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <OverviewTab data={dashboardData} timeRange={timeRange} setTimeRange={setTimeRange} />
            </TabsContent>

            <TabsContent value="health">
              <HealthTab data={dashboardData} />
            </TabsContent>

            <TabsContent value="nutrition">
              <NutritionTab data={dashboardData} />
            </TabsContent>

            <TabsContent value="fitness">
              <FitnessTab data={dashboardData} />
            </TabsContent>

            <TabsContent value="achievements">
              <AchievementsTab achievements={dashboardData.achievements} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AnimatedGradient>
  );
};

// ================================
// COMPONENTES DO DASHBOARD
// ================================

const DashboardSkeleton = () => (
  <div className="min-h-screen bg-gray-50 animate-pulse">
    <div className="container mx-auto px-4 py-8">
      <div className="h-20 bg-gray-200 rounded-lg mb-8"></div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
        ))}
      </div>
    </div>
  </div>
);

const DashboardHeader = ({ user }) => (
  <StaggerContainer className="mb-8">
    <MorphingCard className="p-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="flex items-center gap-4">
          <GlowingBorder className="p-1">
            <Avatar className="w-16 h-16">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="bg-health-gradient text-white text-xl font-bold">
                {user.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
          </GlowingBorder>
          
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Olá, {user.name}! 👋
            </h1>
            <p className="text-gray-600">
              <TypingAnimation text="Pronto para mais um dia saudável?" speed={30} />
            </p>
            
            <div className="flex items-center gap-4 mt-2">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Nível {user.level}
              </Badge>
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-medium">{user.streak} dias</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4">
          <div className="text-center lg:text-right">
            <p className="text-sm text-gray-600">Score de Saúde</p>
            <div className="flex items-center gap-2">
              <div className="w-16 h-16 relative">
                <svg className="w-16 h-16 transform -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="transparent"
                    className="text-gray-200"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="transparent"
                    strokeDasharray={`${2 * Math.PI * 28}`}
                    strokeDashoffset={`${2 * Math.PI * 28 * (1 - user.healthScore / 100)}`}
                    className="text-green-500 transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-green-600">{user.healthScore}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <MagneticButton className="bg-green-500 hover:bg-green-600">
              <Plus className="w-4 h-4 mr-2" />
              Nova Atividade
            </MagneticButton>
            <Button variant="outline" size="icon">
              <Bell className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* XP Progress */}
      <div className="mt-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Progresso XP</span>
          <span className="text-sm text-gray-600">{user.xp}/{user.nextLevelXp} XP</span>
        </div>
        <Progress value={(user.xp / user.nextLevelXp) * 100} className="h-2" />
      </div>
    </MorphingCard>
  </StaggerContainer>
);

const QuickStats = ({ stats }) => {
  const statCards = [
    {
      title: 'Calorias Queimadas',
      value: stats.caloriesBurned,
      unit: 'kcal',
      icon: Flame,
      color: 'text-orange-500',
      bgColor: 'bg-orange-100',
      change: '+12%',
      trend: 'up'
    },
    {
      title: 'Hidratação',
      value: stats.waterIntake,
      unit: 'L',
      icon: Droplets,
      color: 'text-blue-500',
      bgColor: 'bg-blue-100',
      change: '+5%',
      trend: 'up'
    },
    {
      title: 'Score de Saúde',
      value: stats.healthScore,
      unit: '/100',
      icon: Heart,
      color: 'text-green-500',
      bgColor: 'bg-green-100',
      change: '+3%',
      trend: 'up'
    },
    {
      title: 'Sequência',
      value: stats.streakDays,
      unit: 'dias',
      icon: Target,
      color: 'text-purple-500',
      bgColor: 'bg-purple-100',
      change: '+1',
      trend: 'up'
    }
  ];

  return (
    <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat, index) => (
        <FloatingElement key={index} delay={index * 0.1}>
          <MorphingCard className="p-6 hover-lift">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </span>
                  <span className="text-sm text-gray-500">{stat.unit}</span>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3 text-green-500" />
                  <span className="text-xs text-green-600 font-medium">{stat.change}</span>
                </div>
              </div>
              <div className={`p-3 rounded-full ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </MorphingCard>
        </FloatingElement>
      ))}
    </StaggerContainer>
  );
};

const OverviewTab = ({ data, timeRange, setTimeRange }) => (
  <div className="space-y-6">
    {/* Controles */}
    <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
      <h2 className="text-xl font-semibold text-gray-900">Visão Geral</h2>
      <div className="flex gap-2">
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">7 dias</SelectItem>
            <SelectItem value="30d">30 dias</SelectItem>
            <SelectItem value="90d">90 dias</SelectItem>
            <SelectItem value="1y">1 ano</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon">
          <Download className="w-4 h-4" />
        </Button>
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Gráfico Principal */}
      <div className="lg:col-span-2">
        <MorphingCard className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Progresso de Saúde</h3>
            <Badge variant="secondary">Últimos 30 dias</Badge>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.charts.healthProgress}>
                <defs>
                  <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="muscleGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="date" tickFormatter={(date) => new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} />
                <YAxis />
                <Tooltip 
                  labelFormatter={(date) => new Date(date).toLocaleDateString('pt-BR')}
                  formatter={(value, name) => [
                    `${value}${name === 'weight' ? 'kg' : name === 'muscle' ? 'kg' : '%'}`,
                    name === 'weight' ? 'Peso' : name === 'muscle' ? 'Músculo' : 'Gordura'
                  ]}
                />
                <Area type="monotone" dataKey="weight" stroke="#22c55e" fillOpacity={1} fill="url(#weightGradient)" strokeWidth={2} />
                <Area type="monotone" dataKey="muscle" stroke="#3b82f6" fillOpacity={1} fill="url(#muscleGradient)" strokeWidth={2} />
                <Line type="monotone" dataKey="fat" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </MorphingCard>
      </div>

      {/* Atividades Recentes */}
      <div>
        <MorphingCard className="p-6">
          <h3 className="text-lg font-semibold mb-4">Atividades Recentes</h3>
          <div className="space-y-4">
            {data.recentActivities.map((activity) => (
              <RippleEffect key={activity.id} className="p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${
                    activity.type === 'workout' ? 'bg-orange-100 text-orange-600' :
                    activity.type === 'meal' ? 'bg-green-100 text-green-600' :
                    activity.type === 'water' ? 'bg-blue-100 text-blue-600' :
                    'bg-purple-100 text-purple-600'
                  }`}>
                    {activity.type === 'workout' && <Dumbbell className="w-4 h-4" />}
                    {activity.type === 'meal' && <Apple className="w-4 h-4" />}
                    {activity.type === 'water' && <Droplets className="w-4 h-4" />}
                    {activity.type === 'sleep' && <Moon className="w-4 h-4" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{activity.title}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </RippleEffect>
            ))}
          </div>
        </MorphingCard>
      </div>
    </div>

    {/* Gráfico de Atividade Semanal */}
    <MorphingCard className="p-6">
      <h3 className="text-lg font-semibold mb-6">Atividade Semanal</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.charts.activityData}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="steps" fill="#22c55e" radius={[4, 4, 0, 0]} />
            <Bar dataKey="calories" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </MorphingCard>
  </div>
);

const HealthTab = () => (
  <div className="space-y-6">
    <h2 className="text-xl font-semibold text-gray-900">Monitoramento de Saúde</h2>
    
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <MorphingCard className="p-6">
        <h3 className="text-lg font-semibold mb-4">Composição Corporal</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Peso</span>
            <span className="text-lg font-bold">73kg</span>
          </div>
          <Progress value={75} className="h-2" />
          
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Massa Muscular</span>
            <span className="text-lg font-bold">47kg</span>
          </div>
          <Progress value={85} className="h-2" />
          
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Gordura Corporal</span>
            <span className="text-lg font-bold">16%</span>
          </div>
          <Progress value={30} className="h-2" />
        </div>
      </MorphingCard>

      <MorphingCard className="p-6">
        <h3 className="text-lg font-semibold mb-4">Sinais Vitais</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <Heart className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Frequência Cardíaca</p>
            <p className="text-xl font-bold text-red-600">72 bpm</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <Activity className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Pressão Arterial</p>
            <p className="text-xl font-bold text-blue-600">120/80</p>
          </div>
        </div>
      </MorphingCard>
    </div>
  </div>
);

const NutritionTab = ({ data }) => {
  // Usar dados reais do dashboard ou valores padrão
  const nutritionSummary = data?.nutrition_summary || {};
  const totalMacros = (nutritionSummary.protein || 0) + (nutritionSummary.carbs || 0) + (nutritionSummary.fat || 0);
  
  // Calcular percentuais
  const proteinPercent = totalMacros > 0 ? ((nutritionSummary.protein || 0) / totalMacros) * 100 : 0;
  const carbsPercent = totalMacros > 0 ? ((nutritionSummary.carbs || 0) / totalMacros) * 100 : 0;
  const fatPercent = totalMacros > 0 ? ((nutritionSummary.fat || 0) / totalMacros) * 100 : 0;
  
  const nutritionData = [
    { name: 'Proteínas', value: Math.round(proteinPercent), color: '#ff6b6b', grams: nutritionSummary.protein || 0 },
    { name: 'Carboidratos', value: Math.round(carbsPercent), color: '#4ecdc4', grams: nutritionSummary.carbs || 0 },
    { name: 'Gorduras', value: Math.round(fatPercent), color: '#45b7d1', grams: nutritionSummary.fat || 0 }
  ];

  // Metas diárias padrão (podem vir da API no futuro)
  const dailyGoals = {
    calories: 2000,
    protein: 150,
    water: 2.5
  };

  const caloriesProgress = dailyGoals.calories > 0 ? ((nutritionSummary.calories || 0) / dailyGoals.calories) * 100 : 0;
  const proteinProgress = dailyGoals.protein > 0 ? ((nutritionSummary.protein || 0) / dailyGoals.protein) * 100 : 0;
  const waterProgress = dailyGoals.water > 0 ? ((nutritionSummary.water || 0) / dailyGoals.water) * 100 : 0;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Análise Nutricional</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MorphingCard className="p-6">
          <h3 className="text-lg font-semibold mb-4">Distribuição de Macronutrientes</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={nutritionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {nutritionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-4">
            {nutritionData.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span className="text-sm">{item.name}: {item.grams}g ({item.value}%)</span>
              </div>
            ))}
          </div>
        </MorphingCard>

      <MorphingCard className="p-6">
        <h3 className="text-lg font-semibold mb-4">Metas Diárias</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Calorias</span>
              <span className="text-sm text-gray-600">
                {Math.round(nutritionSummary.calories || 0).toLocaleString('pt-BR')} / {dailyGoals.calories.toLocaleString('pt-BR')}
              </span>
            </div>
            <Progress value={Math.min(caloriesProgress, 100)} className="h-2" />
          </div>
          
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Proteínas</span>
              <span className="text-sm text-gray-600">
                {Math.round(nutritionSummary.protein || 0)}g / {dailyGoals.protein}g
              </span>
            </div>
            <Progress value={Math.min(proteinProgress, 100)} className="h-2" />
          </div>
          
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Água</span>
              <span className="text-sm text-gray-600">
                {(nutritionSummary.water || 0).toFixed(1)}L / {dailyGoals.water.toFixed(1)}L
              </span>
            </div>
            <Progress value={Math.min(waterProgress, 100)} className="h-2" />
          </div>
        </div>
      </MorphingCard>
    </div>
  </div>
  );
};

const FitnessTab = () => (
  <div className="space-y-6">
    <h2 className="text-xl font-semibold text-gray-900">Fitness & Exercícios</h2>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <MorphingCard className="p-6 text-center">
        <Dumbbell className="w-12 h-12 text-orange-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Treinos</h3>
        <p className="text-3xl font-bold text-orange-600">12</p>
        <p className="text-sm text-gray-600">Este mês</p>
      </MorphingCard>

      <MorphingCard className="p-6 text-center">
        <Flame className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Calorias</h3>
        <p className="text-3xl font-bold text-red-600">2,340</p>
        <p className="text-sm text-gray-600">Hoje</p>
      </MorphingCard>

      <MorphingCard className="p-6 text-center">
        <Target className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Metas</h3>
        <p className="text-3xl font-bold text-green-600">8/10</p>
        <p className="text-sm text-gray-600">Alcançadas</p>
      </MorphingCard>
    </div>
  </div>
);

const AchievementsTab = ({ achievements }) => (
  <div className="space-y-6">
    <h2 className="text-xl font-semibold text-gray-900">Conquistas & Badges</h2>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {achievements.map((achievement) => (
        <MorphingCard key={achievement.id} className={`p-6 ${achievement.unlocked ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200' : 'bg-gray-50 border-gray-200'}`}>
          <div className="text-center">
            <div className={`text-4xl mb-4 ${achievement.unlocked ? 'grayscale-0' : 'grayscale'}`}>
              {achievement.icon}
            </div>
            <h3 className={`text-lg font-semibold mb-2 ${achievement.unlocked ? 'text-gray-900' : 'text-gray-500'}`}>
              {achievement.title}
            </h3>
            <p className={`text-sm ${achievement.unlocked ? 'text-gray-600' : 'text-gray-400'}`}>
              {achievement.description}
            </p>
            {achievement.unlocked && (
              <Badge className="mt-3 bg-yellow-100 text-yellow-800">
                Desbloqueada!
              </Badge>
            )}
          </div>
        </MorphingCard>
      ))}
    </div>
  </div>
);

export default Dashboard;

