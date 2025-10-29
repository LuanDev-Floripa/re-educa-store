import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/Ui/card';
import { Button } from '@/components/Ui/button';
import { Badge } from '@/components/Ui/badge';
import { Input } from '@/components/Ui/input';
import { Label } from '@/components/Ui/label';
import { 
  Tag, 
  Copy, 
  Check, 
  X, 
  Clock, 
  Percent, 
  DollarSign, 
  Gift, 
  ShoppingCart, 
  Star, 
  Users, 
  Calendar, 
  TrendingUp, 
  AlertTriangle, 
  Info, 
  ArrowRight, 
  Plus, 
  Minus, 
  Target, 
  Award, 
  Zap, 
  Heart, 
  Package, 
  Truck, 
  Shield, 
  Crown,
  Sparkles,
  Flame,
  Activity,
  Bookmark,
  Share2,
  Download,
  Upload,
  RefreshCw,
  Settings,
  Eye,
  Edit,
  Trash2,
  Filter,
  Search
} from 'lucide-react';

export const CouponSystem = ({ 
  userProfile = {},
  onApplyCoupon,
  onGenerateCoupon,
  onShareCoupon,
  showAdminFeatures = false
}) => {
  const [coupons, setCoupons] = useState([]);
  const [userCoupons, setUserCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('available');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [copiedCoupon, setCopiedCoupon] = useState(null);

  // Dados do usuário de exemplo
  const defaultUserProfile = {
    id: 1,
    name: 'João Silva',
    email: 'joao@email.com',
    loyaltyTier: 'gold',
    totalSpent: 2450.80,
    totalOrders: 23,
    memberSince: '2023-01-15'
  };

  const currentUserProfile = { ...defaultUserProfile, ...userProfile };

  // Dados de cupons de exemplo
  const couponData = {
    available: [
      {
        id: 1,
        code: 'WELCOME10',
        name: 'Bem-vindo',
        description: '10% de desconto na primeira compra',
        type: 'percentage',
        value: 10,
        minOrderValue: 100,
        maxDiscount: 50,
        validFrom: '2024-01-01',
        validUntil: '2024-12-31',
        usageLimit: 1000,
        usedCount: 234,
        isActive: true,
        category: 'welcome',
        icon: Gift,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        requirements: ['Primeira compra'],
        exclusions: ['Produtos em promoção'],
        applicableProducts: ['all'],
        applicableCategories: ['all']
      },
      {
        id: 2,
        code: 'FREESHIP',
        name: 'Frete Grátis',
        description: 'Frete grátis em pedidos acima de R$ 150',
        type: 'shipping',
        value: 0,
        minOrderValue: 150,
        maxDiscount: 0,
        validFrom: '2024-01-01',
        validUntil: '2024-12-31',
        usageLimit: 500,
        usedCount: 89,
        isActive: true,
        category: 'shipping',
        icon: Truck,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        requirements: ['Pedido mínimo R$ 150'],
        exclusions: ['Frete expresso'],
        applicableProducts: ['all'],
        applicableCategories: ['all']
      },
      {
        id: 3,
        code: 'SUPPLY20',
        name: 'Suplementos',
        description: '20% de desconto em suplementos',
        type: 'percentage',
        value: 20,
        minOrderValue: 200,
        maxDiscount: 100,
        validFrom: '2024-01-01',
        validUntil: '2024-06-30',
        usageLimit: 200,
        usedCount: 45,
        isActive: true,
        category: 'category',
        icon: Package,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-200',
        requirements: ['Pedido mínimo R$ 200'],
        exclusions: ['Produtos em promoção'],
        applicableProducts: ['all'],
        applicableCategories: ['Suplementos']
      },
      {
        id: 4,
        code: 'GOLD15',
        name: 'Membro Gold',
        description: '15% de desconto exclusivo para membros Gold',
        type: 'percentage',
        value: 15,
        minOrderValue: 0,
        maxDiscount: 0,
        validFrom: '2024-01-01',
        validUntil: '2024-12-31',
        usageLimit: 0,
        usedCount: 12,
        isActive: true,
        category: 'loyalty',
        icon: Crown,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        requirements: ['Membro Gold'],
        exclusions: ['Produtos em promoção'],
        applicableProducts: ['all'],
        applicableCategories: ['all']
      },
      {
        id: 5,
        code: 'FLASH50',
        name: 'Flash Sale',
        description: 'R$ 50 de desconto em pedidos acima de R$ 300',
        type: 'fixed',
        value: 50,
        minOrderValue: 300,
        maxDiscount: 50,
        validFrom: '2024-01-15',
        validUntil: '2024-01-20',
        usageLimit: 100,
        usedCount: 67,
        isActive: true,
        category: 'flash',
        icon: Zap,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        requirements: ['Pedido mínimo R$ 300'],
        exclusions: ['Produtos em promoção'],
        applicableProducts: ['all'],
        applicableCategories: ['all']
      }
    ],
    userCoupons: [
      {
        id: 6,
        code: 'PERSONAL10',
        name: 'Cupom Pessoal',
        description: '10% de desconto pessoal',
        type: 'percentage',
        value: 10,
        minOrderValue: 0,
        maxDiscount: 0,
        validFrom: '2024-01-01',
        validUntil: '2024-12-31',
        usageLimit: 1,
        usedCount: 0,
        isActive: true,
        category: 'personal',
        icon: Star,
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-50',
        borderColor: 'border-indigo-200',
        requirements: [],
        exclusions: [],
        applicableProducts: ['all'],
        applicableCategories: ['all'],
        isUsed: false,
        usedAt: null
      }
    ],
    expired: [
      {
        id: 7,
        code: 'NEWYEAR2023',
        name: 'Ano Novo 2023',
        description: '15% de desconto no Ano Novo',
        type: 'percentage',
        value: 15,
        minOrderValue: 0,
        maxDiscount: 0,
        validFrom: '2023-12-31',
        validUntil: '2024-01-05',
        usageLimit: 500,
        usedCount: 500,
        isActive: false,
        category: 'seasonal',
        icon: Calendar,
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
        requirements: [],
        exclusions: [],
        applicableProducts: ['all'],
        applicableCategories: ['all']
      }
    ]
  };

  useEffect(() => {
    loadCoupons();
  }, [loadCoupons]);

  const loadCoupons = useCallback(async () => {
    setLoading(true);
    
    // Simular carregamento de API
    setTimeout(() => {
      setCoupons(couponData.available);
      setUserCoupons(couponData.userCoupons);
      setLoading(false);
    }, 1000);
  }, [couponData.available, couponData.userCoupons]);

  const handleApplyCoupon = (coupon) => {
    if (onApplyCoupon) {
      onApplyCoupon(coupon);
    }
  };

  const handleCopyCoupon = (couponCode) => {
    navigator.clipboard.writeText(couponCode);
    setCopiedCoupon(couponCode);
    setTimeout(() => setCopiedCoupon(null), 2000);
  };

  const handleShareCoupon = (coupon) => {
    if (onShareCoupon) {
      onShareCoupon(coupon);
    }
  };

  const getCouponIcon = (type) => {
    switch (type) {
      case 'percentage': return Percent;
      case 'fixed': return DollarSign;
      case 'shipping': return Truck;
      default: return Tag;
    }
  };

  const getCouponColor = (category) => {
    switch (category) {
      case 'welcome': return 'text-green-600';
      case 'shipping': return 'text-blue-600';
      case 'category': return 'text-purple-600';
      case 'loyalty': return 'text-yellow-600';
      case 'flash': return 'text-red-600';
      case 'personal': return 'text-indigo-600';
      case 'seasonal': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const getCouponBgColor = (category) => {
    switch (category) {
      case 'welcome': return 'bg-green-50';
      case 'shipping': return 'bg-blue-50';
      case 'category': return 'bg-purple-50';
      case 'loyalty': return 'bg-yellow-50';
      case 'flash': return 'bg-red-50';
      case 'personal': return 'bg-indigo-50';
      case 'seasonal': return 'bg-gray-50';
      default: return 'bg-gray-50';
    }
  };

  const getCouponBorderColor = (category) => {
    switch (category) {
      case 'welcome': return 'border-green-200';
      case 'shipping': return 'border-blue-200';
      case 'category': return 'border-purple-200';
      case 'loyalty': return 'border-yellow-200';
      case 'flash': return 'border-red-200';
      case 'personal': return 'border-indigo-200';
      case 'seasonal': return 'border-gray-200';
      default: return 'border-gray-200';
    }
  };

  const formatCouponValue = (coupon) => {
    switch (coupon.type) {
      case 'percentage':
        return `${coupon.value}%`;
      case 'fixed':
        return `R$ ${coupon.value}`;
      case 'shipping':
        return 'Grátis';
      default:
        return coupon.value;
    }
  };

  const isCouponValid = (coupon) => {
    const now = new Date();
    const validFrom = new Date(coupon.validFrom);
    const validUntil = new Date(coupon.validUntil);
    
    return now >= validFrom && now <= validUntil && coupon.isActive;
  };

  const isCouponExpired = (coupon) => {
    const now = new Date();
    const validUntil = new Date(coupon.validUntil);
    
    return now > validUntil;
  };

  const getCouponStatus = (coupon) => {
    if (!coupon.isActive) return 'inactive';
    if (isCouponExpired(coupon)) return 'expired';
    if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) return 'limit_reached';
    if (isCouponValid(coupon)) return 'valid';
    return 'pending';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'valid': return 'text-green-600';
      case 'expired': return 'text-red-600';
      case 'inactive': return 'text-gray-600';
      case 'limit_reached': return 'text-orange-600';
      case 'pending': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'valid': return 'Válido';
      case 'expired': return 'Expirado';
      case 'inactive': return 'Inativo';
      case 'limit_reached': return 'Limite Atingido';
      case 'pending': return 'Pendente';
      default: return 'Desconhecido';
    }
  };

  const filteredCoupons = coupons.filter(coupon => {
    const matchesSearch = coupon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         coupon.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || coupon.category === filterType;
    
    return matchesSearch && matchesFilter;
  });

  const renderCouponCard = (coupon) => {
    const IconComponent = coupon.icon;
    const status = getCouponStatus(coupon);
    const isValid = status === 'valid';
    const isExpired = status === 'expired';
    
    return (
      <Card key={coupon.id} className={`hover:shadow-lg transition-shadow ${isExpired ? 'opacity-60' : ''} ${getCouponBgColor(coupon.category)}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <IconComponent className={`w-5 h-5 ${getCouponColor(coupon.category)}`} />
              <Badge variant="outline" className={getCouponBorderColor(coupon.category)}>
                {coupon.category}
              </Badge>
            </div>
            <div className="flex items-center space-x-1">
              <Badge 
                variant="secondary" 
                className={`text-xs ${getStatusColor(status)}`}
              >
                {getStatusText(status)}
              </Badge>
              {isExpired && <Clock className="w-4 h-4 text-red-500" />}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {/* Código do Cupom */}
          <div className="flex items-center space-x-2">
            <div className="flex-1 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg font-mono text-sm">
              {coupon.code}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCopyCoupon(coupon.code)}
            >
              {copiedCoupon === coupon.code ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Nome e Descrição */}
          <div>
            <h3 className="font-semibold text-sm mb-1 flex items-center">
              {React.createElement(getCouponIcon(coupon.type), { className: "w-4 h-4 mr-2" })}
              {coupon.name}
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {coupon.description}
            </p>
          </div>

          {/* Valor do Desconto */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold text-green-600">
                {formatCouponValue(coupon)}
              </span>
              {coupon.minOrderValue > 0 && (
                <span className="text-xs text-gray-500">
                  (min. R$ {coupon.minOrderValue})
                </span>
              )}
            </div>
            {coupon.maxDiscount > 0 && (
              <span className="text-xs text-gray-500">
                máx. R$ {coupon.maxDiscount}
              </span>
            )}
          </div>

          {/* Validade */}
          <div className="text-xs text-gray-600 dark:text-gray-400">
            <div className="flex items-center space-x-1">
              <Calendar className="w-3 h-3" />
              <span>
                Válido até {new Date(coupon.validUntil).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Uso */}
          {coupon.usageLimit > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Uso</span>
                <span>{coupon.usedCount}/{coupon.usageLimit}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1">
                <div 
                  className="bg-blue-600 h-1 rounded-full" 
                  style={{ width: `${(coupon.usedCount / coupon.usageLimit) * 100}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Requisitos */}
          {coupon.requirements.length > 0 && (
            <div className="space-y-1">
              <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Requisitos:
              </div>
              <div className="space-y-1">
                {coupon.requirements.map((req, index) => (
                  <div key={index} className="flex items-center space-x-1 text-xs text-gray-600 dark:text-gray-400">
                    <Check className="w-3 h-3 text-green-600" />
                    <span>{req}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Exclusões */}
          {coupon.exclusions.length > 0 && (
            <div className="space-y-1">
              <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Exclusões:
              </div>
              <div className="space-y-1">
                {coupon.exclusions.map((exc, index) => (
                  <div key={index} className="flex items-center space-x-1 text-xs text-gray-600 dark:text-gray-400">
                    <X className="w-3 h-3 text-red-600" />
                    <span>{exc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ações */}
          <div className="flex space-x-2 pt-2">
            <Button
              size="sm"
              className="flex-1"
              disabled={!isValid}
              onClick={() => handleApplyCoupon(coupon)}
            >
              <ShoppingCart className="w-3 h-3 mr-1" />
              Aplicar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleShareCoupon(coupon)}
            >
              <Share2 className="w-3 h-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const tabs = [
    { id: 'available', label: 'Disponíveis', icon: Tag, count: coupons.length },
    { id: 'my_coupons', label: 'Meus Cupons', icon: Star, count: userCoupons.length },
    { id: 'expired', label: 'Expirados', icon: Clock, count: couponData.expired.length }
  ];

  const categories = [
    { id: 'all', label: 'Todos' },
    { id: 'welcome', label: 'Bem-vindo' },
    { id: 'shipping', label: 'Frete' },
    { id: 'category', label: 'Categoria' },
    { id: 'loyalty', label: 'Fidelidade' },
    { id: 'flash', label: 'Flash Sale' },
    { id: 'personal', label: 'Pessoal' }
  ];

  const currentCoupons = activeTab === 'available' ? filteredCoupons : 
                        activeTab === 'my_coupons' ? userCoupons : 
                        couponData.expired;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Sistema de Cupons
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Encontre e use cupons de desconto exclusivos
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
            Bem-vindo, {currentUserProfile.name} • Membro desde {new Date(currentUserProfile.memberSince).toLocaleDateString('pt-BR')}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary">
            {coupons.length} cupons disponíveis
          </Badge>
          {showAdminFeatures && (
            <Button onClick={() => onGenerateCoupon && onGenerateCoupon()}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Cupom
            </Button>
          )}
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar cupons..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex space-x-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </select>
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <IconComponent className="w-4 h-4" />
              <span>{tab.label}</span>
              <Badge variant="secondary" className="text-xs">
                {tab.count}
              </Badge>
            </button>
          );
        })}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Carregando cupons...
          </p>
        </div>
      )}

      {/* Coupons Grid */}
      {!loading && currentCoupons.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentCoupons.map(renderCouponCard)}
        </div>
      )}

      {/* Empty State */}
      {!loading && currentCoupons.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Tag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Nenhum cupom encontrado
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {activeTab === 'available' ? 'Não há cupons disponíveis no momento' :
               activeTab === 'my_coupons' ? 'Você não possui cupons pessoais' :
               'Não há cupons expirados'}
            </p>
            {activeTab === 'available' && (
              <Button>
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Estatísticas */}
      {!loading && activeTab === 'available' && (
        <Card>
          <CardHeader>
            <CardTitle>Estatísticas dos Cupons</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {coupons.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Cupons Ativos
                </div>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {coupons.reduce((sum, coupon) => sum + coupon.usedCount, 0)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Total de Usos
                </div>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {coupons.filter(coupon => isCouponValid(coupon)).length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Válidos Agora
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};