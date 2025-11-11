import React, { useState, useEffect } from "react";
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
import {
  Settings,
  Bell,
  Shield,
  Palette,
  Globe,
  Lock,
  Eye,
  EyeOff,
  Save,
  Moon,
  Sun,
  Monitor,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth.jsx";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { apiService } from "../../lib/api.js";
import logger from "@/utils/logger";

/**
 * UserSettingsPage
 * Configurações do usuário (notificações, privacidade, aparência e segurança).
 */
const UserSettingsPage = () => {
  const { user } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Evitar hidratação mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const [settings, setSettings] = useState({
    // Notifications
    emailNotifications: true,
    pushNotifications: true,
    marketingEmails: false,
    weeklyReports: true,

    // Privacy
    profileVisibility: "public",
    showEmail: false,
    showPhone: false,
    allowMessages: true,

    // Appearance
    theme: theme || "system",
    language: "pt-BR",
    fontSize: "medium",

    // Security
    twoFactorAuth: false,
    loginAlerts: true,
    sessionTimeout: 30,
  });

  // Carregar configurações ao montar
  useEffect(() => {
    const loadSettings = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const response = await apiService.users.getSettings();
        if (response.settings) {
          setSettings(prev => ({
            ...prev,
            ...response.settings,
            theme: response.settings.theme || theme || "system"
          }));
          // Aplicar tema se existir
          if (response.settings.theme && setTheme) {
            setTheme(response.settings.theme);
          }
        }
      } catch (error) {
        logger.error("Erro ao carregar configurações:", error);
        toast.error("Erro ao carregar configurações");
      } finally {
        setLoading(false);
      }
    };

    if (mounted && user) {
      loadSettings();
    }
  }, [user, mounted]);

  // Sincronizar tema do sistema com o estado local
  useEffect(() => {
    if (mounted && theme) {
      setSettings((prev) => ({
        ...prev,
        theme: theme,
      }));
    }
  }, [theme, mounted]);

  const [showPassword, setShowPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleSettingChange = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));

    // Se for mudança de tema, aplicar imediatamente
    if (key === "theme" && setTheme) {
      setTheme(value);
      toast.success(`Tema alterado para ${value === "light" ? "claro" : value === "dark" ? "escuro" : "sistema"}`);
    }
  };

  const handlePasswordChange = (field, value) => {
    setPasswordData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      const response = await apiService.users.updateSettings(settings);
      if (response.settings) {
        toast.success(response.message || "Configurações salvas com sucesso");
      } else {
        throw new Error(response.error || "Erro ao salvar configurações");
      }
    } catch (error) {
      logger.error("Erro ao salvar configurações:", error);
      toast.error(error.message || "Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      toast.error("Preencha todos os campos");
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error("A nova senha deve ter pelo menos 8 caracteres");
      return;
    }

    try {
      setSaving(true);
      const response = await apiService.users.changePassword({
        current_password: passwordData.currentPassword,
        new_password: passwordData.newPassword,
      });
      
      toast.success(response.message || "Senha alterada com sucesso");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      logger.error("Erro ao alterar senha:", error);
      toast.error(error.message || "Erro ao alterar senha. Verifique sua senha atual.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10 p-6 sm:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3 mb-3">
            <Settings className="w-8 h-8 text-primary" />
            Configurações
          </h1>
          <p className="text-muted-foreground/90 leading-relaxed">
            Personalize sua experiência na plataforma
          </p>
        </div>

        <Button onClick={saveSettings} className="flex items-center gap-2.5">
          <Save className="w-4 h-4" />
          Salvar Configurações
        </Button>
      </div>

      <div className="space-y-8">
        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notificações
            </CardTitle>
            <CardDescription>
              Configure como você deseja receber notificações
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-5 border border-border/30 rounded-lg transition-colors duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-muted/30">
              <div className="space-y-2">
                <Label>Notificações por E-mail</Label>
                <p className="text-sm text-muted-foreground/90 leading-relaxed">
                  Receber notificações importantes por e-mail
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={(e) =>
                  handleSettingChange("emailNotifications", e.target.checked)
                }
                className="w-5 h-5 text-primary bg-background border-border/50 rounded-md focus:ring-primary transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]"
              />
            </div>

            <div className="flex items-center justify-between p-5 border border-border/30 rounded-lg transition-colors duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-muted/30">
              <div className="space-y-2">
                <Label>Notificações Push</Label>
                <p className="text-sm text-muted-foreground/90 leading-relaxed">
                  Receber notificações no navegador
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.pushNotifications}
                onChange={(e) =>
                  handleSettingChange("pushNotifications", e.target.checked)
                }
                className="w-5 h-5 text-primary bg-background border-border/50 rounded-md focus:ring-primary transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]"
              />
            </div>

            <div className="flex items-center justify-between p-5 border border-border/30 rounded-lg transition-colors duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-muted/30">
              <div className="space-y-2">
                <Label>E-mails de Marketing</Label>
                <p className="text-sm text-muted-foreground/90 leading-relaxed">
                  Receber ofertas e novidades por e-mail
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.marketingEmails}
                onChange={(e) =>
                  handleSettingChange("marketingEmails", e.target.checked)
                }
                className="w-5 h-5 text-primary bg-background border-border/50 rounded-md focus:ring-primary transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]"
              />
            </div>

            <div className="flex items-center justify-between p-5 border border-border/30 rounded-lg transition-colors duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-muted/30">
              <div className="space-y-2">
                <Label>Relatórios Semanais</Label>
                <p className="text-sm text-muted-foreground/90 leading-relaxed">
                  Receber resumos semanais de atividade
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.weeklyReports}
                onChange={(e) =>
                  handleSettingChange("weeklyReports", e.target.checked)
                }
                className="w-5 h-5 text-primary bg-background border-border/50 rounded-md focus:ring-primary transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Privacidade
            </CardTitle>
            <CardDescription>
              Controle quem pode ver suas informações
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="profileVisibility">Visibilidade do Perfil</Label>
              <select
                id="profileVisibility"
                value={settings.profileVisibility}
                onChange={(e) =>
                  handleSettingChange("profileVisibility", e.target.value)
                }
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="public">Público</option>
                <option value="friends">Apenas Amigos</option>
                <option value="private">Privado</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Mostrar E-mail</Label>
                <p className="text-sm text-muted-foreground">
                  Permitir que outros usuários vejam seu e-mail
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.showEmail}
                onChange={(e) =>
                  handleSettingChange("showEmail", e.target.checked)
                }
                className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Mostrar Telefone</Label>
                <p className="text-sm text-muted-foreground">
                  Permitir que outros usuários vejam seu telefone
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.showPhone}
                onChange={(e) =>
                  handleSettingChange("showPhone", e.target.checked)
                }
                className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Permitir Mensagens</Label>
                <p className="text-sm text-muted-foreground">
                  Permitir que outros usuários enviem mensagens
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.allowMessages}
                onChange={(e) =>
                  handleSettingChange("allowMessages", e.target.checked)
                }
                className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary"
              />
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Aparência
            </CardTitle>
            <CardDescription>
              Personalize a aparência da interface
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tema</Label>
              <p className="text-sm text-muted-foreground/90 leading-relaxed mb-4">
                Escolha o tema da interface. As alterações são aplicadas imediatamente.
              </p>
              <div className="flex gap-3">
                <Button
                  variant={settings.theme === "light" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleSettingChange("theme", "light")}
                  className="flex items-center gap-2"
                  disabled={!mounted}
                >
                  <Sun className="w-4 h-4" />
                  Claro
                </Button>
                <Button
                  variant={settings.theme === "dark" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleSettingChange("theme", "dark")}
                  className="flex items-center gap-2"
                  disabled={!mounted}
                >
                  <Moon className="w-4 h-4" />
                  Escuro
                </Button>
                <Button
                  variant={settings.theme === "system" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleSettingChange("theme", "system")}
                  className="flex items-center gap-2"
                  disabled={!mounted}
                >
                  <Monitor className="w-4 h-4" />
                  Sistema
                </Button>
              </div>
              {mounted && (
                <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-2">
                  Tema atual: <strong>{resolvedTheme || theme}</strong>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Idioma</Label>
              <select
                id="language"
                value={settings.language}
                onChange={(e) =>
                  handleSettingChange("language", e.target.value)
                }
                className="w-full px-4 py-2.5 border border-border/50 rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]"
              >
                <option value="pt-BR">Português (Brasil)</option>
                <option value="en-US">English (US)</option>
                <option value="es-ES">Español</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fontSize">Tamanho da Fonte</Label>
              <select
                id="fontSize"
                value={settings.fontSize}
                onChange={(e) =>
                  handleSettingChange("fontSize", e.target.value)
                }
                className="w-full px-4 py-2.5 border border-border/50 rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]"
              >
                <option value="small">Pequeno</option>
                <option value="medium">Médio</option>
                <option value="large">Grande</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Segurança
            </CardTitle>
            <CardDescription>Gerencie a segurança da sua conta</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Change Password */}
            <div className="space-y-4">
              <h4 className="font-medium">Alterar Senha</h4>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Senha Atual</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showPassword ? "text" : "password"}
                      value={passwordData.currentPassword}
                      onChange={(e) =>
                        handlePasswordChange("currentPassword", e.target.value)
                      }
                      placeholder="Digite sua senha atual"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nova Senha</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      handlePasswordChange("newPassword", e.target.value)
                    }
                    placeholder="Digite sua nova senha"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      handlePasswordChange("confirmPassword", e.target.value)
                    }
                    placeholder="Confirme sua nova senha"
                  />
                </div>

                <Button onClick={changePassword} className="w-full" disabled={saving}>
                  {saving ? "Alterando..." : "Alterar Senha"}
                </Button>
              </div>
            </div>

            {/* Security Options */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-border/30 rounded-lg transition-colors duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-muted/30">
                <div className="space-y-1.5">
                  <Label>Autenticação de Dois Fatores</Label>
                  <p className="text-sm text-muted-foreground/90 leading-relaxed">
                    Adicione uma camada extra de segurança
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.twoFactorAuth}
                  onChange={(e) =>
                    handleSettingChange("twoFactorAuth", e.target.checked)
                  }
                  className="w-5 h-5 text-primary bg-background border-border/50 rounded-md focus:ring-primary transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]"
                />
              </div>

              <div className="flex items-center justify-between p-4 border border-border/30 rounded-lg transition-colors duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-muted/30">
                <div className="space-y-1.5">
                  <Label>Alertas de Login</Label>
                  <p className="text-sm text-muted-foreground/90 leading-relaxed">
                    Receber notificações de novos logins
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.loginAlerts}
                  onChange={(e) =>
                    handleSettingChange("loginAlerts", e.target.checked)
                  }
                  className="w-5 h-5 text-primary bg-background border-border/50 rounded-md focus:ring-primary transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sessionTimeout">
                  Timeout da Sessão (minutos)
                </Label>
                <select
                  id="sessionTimeout"
                  value={settings.sessionTimeout}
                  onChange={(e) =>
                    handleSettingChange(
                      "sessionTimeout",
                      parseInt(e.target.value),
                    )
                  }
                  className="w-full px-4 py-2.5 border border-border/50 rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]"
                >
                  <option value={15}>15 minutos</option>
                  <option value={30}>30 minutos</option>
                  <option value={60}>1 hora</option>
                  <option value={120}>2 horas</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserSettingsPage;
