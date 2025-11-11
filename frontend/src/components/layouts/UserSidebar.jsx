import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Calculator,
  Calendar,
  Activity,
  ShoppingCart,
  Settings,
  BarChart3,
  Heart,
  Target,
  BookOpen,
  Zap,
  Crown,
  Dumbbell,
  Moon,
  Droplets,
  Brain,
  Clock,
  TrendingUp,
  Package,
  CreditCard,
  User,
  LogOut,
  Users,
  MessageCircle,
  Bell,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useAuth } from "../../hooks/useAuth.jsx";
import { H3 } from "@/components/Ui/typography";

/**
 * Sidebar de navegação do usuário.
 * - Suporta colapso em desktop e overlay em mobile
 * - Exibe seções de navegação com estado ativo e descrição
 */
export const UserSidebar = ({
  isMobile = false,
  onClose,
  onCollapseChange,
}) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  // Comunicar estado inicial
  React.useEffect(() => {
    if (onCollapseChange) {
      onCollapseChange(isCollapsed);
    }
  }, [isCollapsed, onCollapseChange]);

  const handleCollapseToggle = () => {
    if (isMobile) return; // Não permitir colapso em mobile

    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    if (onCollapseChange) {
      onCollapseChange(newCollapsed);
    }
  };

  const navigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: Home,
      description: "Seu painel pessoal de saúde",
    },
    {
      name: "Ferramentas",
      href: "/tools",
      icon: Calculator,
      description: "Calculadoras e ferramentas",
    },
    {
      name: "IA Assistant",
      href: "/ai",
      icon: Brain,
      description: "Assistente inteligente",
    },
  ];

  const healthTools = [
    {
      name: "Calculadora IMC",
      href: "/tools/imc",
      icon: Calculator,
      description: "Índice de massa corporal",
    },
    {
      name: "Diário Alimentar",
      href: "/tools/food-diary",
      icon: Calendar,
      description: "Registre suas refeições",
    },
    {
      name: "Exercícios",
      href: "/tools/exercises",
      icon: Activity,
      description: "Biblioteca de exercícios",
    },
    {
      name: "Planos de Treino",
      href: "/tools/workout-plans",
      icon: Dumbbell,
      description: "Planos personalizados",
    },
    {
      name: "Sessões de Treino",
      href: "/tools/workout-sessions",
      icon: Target,
      description: "Acompanhe seus treinos",
    },
  ];

  const calculators = [
    {
      name: "Calculadora de Calorias",
      href: "/tools/calorie-calculator",
      icon: Zap,
      description: "Necessidades calóricas",
    },
    {
      name: "Calculadora de Metabolismo",
      href: "/tools/metabolism-calculator",
      icon: Brain,
      description: "Análise do metabolismo",
    },
    {
      name: "Calculadora de Hidratação",
      href: "/tools/hydration-calculator",
      icon: Droplets,
      description: "Necessidades de água",
    },
    {
      name: "Calculadora de Sono",
      href: "/tools/sleep-calculator",
      icon: Moon,
      description: "Qualidade do sono",
    },
    {
      name: "Calculadora de Estresse",
      href: "/tools/stress-calculator",
      icon: Heart,
      description: "Nível de estresse",
    },
    {
      name: "Idade Biológica",
      href: "/tools/biological-age-calculator",
      icon: Clock,
      description: "Sua idade real",
    },
  ];

  const storeNavigation = [
    {
      name: "Loja",
      href: "/store",
      icon: Package,
      description: "Suplementos e produtos",
    },
    {
      name: "Carrinho",
      href: "/store/cart",
      icon: ShoppingCart,
      description: "Seus itens selecionados",
    },
    {
      name: "Meus Pedidos",
      href: "/store/orders",
      icon: CreditCard,
      description: "Histórico de compras",
    },
  ];

  const userNavigation = [
    {
      name: "Perfil",
      href: "/profile",
      icon: User,
      description: "Seus dados pessoais",
    },
    {
      name: "Configurações",
      href: "/settings",
      icon: Settings,
      description: "Preferências da conta",
    },
  ];

  const socialNavigation = [
    {
      name: "Feed",
      href: "/social",
      icon: MessageCircle,
      description: "Feed principal",
    },
    {
      name: "Mensagens",
      href: "/social?tab=messages",
      icon: MessageCircle,
      description: "Mensagens diretas",
    },
    {
      name: "Notificações",
      href: "/social?tab=notifications",
      icon: Bell,
      description: "Suas notificações",
    },
    {
      name: "Grupos",
      href: "/social?tab=groups",
      icon: Users,
      description: "Grupos e comunidades",
    },
  ];

  const handleLogout = () => {
    logout();
  };

  const isActive = (href) => {
    return (
      location.pathname === href || location.pathname.startsWith(href + "/")
    );
  };

  const NavItem = ({ item, level = 0 }) => (
    <Link
      to={item.href}
      onClick={() => {
        if (isMobile && onClose) {
          onClose();
        }
      }}
      className={cn(
        "flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]",
        "hover:bg-accent/50 hover:text-accent-foreground",
        isActive(item.href)
          ? "bg-accent/80 text-accent-foreground"
          : "text-foreground",
        level > 0 && "ml-4",
      )}
      aria-current={isActive(item.href) ? "page" : undefined}
    >
      <item.icon className="h-5 w-5 flex-shrink-0" />
      {(!isCollapsed || isMobile) && (
        <div className="flex-1 min-w-0">
          <div className="truncate">{item.name}</div>
          {item.description && (
            <div className="text-xs text-muted-foreground truncate">
              {item.description}
            </div>
          )}
        </div>
      )}
    </Link>
  );

  const NavSection = ({ title, items, level = 0 }) => (
    <div className="space-y-1">
      {(!isCollapsed || isMobile) && title && (
        <H3 className="px-3 text-xs uppercase tracking-wider">
          {title}
        </H3>
      )}
      <div className="space-y-1">
        {items.map((item) => (
          <NavItem key={item.href} item={item} level={level} />
        ))}
      </div>
    </div>
  );

  return (
    <div
      className={cn(
        "flex h-full flex-col bg-card/95 backdrop-blur-xl border-r border-border/30",
        isCollapsed && !isMobile ? "w-16" : "w-64",
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-end px-5 border-b border-border/30">
        {!isMobile && (
          <button
            onClick={handleCollapseToggle}
            className="p-1.5 rounded-md hover:bg-accent transition-colors"
          >
            <div className="h-4 w-4">
              <div
                className={cn(
                  "h-0.5 w-4 bg-foreground transition-all duration-200",
                  isCollapsed
                    ? "rotate-0 translate-y-0"
                    : "rotate-45 translate-y-1.5",
                )}
              />
              <div
                className={cn(
                  "h-0.5 w-4 bg-foreground transition-all duration-200 mt-1",
                  isCollapsed ? "opacity-100" : "opacity-0",
                )}
              />
              <div
                className={cn(
                  "h-0.5 w-4 bg-foreground transition-all duration-200 mt-1",
                  isCollapsed
                    ? "rotate-0 -translate-y-0"
                    : "-rotate-45 -translate-y-1.5",
                )}
              />
            </div>
          </button>
        )}
      </div>

      {/* User Info */}
      {(!isCollapsed || isMobile) && user && (
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user.name || user.email}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user.email}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav
        className="flex-1 space-y-8 px-4 py-6 overflow-y-auto"
        role="navigation"
        aria-label="Navegação do usuário"
      >
        <NavSection title="Principal" items={navigation} />

        <NavSection title="Rede Social" items={socialNavigation} />

        <NavSection title="Ferramentas de Saúde" items={healthTools} />

        <NavSection title="Calculadoras" items={calculators} />

        <NavSection title="Loja" items={storeNavigation} />

        <NavSection title="Conta" items={userNavigation} />
      </nav>

      {/* Footer */}
      <div className="border-t border-border/30 p-4">
        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center gap-3 w-full rounded-lg px-4 py-2.5 text-sm font-medium",
            "text-destructive hover:bg-destructive/10",
            "transition-colors duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]",
          )}
          aria-label="Sair da conta"
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {(!isCollapsed || isMobile) && <span>Sair</span>}
        </button>
      </div>
    </div>
  );
};
