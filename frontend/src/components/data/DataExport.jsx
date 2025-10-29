import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/Ui/card';
import { Button } from '@/components/Ui/button';
import { Badge } from '@/components/Ui/badge';
import { Progress } from '@/components/Ui/progress';
import { Input } from '@/components/Ui/input';
import { Label } from '@/components/Ui/label';
import { 
  Download, 
  FileText, 
  File, 
  Archive, 
  Check, 
  X, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Target,
  Heart, 
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
  Bell, 
  Settings, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  AlertTriangle, 
  Info, 
  Upload, 
  Camera, 
  Apple, 
  Coffee, 
  Utensils, 
  Pill, 
  Stethoscope, 
  Shield, 
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
  Image, 
  Folder, 
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
  Settings as SettingsIcon, 
  User as UserIcon, 
  Mail as MailIcon, 
  Phone as PhoneIcon, 
  MapPin as MapPinIcon, 
  Eye as EyeIcon, 
  EyeOff as EyeOffIcon, 
  Lock as LockIcon, 
  Unlock as UnlockIcon, 
  AlertTriangle as AlertTriangleIcon, 
  Info as InfoIcon, 
  Upload as UploadIcon, 
  Camera as CameraIcon, 
  Apple as AppleIcon, 
  Coffee as CoffeeIcon, 
  Utensils as UtensilsIcon, 
  Pill as PillIcon, 
  Stethoscope as StethoscopeIcon, 
  Shield as ShieldIcon, 
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
  Wallet as WalletIcon
} from 'lucide-react';

export const DataExport = ({ 
  userId,
  onExportData,
  onScheduleExport,
  onCancelExport,
  onDownloadExport
}) => {
  const [exportData, setExportData] = useState({});
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('export');
  const [selectedDataTypes, setSelectedDataTypes] = useState([]);
  const [selectedFormat, setSelectedFormat] = useState('json');
  const [exportProgress, setExportProgress] = useState(0);
  const [isExporting, setIsExporting] = useState(false);

  // Dados de exemplo para exportação
  const defaultExportData = useMemo(() => ({
    user: {
      id: 1,
      name: 'João Silva',
      email: 'joao@email.com',
      joinDate: '2023-01-15T00:00:00Z',
      lastLogin: '2024-01-28T10:30:00Z'
    },
    dataTypes: [
      {
        id: 'profile',
        name: 'Perfil',
        description: 'Informações pessoais e configurações',
        icon: User,
        color: 'text-blue-600',
        size: '2.5 KB',
        lastUpdated: '2024-01-28T10:30:00Z',
        items: 15
      },
      {
        id: 'workouts',
        name: 'Treinos',
        description: 'Histórico de treinos e exercícios',
        icon: Activity,
        color: 'text-green-600',
        size: '45.2 KB',
        lastUpdated: '2024-01-28T09:15:00Z',
        items: 156
      },
      {
        id: 'goals',
        name: 'Metas',
        description: 'Objetivos e progresso',
        icon: Target,
        color: 'text-purple-600',
        size: '8.7 KB',
        lastUpdated: '2024-01-28T08:45:00Z',
        items: 12
      },
      {
        id: 'nutrition',
        name: 'Nutrição',
        description: 'Registros de alimentação e hidratação',
        icon: Apple,
        color: 'text-orange-600',
        size: '32.1 KB',
        lastUpdated: '2024-01-28T07:30:00Z',
        items: 89
      },
      {
        id: 'health',
        name: 'Saúde',
        description: 'Métricas de saúde e calculadoras',
        icon: Heart,
        color: 'text-red-600',
        size: '12.3 KB',
        lastUpdated: '2024-01-28T06:20:00Z',
        items: 45
      },
      {
        id: 'social',
        name: 'Social',
        description: 'Posts, comentários e interações',
        icon: Users,
        color: 'text-cyan-600',
        size: '18.9 KB',
        lastUpdated: '2024-01-28T05:10:00Z',
        items: 67
      },
      {
        id: 'orders',
        name: 'Pedidos',
        description: 'Histórico de compras e pedidos',
        icon: ShoppingCart,
        color: 'text-yellow-600',
        size: '25.6 KB',
        lastUpdated: '2024-01-27T16:45:00Z',
        items: 23
      },
      {
        id: 'favorites',
        name: 'Favoritos',
        description: 'Itens salvos como favoritos',
        icon: Star,
        color: 'text-pink-600',
        size: '5.2 KB',
        lastUpdated: '2024-01-28T11:00:00Z',
        items: 34
      }
    ],
    formats: [
      {
        id: 'json',
        name: 'JSON',
        description: 'Formato estruturado para desenvolvedores',
        icon: FileText,
        color: 'text-blue-600',
        extension: '.json',
        size: 'Compacto'
      },
      {
        id: 'csv',
        name: 'CSV',
        description: 'Planilha compatível com Excel',
        icon: File,
        color: 'text-green-600',
        extension: '.csv',
        size: 'Médio'
      },
      {
        id: 'pdf',
        name: 'PDF',
        description: 'Relatório formatado para impressão',
        icon: FileText,
        color: 'text-red-600',
        extension: '.pdf',
        size: 'Grande'
      },
      {
        id: 'zip',
        name: 'ZIP',
        description: 'Arquivo compactado com todos os dados',
        icon: Archive,
        color: 'text-purple-600',
        extension: '.zip',
        size: 'Compacto'
      }
    ],
    exportHistory: [
      {
        id: 1,
        name: 'Exportação Completa',
        format: 'json',
        dataTypes: ['profile', 'workouts', 'goals', 'nutrition', 'health'],
        size: '125.4 KB',
        status: 'completed',
        createdAt: '2024-01-15T14:30:00Z',
        completedAt: '2024-01-15T14:32:00Z',
        downloadUrl: '/exports/export-1.json'
      },
      {
        id: 2,
        name: 'Relatório de Treinos',
        format: 'pdf',
        dataTypes: ['workouts'],
        size: '45.2 KB',
        status: 'completed',
        createdAt: '2024-01-10T09:15:00Z',
        completedAt: '2024-01-10T09:17:00Z',
        downloadUrl: '/exports/export-2.pdf'
      },
      {
        id: 3,
        name: 'Dados de Saúde',
        format: 'csv',
        dataTypes: ['health', 'nutrition'],
        size: '44.4 KB',
        status: 'completed',
        createdAt: '2024-01-05T16:45:00Z',
        completedAt: '2024-01-05T16:47:00Z',
        downloadUrl: '/exports/export-3.csv'
      },
      {
        id: 4,
        name: 'Exportação Completa',
        format: 'zip',
        dataTypes: ['profile', 'workouts', 'goals', 'nutrition', 'health', 'social', 'orders', 'favorites'],
        size: '150.8 KB',
        status: 'processing',
        createdAt: '2024-01-28T12:00:00Z',
        completedAt: null,
        downloadUrl: null
      }
    ],
    scheduledExports: [
      {
        id: 1,
        name: 'Backup Semanal',
        format: 'json',
        dataTypes: ['profile', 'workouts', 'goals', 'nutrition', 'health'],
        frequency: 'weekly',
        nextRun: '2024-02-04T00:00:00Z',
        isActive: true
      },
      {
        id: 2,
        name: 'Relatório Mensal',
        format: 'pdf',
        dataTypes: ['workouts', 'goals', 'health'],
        frequency: 'monthly',
        nextRun: '2024-02-01T00:00:00Z',
        isActive: true
      }
    ]
  }), []);

  useEffect(() => {
    loadExportData();
  }, [userId, loadExportData]);

  const loadExportData = useCallback(async () => {
    setLoading(true);
    
    try {
      // Simular carregamento de API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setExportData(defaultExportData);
    } catch (error) {
      console.error('Erro ao carregar dados de exportação:', error);
    } finally {
      setLoading(false);
    }
  }, [defaultExportData]);

  const handleDataTypeToggle = (dataTypeId) => {
    setSelectedDataTypes(prev => 
      prev.includes(dataTypeId) 
        ? prev.filter(id => id !== dataTypeId)
        : [...prev, dataTypeId]
    );
  }

  const handleExport = async () => {
    if (selectedDataTypes.length === 0) {
      alert('Selecione pelo menos um tipo de dados para exportar');
      return;
    }

    setIsExporting(true);
    setExportProgress(0);

    // Simular progresso de exportação
    const interval = setInterval(() => {
      setExportProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsExporting(false);
          return 100;
        }
        return prev + 10;
      });
    }, 200);

    if (onExportData) {
      onExportData(selectedDataTypes, selectedFormat);
    }
  }

  const handleScheduleExport = async (scheduleData) => {
    if (onScheduleExport) {
      onScheduleExport(scheduleData);
    }
  };

  const handleCancelExport = async (exportId) => {
    if (onCancelExport) {
      onCancelExport(exportId);
    }
  };

  const handleDownloadExport = async (exportId) => {
    if (onDownloadExport) {
      onDownloadExport(exportId);
    }
  };

  const getDataTypeIcon = (typeId) => {
    const dataType = exportData.dataTypes?.find(dt => dt.id === typeId);
    return dataType?.icon || FileText;
  };

  const getDataTypeColor = (typeId) => {
    const dataType = exportData.dataTypes?.find(dt => dt.id === typeId);
    return dataType?.color || 'text-gray-600';
  };

  const getFormatIcon = (formatId) => {
    const format = exportData.formats?.find(f => f.id === formatId);
    return format?.icon || FileText;
  };

  const getFormatColor = (formatId) => {
    const format = exportData.formats?.find(f => f.id === formatId);
    return format?.color || 'text-gray-600';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'processing': return 'text-blue-600';
      case 'failed': return 'text-red-600';
      case 'scheduled': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'Concluído';
      case 'processing': return 'Processando';
      case 'failed': return 'Falhou';
      case 'scheduled': return 'Agendado';
      default: return 'Desconhecido';
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const renderExportTab = () => (
    <div className="space-y-6">
      {/* Seleção de Dados */}
      <Card>
        <CardHeader>
          <CardTitle>Selecionar Dados para Exportar</CardTitle>
          <CardDescription>
            Escolha quais dados você gostaria de exportar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exportData.dataTypes?.map((dataType) => {
              const IconComponent = dataType.icon;
              const isSelected = selectedDataTypes.includes(dataType.id);
              
              return (
                <div
                  key={dataType.id}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleDataTypeToggle(dataType.id)}
                >
                  <div className="flex items-center space-x-3">
                    {React.createElement(getDataTypeIcon(dataType.id), { className: `w-6 h-6 ${getDataTypeColor(dataType.id)}` })}
                    <div className="flex-1">
                      <h3 className="font-semibold">{dataType.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {dataType.description}
                      </p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span>{dataType.size}</span>
                        <span>{dataType.items} itens</span>
                      </div>
                    </div>
                    {isSelected && <Check className="w-5 h-5 text-blue-600" />}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Seleção de Formato */}
      <Card>
        <CardHeader>
          <CardTitle>Formato de Exportação</CardTitle>
          <CardDescription>
            Escolha o formato do arquivo de exportação
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {exportData.formats?.map((format) => {
              const IconComponent = format.icon;
              const isSelected = selectedFormat === format.id;
              
              return (
                <div
                  key={format.id}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedFormat(format.id)}
                >
                  <div className="text-center">
                    {React.createElement(getFormatIcon(format.id), { className: `w-8 h-8 ${getFormatColor(format.id)} mx-auto mb-2` })}
                    <h3 className="font-semibold">{format.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {format.description}
                    </p>
                    <div className="text-xs text-gray-500">
                      {format.extension} • {format.size}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Resumo e Ação */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo da Exportação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Tipos de dados selecionados:</span>
              <span className="font-semibold">{selectedDataTypes.length}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span>Formato:</span>
              <span className="font-semibold">
                {exportData.formats?.find(f => f.id === selectedFormat)?.name}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span>Tamanho estimado:</span>
              <span className="font-semibold">
                {selectedDataTypes.reduce((total, typeId) => {
                  const dataType = exportData.dataTypes?.find(dt => dt.id === typeId);
                  return total + (dataType ? parseFloat(dataType.size) : 0);
                }, 0).toFixed(1)} KB
              </span>
            </div>
            
            {isExporting && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Exportando...</span>
                  <span className="font-semibold">{exportProgress}%</span>
                </div>
                <Progress value={exportProgress} className="h-2" />
              </div>
            )}
            
            <div className="flex space-x-2">
              <Button
                onClick={handleExport}
                disabled={selectedDataTypes.length === 0 || isExporting}
                className="flex-1"
              >
                <Download className="w-4 h-4 mr-2" />
                {isExporting ? 'Exportando...' : 'Exportar Dados'}
              </Button>
              <Button
                variant="outline"
                onClick={() => handleScheduleExport({ dataTypes: selectedDataTypes, format: selectedFormat })}
                disabled={selectedDataTypes.length === 0}
                className="flex-1"
              >
                <Archive className="w-4 h-4 mr-2" />
                Agendar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderHistoryTab = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
        Histórico de Exportações
      </h2>
      
      <div className="space-y-4">
        {exportData.exportHistory?.map((exportItem) => (
          <Card key={exportItem.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-semibold text-lg">{exportItem.name}</h3>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getStatusColor(exportItem.status)}`}
                    >
                      {getStatusText(exportItem.status)}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div>
                      <span className="font-medium">Formato:</span> {exportItem.format.toUpperCase()}
                    </div>
                    <div>
                      <span className="font-medium">Tamanho:</span> {exportItem.size}
                    </div>
                    <div>
                      <span className="font-medium">Criado em:</span> {formatTimestamp(exportItem.createdAt)}
                    </div>
                  </div>
                  
                  <div className="mt-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Dados: {exportItem.dataTypes.map(typeId => {
                        const dataType = exportData.dataTypes?.find(dt => dt.id === typeId);
                        return dataType?.name;
                      }).join(', ')}
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-col items-end space-y-2">
                  {exportItem.status === 'completed' && (
                    <Button
                      size="sm"
                      onClick={() => handleDownloadExport(exportItem.id)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Baixar
                    </Button>
                  )}
                  
                  {exportItem.status === 'processing' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCancelExport(exportItem.id)}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancelar
                    </Button>
                  )}
                  
                  <div className="text-xs text-gray-500">
                    {exportItem.completedAt ? `Concluído em ${formatTimestamp(exportItem.completedAt)}` : 'Em processamento...'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderScheduleTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Exportações Agendadas
        </h2>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nova Exportação Agendada
        </Button>
      </div>
      
      <div className="space-y-4">
        {exportData.scheduledExports?.map((schedule) => (
          <Card key={schedule.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-semibold text-lg">{schedule.name}</h3>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${schedule.isActive ? 'text-green-600' : 'text-gray-600'}`}
                    >
                      {schedule.isActive ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div>
                      <span className="font-medium">Formato:</span> {schedule.format.toUpperCase()}
                    </div>
                    <div>
                      <span className="font-medium">Frequência:</span> {schedule.frequency}
                    </div>
                    <div>
                      <span className="font-medium">Próxima execução:</span> {formatTimestamp(schedule.nextRun)}
                    </div>
                  </div>
                  
                  <div className="mt-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Dados: {schedule.dataTypes.map(typeId => {
                        const dataType = exportData.dataTypes?.find(dt => dt.id === typeId);
                        return dataType?.name;
                      }).join(', ')}
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-col items-end space-y-2">
                  <Button size="sm" variant="outline">
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                  
                  <Button size="sm" variant="outline" className="text-red-600">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const tabs = [
    { id: 'export', label: 'Exportar', icon: Download },
    { id: 'history', label: 'Histórico', icon: FileText },
    { id: 'schedule', label: 'Agendadas', icon: Calendar }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando dados de exportação...</p>
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
              <Download className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Exportação de Dados
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Exporte seus dados em diferentes formatos
              </p>
            </div>
          </div>
          
          <Button variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
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
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        {activeTab === 'export' && renderExportTab()}
        {activeTab === 'history' && renderHistoryTab()}
        {activeTab === 'schedule' && renderScheduleTab()}
      </div>
    </div>
  );
};