import React, { useState, useEffect, useCallback } from "react";
import logger from "@/utils/logger";
import apiClient from "@/services/apiClient";
import { apiService } from "@/lib/api";
import { getAuthToken } from "@/utils/storage";
import { toast } from "sonner";
/**
 * Central de suporte (tickets, FAQs e contato).
 * - Carrega dados (mock/API), cria/atualiza/fecha tickets
 * - Busca/filtros e detalhes com mensagens
 */
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
import {
  HelpCircle,
  MessageCircle,
  Phone,
  Mail,
  Clock,
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
  MapPin,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  AlertTriangle,
  Info,
  Download,
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
  Truck,
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
  MapPin as MapPinIcon,
  Eye as EyeIcon,
  EyeOff as EyeOffIcon,
  Lock as LockIcon,
  Unlock as UnlockIcon,
  AlertTriangle as AlertTriangleIcon,
  Info as InfoIcon,
  Download as DownloadIcon,
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
  Wallet as WalletIcon,
} from "lucide-react";

export const SupportSystem = ({
  userId,
  onCreateTicket,
  onUpdateTicket,
  onSendMessage,
}) => {
  const [supportData, setSupportData] = useState({});
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("tickets");
  const [showCreateTicket, setShowCreateTicket] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Dados de exemplo do sistema de suporte
  const defaultSupportData = {
    user: {
      id: 1,
      name: "João Silva",
      email: "joao@email.com",
      phone: "+55 11 99999-9999",
      tier: "gold",
      supportLevel: "priority",
    },
    tickets: [
      {
        id: 1,
        subject: "Problema com login",
        description: "Não consigo fazer login na minha conta",
        category: "account",
        priority: "high",
        status: "open",
        assignedTo: {
          name: "Maria Santos",
          avatar: "/images/avatar-maria.jpg",
        },
        createdAt: "2024-01-28T10:00:00Z",
        updatedAt: "2024-01-28T10:00:00Z",
        messages: [
          {
            id: 1,
            sender: "user",
            content:
              "Olá, não consigo fazer login na minha conta. Recebo uma mensagem de erro.",
            timestamp: "2024-01-28T10:00:00Z",
            attachments: [],
          },
          {
            id: 2,
            sender: "support",
            content:
              "Olá! Vou ajudá-lo com esse problema. Pode me informar qual mensagem de erro está aparecendo?",
            timestamp: "2024-01-28T10:15:00Z",
            attachments: [],
          },
        ],
      },
      {
        id: 2,
        subject: "Dúvida sobre produto",
        description: "Gostaria de saber mais sobre o Whey Protein Premium",
        category: "product",
        priority: "medium",
        status: "resolved",
        assignedTo: {
          name: "Pedro Costa",
          avatar: "/images/avatar-pedro.jpg",
        },
        createdAt: "2024-01-27T14:30:00Z",
        updatedAt: "2024-01-27T16:45:00Z",
        resolvedAt: "2024-01-27T16:45:00Z",
        messages: [
          {
            id: 1,
            sender: "user",
            content:
              "Olá, gostaria de saber mais sobre o Whey Protein Premium. Qual a diferença para o Whey Protein comum?",
            timestamp: "2024-01-27T14:30:00Z",
            attachments: [],
          },
          {
            id: 2,
            sender: "support",
            content:
              "Olá! O Whey Protein Premium é uma versão mais concentrada com maior teor de proteína por dose. Ele contém 25g de proteína por dose contra 20g do Whey comum.",
            timestamp: "2024-01-27T15:00:00Z",
            attachments: [],
          },
          {
            id: 3,
            sender: "user",
            content: "Perfeito! Vou fazer o pedido. Obrigado pela ajuda!",
            timestamp: "2024-01-27T16:30:00Z",
            attachments: [],
          },
          {
            id: 4,
            sender: "support",
            content:
              "Ótimo! Fico feliz em ajudar. Se tiver mais alguma dúvida, estarei aqui!",
            timestamp: "2024-01-27T16:45:00Z",
            attachments: [],
          },
        ],
      },
      {
        id: 3,
        subject: "Problema com pedido",
        description: "Meu pedido não chegou ainda",
        category: "order",
        priority: "high",
        status: "in_progress",
        assignedTo: {
          name: "Ana Silva",
          avatar: "/images/avatar-ana.jpg",
        },
        createdAt: "2024-01-26T09:00:00Z",
        updatedAt: "2024-01-28T08:30:00Z",
        messages: [
          {
            id: 1,
            sender: "user",
            content:
              "Olá, fiz um pedido há 5 dias e ainda não chegou. O código de rastreamento é BR123456789.",
            timestamp: "2024-01-26T09:00:00Z",
            attachments: [],
          },
          {
            id: 2,
            sender: "support",
            content:
              "Olá! Vou verificar o status do seu pedido. Um momento, por favor.",
            timestamp: "2024-01-26T09:15:00Z",
            attachments: [],
          },
          {
            id: 3,
            sender: "support",
            content:
              "Verifiquei seu pedido e ele está em trânsito. Deve chegar até amanhã. Vou acompanhar e te avisar quando chegar.",
            timestamp: "2024-01-28T08:30:00Z",
            attachments: [],
          },
        ],
      },
    ],
    faqs: [
      {
        id: 1,
        question: "Como faço para resetar minha senha?",
        answer:
          'Para resetar sua senha, clique em "Esqueci minha senha" na tela de login e siga as instruções enviadas por email.',
        category: "account",
        helpful: 45,
        notHelpful: 2,
      },
      {
        id: 2,
        question: "Qual o prazo de entrega dos produtos?",
        answer:
          "O prazo de entrega varia de 3 a 7 dias úteis, dependendo da sua localização. Para o estado de São Paulo, o prazo é de 3 a 5 dias úteis.",
        category: "shipping",
        helpful: 38,
        notHelpful: 1,
      },
      {
        id: 3,
        question: "Posso cancelar meu pedido?",
        answer:
          "Sim, você pode cancelar seu pedido até 24 horas após a confirmação. Após esse período, o pedido já estará em processo de envio.",
        category: "order",
        helpful: 42,
        notHelpful: 3,
      },
      {
        id: 4,
        question: "Como funciona o programa de fidelidade?",
        answer:
          "O programa de fidelidade permite que você acumule pontos a cada compra e os troque por descontos e produtos exclusivos.",
        category: "loyalty",
        helpful: 35,
        notHelpful: 2,
      },
      {
        id: 5,
        question: "Quais métodos de pagamento são aceitos?",
        answer:
          "Aceitamos cartão de crédito, débito, PIX, boleto bancário e PayPal.",
        category: "payment",
        helpful: 40,
        notHelpful: 1,
      },
    ],
    categories: [
      { id: "account", name: "Conta", icon: User, color: "text-primary" },
      {
        id: "product",
        name: "Produto",
        icon: Package,
        color: "text-primary",
      },
      {
        id: "order",
        name: "Pedido",
        icon: ShoppingCart,
        color: "text-primary",
      },
      {
        id: "shipping",
        name: "Entrega",
        icon: Truck,
        color: "text-primary",
      },
      {
        id: "payment",
        name: "Pagamento",
        icon: CreditCard,
        color: "text-destructive",
      },
      {
        id: "loyalty",
        name: "Fidelidade",
        icon: Star,
        color: "text-primary",
      },
      {
        id: "technical",
        name: "Técnico",
        icon: Settings,
        color: "text-muted-foreground",
      },
      { id: "other", name: "Outros", icon: HelpCircle, color: "text-muted-foreground" },
    ],
    priorities: [
      {
        id: "low",
        name: "Baixa",
        color: "text-primary",
        bgColor: "bg-primary/10",
      },
      {
        id: "medium",
        name: "Média",
        color: "text-primary",
        bgColor: "bg-primary/10",
      },
      {
        id: "high",
        name: "Alta",
        color: "text-primary",
        bgColor: "bg-primary/10",
      },
      {
        id: "urgent",
        name: "Urgente",
        color: "text-destructive",
        bgColor: "bg-destructive/10",
      },
    ],
    statuses: [
      {
        id: "open",
        name: "Aberto",
        color: "text-primary",
        bgColor: "bg-primary/10",
      },
      {
        id: "in_progress",
        name: "Em Andamento",
        color: "text-primary",
        bgColor: "bg-primary/10",
      },
      {
        id: "resolved",
        name: "Resolvido",
        color: "text-primary",
        bgColor: "bg-primary/10",
      },
      {
        id: "closed",
        name: "Fechado",
        color: "text-muted-foreground",
        bgColor: "bg-muted",
      },
    ],
    contactMethods: [
      {
        id: "chat",
        name: "Chat Online",
        description: "Fale conosco em tempo real",
        icon: MessageCircle,
        color: "text-primary",
        available: true,
        waitTime: "2 min",
      },
      {
        id: "email",
        name: "Email",
        description: "Envie sua dúvida por email",
        icon: Mail,
        color: "text-primary",
        available: true,
        waitTime: "2 horas",
      },
      {
        id: "phone",
        name: "Telefone",
        description: "Ligue para nosso suporte",
        icon: Phone,
        color: "text-primary",
        available: true,
        waitTime: "5 min",
      },
    ],
  };

  const loadSupportData = useCallback(async () => {
    setLoading(true);

    try {
      const token = getAuthToken();
      
      // Tentar carregar da API se houver token e endpoints disponíveis
      if (token && userId) {
        try {
          // Carregar tickets da API
          const ticketsResponse = await apiService.support.getTickets({ limit: 50 });
          const faqsResponse = await apiService.support.getFaqs();
          
          if (ticketsResponse?.success && Array.isArray(ticketsResponse.tickets)) {
            // Transformar tickets da API para o formato esperado
            const transformedTickets = ticketsResponse.tickets.map(ticket => ({
              id: ticket.id,
              subject: ticket.subject || "Sem assunto",
              message: ticket.message || "",
              status: ticket.status || "open",
              category: ticket.category || "general",
              priority: ticket.priority || "medium",
              createdAt: ticket.created_at,
              updatedAt: ticket.updated_at,
              messages: ticket.messages || [],
            }));
            
            setSupportData(prev => ({
              ...prev,
              tickets: transformedTickets,
            }));
          }
          
          if (faqsResponse?.success && Array.isArray(faqsResponse.faqs)) {
            // Transformar FAQs da API
            const transformedFaqs = faqsResponse.faqs.map(faq => ({
              id: faq.id,
              question: faq.title || faq.question || "Pergunta",
              answer: faq.content || faq.answer || "",
              category: faq.category || "general",
            }));
            
            setSupportData(prev => ({
              ...prev,
              faqs: transformedFaqs,
            }));
          }
          
          // Se carregou dados da API, não usar fallback
          if (ticketsResponse?.success || faqsResponse?.success) {
            return;
          }
        } catch (apiError) {
          logger.warn("Erro ao carregar dados de suporte da API, usando fallback:", apiError);
        }
      }
      
      // Fallback: usar dados padrão
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simular carregamento
      setSupportData(defaultSupportData);
    } catch (error) {
      logger.error("Erro ao carregar dados de suporte:", error);
      setSupportData(defaultSupportData); // Garantir que sempre há dados
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadSupportData();
  }, [loadSupportData]);

  const handleCreateTicket = async (ticketData) => {
    try {
      const token = getAuthToken();
      if (token) {
        // Criar ticket via API
        const response = await apiService.support.createTicket({
          subject: ticketData.subject,
          message: ticketData.message,
          category: ticketData.category || "general",
          priority: ticketData.priority || "medium",
        });
        
        if (response?.success && response?.ticket) {
          const newTicket = {
            id: response.ticket.id,
            ...response.ticket,
          };
          
          setSupportData(prev => ({
            ...prev,
            tickets: [newTicket, ...prev.tickets],
          }));
          
          toast.success("Ticket criado com sucesso!");
          return;
        }
      }
    } catch (error) {
      logger.error("Erro ao criar ticket via API:", error);
      toast.error("Erro ao criar ticket. Usando dados locais.");
    }
    
    // Fallback: criar ticket localmente
    const newTicket = {
      id: Date.now(),
      ...ticketData,
      status: "open",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [
        {
          id: 1,
          sender: "user",
          content: ticketData.description,
          timestamp: new Date().toISOString(),
          attachments: [],
        },
      ],
    };

    setSupportData((prev) => ({
      ...prev,
      tickets: [newTicket, ...prev.tickets],
    }));

    if (onCreateTicket) {
      onCreateTicket(newTicket);
    }
  };


  const getCategoryIcon = (categoryId) => {
    const category = supportData.categories?.find(
      (cat) => cat.id === categoryId,
    );
    return category?.icon || HelpCircle;
  };

  const getCategoryColor = (categoryId) => {
    const category = supportData.categories?.find(
      (cat) => cat.id === categoryId,
    );
    return category?.color || "text-muted-foreground";
  };

  const getPriorityColor = (priority) => {
    const priorityData = supportData.priorities?.find((p) => p.id === priority);
    return priorityData?.color || "text-muted-foreground";
  };


  const getStatusColor = (status) => {
    const statusData = supportData.statuses?.find((s) => s.id === status);
    return statusData?.color || "text-muted-foreground";
  };


  const getStatusText = (status) => {
    const statusData = supportData.statuses?.find((s) => s.id === status);
    return statusData?.name || status;
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) {
      // Menos de 1 minuto
      return "Agora";
    } else if (diff < 3600000) {
      // Menos de 1 hora
      return `${Math.floor(diff / 60000)} min atrás`;
    } else if (diff < 86400000) {
      // Menos de 1 dia
      return `${Math.floor(diff / 3600000)}h atrás`;
    } else if (diff < 604800000) {
      // Menos de 1 semana
      return `${Math.floor(diff / 86400000)} dias atrás`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const filteredTickets = supportData.tickets?.filter((ticket) => {
    const matchesFilter = filter === "all" || ticket.status === filter;
    const matchesSearch =
      searchTerm === "" ||
      ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const filteredFaqs = supportData.faqs?.filter((faq) => {
    return (
      searchTerm === "" ||
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const renderTickets = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">
          Meus Tickets
        </h2>
        <Button onClick={() => setShowCreateTicket(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Ticket
        </Button>
      </div>

      <div className="space-y-4">
        {filteredTickets?.map((ticket) => {
          const CategoryIcon = getCategoryIcon(ticket.category);

          return (
            <Card
              key={ticket.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedTicket(ticket)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <CategoryIcon
                        className={`w-5 h-5 ${getCategoryColor(ticket.category)}`}
                      />
                      <h3 className="font-semibold text-lg">
                        {ticket.subject}
                      </h3>
                    </div>

                    <p className="text-muted-foreground mb-3 line-clamp-2">
                      {ticket.description}
                    </p>

                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>
                          Criado em{" "}
                          {new Date(ticket.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {ticket.assignedTo && (
                        <div className="flex items-center space-x-1">
                          <User className="w-4 h-4" />
                          <span>Atribuído a {ticket.assignedTo.name}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end space-y-2">
                    <Badge
                      variant="outline"
                      className={`text-xs ${getStatusColor(ticket.status)}`}
                    >
                      {getStatusText(ticket.status)}
                    </Badge>

                    <Badge
                      variant="outline"
                      className={`text-xs ${getPriorityColor(ticket.priority)}`}
                    >
                      {
                        supportData.priorities?.find(
                          (p) => p.id === ticket.priority,
                        )?.name
                      }
                    </Badge>

                    <div className="text-xs text-muted-foreground">
                      {ticket.messages?.length} mensagens
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );

  const renderFaqs = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">
        Perguntas Frequentes
      </h2>

      <div className="space-y-4">
        {filteredFaqs?.map((faq) => (
          <Card key={faq.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">{faq.question}</h3>
                <p className="text-muted-foreground">{faq.answer}</p>

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-primary"
                      onClick={() => {
                        // Marcar FAQ como útil
                        setSupportData(prev => ({
                          ...prev,
                          faqs: prev.faqs?.map(f => 
                            f.id === faq.id 
                              ? { ...f, helpful: (f.helpful || 0) + 1 }
                              : f
                          ) || []
                        }));
                        toast.success("Obrigado pelo feedback!");
                      }}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Útil ({faq.helpful || 0})
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-destructive"
                      onClick={() => {
                        // Marcar FAQ como não útil
                        setSupportData(prev => ({
                          ...prev,
                          faqs: prev.faqs?.map(f => 
                            f.id === faq.id 
                              ? { ...f, notHelpful: (f.notHelpful || 0) + 1 }
                              : f
                          ) || []
                        }));
                        toast.info("Obrigado pelo feedback. Vamos melhorar!");
                      }}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Não útil ({faq.notHelpful || 0})
                    </Button>
                  </div>

                  <Badge variant="outline" className="text-xs">
                    {
                      supportData.categories?.find(
                        (cat) => cat.id === faq.category,
                      )?.name
                    }
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderContactMethods = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">
        Entre em Contato
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {supportData.contactMethods?.map((method) => {
          const IconComponent = method.icon;

          return (
            <Card key={method.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center w-16 h-16 bg-muted rounded-full mx-auto mb-4">
                  <IconComponent className={`w-8 h-8 ${method.color}`} />
                </div>

                <h3 className="font-semibold text-lg mb-2">{method.name}</h3>
                <p className="text-muted-foreground mb-4">
                  {method.description}
                </p>

                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    Tempo de espera: {method.waitTime}
                  </div>

                  <Button 
                    className="w-full" 
                    disabled={!method.available}
                    onClick={() => {
                      if (!method.available) return;
                      
                      switch (method.id) {
                        case "chat":
                          toast.info("Abrindo chat online...");
                          // Aqui poderia abrir um modal de chat ou redirecionar
                          setShowCreateTicket(true);
                          break;
                        case "email":
                          // mailto: é legítimo para email
                          window.location.href = "mailto:suporte@re-educa.com";
                          break;
                        case "phone":
                          toast.info("Ligue para: (11) 99999-9999");
                          // Aqui poderia usar tel: link
                          break;
                        default:
                          toast.info(`Abrindo ${method.name}...`);
                      }
                    }}
                  >
                    {method.available ? "Entrar em Contato" : "Indisponível"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );

  const renderTicketDetail = () => {
    if (!selectedTicket) return null;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={() => setSelectedTicket(null)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <h2 className="text-2xl font-bold text-foreground">
              {selectedTicket.subject}
            </h2>
          </div>

          <div className="flex items-center space-x-2">
            <Badge
              variant="outline"
              className={`text-xs ${getStatusColor(selectedTicket.status)}`}
            >
              {getStatusText(selectedTicket.status)}
            </Badge>

            <Badge
              variant="outline"
              className={`text-xs ${getPriorityColor(selectedTicket.priority)}`}
            >
              {
                supportData.priorities?.find(
                  (p) => p.id === selectedTicket.priority,
                )?.name
              }
            </Badge>

            {/* Botão para atualizar status do ticket */}
            {selectedTicket.status !== "closed" && (
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    const newStatus = selectedTicket.status === "open" ? "in_progress" : "resolved";
                    if (onUpdateTicket) {
                      await onUpdateTicket(selectedTicket.id, { status: newStatus });
                    } else {
                      // Usar apiService para atualizar ticket
                      await apiService.support.updateTicket(selectedTicket.id, {
                        status: newStatus === "resolved" ? "closed" : newStatus,
                      });
                    }
                    toast.success("Ticket atualizado com sucesso!");
                    loadSupportData();
                  } catch (error) {
                    logger.error("Erro ao atualizar ticket:", error);
                    toast.error("Erro ao atualizar ticket");
                  }
                }}
              >
                {selectedTicket.status === "open" ? "Marcar em Andamento" : "Marcar como Resolvido"}
              </Button>
            )}
          </div>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              {selectedTicket.messages?.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] p-3 rounded-lg ${
                      message.sender === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    <p>{message.content}</p>
                    <div
                      className={`text-xs mt-2 ${
                        message.sender === "user"
                          ? "text-primary-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      {formatTimestamp(message.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t">
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  const message = formData.get("message");
                  if (!message || !message.trim()) return;

                  try {
                    if (onSendMessage) {
                      await onSendMessage(selectedTicket.id, message);
                    } else {
                      // Implementação direta se callback não fornecido
                      await apiService.support.addTicketMessage(selectedTicket.id, {
                        message: message,
                      });
                    }
                    toast.success("Mensagem enviada com sucesso!");
                    e.target.reset();
                    // Recarregar ticket para atualizar mensagens
                    loadSupportData();
                  } catch (error) {
                    logger.error("Erro ao enviar mensagem:", error);
                    toast.error("Erro ao enviar mensagem");
                  }
                }}
                className="flex space-x-2"
              >
                <Input
                  name="message"
                  placeholder="Digite sua mensagem..."
                  className="flex-1"
                  required
                />
                <Button type="submit">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Enviar
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderCreateTicket = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>Criar Novo Ticket</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const ticketData = {
                subject: formData.get("subject"),
                description: formData.get("description"),
                category: formData.get("category"),
                priority: formData.get("priority"),
              };

              handleCreateTicket(ticketData);
              setShowCreateTicket(false);
            }}
          >
            <div className="space-y-4">
              <div>
                <Label htmlFor="subject">Assunto</Label>
                <Input
                  id="subject"
                  name="subject"
                  required
                  placeholder="Resumo do problema"
                />
              </div>

              <div>
                <Label htmlFor="category">Categoria</Label>
                <select
                  id="category"
                  name="category"
                  required
                  className="w-full px-3 py-2 border border-border rounded-md"
                >
                  <option value="">Selecione uma categoria</option>
                  {supportData.categories?.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="priority">Prioridade</Label>
                <select
                  id="priority"
                  name="priority"
                  required
                  className="w-full px-3 py-2 border border-border rounded-md"
                >
                  {supportData.priorities?.map((priority) => (
                    <option key={priority.id} value={priority.id}>
                      {priority.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <textarea
                  id="description"
                  name="description"
                  required
                  rows={4}
                  className="w-full px-3 py-2 border border-border rounded-md"
                  placeholder="Descreva seu problema em detalhes..."
                />
              </div>

              <div className="flex space-x-2 pt-4">
                <Button type="submit" className="flex-1">
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Ticket
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateTicket(false)}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );

  const tabs = [
    { id: "tickets", label: "Meus Tickets", icon: MessageCircle },
    { id: "faqs", label: "Perguntas Frequentes", icon: HelpCircle },
    { id: "contact", label: "Contato", icon: Phone },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" role="status" aria-label="Carregando suporte">
            <span className="sr-only">Carregando suporte...</span>
          </div>
          <p className="text-muted-foreground">
            Carregando suporte...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <HelpCircle className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Central de Suporte
              </h1>
              <p className="text-muted-foreground">
                Estamos aqui para ajudar você
              </p>
            </div>
          </div>

          <Button 
            variant="outline"
            onClick={() => loadSupportData()}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>

        {/* Tabs */}
        {!selectedTicket && (
          <div className="flex space-x-1 bg-muted p-1 rounded-lg mb-6">
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
                </button>
              );
            })}
          </div>
        )}

        {/* Filtros e Busca */}
        {!selectedTicket && (
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {activeTab === "tickets" && (
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 border border-border rounded-md text-sm"
              >
                <option value="all">Todos os status</option>
                {supportData.statuses?.map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Content */}
        {selectedTicket ? (
          renderTicketDetail()
        ) : (
          <>
            {activeTab === "tickets" && renderTickets()}
            {activeTab === "faqs" && renderFaqs()}
            {activeTab === "contact" && renderContactMethods()}
          </>
        )}

        {/* Create Ticket Modal */}
        {showCreateTicket && renderCreateTicket()}
      </div>
    </div>
  );
};
