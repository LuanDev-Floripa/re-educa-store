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
      name: "Cupons",
      href: "/admin/coupons",
      icon: Tag,
      current: location.pathname.startsWith("/admin/coupons"),
    },
    {
      name: "Pedidos",
      href: "/admin/orders",
      icon: ShoppingBag,
      current: location.pathname.startsWith("/admin/orders"),
    },
    {
      name: "Analytics",
      href: "/admin/analytics",
      icon: BarChart3,
      current: location.pathname.startsWith("/admin/analytics"),
    },
    {
      name: "Configuração de IA",
      href: "/admin/ai-config",
      icon: Brain,
      current: location.pathname.startsWith("/admin/ai-config"),
    },
  ];

  const quickStats = [
    {
      name: "Usuários Ativos",
      value: "892",
      icon: UserCheck,
      color: "text-green-600",
    },
    {
      name: "Pedidos Pendentes",
      value: "23",
      icon: AlertCircle,
      color: "text-yellow-600",
    },
    {
      name: "Receita Hoje",
      value: "R$ 2.450",
      icon: TrendingUp,
      color: "text-blue-600",
    },
    {
      name: "Notificações",
      value: "5",
      icon: Bell,
      color: "text-red-600",
    },
  ];

  return (
    <div className="flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-full">
      {/* Header */}
      <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          Admin Panel
        </h1>
      </div>

      {/* Quick Stats */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
          Resumo Rápido
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {quickStats.map((stat) => (
            <div
              key={stat.name}
              className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <stat.icon className={`w-4 h-4 mx-auto mb-1 ${stat.color}`} />
              <div className="text-xs font-medium text-gray-900 dark:text-white">
                {stat.value}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
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
                ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white",
            )}
          >
            <item.icon
              className={cn(
                "mr-3 h-5 w-5 flex-shrink-0",
                item.current
                  ? "text-gray-500 dark:text-gray-300"
                  : "text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-300",
              )}
            />
            {item.name}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
        <Link
          to="/dashboard"
          className="flex items-center space-x-2 w-full px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar ao Dashboard</span>
        </Link>

        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          RE-EDUCA Admin v2.0
        </div>
      </div>
    </div>
  );
};

export default AdminSidebar;
