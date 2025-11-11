import React, { useState, useEffect, useCallback } from "react";
import logger from "@/utils/logger";
import { apiService } from "@/lib/api";
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
  const [expiredCoupons, setExpiredCoupons] = useState([]);
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
  }, [loadCoupons]);

  const loadCoupons = useCallback(async () => {
    setLoading(true);
    
    try {
      // Buscar cupons disponíveis do backend
      const response = await apiService.coupons.getAvailable();
      
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
      logger.error("Erro ao carregar cupons:", error);
      toast.error("Erro ao carregar cupons. Tente novamente.");
      // Fallback para listas vazias
      setCoupons([]);
      setUserCoupons([]);
      setExpiredCoupons([]);
    } finally {
      setLoading(false);
    }
  }, []);

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
      case "flash":
        return "text-destructive";
      default:
        return "text-primary";
    }
  };

  const getCouponBgColor = (category) => {
    switch (category) {
      case "flash":
        return "bg-destructive/10";
      default:
        return "bg-primary/10";
    }
  };

  const getCouponBorderColor = (category) => {
    switch (category) {
      case "flash":
        return "border-destructive/20";
      default:
        return "border-primary/20";
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
        return "text-primary";
      case "expired":
        return "text-destructive";
      case "inactive":
        return "text-muted-foreground";
      case "limit_reached":
        return "text-primary";
      case "pending":
        return "text-primary";
      default:
        return "text-muted-foreground";
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
        className={`hover:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)] transition-shadow duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${isExpired ? "opacity-40" : ""} ${getCouponBgColor(coupon.category)}`}
      >
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
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
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className={`text-xs ${getStatusColor(status)}`}
              >
                {getStatusText(status)}
              </Badge>
              {isExpired && <Clock className="w-4 h-4 text-destructive" />}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Código do Cupom */}
          <div className="flex items-center gap-3">
            <div className="flex-1 p-3 bg-muted/50 rounded-lg font-mono text-sm border border-border/30">
              {coupon.code}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCopyCoupon(coupon.code)}
              className="gap-2"
            >
              {copiedCoupon === coupon.code ? (
                <Check className="w-4 h-4 text-primary" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Nome e Descrição */}
          <div>
            <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
              {React.createElement(getCouponIcon(coupon.type), {
                className: "w-4 h-4",
              })}
              {coupon.name}
            </h3>
            <p className="text-xs text-muted-foreground/90 leading-relaxed">
              {coupon.description}
            </p>
          </div>

          {/* Valor do Desconto */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-primary">
                {formatCouponValue(coupon)}
              </span>
              {coupon.minOrderValue > 0 && (
                <span className="text-xs text-muted-foreground/90">
                  (min. R$ {coupon.minOrderValue})
                </span>
              )}
            </div>
            {coupon.maxDiscount > 0 && (
              <span className="text-xs text-muted-foreground/90">
                máx. R$ {coupon.maxDiscount}
              </span>
            )}
          </div>

          {/* Validade */}
          <div className="text-xs text-muted-foreground/90">
            <div className="flex items-center gap-1.5">
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
              <div className="w-full bg-muted rounded-full h-1">
                <div
                  className="bg-primary h-1 rounded-full"
                  style={{
                    width: `${(coupon.usedCount / coupon.usageLimit) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
          )}

          {/* Requisitos */}
          {coupon.requirements.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-foreground">
                Requisitos:
              </div>
              <div className="space-y-1.5">
                {coupon.requirements.map((req, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 text-xs text-muted-foreground/90"
                  >
                    <Check className="w-3 h-3 text-primary" />
                    <span>{req}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Exclusões */}
          {coupon.exclusions.length > 0 && (
            <div className="space-y-1">
              <div className="text-xs font-medium text-foreground">
                Exclusões:
              </div>
              <div className="space-y-1">
                {coupon.exclusions.map((exc, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-1 text-xs text-muted-foreground"
                  >
                    <X className="w-3 h-3 text-destructive" />
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
      count: expiredCoupons.length,
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
        : expiredCoupons;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Sistema de Cupons
          </h2>
          <p className="text-muted-foreground">
            Encontre e use cupons de desconto exclusivos
          </p>
          <p className="text-sm text-muted-foreground dark:text-muted-foreground mt-1">
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
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
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
            className="px-3 py-2 border border-border rounded-md text-sm"
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
      <div className="flex space-x-1 bg-muted p-1 rounded-lg">
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" role="status" aria-label="Carregando cupons">
            <span className="sr-only">Carregando cupons...</span>
          </div>
          <p className="text-muted-foreground">
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
          <CardContent className="text-center py-16 px-4">
            <div className="relative mb-6 max-w-md mx-auto">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-primary/10 animate-pulse"></div>
              </div>
              <Tag className="w-16 h-16 text-primary mx-auto relative z-10" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-3">
              Nenhum cupom encontrado
            </h3>
            <p className="text-muted-foreground/90 leading-relaxed max-w-md mx-auto mb-6">
              {activeTab === "available"
                ? "Não há cupons disponíveis no momento. Fique de olho em nossas promoções!"
                : activeTab === "my_coupons"
                  ? "Você ainda não possui cupons pessoais. Continue comprando para ganhar descontos!"
                  : "Não há cupons expirados no momento"}
            </p>
            {activeTab === "available" && (
              <Button onClick={() => loadCoupons()} className="gap-2 shadow-md hover:shadow-lg transition-all duration-200">
                <RefreshCw className="w-4 h-4" />
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
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-foreground">
                  {coupons.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  Cupons Ativos
                </div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-foreground">
                  {coupons.reduce((sum, coupon) => sum + coupon.usedCount, 0)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total de Usos
                </div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-foreground">
                  {coupons.filter((coupon) => isCouponValid(coupon)).length}
                </div>
                <div className="text-sm text-muted-foreground">
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
