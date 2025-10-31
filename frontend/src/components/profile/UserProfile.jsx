import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/Ui/card';
import { Button } from '@/components/Ui/button';
import { Input } from '@/components/Ui/input';
import { Label } from '@/components/Ui/label';
import { Badge } from '@/components/Ui/badge';
import { Progress } from '@/components/Ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/Ui/tabs';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Clock, 
  Edit, 
  Save, 
  X, 
  Camera, 
  Upload, 
  Download, 
  Shield, 
  Bell, 
  Settings, 
  Heart, 
  Activity, 
  Target, 
  Trophy, 
  Award, 
  Star, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  Check, 
  AlertTriangle, 
  Info, 
  Plus, 
  Minus, 
  Trash2, 
  Copy, 
  Share2, 
  MessageCircle, 
  Users, 
  Globe, 
  Smartphone, 
  Monitor, 
  Tablet, 
  Headphones, 
  Mic, 
  Video, 
  Bookmark, 
  Flag, 
  Zap, 
  Crown, 
  Diamond, 
  Medal, 
  Flame, 
  Droplets, 
  Moon, 
  Sun, 
  Cloud, 
  Wind, 
  Snow, 
  Umbrella, 
  TreePine, 
  Mountain, 
  Waves, 
  Fish, 
  Bird, 
  Cat, 
  Dog, 
  Rabbit, 
  Car, 
  Bike, 
  Bus, 
  Train, 
  Plane, 
  Ship, 
  Rocket, 
  Gamepad2, 
  Music, 
  Package, 
  ShoppingCart, 
  CreditCard, 
  Gift, 
  Tag, 
  Percent, 
  DollarSign, 
  Calculator, 
  FileText, 
  Image, 
  File, 
  Folder, 
  Archive, 
  Search, 
  Filter, 
  SortAsc, 
  SortDesc, 
  Grid, 
  List, 
  RefreshCw, 
  ExternalLink, 
  ArrowRight, 
  ArrowLeft, 
  ChevronDown, 
  ChevronUp, 
  ChevronRight, 
  ChevronLeft, 
  MoreHorizontal, 
  MoreVertical, 
  Menu, 
  X as XIcon
} from 'lucide-react';

/**
 * Perfil do usuário (dados híbridos API + defaults)
 * - Carrega perfil, configurações e estatísticas
 * - Permite atualização de perfil e preferências
 * - Exibe abas de visão geral, atividade, saúde e configurações
 */
export const UserProfile = ({ 
  userId,
  onUpdateProfile,
  onUpdateSettings,
  onExportData,
  onDeleteAccount,
  showAdminFeatures = false
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [profileData, setProfileData] = useState({});
  const [settings, setSettings] = useState({});
  const [stats, setStats] = useState({});

  // Dados de exemplo do perfil
  const defaultProfileData = useMemo(() => ({
    id: 1,
    name: 'João Silva',
    email: 'joao@email.com',
    phone: '+55 11 99999-9999',
    avatar: '/images/avatar.jpg',
    coverImage: '/images/cover.jpg',
    bio: 'Entusiasta de fitness e saúde. Sempre em busca de novos desafios e objetivos.',
    location: 'São Paulo, SP',
    birthDate: '1995-03-15',
    gender: 'male',
    height: 175,
    weight: 75,
    bodyFat: 15,
    muscleMass: 65,
    joinDate: '2023-01-15',
    lastActive: '2024-01-28',
    isVerified: true,
    isPremium: true,
    tier: 'gold',
    socialMedia: {
      instagram: '@joaosilva',
      twitter: '@joaosilva',
      linkedin: 'joao-silva',
      youtube: 'João Silva Fitness'
    },
    preferences: {
      theme: 'dark',
      language: 'pt-BR',
      units: 'metric',
      timezone: 'America/Sao_Paulo',
      notifications: {
        email: true,
        push: true,
        sms: false,
        marketing: false
      },
      privacy: {
        profilePublic: true,
        showProgress: true,
        allowMessages: true,
        showLocation: false
      }
    },
    goals: [
      { id: 1, name: 'Perda de Peso', target: 70, current: 75, unit: 'kg', deadline: '2024-06-01' },
      { id: 2, name: 'Ganho de Massa', target: 70, current: 65, unit: 'kg', deadline: '2024-12-01' },
      { id: 3, name: 'Redução de Gordura', target: 12, current: 15, unit: '%', deadline: '2024-08-01' }
    ],
    achievements: [
      { id: 1, name: 'Primeiro Treino', date: '2023-01-20', icon: Trophy, color: 'text-yellow-600' },
      { id: 2, name: '100 Treinos', date: '2023-06-15', icon: Award, color: 'text-blue-600' },
      { id: 3, name: 'Meta de Peso', date: '2023-09-10', icon: Target, color: 'text-green-600' },
      { id: 4, name: '1 Ano de Treino', date: '2024-01-15', icon: Crown, color: 'text-purple-600' }
    ],
    workoutHistory: [
      { date: '2024-01-28', type: 'Strength', duration: 60, exercises: 8, calories: 450 },
      { date: '2024-01-27', type: 'Cardio', duration: 30, exercises: 5, calories: 300 },
      { date: '2024-01-26', type: 'HIIT', duration: 45, exercises: 12, calories: 500 },
      { date: '2024-01-25', type: 'Strength', duration: 75, exercises: 10, calories: 550 },
      { date: '2024-01-24', type: 'Yoga', duration: 60, exercises: 15, calories: 200 }
    ],
    nutritionHistory: [
      { date: '2024-01-28', calories: 2200, protein: 150, carbs: 200, fat: 80, water: 2.5 },
      { date: '2024-01-27', calories: 2100, protein: 140, carbs: 180, fat: 75, water: 2.2 },
      { date: '2024-01-26', calories: 2300, protein: 160, carbs: 220, fat: 85, water: 2.8 },
      { date: '2024-01-25', calories: 2150, protein: 145, carbs: 190, fat: 78, water: 2.3 },
      { date: '2024-01-24', calories: 2000, protein: 130, carbs: 170, fat: 70, water: 2.0 }
    ],
    healthMetrics: {
      bmr: 1800,
      tdee: 2400,
      bodyFat: 15,
      muscleMass: 65,
      hydration: 85,
      sleep: 7.5,
      stress: 3,
      energy: 8
    }
  }), []);

  const defaultSettings = useMemo(() => ({
    account: {
      email: 'joao@email.com',
      phone: '+55 11 99999-9999',
      password: '••••••••',
      twoFactor: false
    },
    privacy: {
      profilePublic: true,
      showProgress: true,
      allowMessages: true,
      showLocation: false,
      showBirthDate: false,
      showEmail: false
    },
    notifications: {
      email: true,
      push: true,
      sms: false,
      marketing: false,
      workoutReminders: true,
      goalReminders: true,
      achievementNotifications: true
    },
    preferences: {
      theme: 'dark',
      language: 'pt-BR',
      units: 'metric',
      timezone: 'America/Sao_Paulo',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h'
    }
  }), []);

  useEffect(() => {
    const defaultStats = {
      totalWorkouts: 156,
      totalDuration: 7800, // em minutos
      totalCalories: 78000,
      currentStreak: 7,
      longestStreak: 45,
      favoriteExercise: 'Supino Reto',
      totalDistance: 1250, // em km
      totalWeight: 12500, // em kg
      averageWorkoutDuration: 50,
      workoutFrequency: 4.2,
      goalCompletion: 75,
      achievements: 12,
      level: 8,
      experience: 2450
    };

    const loadProfileData = async () => {
      setLoading(true);
      
      try {
        // Carregar dados reais da API
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('Token de autenticação não encontrado');
        }

        // Carregar perfil do usuário
        const profileResponse = await fetch(`/api/users/${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (profileResponse.ok) {
          const userData = await profileResponse.json();
          setProfileData({
            ...defaultProfileData,
            ...userData,
            // Mapear campos da API para o formato esperado
            name: userData.username || userData.name,
            email: userData.email,
            id: userData.id
          });
        } else {
          // Fallback para dados padrão se API falhar
          setProfileData(defaultProfileData);
        }

        // Carregar configurações do usuário (se houver endpoint específico)
        setSettings(defaultSettings);
        
        // Carregar estatísticas do usuário (se houver endpoint específico)
        setStats(defaultStats);
        
      } catch (error) {
        console.error('Erro ao carregar perfil:', error);
        // Fallback para dados padrão em caso de erro
        setProfileData(defaultProfileData);
        setSettings(defaultSettings);
        setStats(defaultStats);
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, [userId, defaultProfileData, defaultSettings]);

  const handleUpdateProfile = async (updatedData) => {
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      // Atualizar perfil via API real
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: updatedData.name,
          email: updatedData.email,
          // Mapear outros campos conforme necessário
          ...updatedData
        })
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setProfileData(prev => ({ ...prev, ...updatedUser }));
        
        if (onUpdateProfile) {
          onUpdateProfile(updatedUser);
        }
        
        toast.success('Perfil atualizado com sucesso!');
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao atualizar perfil');
      }
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      toast.error(error.message || 'Erro ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSettings = async (updatedSettings) => {
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      // Atualizar configurações via API (usando endpoint de usuário por enquanto)
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          preferences: updatedSettings
        })
      });

      if (response.ok) {
        await response.json();
        setSettings(prev => ({ ...prev, ...updatedSettings }));
        
        if (onUpdateSettings) {
          onUpdateSettings(updatedSettings);
        }
        
        toast.success('Configurações atualizadas com sucesso!');
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao atualizar configurações');
      }
    } catch (error) {
      console.error('Erro ao atualizar configurações:', error);
      toast.error(error.message || 'Erro ao atualizar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = () => {
    if (onExportData) {
      onExportData(profileData);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Tem certeza que deseja deletar sua conta? Esta ação não pode ser desfeita.')) {
      return;
    }

    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      // Deletar conta via API real
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Limpar dados locais
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        if (onDeleteAccount) {
          onDeleteAccount();
        }
        
        toast.success('Conta deletada com sucesso!');
        
        // Redirecionar para login
        window.location.href = '/login';
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao deletar conta');
      }
    } catch (error) {
      console.error('Erro ao deletar conta:', error);
      toast.error(error.message || 'Erro ao deletar conta');
    } finally {
      setLoading(false);
    }
  };

  const getTierIcon = (tier) => {
    switch (tier) {
      case 'bronze': return Medal;
      case 'silver': return Award;
      case 'gold': return Crown;
      case 'platinum': return Diamond;
      default: return Star;
    }
  };

  const getTierColor = (tier) => {
    switch (tier) {
      case 'bronze': return 'text-orange-600';
      case 'silver': return 'text-gray-600';
      case 'gold': return 'text-yellow-600';
      case 'platinum': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  const getTierBgColor = (tier) => {
    switch (tier) {
      case 'bronze': return 'bg-orange-50';
      case 'silver': return 'bg-gray-50';
      case 'gold': return 'bg-yellow-50';
      case 'platinum': return 'bg-purple-50';
      default: return 'bg-gray-50';
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Header do Perfil */}
      <Card>
        <div className="relative">
          <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-600 rounded-t-lg">
            <div className="absolute inset-0 bg-black/20 rounded-t-lg"></div>
            <div className="absolute bottom-4 left-4 right-4">
              <div className="flex items-end space-x-4">
                <div className="relative">
                  <div className="w-24 h-24 bg-white rounded-full border-4 border-white shadow-lg">
                    <img
                      src={profileData.avatar || '/images/default-avatar.jpg'}
                      alt={profileData.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                  {profileData.isVerified && (
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 text-white">
                  <div className="flex items-center space-x-2 mb-2">
                    <h1 className="text-2xl font-bold">{profileData.name}</h1>
                    {profileData.isPremium && (
                      <Badge className="bg-yellow-500 text-yellow-900">
                        <Crown className="w-3 h-3 mr-1" />
                        Premium
                      </Badge>
                    )}
                  </div>
                  <p className="text-blue-100 mb-2">{profileData.bio}</p>
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-4 h-4" />
                      <span>{profileData.location}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>Membro desde {new Date(profileData.joinDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" className="bg-white/20 border-white/30 text-white hover:bg-white/30">
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                  <Button variant="outline" size="sm" className="bg-white/20 border-white/30 text-white hover:bg-white/30">
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Informações Pessoais</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span>{profileData.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span>{profileData.phone}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span>{new Date(profileData.birthDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="capitalize">{profileData.gender}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Medidas Corporais</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Altura:</span>
                  <span>{profileData.height} cm</span>
                </div>
                <div className="flex justify-between">
                  <span>Peso:</span>
                  <span>{profileData.weight} kg</span>
                </div>
                <div className="flex justify-between">
                  <span>Gordura Corporal:</span>
                  <span>{profileData.bodyFat}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Massa Muscular:</span>
                  <span>{profileData.muscleMass} kg</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Status</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${profileData.isPremium ? 'bg-yellow-500' : 'bg-gray-400'}`}></div>
                  <span className="text-sm">{profileData.isPremium ? 'Premium' : 'Básico'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">Última atividade: {new Date(profileData.lastActive).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">Conta verificada</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Activity className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.totalWorkouts}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Treinos Totais
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {Math.round(stats.totalDuration / 60)}h
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Tempo Total
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Flame className="w-8 h-8 text-red-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.totalCalories.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Calorias Queimadas
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Trophy className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.achievements}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Conquistas
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Objetivos */}
      <Card>
        <CardHeader>
          <CardTitle>Objetivos Atuais</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {profileData.goals?.map((goal) => (
              <div key={goal.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{goal.name}</h3>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {goal.current} / {goal.target} {goal.unit}
                  </span>
                </div>
                <Progress 
                  value={(goal.current / goal.target) * 100} 
                  className="h-2 mb-2"
                />
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>Meta: {goal.target} {goal.unit}</span>
                  <span>Prazo: {new Date(goal.deadline).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Conquistas */}
      <Card>
        <CardHeader>
          <CardTitle>Conquistas Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profileData.achievements?.map((achievement) => {
              const IconComponent = achievement.icon;
              return (
                <div key={achievement.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                  <IconComponent className={`w-8 h-8 ${achievement.color}`} />
                  <div>
                    <h3 className="font-semibold">{achievement.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(achievement.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderActivity = () => (
    <div className="space-y-6">
      {/* Histórico de Treinos */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Treinos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {profileData.workoutHistory?.map((workout, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <Activity className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{workout.type}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {workout.exercises} exercícios • {workout.duration} min
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-green-600">
                    {workout.calories} cal
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(workout.date).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Histórico de Nutrição */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Nutrição</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {profileData.nutritionHistory?.map((nutrition, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">
                    {new Date(nutrition.date).toLocaleDateString()}
                  </h3>
                  <div className="text-lg font-bold text-blue-600">
                    {nutrition.calories} cal
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600 dark:text-gray-400">Proteína</div>
                    <div className="font-semibold">{nutrition.protein}g</div>
                  </div>
                  <div>
                    <div className="text-gray-600 dark:text-gray-400">Carboidratos</div>
                    <div className="font-semibold">{nutrition.carbs}g</div>
                  </div>
                  <div>
                    <div className="text-gray-600 dark:text-gray-400">Gordura</div>
                    <div className="font-semibold">{nutrition.fat}g</div>
                  </div>
                  <div>
                    <div className="text-gray-600 dark:text-gray-400">Água</div>
                    <div className="font-semibold">{nutrition.water}L</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderHealth = () => (
    <div className="space-y-6">
      {/* Métricas de Saúde */}
      <Card>
        <CardHeader>
          <CardTitle>Métricas de Saúde</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 border rounded-lg text-center">
              <Flame className="w-8 h-8 text-red-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {profileData.healthMetrics?.bmr}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                BMR (kcal)
              </div>
            </div>
            
            <div className="p-4 border rounded-lg text-center">
              <Activity className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {profileData.healthMetrics?.tdee}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                TDEE (kcal)
              </div>
            </div>
            
            <div className="p-4 border rounded-lg text-center">
              <Droplets className="w-8 h-8 text-cyan-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {profileData.healthMetrics?.hydration}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Hidratação
              </div>
            </div>
            
            <div className="p-4 border rounded-lg text-center">
              <Moon className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {profileData.healthMetrics?.sleep}h
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Sono Médio
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gráficos de Saúde */}
      <Card>
        <CardHeader>
          <CardTitle>Evolução das Métricas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 dark:text-gray-400">
                Gráficos de evolução serão exibidos aqui
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      {/* Configurações da Conta */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações da Conta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={settings.account?.email}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  account: { ...prev.account, email: e.target.value }
                }))}
              />
            </div>
            
            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={settings.account?.phone}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  account: { ...prev.account, phone: e.target.value }
                }))}
              />
            </div>
            
            <div>
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={settings.account?.password}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  account: { ...prev.account, password: e.target.value }
                }))}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="twoFactor"
                checked={settings.account?.twoFactor}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  account: { ...prev.account, twoFactor: e.target.checked }
                }))}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <Label htmlFor="twoFactor">Autenticação de dois fatores</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configurações de Privacidade */}
      <Card>
        <CardHeader>
          <CardTitle>Privacidade</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(settings.privacy || {}).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <h3 className="font-semibold capitalize">{key.replace(/([A-Z])/g, ' $1')}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {key === 'profilePublic' && 'Tornar perfil público'}
                  {key === 'showProgress' && 'Mostrar progresso nos treinos'}
                  {key === 'allowMessages' && 'Permitir mensagens de outros usuários'}
                  {key === 'showLocation' && 'Mostrar localização'}
                  {key === 'showBirthDate' && 'Mostrar data de nascimento'}
                  {key === 'showEmail' && 'Mostrar email no perfil'}
                </p>
              </div>
              <input
                type="checkbox"
                checked={value}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  privacy: { ...prev.privacy, [key]: e.target.checked }
                }))}
                className="w-5 h-5 text-blue-600 rounded"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Configurações de Notificação */}
      <Card>
        <CardHeader>
          <CardTitle>Notificações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(settings.notifications || {}).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <h3 className="font-semibold capitalize">{key.replace(/([A-Z])/g, ' $1')}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {key === 'email' && 'Receber notificações por email'}
                  {key === 'push' && 'Receber notificações push'}
                  {key === 'sms' && 'Receber notificações por SMS'}
                  {key === 'marketing' && 'Receber ofertas e promoções'}
                  {key === 'workoutReminders' && 'Lembretes de treino'}
                  {key === 'goalReminders' && 'Lembretes de metas'}
                  {key === 'achievementNotifications' && 'Notificações de conquistas'}
                </p>
              </div>
              <input
                type="checkbox"
                checked={value}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  notifications: { ...prev.notifications, [key]: e.target.checked }
                }))}
                className="w-5 h-5 text-blue-600 rounded"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Ações da Conta */}
      <Card>
        <CardHeader>
          <CardTitle>Ações da Conta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button variant="outline" onClick={handleExportData}>
              <Download className="w-4 h-4 mr-2" />
              Exportar Dados
            </Button>
            
            <Button variant="outline" className="text-orange-600 hover:text-orange-700">
              <Lock className="w-4 h-4 mr-2" />
              Alterar Senha
            </Button>
            
            <Button variant="outline" className="text-red-600 hover:text-red-700">
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir Conta
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: User },
    { id: 'activity', label: 'Atividade', icon: Activity },
    { id: 'health', label: 'Saúde', icon: Heart },
    { id: 'settings', label: 'Configurações', icon: Settings }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <TabsTrigger key={tab.id} value={tab.id} className="flex items-center space-x-2">
                  <IconComponent className="w-4 h-4" />
                  <span>{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="overview">
            {renderOverview()}
          </TabsContent>

          <TabsContent value="activity">
            {renderActivity()}
          </TabsContent>

          <TabsContent value="health">
            {renderHealth()}
          </TabsContent>

          <TabsContent value="settings">
            {renderSettings()}
          </TabsContent>
        </Tabs>

        {/* Controles Administrativos */}
        {showAdminFeatures && (
          <Card className="mt-6 border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600 flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Controles Administrativos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => handleUpdateProfile(profileData)}
                  disabled={loading}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Perfil
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleUpdateSettings(settings)}
                  disabled={loading}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Salvar Configurações
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => handleDeleteAccount()}
                  disabled={loading}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Deletar Conta
                </Button>
              </div>
              
              {/* Indicador de Tier */}
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Tier Atual:</span>
                <Badge 
                  className={`${getTierBgColor(profileData.tier)} text-white`}
                >
                  {getTierIcon(profileData.tier)} {profileData.tier}
                </Badge>
              </div>
              
              {/* Indicador de Modo de Edição */}
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Modo:</span>
                <Badge 
                  variant={editing ? "destructive" : "secondary"}
                  className={editing ? "bg-red-500" : "bg-gray-500"}
                >
                  {editing ? "Editando" : "Visualizando"}
                </Badge>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setEditing(!editing)}
                >
                  {editing ? "Sair" : "Entrar"} do Modo de Edição
                </Button>
              </div>
              
              {/* Cor do Tier */}
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Cor do Tier:</span>
                <div 
                  className="w-6 h-6 rounded-full border-2 border-gray-300"
                  style={{ backgroundColor: getTierColor(profileData.tier) }}
                ></div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};