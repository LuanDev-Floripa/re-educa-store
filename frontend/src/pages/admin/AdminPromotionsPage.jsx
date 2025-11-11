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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/Ui/dialog";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Tag,
  Calendar,
  DollarSign,
  RefreshCw,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

/**
 * AdminPromotionsPage
 * Gestão completa de promoções incluindo BOGO.
 * @returns {JSX.Element}
 */
const AdminPromotionsPage = () => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "percentage",
    value: 0,
    min_quantity: 2,
    discount_percent: 100,
    valid_from: "",
    valid_until: "",
    applicable_products: [],
    max_discount: null,
    priority: 0,
  });

  useEffect(() => {
    loadPromotions();
  }, []);

  const loadPromotions = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/api/promotions/promotions");
      const promotionsList =
        response?.promotions ||
        response?.data ||
        (Array.isArray(response) ? response : []);
      setPromotions(promotionsList);
    } catch (error) {
      logger.error("Erro ao carregar promoções:", error);
      toast.error("Erro ao carregar promoções");
      setPromotions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (editingPromotion) {
        const response = await apiClient.put(
          `/api/promotions/promotions/${editingPromotion.id}`,
          formData
        );
        if (response?.success) {
          toast.success("Promoção atualizada com sucesso!");
        } else {
          throw new Error(response?.error || "Erro ao atualizar promoção");
        }
      } else {
        const response = await apiClient.post(
          "/api/promotions/promotions",
          formData
        );
        if (response?.success) {
          toast.success("Promoção criada com sucesso!");
        } else {
          throw new Error(response?.error || "Erro ao criar promoção");
        }
      }
      setShowModal(false);
      setEditingPromotion(null);
      setFormData({
        name: "",
        type: "percentage",
        value: 0,
        min_quantity: 2,
        discount_percent: 100,
        valid_from: "",
        valid_until: "",
        applicable_products: [],
        max_discount: null,
        priority: 0,
      });
      loadPromotions();
    } catch (error) {
      logger.error("Erro ao salvar promoção:", error);
      toast.error(error.message || "Erro ao salvar promoção");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Tem certeza que deseja deletar esta promoção?")) return;

    try {
      const response = await apiClient.delete(
        `/api/promotions/promotions/${id}`
      );
      if (response?.success) {
        toast.success("Promoção deletada com sucesso!");
        loadPromotions();
      } else {
        throw new Error(response?.error || "Erro ao deletar promoção");
      }
    } catch (error) {
      logger.error("Erro ao deletar promoção:", error);
      toast.error(error.message || "Erro ao deletar promoção");
    }
  };

  const filteredPromotions = promotions.filter((promo) =>
    String(promo.name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatus = (promo) => {
    const now = new Date();
    const validFrom = promo.valid_from ? new Date(promo.valid_from) : null;
    const validUntil = promo.valid_until ? new Date(promo.valid_until) : null;

    if (validFrom && now < validFrom) return { label: "Agendada", color: "default" };
    if (validUntil && now > validUntil) return { label: "Expirada", color: "destructive" };
    return { label: "Ativa", color: "default" };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando promoções...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Gestão de Promoções
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Gerencie promoções e descontos da plataforma
          </p>
        </div>
        <Button onClick={() => {
          setEditingPromotion(null);
          setFormData({
            name: "",
            type: "percentage",
            value: 0,
            min_quantity: 2,
            discount_percent: 100,
            valid_from: "",
            valid_until: "",
            applicable_products: [],
            max_discount: null,
            priority: 0,
          });
          setShowModal(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Promoção
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar promoções..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Promoções</CardTitle>
          <CardDescription>
            {filteredPromotions.length} promoção(ões) encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredPromotions.length === 0 ? (
              <div className="text-center py-16 px-4">
                <div className="relative mb-6 max-w-md mx-auto">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-24 h-24 rounded-full bg-primary/10 animate-pulse"></div>
                  </div>
                  <Tag className="h-16 w-16 text-primary mx-auto relative z-10" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  Nenhuma promoção encontrada
                </h3>
                <p className="text-muted-foreground/90 leading-relaxed max-w-md mx-auto">
                  {searchTerm || statusFilter !== "all"
                    ? "Tente ajustar os filtros de busca para encontrar promoções"
                    : "Crie promoções para atrair mais clientes e aumentar as vendas"}
                </p>
              </div>
            ) : (
              filteredPromotions.map((promo) => {
                const status = getStatus(promo);
                return (
                  <div
                    key={promo.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-medium">{promo.name}</p>
                        <Badge variant={status.color}>{status.label}</Badge>
                        <Badge variant="outline">{promo.type}</Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        {promo.type === "bogo" ? (
                          <>
                            <span>Compre {promo.min_quantity || 2}, ganhe com {promo.discount_percent || 100}% desconto</span>
                          </>
                        ) : promo.type === "percentage" ? (
                          <span>Desconto de {promo.value}%</span>
                        ) : (
                          <span>Desconto de R$ {promo.value}</span>
                        )}
                        {promo.valid_until && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Válido até {new Date(promo.valid_until).toLocaleDateString("pt-BR")}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingPromotion(promo);
                          setFormData({
                            name: promo.name || "",
                            type: promo.type || "percentage",
                            value: promo.value || 0,
                            min_quantity: promo.min_quantity || 2,
                            discount_percent: promo.discount_percent || 100,
                            valid_from: promo.valid_from || "",
                            valid_until: promo.valid_until || "",
                            applicable_products: promo.applicable_products || [],
                            max_discount: promo.max_discount || null,
                            priority: promo.priority || 0,
                          });
                          setShowModal(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(promo.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPromotion ? "Editar Promoção" : "Nova Promoção"}
            </DialogTitle>
            <DialogDescription>
              Configure os detalhes da promoção
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Promoção *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Ex: Black Friday 2025"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Tipo *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentual</SelectItem>
                  <SelectItem value="fixed">Valor Fixo</SelectItem>
                  <SelectItem value="bogo">BOGO (Buy One Get One)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.type === "bogo" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="min_quantity">Quantidade Mínima *</Label>
                  <Input
                    id="min_quantity"
                    type="number"
                    value={formData.min_quantity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        min_quantity: parseInt(e.target.value) || 2,
                      })
                    }
                    min="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discount_percent">Percentual de Desconto *</Label>
                  <Input
                    id="discount_percent"
                    type="number"
                    value={formData.discount_percent}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discount_percent: parseInt(e.target.value) || 100,
                      })
                    }
                    min="0"
                    max="100"
                  />
                  <p className="text-xs text-muted-foreground">
                    100% = grátis, 50% = metade do preço
                  </p>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="value">
                  {formData.type === "percentage" ? "Percentual (%) *" : "Valor (R$) *"}
                </Label>
                <Input
                  id="value"
                  type="number"
                  value={formData.value}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      value: parseFloat(e.target.value) || 0,
                    })
                  }
                  min="0"
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valid_from">Válido De</Label>
                <Input
                  id="valid_from"
                  type="datetime-local"
                  value={formData.valid_from}
                  onChange={(e) =>
                    setFormData({ ...formData, valid_from: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="valid_until">Válido Até *</Label>
                <Input
                  id="valid_until"
                  type="datetime-local"
                  value={formData.valid_until}
                  onChange={(e) =>
                    setFormData({ ...formData, valid_until: e.target.value })
                  }
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_discount">Desconto Máximo (R$)</Label>
              <Input
                id="max_discount"
                type="number"
                value={formData.max_discount || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    max_discount: e.target.value ? parseFloat(e.target.value) : null,
                  })
                }
                min="0"
                placeholder="Sem limite"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Prioridade</Label>
              <Input
                id="priority"
                type="number"
                value={formData.priority}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    priority: parseInt(e.target.value) || 0,
                  })
                }
                min="0"
              />
              <p className="text-xs text-muted-foreground">
                Promoções com maior prioridade são aplicadas primeiro
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPromotionsPage;
