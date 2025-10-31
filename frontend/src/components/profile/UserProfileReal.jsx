import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../Ui/card";
import { Button } from "../Ui/button";
import { Input } from "../Ui/input";
import { Label } from "../Ui/label";
import { Textarea } from "../Ui/textarea";
import { Badge } from "../Ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../Ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../Ui/tabs";
import { useAuth } from "../../hooks/useAuth";
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
  Award,
  Target,
  Activity,
  Heart,
  TrendingUp,
  BarChart3,
  Trophy,
  Star,
  CheckCircle,
  Settings,
  Bell,
  Lock,
  Eye,
  EyeOff,
  Upload,
  Download,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

const UserProfileReal = ({
  onProfileUpdate,
  onPasswordChange,
  onNotificationSettings,
  onPrivacySettings,
  onDataExport,
  onAccountDelete,
  showEditMode = true,
}) => {
  const { user, updateUser, loading: authLoading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    bio: "",
    location: "",
    birthDate: "",
    gender: "",
    height: "",
    weight: "",
    activityLevel: "",
    goals: [],
    interests: [],
    preferences: {},
  });

  // Carrega dados do usuário
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        bio: user.bio || "",
        location: user.location || "",
        birthDate: user.birth_date || "",
        gender: user.gender || "",
        height: user.height || "",
        weight: user.weight || "",
        activityLevel: user.activity_level || "",
        goals: user.goals || [],
        interests: user.interests || [],
        preferences: user.preferences || {},
      });
    }
  }, [user]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await updateUser(formData);

      if (result.success) {
        setIsEditing(false);
        if (onProfileUpdate) {
          onProfileUpdate(result.user);
        }
      } else {
        setError(result.error);
      }
    } catch {
      setError("Erro ao salvar perfil");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        bio: user.bio || "",
        location: user.location || "",
        birthDate: user.birth_date || "",
        gender: user.gender || "",
        height: user.height || "",
        weight: user.weight || "",
        activityLevel: user.activity_level || "",
        goals: user.goals || [],
        interests: user.interests || [],
        preferences: user.preferences || {},
      });
    }
    setIsEditing(false);
    setError(null);
  };

  const handlePasswordChangeClick = () => {
    if (onPasswordChange) {
      onPasswordChange();
    }
  };

  const handleNotificationSettingsClick = () => {
    if (onNotificationSettings) {
      onNotificationSettings();
    }
  };

  const handlePrivacySettingsClick = () => {
    if (onPrivacySettings) {
      onPrivacySettings();
    }
  };

  const handleDataExportClick = () => {
    if (onDataExport) {
      onDataExport();
    }
  };

  const handleAccountDeleteClick = () => {
    if (onAccountDelete) {
      onAccountDelete();
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin" />
        <span className="ml-2">Carregando perfil...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center p-8">
        <AlertCircle className="w-6 h-6 text-red-500" />
        <span className="ml-2 text-red-500">Usuário não encontrado</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header do Perfil */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="w-20 h-20">
                <AvatarImage src={user.avatar_url} />
                <AvatarFallback>
                  {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl">
                  {isEditing ? (
                    <Input
                      value={formData.name}
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                      className="text-2xl font-bold"
                    />
                  ) : (
                    user.name || "Usuário"
                  )}
                </CardTitle>
                <p className="text-gray-600">
                  {isEditing ? (
                    <Input
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      type="email"
                    />
                  ) : (
                    user.email
                  )}
                </p>
                {user.bio && (
                  <p className="text-sm text-gray-500 mt-1">
                    {isEditing ? (
                      <Textarea
                        value={formData.bio}
                        onChange={(e) =>
                          handleInputChange("bio", e.target.value)
                        }
                        placeholder="Sua biografia..."
                        rows={2}
                      />
                    ) : (
                      user.bio
                    )}
                  </p>
                )}
              </div>
            </div>
            {showEditMode && (
              <div className="flex space-x-2">
                {isEditing ? (
                  <>
                    <Button onClick={handleSave} disabled={loading}>
                      <Save className="w-4 h-4 mr-2" />
                      {loading ? "Salvando..." : "Salvar"}
                    </Button>
                    <Button variant="outline" onClick={handleCancel}>
                      <X className="w-4 h-4 mr-2" />
                      Cancelar
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setIsEditing(true)}>
                    <Edit3 className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Tabs de Conteúdo */}
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="stats">Estatísticas</TabsTrigger>
          <TabsTrigger value="achievements">Conquistas</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        {/* Aba Perfil */}
        <TabsContent value="profile" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Informações Pessoais */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Informações Pessoais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  {isEditing ? (
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) =>
                        handleInputChange("phone", e.target.value)
                      }
                      placeholder="Seu telefone"
                    />
                  ) : (
                    <p className="text-sm text-gray-600">
                      {user.phone || "Não informado"}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="location">Localização</Label>
                  {isEditing ? (
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) =>
                        handleInputChange("location", e.target.value)
                      }
                      placeholder="Sua localização"
                    />
                  ) : (
                    <p className="text-sm text-gray-600">
                      {user.location || "Não informado"}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="birthDate">Data de Nascimento</Label>
                  {isEditing ? (
                    <Input
                      id="birthDate"
                      type="date"
                      value={formData.birthDate}
                      onChange={(e) =>
                        handleInputChange("birthDate", e.target.value)
                      }
                    />
                  ) : (
                    <p className="text-sm text-gray-600">
                      {user.birth_date || "Não informado"}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="gender">Gênero</Label>
                  {isEditing ? (
                    <select
                      id="gender"
                      value={formData.gender}
                      onChange={(e) =>
                        handleInputChange("gender", e.target.value)
                      }
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="">Selecione</option>
                      <option value="male">Masculino</option>
                      <option value="female">Feminino</option>
                      <option value="other">Outro</option>
                    </select>
                  ) : (
                    <p className="text-sm text-gray-600">
                      {user.gender || "Não informado"}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Informações de Saúde */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Heart className="w-5 h-5 mr-2" />
                  Informações de Saúde
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="height">Altura (cm)</Label>
                  {isEditing ? (
                    <Input
                      id="height"
                      type="number"
                      value={formData.height}
                      onChange={(e) =>
                        handleInputChange("height", e.target.value)
                      }
                      placeholder="Sua altura em cm"
                    />
                  ) : (
                    <p className="text-sm text-gray-600">
                      {user.height || "Não informado"}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="weight">Peso (kg)</Label>
                  {isEditing ? (
                    <Input
                      id="weight"
                      type="number"
                      value={formData.weight}
                      onChange={(e) =>
                        handleInputChange("weight", e.target.value)
                      }
                      placeholder="Seu peso em kg"
                    />
                  ) : (
                    <p className="text-sm text-gray-600">
                      {user.weight || "Não informado"}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="activityLevel">Nível de Atividade</Label>
                  {isEditing ? (
                    <select
                      id="activityLevel"
                      value={formData.activityLevel}
                      onChange={(e) =>
                        handleInputChange("activityLevel", e.target.value)
                      }
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="">Selecione</option>
                      <option value="sedentary">Sedentário</option>
                      <option value="light">Leve</option>
                      <option value="moderate">Moderado</option>
                      <option value="active">Ativo</option>
                      <option value="very_active">Muito Ativo</option>
                    </select>
                  ) : (
                    <p className="text-sm text-gray-600">
                      {user.activity_level || "Não informado"}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Aba Estatísticas */}
        <TabsContent value="stats" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Activity className="w-8 h-8 text-blue-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Exercícios
                    </p>
                    <p className="text-2xl font-bold">
                      {user.stats?.exercises || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Target className="w-8 h-8 text-green-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Metas</p>
                    <p className="text-2xl font-bold">
                      {user.stats?.goals || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Trophy className="w-8 h-8 text-yellow-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Conquistas
                    </p>
                    <p className="text-2xl font-bold">
                      {user.stats?.achievements || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Aba Conquistas */}
        <TabsContent value="achievements" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {user.achievements?.map((achievement, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-yellow-100 rounded-full">
                      <Award className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{achievement.name}</h3>
                      <p className="text-sm text-gray-600">
                        {achievement.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )) || (
              <div className="col-span-full text-center py-8">
                <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nenhuma conquista ainda</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Aba Configurações */}
        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Segurança
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={handlePasswordChangeClick}
                  variant="outline"
                  className="w-full"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Alterar Senha
                </Button>
                <Button
                  onClick={handlePrivacySettingsClick}
                  variant="outline"
                  className="w-full"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Configurações de Privacidade
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="w-5 h-5 mr-2" />
                  Notificações
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={handleNotificationSettingsClick}
                  variant="outline"
                  className="w-full"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Configurar Notificações
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Download className="w-5 h-5 mr-2" />
                  Dados
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={handleDataExportClick}
                  variant="outline"
                  className="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Exportar Dados
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-red-600">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  Zona de Perigo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleAccountDeleteClick}
                  variant="destructive"
                  className="w-full"
                >
                  Excluir Conta
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Mensagem de Erro */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfileReal;
