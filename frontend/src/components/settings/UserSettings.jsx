import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/Ui/card";
import { Button } from "@/components/Ui/button";
import { Badge } from "@/components/Ui/badge";
import { Progress } from "@/components/Ui/progress";
import { Input } from "@/components/Ui/input";
import { Label } from "@/components/Ui/label";
// import { toast } from "sonner";
import {
  Settings,
  User,
  Bell,
  Shield,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Check,
  X,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Grid,
  List,
  RefreshCw,
  ExternalLink,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ChevronLeft,
  MoreHorizontal,
  MoreVertical,
  Menu,
  X as XIcon,
  Copy,
  Share2,
  MessageCircle,
  Users,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  Headphones,
  Mic,
  Video,
  Bookmark,
  Flag,
  Mail,
  Phone,
  MapPin,
  Camera,
  Apple,
  Coffee,
  Utensils,
  Pill,
  Stethoscope,
  Trophy,
  Award,
  Star,
  Crown,
  Diamond,
  Medal,
  Zap,
  Sparkles,
  Gem,
  Coins,
  Banknote,
  Wallet,
  CreditCard,
  ShoppingCart,
  Package,
  Gift,
  Tag,
  Percent,
  DollarSign,
  Calculator,
  FileText,
  Image,
  File,
  Folder,
  Archive,
  Calendar,
  Clock,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Activity,
  Dumbbell,
  Flame,
  Droplets,
  Moon,
  Sun,
  Cloud,
  Wind,
  Snow,
  Umbrella,
  TreePine,
  Mountain,
  Waves,
  Fish,
  Bird,
  Cat,
  Dog,
  Rabbit,
  Car,
  Bike,
  Bus,
  Train,
  Plane,
  Ship,
  Rocket,
  Gamepad2,
  Music,
  CreditCard as CreditCardIcon,
  ShoppingCart as ShoppingCartIcon,
  Package as PackageIcon,
  Gift as GiftIcon,
  Tag as TagIcon,
  Percent as PercentIcon,
  DollarSign as DollarSignIcon,
  Calculator as CalculatorIcon,
  FileText as FileTextIcon,
  Image as ImageIcon,
  File as FileIcon,
  Folder as FolderIcon,
  Archive as ArchiveIcon,
  Search as SearchIcon,
  Filter as FilterIcon,
  SortAsc as SortAscIcon,
  SortDesc as SortDescIcon,
  Grid as GridIcon,
  List as ListIcon,
  RefreshCw as RefreshCwIcon,
  ExternalLink as ExternalLinkIcon,
  ArrowRight as ArrowRightIcon,
  ArrowLeft as ArrowLeftIcon,
  ChevronDown as ChevronDownIcon,
  ChevronUp as ChevronUpIcon,
  ChevronRight as ChevronRightIcon,
  ChevronLeft as ChevronLeftIcon,
  MoreHorizontal as MoreHorizontalIcon,
  MoreVertical as MoreVerticalIcon,
  Menu as MenuIcon,
  X as XIconIcon,
  Plus as PlusIcon,
  Minus,
  Edit as EditIcon,
  Trash2 as Trash2Icon,
  Copy as CopyIcon,
  Share2 as Share2Icon,
  MessageCircle as MessageCircleIcon,
  Users as UsersIcon,
  Globe as GlobeIcon,
  Smartphone as SmartphoneIcon,
  Monitor as MonitorIcon,
  Tablet as TabletIcon,
  Headphones as HeadphonesIcon,
  Mic as MicIcon,
  Video as VideoIcon,
  Bookmark as BookmarkIcon,
  Flag as FlagIcon,
  Bell as BellIcon,
  Mail as MailIcon,
  Phone as PhoneIcon,
  MapPin as MapPinIcon,
  Camera as CameraIcon,
  Apple as AppleIcon,
  Coffee as CoffeeIcon,
  Utensils as UtensilsIcon,
  Pill as PillIcon,
  Stethoscope as StethoscopeIcon,
  Trophy as TrophyIcon,
  Award as AwardIcon,
  Star as StarIcon,
  Crown as CrownIcon,
  Diamond as DiamondIcon,
  Medal as MedalIcon,
  Zap as ZapIcon,
  Sparkles as SparklesIcon,
  Gem as GemIcon,
  Coins as CoinsIcon,
  Banknote as BanknoteIcon,
  Wallet as WalletIcon,
} from "lucide-react";

/**
 * Configurações do Usuário - Componente de gerenciamento de configurações.
 * 
 * @component
 * @param {string} [userId] - ID do usuário (prop opcional)
 * @param {Function} [onSettingsUpdate] - Callback ao atualizar configurações
 * @param {Function} [onPasswordChange] - Callback ao mudar senha
 * @param {Function} [onAccountDelete] - Callback ao deletar conta (prop opcional para uso futuro)
 * @param {Function} [onDataExport] - Callback ao exportar dados
 * @param {Function} [onTwoFactorToggle] - Callback ao alternar 2FA
 */
export const UserSettings = ({
  userId: _userId, // eslint-disable-line no-unused-vars
  onSettingsUpdate,
  onPasswordChange,
  onAccountDelete: _onAccountDelete, // eslint-disable-line no-unused-vars
  onDataExport,
  onTwoFactorToggle,
}) => {
  const [settings, setSettings] = useState({});
  const [loading] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleSettingsUpdate = async (section, updates) => {
    try {
      // Atualiza estado local imediatamente (UI otimista)
      setSettings((prev) => ({
        ...prev,
        [section]: { ...prev[section], ...updates },
      }));
      if (onSettingsUpdate) {
        onSettingsUpdate(section, updates);
      }
    } catch (ERR) {
      console.error(ERR);
    }
  };

  const handlePasswordChange = () => {
    if (onPasswordChange) onPasswordChange();
  };

  // Usar as variáveis de modal
  const handleOpenPasswordModal = () => setShowPasswordModal(true);
  // removido: close handler não utilizado
  const handleOpenDeleteModal = () => setShowDeleteModal(true);
  // removido: close handler não utilizado

  // Usar as funções de modal
  const handlePasswordChangeClick = () => {
    handleOpenPasswordModal();
  };

  const handleDeleteClick = () => {
    handleOpenDeleteModal();
  };

  // Usar as variáveis de modal
  // removido: toggler não utilizado

  // removido: toggler não utilizado

  // Usar as funções não utilizadas

  // removido: handler duplicado/sem uso

  const handleDataExport = async (format, dataTypes) => {
    if (onDataExport) {
      onDataExport(format, dataTypes);
    }
  };

  const handleTwoFactorToggle = async (enabled) => {
    setSettings((prev) => ({
      ...prev,
      account: { ...prev.account, twoFactor: enabled },
      security: { ...prev.security, twoFactor: enabled },
    }));

    if (onTwoFactorToggle) {
      onTwoFactorToggle(enabled);
    }
  };

  const renderProfileSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informações Pessoais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-white">
                  {settings.profile?.name?.charAt(0)}
                </span>
              </div>
              <Button
                size="sm"
                className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full"
              >
                <Camera className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex-1">
              <h3 className="text-lg font-semibold">
                {settings.profile?.name}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {settings.profile?.email}
              </p>
              <Button variant="outline" size="sm" className="mt-2">
                <Edit className="w-4 h-4 mr-2" />
                Alterar Foto
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nome Completo</Label>
              <Input
                id="name"
                value={settings.profile?.name}
                onChange={(e) =>
                  handleSettingsUpdate("profile", { name: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={settings.profile?.email}
                onChange={(e) =>
                  handleSettingsUpdate("profile", { email: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={settings.profile?.phone}
                onChange={(e) =>
                  handleSettingsUpdate("profile", { phone: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="location">Localização</Label>
              <Input
                id="location"
                value={settings.profile?.location}
                onChange={(e) =>
                  handleSettingsUpdate("profile", { location: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={settings.profile?.website}
                onChange={(e) =>
                  handleSettingsUpdate("profile", { website: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="birthDate">Data de Nascimento</Label>
              <Input
                id="birthDate"
                type="date"
                value={settings.profile?.birthDate}
                onChange={(e) =>
                  handleSettingsUpdate("profile", { birthDate: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <Label htmlFor="bio">Biografia</Label>
            <textarea
              id="bio"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={settings.profile?.bio}
              onChange={(e) =>
                handleSettingsUpdate("profile", { bio: e.target.value })
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Redes Sociais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="instagram">Instagram</Label>
              <Input
                id="instagram"
                value={settings.profile?.socialMedia?.instagram}
                onChange={(e) =>
                  handleSettingsUpdate("profile", {
                    socialMedia: {
                      ...settings.profile?.socialMedia,
                      instagram: e.target.value,
                    },
                  })
                }
              />
            </div>

            <div>
              <Label htmlFor="twitter">Twitter</Label>
              <Input
                id="twitter"
                value={settings.profile?.socialMedia?.twitter}
                onChange={(e) =>
                  handleSettingsUpdate("profile", {
                    socialMedia: {
                      ...settings.profile?.socialMedia,
                      twitter: e.target.value,
                    },
                  })
                }
              />
            </div>

            <div>
              <Label htmlFor="linkedin">LinkedIn</Label>
              <Input
                id="linkedin"
                value={settings.profile?.socialMedia?.linkedin}
                onChange={(e) =>
                  handleSettingsUpdate("profile", {
                    socialMedia: {
                      ...settings.profile?.socialMedia,
                      linkedin: e.target.value,
                    },
                  })
                }
              />
            </div>

            <div>
              <Label htmlFor="youtube">YouTube</Label>
              <Input
                id="youtube"
                value={settings.profile?.socialMedia?.youtube}
                onChange={(e) =>
                  handleSettingsUpdate("profile", {
                    socialMedia: {
                      ...settings.profile?.socialMedia,
                      youtube: e.target.value,
                    },
                  })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAccountSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informações da Conta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="accountEmail">Email</Label>
              <Input
                id="accountEmail"
                type="email"
                value={settings.account?.email}
                onChange={(e) =>
                  handleSettingsUpdate("account", { email: e.target.value })
                }
              />
              {settings.account?.emailVerified && (
                <div className="flex items-center space-x-1 mt-1">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600">
                    Email verificado
                  </span>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="accountPhone">Telefone</Label>
              <Input
                id="accountPhone"
                value={settings.account?.phone}
                onChange={(e) =>
                  handleSettingsUpdate("account", { phone: e.target.value })
                }
              />
              {settings.account?.phoneVerified && (
                <div className="flex items-center space-x-1 mt-1">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600">
                    Telefone verificado
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-semibold">Autenticação de Dois Fatores</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Adicione uma camada extra de segurança à sua conta
              </p>
            </div>
            <Button
              variant={settings.account?.twoFactor ? "default" : "outline"}
              onClick={() =>
                handleTwoFactorToggle(!settings.account?.twoFactor)
              }
            >
              {settings.account?.twoFactor ? "Desativar" : "Ativar"}
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-semibold">Alterar Senha</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Última alteração:{" "}
                {new Date(
                  settings.security?.passwordLastChanged,
                ).toLocaleDateString()}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handlePasswordChangeClick}
              className={showPasswordModal ? "bg-blue-100" : ""}
            >
              <Lock className="w-4 h-4 mr-2" />
              {showPasswordModal ? "Fechar Modal" : "Alterar Senha"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Login</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {settings.account?.loginHistory?.map((login, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <div className="font-medium">{login.device}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {login.location} • {login.ip}
                  </div>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date(login.date).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderPrivacySettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configurações de Privacidade</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(settings.privacy || {}).map(([key, value]) => (
            <div
              key={key}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div>
                <h3 className="font-semibold capitalize">
                  {key.replace(/([A-Z])/g, " $1")}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {key === "profilePublic" && "Tornar perfil público"}
                  {key === "showEmail" && "Mostrar email no perfil"}
                  {key === "showPhone" && "Mostrar telefone no perfil"}
                  {key === "showLocation" && "Mostrar localização no perfil"}
                  {key === "showBirthDate" &&
                    "Mostrar data de nascimento no perfil"}
                  {key === "showActivity" && "Mostrar atividade recente"}
                  {key === "showProgress" && "Mostrar progresso nos treinos"}
                  {key === "allowMessages" &&
                    "Permitir mensagens de outros usuários"}
                  {key === "allowFriendRequests" &&
                    "Permitir solicitações de amizade"}
                  {key === "showOnlineStatus" && "Mostrar status online"}
                </p>
              </div>
              <input
                type="checkbox"
                checked={value}
                onChange={(e) =>
                  handleSettingsUpdate("privacy", { [key]: e.target.checked })
                }
                className="w-5 h-5 text-blue-600 rounded"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Compartilhamento de Dados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(settings.privacy?.dataSharing || {}).map(
            ([key, value]) => (
              <div
                key={key}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <h3 className="font-semibold capitalize">
                    {key.replace(/([A-Z])/g, " $1")}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {key === "analytics" &&
                      "Compartilhar dados para análise e melhorias"}
                    {key === "marketing" &&
                      "Receber ofertas e promoções personalizadas"}
                    {key === "thirdParty" &&
                      "Compartilhar dados com parceiros terceiros"}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) =>
                    handleSettingsUpdate("privacy", {
                      dataSharing: {
                        ...settings.privacy?.dataSharing,
                        [key]: e.target.checked,
                      },
                    })
                  }
                  className="w-5 h-5 text-blue-600 rounded"
                />
              </div>
            ),
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Notificações por Email</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(settings.notifications?.email || {}).map(
            ([key, value]) => (
              <div
                key={key}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <h3 className="font-semibold capitalize">
                    {key.replace(/([A-Z])/g, " $1")}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {key === "enabled" && "Ativar notificações por email"}
                    {key === "workoutReminders" && "Lembretes de treino"}
                    {key === "goalReminders" && "Lembretes de metas"}
                    {key === "achievementNotifications" &&
                      "Notificações de conquistas"}
                    {key === "socialNotifications" && "Notificações sociais"}
                    {key === "marketingEmails" && "Emails de marketing"}
                    {key === "securityAlerts" && "Alertas de segurança"}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) =>
                    handleSettingsUpdate("notifications", {
                      email: {
                        ...settings.notifications?.email,
                        [key]: e.target.checked,
                      },
                    })
                  }
                  className="w-5 h-5 text-blue-600 rounded"
                />
              </div>
            ),
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notificações Push</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(settings.notifications?.push || {}).map(
            ([key, value]) => (
              <div
                key={key}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <h3 className="font-semibold capitalize">
                    {key.replace(/([A-Z])/g, " $1")}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {key === "enabled" && "Ativar notificações push"}
                    {key === "workoutReminders" && "Lembretes de treino"}
                    {key === "goalReminders" && "Lembretes de metas"}
                    {key === "achievementNotifications" &&
                      "Notificações de conquistas"}
                    {key === "socialNotifications" && "Notificações sociais"}
                    {key === "marketingNotifications" &&
                      "Notificações de marketing"}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) =>
                    handleSettingsUpdate("notifications", {
                      push: {
                        ...settings.notifications?.push,
                        [key]: e.target.checked,
                      },
                    })
                  }
                  className="w-5 h-5 text-blue-600 rounded"
                />
              </div>
            ),
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderPreferenceSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Preferências Gerais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="theme">Tema</Label>
              <select
                id="theme"
                value={settings.preferences?.theme}
                onChange={(e) =>
                  handleSettingsUpdate("preferences", { theme: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="light">Claro</option>
                <option value="dark">Escuro</option>
                <option value="system">Sistema</option>
              </select>
            </div>

            <div>
              <Label htmlFor="language">Idioma</Label>
              <select
                id="language"
                value={settings.preferences?.language}
                onChange={(e) =>
                  handleSettingsUpdate("preferences", {
                    language: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="pt-BR">Português (Brasil)</option>
                <option value="en-US">English (US)</option>
                <option value="es-ES">Español</option>
              </select>
            </div>

            <div>
              <Label htmlFor="timezone">Fuso Horário</Label>
              <select
                id="timezone"
                value={settings.preferences?.timezone}
                onChange={(e) =>
                  handleSettingsUpdate("preferences", {
                    timezone: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="America/Sao_Paulo">São Paulo (GMT-3)</option>
                <option value="America/New_York">New York (GMT-5)</option>
                <option value="Europe/London">London (GMT+0)</option>
              </select>
            </div>

            <div>
              <Label htmlFor="currency">Moeda</Label>
              <select
                id="currency"
                value={settings.preferences?.currency}
                onChange={(e) =>
                  handleSettingsUpdate("preferences", {
                    currency: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="BRL">Real (R$)</option>
                <option value="USD">Dollar ($)</option>
                <option value="EUR">Euro (€)</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lembretes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <h3 className="font-semibold">Lembretes de Treino</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {settings.preferences?.workoutReminders?.enabled
                  ? "Ativado"
                  : "Desativado"}
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.preferences?.workoutReminders?.enabled}
              onChange={(e) =>
                handleSettingsUpdate("preferences", {
                  workoutReminders: {
                    ...settings.preferences?.workoutReminders,
                    enabled: e.target.checked,
                  },
                })
              }
              className="w-5 h-5 text-blue-600 rounded"
            />
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <h3 className="font-semibold">Lembretes de Metas</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {settings.preferences?.goalReminders?.enabled
                  ? "Ativado"
                  : "Desativado"}
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.preferences?.goalReminders?.enabled}
              onChange={(e) =>
                handleSettingsUpdate("preferences", {
                  goalReminders: {
                    ...settings.preferences?.goalReminders,
                    enabled: e.target.checked,
                  },
                })
              }
              className="w-5 h-5 text-blue-600 rounded"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderDataSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Exportação de Dados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {Object.entries(settings.data?.accountData || {}).map(
              ([key, value]) => (
                <div
                  key={key}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <h3 className="font-semibold capitalize">{key}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Incluir dados de {key} na exportação
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) =>
                      handleSettingsUpdate("data", {
                        accountData: {
                          ...settings.data?.accountData,
                          [key]: e.target.checked,
                        },
                      })
                    }
                    className="w-5 h-5 text-blue-600 rounded"
                  />
                </div>
              ),
            )}
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-semibold">Exportar Dados</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Última exportação:{" "}
                {new Date(settings.data?.lastExport).toLocaleDateString()}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() =>
                handleDataExport("JSON", settings.data?.accountData)
              }
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Excluir Conta</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 border border-red-200 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h3 className="font-semibold text-red-800 dark:text-red-200">
                Zona de Perigo
              </h3>
            </div>
            <p className="text-sm text-red-700 dark:text-red-300 mb-4">
              Excluir sua conta é uma ação irreversível. Todos os seus dados
              serão permanentemente removidos.
            </p>
            <Button
              variant="destructive"
              onClick={handleDeleteClick}
              className={showDeleteModal ? "bg-red-200" : ""}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {showDeleteModal ? "Fechar Modal" : "Excluir Conta"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const tabs = [
    { id: "profile", label: "Perfil", icon: User },
    { id: "account", label: "Conta", icon: Settings },
    { id: "privacy", label: "Privacidade", icon: Shield },
    { id: "notifications", label: "Notificações", icon: Bell },
    { id: "preferences", label: "Preferências", icon: Settings },
    { id: "data", label: "Dados", icon: FileText },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Carregando configurações...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Settings className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Configurações
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Gerencie suas preferências e configurações
              </p>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={handlePasswordChange}>
              <Lock className="w-4 h-4 mr-2" />
              Senha
            </Button>
            <Button variant="outline" size="sm" onClick={handleDeleteClick}>
              <Trash2 className="w-4 h-4 mr-2" />
              Deletar
            </Button>
            <Button variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg mb-6">
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
              </button>
            );
          })}
        </div>

        {/* Content */}
        {activeTab === "profile" && renderProfileSettings()}
        {activeTab === "account" && renderAccountSettings()}
        {activeTab === "privacy" && renderPrivacySettings()}
        {activeTab === "notifications" && renderNotificationSettings()}
        {activeTab === "preferences" && renderPreferenceSettings()}
        {activeTab === "data" && renderDataSettings()}
      </div>
    </div>
  );
};
