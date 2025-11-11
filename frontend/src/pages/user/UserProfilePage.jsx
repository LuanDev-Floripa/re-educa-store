import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/Ui/card";
import { Button } from "@/components/Ui/button";
import { Input } from "@/components/Ui/input";
import { Label } from "@/components/Ui/label";
import { H1, H3 } from "@/components/Ui/typography";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/Ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/Ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/Ui/tabs";
import logger from "@/utils/logger";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit3,
  Save,
  X,
  Camera,
  Shield,
  Bell,
  Globe,
  Users,
  ExternalLink,
  MessageCircle,
  Heart,
  BarChart3,
  Activity,
  Ruler,
  Weight,
  Cake,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth.jsx";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { apiService } from "../../lib/api.js";
import HealthCharts from "../../components/profile/HealthCharts.jsx";
import AvatarUpload from "../../components/profile/AvatarUpload.jsx";

/**
 * UserProfilePage
 * Perfil completo do usuário com dados pessoais, de saúde e análise gráfica
 */
const UserProfilePage = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [healthData, setHealthData] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [originalFormData, setOriginalFormData] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    birthDate: "",
    bio: "",
    website: "",
    notifications: true,
    privacy: "public",
    // Campos de saúde
    age: "",
    weight: "",
    height: "",
    gender: "",
    activity_level: "",
    health_goals: [],
  });

  // Função para carregar dados do perfil
  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const [profileRes, healthRes] = await Promise.all([
        apiService.users.getProfile().catch(() => null),
        apiService.users.getProfileHealth({ period: 30 }).catch(() => null),
      ]);

      if (profileRes?.user) {
        const userData = profileRes.user;
        setAvatarUrl(userData.avatar_url || userData.avatar || user?.avatar || null);
        const loadedFormData = {
          name: userData.name || user?.name || "",
          email: userData.email || user?.email || "",
          phone: userData.phone || "",
          address: userData.address || "",
          birthDate: userData.birth_date || userData.birthDate || "",
          bio: userData.bio || "",
          website: userData.website || "",
          notifications: userData.notifications ?? true,
          privacy: userData.privacy || "public",
          // Campos de saúde
          age: userData.age || "",
          weight: userData.weight || "",
          height: userData.height || "",
          gender: userData.gender || "",
          activity_level: userData.activity_level || "",
          health_goals: Array.isArray(userData.health_goals)
            ? userData.health_goals
            : [],
        };
        setFormData(loadedFormData);
        setOriginalFormData(loadedFormData); // Salvar dados originais
      }

      if (healthRes) {
        setHealthData(healthRes);
      }
    } catch (error) {
      logger.error("Erro ao carregar perfil:", error);
      toast.error("Erro ao carregar dados do perfil");
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Carregar dados do perfil ao montar componente
  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user, loadProfile]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const updateData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        birth_date: formData.birthDate,
        bio: formData.bio,
        website: formData.website,
        notifications: formData.notifications,
        privacy: formData.privacy,
        // Campos de saúde
        age: formData.age ? parseInt(formData.age) : null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        height: formData.height ? parseFloat(formData.height) : null,
        gender: formData.gender || null,
        activity_level: formData.activity_level || null,
        health_goals: formData.health_goals,
      };

      await apiService.users.updateProfile(updateData);
      setIsEditing(false);
      toast.success("Perfil atualizado com sucesso!");

      // Recarregar dados de saúde
      try {
        const healthRes = await apiService.users.getProfileHealth({ period: 30 });
        setHealthData(healthRes);
      } catch {
        // Ignorar erro ao recarregar saúde
      }
    } catch (error) {
      logger.error("Erro ao salvar perfil:", error);
      toast.error(error.message || "Erro ao atualizar perfil");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Resetar para dados originais (reativo)
    if (originalFormData) {
      setFormData(originalFormData);
    } else {
      // Se não houver dados originais salvos, recarregar do servidor
      loadProfile();
    }
    setIsEditing(false);
  };

  const activityLevels = [
    { value: "sedentary", label: "Sedentário (pouco ou nenhum exercício)" },
    { value: "light", label: "Leve (exercício leve 1-3 dias/semana)" },
    { value: "moderate", label: "Moderado (exercício moderado 3-5 dias/semana)" },
    { value: "active", label: "Ativo (exercício pesado 6-7 dias/semana)" },
    { value: "very_active", label: "Muito Ativo (exercício muito pesado, trabalho físico)" },
  ];

  const healthGoalsOptions = [
    "weight_loss",
    "muscle_gain",
    "maintenance",
    "endurance",
    "flexibility",
    "general_health",
  ];

  const healthGoalsLabels = {
    weight_loss: "Perda de Peso",
    muscle_gain: "Ganho de Massa",
    maintenance: "Manutenção",
    endurance: "Resistência",
    flexibility: "Flexibilidade",
    general_health: "Saúde Geral",
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" role="status" aria-label="Carregando perfil">
            <span className="sr-only">Carregando perfil...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-6 sm:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <H1 className="flex items-center gap-2.5 sm:gap-3 mb-3">
            <User className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            Meu Perfil
          </H1>
          <p className="text-muted-foreground/90 leading-relaxed">
            Gerencie suas informações pessoais, dados de saúde e visualize seu progresso
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {isEditing ? (
            <>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? "Salvando..." : "Salvar"}
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={saving}
                className="flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancelar
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4" />
                Editar Perfil
              </Button>
              <Link to="/social">
                <Button variant="outline" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Ver Perfil Social
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="personal" className="gap-2.5">
            <User className="w-4 h-4" />
            Informações Pessoais
          </TabsTrigger>
          <TabsTrigger value="health" className="gap-2.5">
            <Heart className="w-4 h-4" />
            Dados de Saúde
          </TabsTrigger>
          <TabsTrigger value="analysis" className="gap-2.5">
            <BarChart3 className="w-4 h-4" />
            Análise e Gráficos
          </TabsTrigger>
        </TabsList>

        {/* Tab: Informações Pessoais */}
        <TabsContent value="personal" className="space-y-8 mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Profile Card */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader className="text-center">
                  <div className="flex justify-center">
                    <AvatarUpload
                      currentAvatarUrl={avatarUrl}
                      userName={formData.name}
                      userEmail={formData.email || user?.email}
                      onUploadSuccess={(newUrl) => {
                        setAvatarUrl(newUrl);
                        // Recarregar perfil para ter dados atualizados
                        loadProfile();
                      }}
                      size="w-24 h-24"
                      editable={isEditing}
                    />
                  </div>
                  <CardTitle className="text-xl mt-6 mb-2">
                    {formData.name || "Usuário"}
                  </CardTitle>
                  <CardDescription className="text-muted-foreground/90">{formData.email}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground/90">
                      Membro desde {new Date().getFullYear()}
                    </p>
                  </div>

                  {formData.bio && (
                    <div className="text-center">
                      <p className="text-sm text-foreground leading-relaxed">
                        {formData.bio}
                      </p>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-center gap-2.5 text-sm">
                      <Shield className="w-4 h-4 text-primary" />
                      <span className="text-muted-foreground/90">
                        Conta verificada
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5 text-sm">
                      <Bell className="w-4 h-4 text-primary" />
                      <span className="text-muted-foreground/90">
                        Notificações ativas
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Profile Form */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Informações Pessoais</CardTitle>
                  <CardDescription>
                    Suas informações básicas de perfil
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome Completo</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        disabled={!isEditing}
                        placeholder="Seu nome completo"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        disabled={!isEditing}
                        placeholder="Ex: joao@exemplo.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        disabled={!isEditing}
                        placeholder="Ex: (11) 98765-4321"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="birthDate">Data de Nascimento</Label>
                      <Input
                        id="birthDate"
                        type="date"
                        value={formData.birthDate}
                        onChange={(e) =>
                          handleInputChange("birthDate", e.target.value)
                        }
                        disabled={!isEditing}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Endereço</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleInputChange("address", e.target.value)}
                      disabled={!isEditing}
                      placeholder="Seu endereço completo"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Biografia</Label>
                    <textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => handleInputChange("bio", e.target.value)}
                      disabled={!isEditing}
                      placeholder="Conte um pouco sobre você..."
                      className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-muted disabled:cursor-not-allowed bg-background"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={formData.website}
                      onChange={(e) => handleInputChange("website", e.target.value)}
                      disabled={!isEditing}
                      placeholder="https://seusite.com"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Preferences */}
              <Card>
                <CardHeader>
                  <CardTitle>Preferências</CardTitle>
                  <CardDescription>
                    Configure suas preferências de conta
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Notificações por E-mail</Label>
                      <p className="text-sm text-muted-foreground">
                        Receber notificações sobre atividades da conta
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.notifications}
                      onChange={(e) =>
                        handleInputChange("notifications", e.target.checked)
                      }
                      disabled={!isEditing}
                      className="w-4 h-4 text-primary bg-muted border-border rounded focus:ring-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="privacy">Privacidade do Perfil</Label>
                    <Select
                      value={formData.privacy}
                      onValueChange={(value) => handleInputChange("privacy", value)}
                      disabled={!isEditing}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Público</SelectItem>
                        <SelectItem value="friends">Apenas Amigos</SelectItem>
                        <SelectItem value="private">Privado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Tab: Dados de Saúde */}
        <TabsContent value="health" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-primary" />
                Informações de Saúde
              </CardTitle>
              <CardDescription>
                Estes dados são usados automaticamente nas calculadoras e para análise do seu progresso
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age" className="flex items-center gap-2">
                    <Cake className="w-4 h-4" />
                    Idade
                  </Label>
                  <Input
                    id="age"
                    type="number"
                    min="1"
                    max="120"
                    value={formData.age}
                    onChange={(e) => handleInputChange("age", e.target.value)}
                    disabled={!isEditing}
                    placeholder="Ex: 30"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight" className="flex items-center gap-2">
                    <Weight className="w-4 h-4" />
                    Peso (kg)
                  </Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.weight}
                    onChange={(e) => handleInputChange("weight", e.target.value)}
                    disabled={!isEditing}
                    placeholder="Ex: 75.5"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height" className="flex items-center gap-2">
                    <Ruler className="w-4 h-4" />
                    Altura (cm)
                  </Label>
                  <Input
                    id="height"
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.height}
                    onChange={(e) => handleInputChange("height", e.target.value)}
                    disabled={!isEditing}
                    placeholder="Ex: 175"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gender">Gênero</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => handleInputChange("gender", value)}
                    disabled={!isEditing}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o gênero" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Masculino</SelectItem>
                      <SelectItem value="female">Feminino</SelectItem>
                      <SelectItem value="other">Outro</SelectItem>
                      <SelectItem value="prefer_not_to_say">Prefiro não dizer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="activity_level">Nível de Atividade</Label>
                  <Select
                    value={formData.activity_level}
                    onValueChange={(value) =>
                      handleInputChange("activity_level", value)
                    }
                    disabled={!isEditing}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o nível de atividade" />
                    </SelectTrigger>
                    <SelectContent>
                      {activityLevels.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Objetivos de Saúde</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {healthGoalsOptions.map((goal) => (
                    <label
                      key={goal}
                      className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer ${
                        !isEditing ? "opacity-50 cursor-not-allowed" : ""
                      } ${
                        formData.health_goals.includes(goal)
                          ? "border-primary bg-primary/10"
                          : "border-border"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.health_goals.includes(goal)}
                        onChange={(e) => {
                          if (!isEditing) return;
                          const newGoals = e.target.checked
                            ? [...formData.health_goals, goal]
                            : formData.health_goals.filter((g) => g !== goal);
                          handleInputChange("health_goals", newGoals);
                        }}
                        disabled={!isEditing}
                        className="w-4 h-4 text-primary rounded"
                      />
                      <span className="text-sm">
                        {healthGoalsLabels[goal]}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {healthData?.latest && (
                <div className="mt-6 p-4 bg-primary/10 rounded-lg">
                  <H3 className="mb-2 flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Últimas Métricas Calculadas
                  </H3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {healthData.latest.imc && (
                      <div>
                        <span className="text-muted-foreground">IMC: </span>
                        <span className="font-semibold text-foreground">
                          {parseFloat(
                            healthData.latest.imc.imc ||
                              healthData.latest.imc.result?.imc || 0
                          ).toFixed(1)}
                        </span>
                      </div>
                    )}
                    {healthData.latest.calories && (
                      <div>
                        <span className="text-muted-foreground">TDEE: </span>
                        <span className="font-semibold text-foreground">
                          {parseInt(
                            healthData.latest.calories.tdee ||
                              healthData.latest.calories.result?.tdee || 0
                          )}{" "}
                          kcal
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Análise e Gráficos */}
        <TabsContent value="analysis" className="space-y-6">
          <HealthCharts healthData={healthData} loading={loading} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserProfilePage;
Page;
