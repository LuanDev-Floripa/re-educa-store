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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/Ui/tabs";
import {
  Settings,
  Save,
  RefreshCw,
  Globe,
  Mail,
  Truck,
  Shield,
  Users,
  Bell,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

/**
 * AdminSettingsPage
 * Configurações gerais da plataforma.
 * @returns {JSX.Element}
 */
const AdminSettingsPage = () => {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [formData, setFormData] = useState({});

  const categories = [
    { value: "general", label: "Geral", icon: Globe },
    { value: "system", label: "Sistema", icon: Settings },
    { value: "shipping", label: "Frete", icon: Truck },
    { value: "contact", label: "Contato", icon: Mail },
    { value: "social", label: "Redes Sociais", icon: Users },
    { value: "security", label: "Segurança", icon: Shield },
  ];

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await apiClient.request(() => apiClient.get("/api/admin/settings"));

      if (response?.success && response?.settings) {
        const settingsList = response.settings;
        setSettings(settingsList);

        // Inicializar formData com valores atuais
        const initialData = {};
        settingsList.forEach((setting) => {
          initialData[setting.setting_key] = setting.parsed_value ?? setting.setting_value;
        });
        setFormData(initialData);
      } else {
        setSettings([]);
      }
    } catch (error) {
      logger.error("Erro ao carregar configurações:", error);
      toast.error("Erro ao carregar configurações");
      setSettings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await apiClient.put("/api/admin/settings/bulk", formData);

      if (response?.success) {
        toast.success("Configurações salvas com sucesso!");
        if (response.errors && response.errors.length > 0) {
          toast.warning(`Alguns erros: ${response.errors.join(", ")}`);
        }
        loadSettings();
      } else {
        throw new Error(response?.error || "Erro ao salvar configurações");
      }
    } catch (error) {
      logger.error("Erro ao salvar configurações:", error);
      toast.error(error.message || "Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key, value) => {
    setFormData({ ...formData, [key]: value });
  };

  const getSettingsByCategory = (category) => {
    return settings.filter((s) => s.category === category);
  };

  const renderSettingField = (setting) => {
    const value = formData[setting.setting_key] ?? setting.parsed_value ?? setting.setting_value ?? "";

    switch (setting.setting_type) {
      case "boolean":
        return (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id={setting.setting_key}
              checked={value === true || value === "true"}
              onChange={(e) =>
                handleChange(setting.setting_key, e.target.checked)
              }
              className="rounded"
            />
            <Label htmlFor={setting.setting_key} className="cursor-pointer">
              {setting.description || setting.setting_key}
            </Label>
          </div>
        );
      case "number":
        return (
          <div className="space-y-2">
            <Label htmlFor={setting.setting_key}>
              {setting.description || setting.setting_key}
            </Label>
            <Input
              id={setting.setting_key}
              type="number"
              value={value}
              onChange={(e) =>
                handleChange(
                  setting.setting_key,
                  setting.setting_type === "number"
                    ? parseFloat(e.target.value) || 0
                    : e.target.value
                )
              }
            />
          </div>
        );
      default:
        return (
          <div className="space-y-2">
            <Label htmlFor={setting.setting_key}>
              {setting.description || setting.setting_key}
            </Label>
            <Input
              id={setting.setting_key}
              value={value}
              onChange={(e) => handleChange(setting.setting_key, e.target.value)}
              placeholder={setting.description}
            />
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando configurações...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Configurações da Plataforma
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Gerencie as configurações gerais da plataforma
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className={`h-4 w-4 mr-2 ${saving ? "animate-spin" : ""}`} />
          {saving ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const categorySettings = getSettingsByCategory(cat.value);
            return (
              <TabsTrigger
                key={cat.value}
                value={cat.value}
                className="text-xs sm:text-sm"
              >
                <Icon className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">{cat.label}</span>
                {categorySettings.length > 0 && (
                  <Badge variant="outline" className="ml-2">
                    {categorySettings.length}
                  </Badge>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {categories.map((cat) => {
          const categorySettings = getSettingsByCategory(cat.value);
          return (
            <TabsContent key={cat.value} value={cat.value} className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <cat.icon className="h-5 w-5" />
                    {cat.label}
                  </CardTitle>
                  <CardDescription>
                    {categorySettings.length} configuração(ões)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {categorySettings.length === 0 ? (
                    <div className="text-center py-16 px-4">
                      <div className="max-w-md mx-auto">
                        <div className="relative mb-6">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-primary/10 animate-pulse"></div>
                          </div>
                          <Settings className="w-16 h-16 sm:w-20 sm:h-20 text-primary mx-auto relative z-10" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3">
                          Nenhuma configuração nesta categoria
                        </h3>
                        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                          As configurações desta categoria serão exibidas aqui quando disponíveis.
                        </p>
                      </div>
                    </div>
                  ) : (
                    categorySettings.map((setting) => (
                      <div key={setting.setting_key} className="space-y-2">
                        {renderSettingField(setting)}
                        {setting.is_public && (
                          <Badge variant="outline" className="text-xs">
                            Público
                          </Badge>
                        )}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
};

export default AdminSettingsPage;
