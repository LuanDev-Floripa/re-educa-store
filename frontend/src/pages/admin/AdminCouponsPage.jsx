import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/Ui/card';
import { Button } from '@/components/Ui/button';
import { Badge } from '@/components/Ui/badge';
import { Input } from '@/components/Ui/input';
import { Label } from '@/components/Ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/Ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/Ui/tabs';
import apiClient from '@/services/apiClient';
import { toast } from 'sonner';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  Tag,
  Percent,
  DollarSign,
  Calendar,
  Users,
  TrendingUp,
  Copy,
  CheckCircle,
  XCircle,
  AlertCircle,
  MoreHorizontal,
  Download,
  Upload
} from 'lucide-react';

const AdminCouponsPage = () => {
  const [coupons, setCoupons] = useState([]);
  const [filteredCoupons, setFilteredCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedSort, setSelectedSort] = useState('created');
  const [activeTab, setActiveTab] = useState('list');
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Dados de exemplo removidos - usando API real acima no useEffect
  const couponsDataFallback = [
    {
      id: 1,
      code: "BEMVINDO10",
      name: "Desconto de Boas-vindas",
      description: "10% de desconto para novos usuários",
      type: "percentage",
      value: 10.0,
      minOrderValue: 50.0,
      maxDiscount: 20.0,
      usageLimit: 100,
      usageCount: 45,
      userLimit: 1,
      validFrom: "2024-01-01",
      validUntil: "2024-12-31",
      active: true,
      createdAt: "2024-01-01",
      updatedAt: "2024-01-15"
    },
    {
      id: 2,
      code: "FRETE15",
      name: "Frete Grátis",
      description: "Frete grátis para pedidos acima de R$ 100",
      type: "fixed",
      value: 15.0,
      minOrderValue: 100.0,
      maxDiscount: null,
      usageLimit: 50,
      usageCount: 23,
      userLimit: 1,
      validFrom: "2024-01-01",
      validUntil: "2024-06-30",
      active: true,
      createdAt: "2024-01-01",
      updatedAt: "2024-01-10"
    },
    {
      id: 3,
      code: "BLACKFRIDAY50",
      name: "Black Friday",
      description: "50% de desconto na Black Friday",
      type: "percentage",
      value: 50.0,
      minOrderValue: 200.0,
      maxDiscount: 100.0,
      usageLimit: 200,
      usageCount: 200,
      userLimit: 1,
      validFrom: "2024-11-25",
      validUntil: "2024-11-30",
      active: false,
      createdAt: "2024-11-20",
      updatedAt: "2024-12-01"
    },
    {
      id: 4,
      code: "VIP20",
      name: "Desconto VIP",
      description: "20% de desconto para clientes VIP",
      type: "percentage",
      value: 20.0,
      minOrderValue: 0.0,
      maxDiscount: 50.0,
      usageLimit: null,
      usageCount: 156,
      userLimit: 5,
      validFrom: "2024-01-01",
      validUntil: "2024-12-31",
      active: true,
      createdAt: "2024-01-01",
      updatedAt: "2024-01-20"
    },
    {
      id: 5,
      code: "PRIMEIRA10",
      name: "Primeira Compra",
      description: "R$ 10 de desconto na primeira compra",
      type: "fixed",
      value: 10.0,
      minOrderValue: 30.0,
      maxDiscount: null,
      usageLimit: 500,
      usageCount: 234,
      userLimit: 1,
      validFrom: "2024-01-01",
      validUntil: "2024-12-31",
      active: true,
      createdAt: "2024-01-01",
      updatedAt: "2024-01-18"
    }
  ];

  const types = [
    { value: 'all', label: 'Todos os Tipos' },
    { value: 'percentage', label: 'Percentual' },
    { value: 'fixed', label: 'Valor Fixo' }
  ];

  const statuses = [
    { value: 'all', label: 'Todos os Status' },
    { value: 'active', label: 'Ativo' },
    { value: 'inactive', label: 'Inativo' },
    { value: 'expired', label: 'Expirado' },
    { value: 'exhausted', label: 'Esgotado' }
  ];

  const sortOptions = [
    { value: 'created', label: 'Data de Criação' },
    { value: 'name', label: 'Nome' },
    { value: 'code', label: 'Código' },
    { value: 'usage', label: 'Uso' },
    { value: 'value', label: 'Valor' },
    { value: 'expires', label: 'Expiração' }
  ];

  useEffect(() => {
    const loadCoupons = async () => {
      try {
        setLoading(true);
        const response = await apiClient.getCoupons();
        
        if (response.coupons || response.data || Array.isArray(response)) {
          const couponsList = response.coupons || response.data || response;
          setCoupons(couponsList);
          setFilteredCoupons(couponsList);
        } else {
          setCoupons([]);
          setFilteredCoupons([]);
        }
      } catch (err) {
        console.error('Erro ao carregar cupons:', err);
        toast.error('Erro ao carregar cupons');
        setCoupons([]);
        setFilteredCoupons([]);
      } finally {
        setLoading(false);
      }
    };

    loadCoupons();
  }, []);

  useEffect(() => {
    filterCoupons();
  }, [searchTerm, selectedType, selectedStatus, selectedSort, coupons]);

  const filterCoupons = () => {
    let filtered = coupons;

    // Filtro por busca
    if (searchTerm) {
      filtered = filtered.filter(coupon =>
        coupon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        coupon.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por tipo
    if (selectedType !== 'all') {
      filtered = filtered.filter(coupon => coupon.type === selectedType);
    }

    // Filtro por status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(coupon => {
        const now = new Date();
        const validUntil = new Date(coupon.validUntil);
        
        if (selectedStatus === 'active') {
          return coupon.active && validUntil > now && (coupon.usageLimit === null || coupon.usageCount < coupon.usageLimit);
        } else if (selectedStatus === 'inactive') {
          return !coupon.active;
        } else if (selectedStatus === 'expired') {
          return validUntil <= now;
        } else if (selectedStatus === 'exhausted') {
          return coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit;
        }
        return true;
      });
    }

    // Ordenação
    filtered.sort((a, b) => {
      switch (selectedSort) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'code':
          return a.code.localeCompare(b.code);
        case 'usage':
          return b.usageCount - a.usageCount;
        case 'value':
          return b.value - a.value;
        case 'expires':
          return new Date(a.validUntil) - new Date(b.validUntil);
        case 'created':
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

    setFilteredCoupons(filtered);
  };

  const getStatusColor = (coupon) => {
    const now = new Date();
    const validUntil = new Date(coupon.validUntil);
    
    if (!coupon.active) {
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    } else if (validUntil <= now) {
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    } else if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    } else {
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    }
  };

  const getStatusLabel = (coupon) => {
    const now = new Date();
    const validUntil = new Date(coupon.validUntil);
    
    if (!coupon.active) {
      return 'Inativo';
    } else if (validUntil <= now) {
      return 'Expirado';
    } else if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
      return 'Esgotado';
    } else {
      return 'Ativo';
    }
  };

  const getStatusIcon = (coupon) => {
    const now = new Date();
    const validUntil = new Date(coupon.validUntil);
    
    if (!coupon.active) {
      return <XCircle className="w-4 h-4" />;
    } else if (validUntil <= now) {
      return <AlertCircle className="w-4 h-4" />;
    } else if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
      return <AlertCircle className="w-4 h-4" />;
    } else {
      return <CheckCircle className="w-4 h-4" />;
    }
  };

  const handleEditCoupon = (coupon) => {
    setSelectedCoupon(coupon);
    setShowEditModal(true);
  };

  const handleDeleteCoupon = (couponId) => {
    if (window.confirm('Tem certeza que deseja excluir este cupom?')) {
      setCoupons(prev => prev.filter(c => c.id !== couponId));
    }
  };

  const handleToggleStatus = (couponId) => {
    setCoupons(prev => prev.map(c => 
      c.id === couponId 
        ? { ...c, active: !c.active }
        : c
    ));
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    // Aqui você pode adicionar uma notificação de sucesso
  };

  const getStats = () => {
    const totalCoupons = coupons.length;
    const activeCoupons = coupons.filter(c => c.active).length;
    const expiredCoupons = coupons.filter(c => new Date(c.validUntil) <= new Date()).length;
    const exhaustedCoupons = coupons.filter(c => c.usageLimit !== null && c.usageCount >= c.usageLimit).length;
    const totalUsage = coupons.reduce((sum, c) => sum + c.usageCount, 0);
    const totalDiscount = coupons.reduce((sum, c) => sum + (c.usageCount * c.value), 0);

    return {
      total: totalCoupons,
      active: activeCoupons,
      expired: expiredCoupons,
      exhausted: exhaustedCoupons,
      totalUsage,
      totalDiscount
    };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
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
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Tag className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Gerenciamento de Cupons
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Gerencie cupons de desconto e promoções
              </p>
            </div>
          </div>
          <Button 
            onClick={() => setShowAddModal(true)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Criar Cupom
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.total}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Ativos</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Expirados</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.exhausted}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Esgotados</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.totalUsage}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Usos</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-emerald-600">R$ {stats.totalDiscount.toLocaleString()}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Desconto Total</div>
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
                placeholder="Buscar cupons..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                {types.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statuses.map(status => (
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
                {sortOptions.map(option => (
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
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list" className="flex items-center space-x-2">
            <Tag className="w-4 h-4" />
            <span>Lista de Cupons</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4" />
            <span>Analytics</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCoupons.map((coupon) => (
              <Card key={coupon.id} className="group hover:shadow-lg transition-all duration-300">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge className={`${getStatusColor(coupon)}`}>
                        {getStatusIcon(coupon)}
                        <span className="ml-1">{getStatusLabel(coupon)}</span>
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyCode(coupon.code)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <CardTitle className="text-lg">{coupon.name}</CardTitle>
                  <CardDescription>{coupon.description}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600 mb-1">
                        {coupon.code}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Código do Cupom
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Tipo:</span>
                      <div className="flex items-center space-x-1">
                        {coupon.type === 'percentage' ? (
                          <Percent className="w-4 h-4 text-blue-500" />
                        ) : (
                          <DollarSign className="w-4 h-4 text-green-500" />
                        )}
                        <span className="font-semibold">
                          {coupon.type === 'percentage' ? `${coupon.value}%` : `R$ ${coupon.value.toFixed(2)}`}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Valor Mínimo:</span>
                      <span className="font-semibold">R$ {coupon.minOrderValue.toFixed(2)}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Uso:</span>
                      <span className="font-semibold">
                        {coupon.usageCount}/{coupon.usageLimit || '∞'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Expira:</span>
                      <span className="font-semibold">
                        {new Date(coupon.validUntil).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      onClick={() => handleEditCoupon(coupon)}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                    
                    <Button
                      onClick={() => handleToggleStatus(coupon.id)}
                      variant="outline"
                      size="sm"
                      className={coupon.active ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}
                    >
                      {coupon.active ? (
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
                      onClick={() => handleDeleteCoupon(coupon.id)}
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

          {filteredCoupons.length === 0 && (
            <div className="text-center py-12">
              <Tag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Nenhum cupom encontrado
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Tente ajustar os filtros para encontrar mais cupons
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Cupons Mais Usados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {coupons
                    .sort((a, b) => b.usageCount - a.usageCount)
                    .slice(0, 5)
                    .map((coupon, index) => (
                      <div key={coupon.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                            <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                              {index + 1}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-medium">{coupon.name}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {coupon.code}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{coupon.usageCount} usos</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {coupon.type === 'percentage' ? `${coupon.value}%` : `R$ ${coupon.value.toFixed(2)}`}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status dos Cupons</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span>Cupons Ativos</span>
                    </div>
                    <span className="font-semibold">{stats.active}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-5 h-5 text-red-500" />
                      <span>Expirados</span>
                    </div>
                    <span className="font-semibold">{stats.expired}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-5 h-5 text-orange-500" />
                      <span>Esgotados</span>
                    </div>
                    <span className="font-semibold">{stats.exhausted}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <XCircle className="w-5 h-5 text-gray-500" />
                      <span>Inativos</span>
                    </div>
                    <span className="font-semibold">
                      {coupons.filter(c => !c.active).length}
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

export default AdminCouponsPage;