import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logger from "@/utils/logger";
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
  Upload,
} from "lucide-react";

/**
 * AdminCouponsPage
 * Gestão de cupons com filtros, normalização de dados e fallbacks de API.
 * @returns {JSX.Element}
 */
const AdminCouponsPage = () => {
  const navigate = useNavigate();
  const [coupons, setCoupons] = useState([]);
  const [filteredCoupons, setFilteredCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedSort, setSelectedSort] = useState("created");
  const [activeTab, setActiveTab] = useState("list");
  const [, setSelectedCoupon] = useState(null);
  const [, setShowAddModal] = useState(false);
  const [, setShowEditModal] = useState(false);

  const types = [
    { value: "all", label: "Todos os Tipos" },
    { value: "percentage", label: "Percentual" },
    { value: "fixed", label: "Valor Fixo" },
  ];

  const statuses = [
    { value: "all", label: "Todos os Status" },
    { value: "active", label: "Ativo" },
    { value: "inactive", label: "Inativo" },
    { value: "expired", label: "Expirado" },
    { value: "exhausted", label: "Esgotado" },
  ];

  const sortOptions = [
    { value: "created", label: "Data de Criação" },
    { value: "name", label: "Nome" },
    { value: "code", label: "Código" },
    { value: "usage", label: "Uso" },
    { value: "value", label: "Valor" },
    { value: "expires", label: "Expiração" },
  ];

  useEffect(() => {
    const loadCoupons = async () => {
      try {
        setLoading(true);
        const response = await apiService.coupons.getAll();

        if (Array.isArray(response?.coupons) || Array.isArray(response?.data) || Array.isArray(response)) {
          const couponsList = (Array.isArray(response?.coupons)
            ? response.coupons
            : Array.isArray(response?.data)
              ? response.data
              : Array.isArray(response)
                ? response
                : [])
            .map((c) => ({
              ...c,
              name: c?.name || "Cupom",
              code: c?.code || "",
              description: c?.description || "",
              type: c?.type === "percentage" || c?.type === "fixed" ? c.type : "percentage",
              value: Number(c?.value) || 0,
              minOrderValue: Number(c?.minOrderValue ?? 0) || 0,
              maxDiscount: c?.maxDiscount == null ? null : Number(c.maxDiscount) || 0,
              usageLimit: c?.usageLimit == null ? null : Number(c.usageLimit) || 0,
              usageCount: Number(c?.usageCount) || 0,
              active: Boolean(c?.active),
              validUntil: c?.validUntil || c?.valid_until || new Date().toISOString(),
              createdAt: c?.createdAt || c?.created_at || new Date().toISOString(),
            }));
          setCoupons(couponsList);
          setFilteredCoupons(couponsList);
        } else {
          setCoupons([]);
          setFilteredCoupons([]);
        }
      } catch (err) {
        logger.error("Erro ao carregar cupons:", err);
        toast.error("Erro ao carregar cupons");
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
      filtered = filtered.filter(
        (coupon) =>
          (coupon.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (coupon.code || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (coupon.description || "").toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // Filtro por tipo
    if (selectedType !== "all") {
      filtered = filtered.filter((coupon) => coupon.type === selectedType);
    }

    // Filtro por status
    if (selectedStatus !== "all") {
      filtered = filtered.filter((coupon) => {
        const now = new Date();
        const validUntil = new Date(coupon.validUntil);

        if (selectedStatus === "active") {
          return (
            coupon.active &&
            validUntil > now &&
            (coupon.usageLimit === null ||
              coupon.usageCount < coupon.usageLimit)
          );
        } else if (selectedStatus === "inactive") {
          return !coupon.active;
        } else if (selectedStatus === "expired") {
          return validUntil <= now;
        } else if (selectedStatus === "exhausted") {
          return (
            coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit
          );
        }
        return true;
      });
    }

    // Ordenação
    filtered.sort((a, b) => {
      switch (selectedSort) {
        case "name":
          return (a.name || "").localeCompare(b.name || "");
        case "code":
          return (a.code || "").localeCompare(b.code || "");
        case "usage":
          return Number(b.usageCount) - Number(a.usageCount);
        case "value":
          return Number(b.value) - Number(a.value);
        case "expires":
          return new Date(a.validUntil) - new Date(b.validUntil);
        case "created":
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
      return "bg-muted text-foreground";
    } else if (validUntil <= now) {
      return "bg-destructive/10 text-destructive";
    } else if (
      coupon.usageLimit !== null &&
      coupon.usageCount >= coupon.usageLimit
    ) {
      return "bg-primary/10 text-primary";
    } else {
      return "bg-primary/10 text-primary";
    }
  };

  const getStatusLabel = (coupon) => {
    const now = new Date();
    const validUntil = new Date(coupon.validUntil);

    if (!coupon.active) {
      return "Inativo";
    } else if (validUntil <= now) {
      return "Expirado";
    } else if (
      coupon.usageLimit !== null &&
      coupon.usageCount >= coupon.usageLimit
    ) {
      return "Esgotado";
    } else {
      return "Ativo";
    }
  };

  const getStatusIcon = (coupon) => {
    const now = new Date();
    const validUntil = new Date(coupon.validUntil);

    if (!coupon.active) {
      return <XCircle className="w-4 h-4" />;
    } else if (validUntil <= now) {
      return <AlertCircle className="w-4 h-4" />;
    } else if (
      coupon.usageLimit !== null &&
      coupon.usageCount >= coupon.usageLimit
    ) {
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
    if (window.confirm("Tem certeza que deseja excluir este cupom?")) {
      setCoupons((prev) => prev.filter((c) => c.id !== couponId));
    }
  };

  const handleToggleStatus = (couponId) => {
    setCoupons((prev) =>
      prev.map((c) => (c.id === couponId ? { ...c, active: !c.active } : c)),
    );
  };

  const handleCopyCode = async (code) => {
    try {
      await navigator?.clipboard?.writeText(String(code || ""));
      toast.success("Código copiado");
    } catch {
      toast.error("Falha ao copiar código");
    }
  };

  const getStats = () => {
    const totalCoupons = coupons.length;
    const activeCoupons = coupons.filter((c) => c.active).length;
    const expiredCoupons = coupons.filter(
      (c) => new Date(c.validUntil) <= new Date(),
    ).length;
    const exhaustedCoupons = coupons.filter(
      (c) => c.usageLimit !== null && c.usageCount >= c.usageLimit,
    ).length;
    const totalUsage = coupons.reduce((sum, c) => sum + c.usageCount, 0);
    const totalDiscount = coupons.reduce(
      (sum, c) => sum + c.usageCount * c.value,
      0,
    );

    return {
      total: totalCoupons,
      active: activeCoupons,
      expired: expiredCoupons,
      exhausted: exhaustedCoupons,
      totalUsage,
      totalDiscount,
    };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-6">
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
                <div className="h-8 bg-muted rounded"></div>
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
            <div className="p-2 bg-primary/10 rounded-lg">
              <Tag className="w-6 h-6 text-primary text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Gerenciamento de Cupons
              </h1>
              <p className="text-muted-foreground/90 leading-relaxed">
                Gerencie cupons de desconto e promoções
              </p>
            </div>
          </div>
          <Button
            onClick={() => setShowAddModal(true)}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Criar Cupom
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">
                {stats.total}
              </div>
              <div className="text-sm text-muted-foreground/90">
                Total
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">
                {stats.active}
              </div>
              <div className="text-sm text-muted-foreground/90">
                Ativos
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-destructive">
                {stats.expired}
              </div>
              <div className="text-sm text-muted-foreground/90">
                Expirados
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">
                {stats.exhausted}
              </div>
              <div className="text-sm text-muted-foreground/90">
                Esgotados
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">
                {stats.totalUsage}
              </div>
              <div className="text-sm text-muted-foreground/90">
                Usos
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">
                R$ {stats.totalDiscount.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground/90">
                Desconto Total
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
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground/80 w-4 h-4" />
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
                {types.map((type) => (
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
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list" className="flex items-center space-x-2">
            <Tag className="w-4 h-4" />
            <span>Lista de Cupons</span>
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="flex items-center gap-2.5"
          >
            <TrendingUp className="w-4 h-4" />
            <span>Analytics</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCoupons.map((coupon) => (
              <Card
                key={coupon.id}
                className="group hover:shadow-lg transition-all duration-300"
              >
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
                  <div className="bg-muted p-3 rounded-lg">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary mb-1">
                        {coupon.code}
                      </div>
                      <div className="text-sm text-muted-foreground/90">
                        Código do Cupom
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground/90">
                        Tipo:
                      </span>
                      <div className="flex items-center gap-1.5">
                        {coupon.type === "percentage" ? (
                          <Percent className="w-4 h-4 text-primary" />
                        ) : (
                          <DollarSign className="w-4 h-4 text-primary" />
                        )}
                        <span className="font-semibold">
                          {coupon.type === "percentage"
                            ? `${coupon.value}%`
                            : `R$ ${coupon.value.toFixed(2)}`}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground/90">
                        Valor Mínimo:
                      </span>
                      <span className="font-semibold">
                        R$ {coupon.minOrderValue.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground/90">
                        Uso:
                      </span>
                      <span className="font-semibold">
                        {coupon.usageCount}/{coupon.usageLimit || "∞"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground/90">
                        Expira:
                      </span>
                      <span className="font-semibold">
                        {new Date(coupon.validUntil).toLocaleDateString(
                          "pt-BR",
                        )}
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
                      className={
                        coupon.active
                          ? "text-destructive hover:text-destructive/80"
                          : "text-primary hover:text-primary/80"
                      }
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
                      className="text-destructive hover:text-destructive/80"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredCoupons.length === 0 && (
            <div className="text-center py-16 px-4">
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
                {searchTerm || typeFilter !== "all" || statusFilter !== "all"
                  ? "Tente ajustar os filtros de busca para encontrar cupons"
                  : "Crie cupons de desconto para atrair mais clientes e aumentar as vendas"}
              </p>
              {(!searchTerm && typeFilter === "all" && statusFilter === "all") && (
                <Button onClick={() => navigate("/admin/coupons")} className="gap-2 shadow-md hover:shadow-lg transition-all duration-200">
                  <Plus className="w-4 h-4" />
                  Criar Cupom
                </Button>
              )}
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
                      <div
                        key={coupon.id}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-sm font-semibold text-primary text-primary">
                              {index + 1}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-medium">{coupon.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {coupon.code}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">
                            {coupon.usageCount} usos
                          </div>
                          <div className="text-sm text-muted-foreground/90">
                            {coupon.type === "percentage"
                              ? `${coupon.value}%`
                              : `R$ ${coupon.value.toFixed(2)}`}
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
                      <CheckCircle className="w-5 h-5 text-primary" />
                      <span>Cupons Ativos</span>
                    </div>
                    <span className="font-semibold">{stats.active}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-5 h-5 text-destructive" />
                      <span>Expirados</span>
                    </div>
                    <span className="font-semibold">{stats.expired}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-5 h-5 text-primary" />
                      <span>Esgotados</span>
                    </div>
                    <span className="font-semibold">{stats.exhausted}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <XCircle className="w-5 h-5 text-muted-foreground" />
                      <span>Inativos</span>
                    </div>
                    <span className="font-semibold">
                      {coupons.filter((c) => !c.active).length}
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
/TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminCouponsPage;
