import React, { useState, useEffect, useCallback } from "react";
import { useApi, apiService } from "../../lib/api";
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
  Search,
} from "lucide-react";

export const CouponSystem = ({
  userProfile = {},
  onApplyCoupon,
  onGenerateCoupon,
  onShareCoupon,
  showAdminFeatures = false,
}) => {
  const [coupons, setCoupons] = useState([]);
  const [userCoupons, setUserCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("available");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [copiedCoupon, setCopiedCoupon] = useState(null);

  // Dados do usuário de exemplo
  const defaultUserProfile = {
    id: 1,
    name: "João Silva",
    email: "joao@email.com",
    loyaltyTier: "gold",
    totalSpent: 2450.8,
    totalOrders: 23,
    memberSince: "2023-01-15",
  };

  const currentUserProfile = { ...defaultUserProfile, ...userProfile };

  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = useCallback(async () => {
    setLoading(true);
    
    try {
      // Buscar cupons disponíveis do backend
      const response = await request(() =>
        apiService.request('/coupons/available')
      );
      
      if (response.success) {
        setCoupons(response.available || []);
        setUserCoupons(response.userCoupons || []);
        setExpiredCoupons(response.expired || []);
      } else {
        toast.error("Erro ao carregar cupons");
        // Fallback para listas vazias
        setCoupons([]);
        setUserCoupons([]);
        setExpiredCoupons([]);
      }
    } catch (error) {
      console.error("Erro ao carregar cupons:", error);
      toast.error("Erro ao carregar cupons. Tente novamente.");
      // Fallback para listas vazias
      setCoupons([]);
      setUserCoupons([]);
      setExpiredCoupons([]);
    } finally {
      setLoading(false);
    }
  }, [request]);

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
      case "percentage":
        return Percent;
      case "fixed":
        return DollarSign;
      case "shipping":
        return Truck;
      default:
        return Tag;
    }
  };

  const getCouponColor = (category) => {
    switch (category) {
      case "welcome":
        return "text-green-600";
      case "shipping":
        return "text-blue-600";
      case "category":
        return "text-purple-600";
      case "loyalty":
        return "text-yellow-600";
      case "flash":
        return "text-red-600";
      case "personal":
        return "text-indigo-600";
      case "seasonal":
        return "text-gray-600";
      default:
        return "text-gray-600";
    }
  };

  const getCouponBgColor = (category) => {
    switch (category) {
      case "welcome":
        return "bg-green-50";
      case "shipping":
        return "bg-blue-50";
      case "category":
        return "bg-purple-50";
      case "loyalty":
        return "bg-yellow-50";
      case "flash":
        return "bg-red-50";
      case "personal":
        return "bg-indigo-50";
      case "seasonal":
        return "bg-gray-50";
      default:
        return "bg-gray-50";
    }
  };

  const getCouponBorderColor = (category) => {
    switch (category) {
      case "welcome":
        return "border-green-200";
      case "shipping":
        return "border-blue-200";
      case "category":
        return "border-purple-200";
      case "loyalty":
        return "border-yellow-200";
      case "flash":
        return "border-red-200";
      case "personal":
        return "border-indigo-200";
      case "seasonal":
        return "border-gray-200";
      default:
        return "border-gray-200";
    }
  };

  const formatCouponValue = (coupon) => {
    switch (coupon.type) {
      case "percentage":
        return `${coupon.value}%`;
      case "fixed":
        return `R$ ${coupon.value}`;
      case "shipping":
        return "Grátis";
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
    if (!coupon.isActive) return "inactive";
    if (isCouponExpired(coupon)) return "expired";
    if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit)
      return "limit_reached";
    if (isCouponValid(coupon)) return "valid";
    return "pending";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "valid":
        return "text-green-600";
      case "expired":
        return "text-red-600";
      case "inactive":
        return "text-gray-600";
      case "limit_reached":
        return "text-orange-600";
      case "pending":
        return "text-yellow-600";
      default:
        return "text-gray-600";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "valid":
        return "Válido";
      case "expired":
        return "Expirado";
      case "inactive":
        return "Inativo";
      case "limit_reached":
        return "Limite Atingido";
      case "pending":
        return "Pendente";
      default:
        return "Desconhecido";
    }
  };

  const filteredCoupons = coupons.filter((coupon) => {
    const matchesSearch =
      coupon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coupon.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterType === "all" || coupon.category === filterType;

    return matchesSearch && matchesFilter;
  });

  const renderCouponCard = (coupon) => {
    const IconComponent = coupon.icon;
    const status = getCouponStatus(coupon);
    const isValid = status === "valid";
    const isExpired = status === "expired";

    return (
      <Card
        key={coupon.id}
        className={`hover:shadow-lg transition-shadow ${isExpired ? "opacity-60" : ""} ${getCouponBgColor(coupon.category)}`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <IconComponent
                className={`w-5 h-5 ${getCouponColor(coupon.category)}`}
              />
              <Badge
                variant="outline"
                className={getCouponBorderColor(coupon.category)}
              >
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
              {React.createElement(getCouponIcon(coupon.type), {
                className: "w-4 h-4 mr-2",
              })}
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
                <span>
                  {coupon.usedCount}/{coupon.usageLimit}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1">
                <div
                  className="bg-blue-600 h-1 rounded-full"
                  style={{
                    width: `${(coupon.usedCount / coupon.usageLimit) * 100}%`,
                  }}
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
                  <div
                    key={index}
                    className="flex items-center space-x-1 text-xs text-gray-600 dark:text-gray-400"
                  >
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
                  <div
                    key={index}
                    className="flex items-center space-x-1 text-xs text-gray-600 dark:text-gray-400"
                  >
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
    { id: "available", label: "Disponíveis", icon: Tag, count: coupons.length },
    {
      id: "my_coupons",
      label: "Meus Cupons",
      icon: Star,
      count: userCoupons.length,
    },
    {
      id: "expired",
      label: "Expirados",
      icon: Clock,
      count: couponData.expired.length,
    },
  ];

  const categories = [
    { id: "all", label: "Todos" },
    { id: "welcome", label: "Bem-vindo" },
    { id: "shipping", label: "Frete" },
    { id: "category", label: "Categoria" },
    { id: "loyalty", label: "Fidelidade" },
    { id: "flash", label: "Flash Sale" },
    { id: "personal", label: "Pessoal" },
  ];

  const currentCoupons =
    activeTab === "available"
      ? filteredCoupons
      : activeTab === "my_coupons"
        ? userCoupons
        : couponData.expired;

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
            Bem-vindo, {currentUserProfile.name} • Membro desde{" "}
            {new Date(currentUserProfile.memberSince).toLocaleDateString(
              "pt-BR",
            )}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary">{coupons.length} cupons disponíveis</Badge>
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
            {categories.map((category) => (
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
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
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
              {activeTab === "available"
                ? "Não há cupons disponíveis no momento"
                : activeTab === "my_coupons"
                  ? "Você não possui cupons pessoais"
                  : "Não há cupons expirados"}
            </p>
            {activeTab === "available" && (
              <Button>
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Estatísticas */}
      {!loading && activeTab === "available" && (
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
                  {coupons.filter((coupon) => isCouponValid(coupon)).length}
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
