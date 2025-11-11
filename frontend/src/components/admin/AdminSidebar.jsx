/**
 * AdminSidebar Component - RE-EDUCA Store
 * 
 * Sidebar de navegação para área administrativa.
 * 
 * Funcionalidades:
 * - Navegação entre páginas admin
 * - Destaque de item ativo
 * - Ícones para cada seção
 * - Link de retorno para home
 * 
 * @component
 * @returns {JSX.Element} Sidebar de navegação administrativa
 */
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "../../lib/utils";
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingBag,
  BarChart3,
  Settings,
  FileText,
  TrendingUp,
  DollarSign,
  UserCheck,
  AlertCircle,
  Bell,
  ArrowLeft,
  Home,
  Tag,
  Brain,
  Dumbbell,
  Shield,
  UserCog,
} from "lucide-react";

const AdminSidebar = () => {
  const location = useLocation();

  const navigation = [
    {
      name: "Dashboard",
      href: "/admin",
      icon: LayoutDashboard,
      current: location.pathname === "/admin",
    },
    {
      name: "Usuários",
      href: "/admin/users",
      icon: Users,
      current: location.pathname.startsWith("/admin/users"),
    },
    {
      name: "Produtos",
      href: "/admin/products",
      icon: Package,
      current: location.pathname.startsWith("/admin/products"),
    },
    {
      name: "Estoque",
      href: "/admin/inventory",
      icon: Package,
      current: location.pathname.startsWith("/admin/inventory"),
    },
    {
      name: "Cupons",
      href: "/admin/coupons",
      icon: Tag,
      current: location.pathname.startsWith("/admin/coupons"),
    },
    {
      name: "Promoções",
      href: "/admin/promotions",
      icon: Tag,
      current: location.pathname.startsWith("/admin/promotions"),
    },
    {
      name: "Pedidos",
      href: "/admin/orders",
      icon: ShoppingBag,
      current: location.pathname.startsWith("/admin/orders"),
    },
    {
      name: "Afiliados",
      href: "/admin/affiliates",
      icon: UserCog,
      current: location.pathname.startsWith("/admin/affiliates"),
    },
    {
      name: "Analytics",
      href: "/admin/analytics",
      icon: BarChart3,
      current: location.pathname.startsWith("/admin/analytics"),
    },
    {
      name: "Relatórios",
      href: "/admin/reports",
      icon: FileText,
      current: location.pathname.startsWith("/admin/reports"),
    },
    {
      name: "Logs",
      href: "/admin/logs",
      icon: FileText,
      current: location.pathname.startsWith("/admin/logs"),
    },
    {
      name: "Configuração de IA",
      href: "/admin/ai-config",
      icon: Brain,
      current: location.pathname.startsWith("/admin/ai-config"),
    },
    {
      name: "Exercícios e Planos",
      href: "/admin/exercises",
      icon: Dumbbell,
      current: location.pathname.startsWith("/admin/exercises"),
    },
    {
      name: "Moderação Social",
      href: "/admin/social/moderation",
      icon: Shield,
      current: location.pathname.startsWith("/admin/social/moderation"),
    },
    {
      name: "Configurações",
      href: "/admin/settings",
      icon: Settings,
      current: location.pathname.startsWith("/admin/settings"),
    },
  ];

  const quickStats = [
    {
      name: "Usuários Ativos",
      value: "892",
      icon: UserCheck,
      color: "text-primary",
    },
    {
      name: "Pedidos Pendentes",
      value: "23",
      icon: AlertCircle,
      color: "text-primary",
    },
    {
      name: "Receita Hoje",
      value: "R$ 2.450",
      icon: TrendingUp,
      color: "text-primary",
    },
    {
      name: "Notificações",
      value: "5",
      icon: Bell,
      color: "text-destructive",
    },
  ];

  return (
    <div className="flex flex-col w-64 bg-card border-r border-border h-full">
      {/* Header */}
      <div className="flex items-center justify-center h-16 px-4 border-b border-border">
        <h1 className="text-xl font-bold text-foreground">
          Admin Panel
        </h1>
      </div>

      {/* Quick Stats */}
      <div className="p-4 border-b border-border">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">
          Resumo Rápido
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {quickStats.map((stat) => (
            <div
              key={stat.name}
              className="text-center p-2 bg-muted rounded-lg"
            >
              <stat.icon className={`w-4 h-4 mx-auto mb-1 ${stat.color}`} />
              <div className="text-xs font-medium text-foreground">
                {stat.value}
              </div>
              <div className="text-xs text-muted-foreground">
                {stat.name}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1">
        {navigation.map((item) => (
          <Link
            key={item.name}
            to={item.href}
            className={cn(
              "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
              item.current
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            <item.icon
              className={cn(
                "mr-3 h-5 w-5 flex-shrink-0",
                item.current
                  ? "text-foreground"
                  : "text-muted-foreground group-hover:text-foreground",
              )}
            />
            {item.name}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border space-y-3">
        <Link
          to="/dashboard"
          className="flex items-center space-x-2 w-full px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground rounded-md transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar ao Dashboard</span>
        </Link>

        <div className="text-xs text-muted-foreground text-center">
          RE-EDUCA Admin v2.0
        </div>
      </div>
    </div>
  );
};

export default AdminSidebar;
