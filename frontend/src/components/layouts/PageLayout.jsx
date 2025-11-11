/**
 * PageLayout Component - RE-EDUCA Store
 * 
 * Layout base para páginas com header, footer e sidebar opcionais.
 * 
 * Funcionalidades:
 * - Layout flexível com componentes opcionais
 * - Header e Footer configuráveis
 * - Sidebar opcional
 * - Layouts específicos (User, Auth)
 * 
 * @component
 * @param {Object} props - Props do componente
 * @param {React.ReactNode} props.children - Conteúdo a ser renderizado
 * @param {boolean} [props.showHeader=true] - Mostrar header
 * @param {boolean} [props.showFooter=true] - Mostrar footer
 * @param {boolean} [props.showSidebar=false] - Mostrar sidebar
 * @param {string} [props.className] - Classes CSS adicionais
 * @returns {JSX.Element} Layout completo da página
 */
import React from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { UserSidebar } from "./UserSidebar";
import { UserLayout } from "./UserLayout";
import { cn } from "../../lib/utils";
import { H2 } from "@/components/Ui/typography";

export const PageLayout = ({
  children,
  showHeader = true,
  showFooter = true,
  showSidebar = false,
  className,
  ...props
}) => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      {showHeader && <Header />}

      {/* Main Content */}
      <div className="flex">
        {/* Sidebar */}
        {showSidebar && <UserSidebar />}

        {/* Content */}
        <main id="main-content" className={cn("flex-1", className)} {...props}>
          {children}
        </main>
      </div>

      {/* Footer */}
      {showFooter && <Footer />}
    </div>
  );
};

// Layout para usuários comuns (com sidebar de ferramentas de saúde)
export const UserLayoutWrapper = ({ children }) => {
  return <UserLayout>{children}</UserLayout>;
};

// Layout para páginas de autenticação
export const AuthLayout = ({ children, className, ...props }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center p-4">
      <div className={cn("w-full max-w-md", className)} {...props}>
        {children}
      </div>
    </div>
  );
};

// Layout para dashboard
export const DashboardLayout = ({ children, className, ...props }) => {
  return (
    <PageLayout
      showSidebar={true}
      className={cn("bg-muted", className)}
      {...props}
    >
      <div className="p-8">{children}</div>
    </PageLayout>
  );
};

// Layout para páginas de conteúdo
export const ContentLayout = ({ children, className, ...props }) => {
  return (
    <PageLayout
      showSidebar={false}
      className={cn("bg-background", className)}
      {...props}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </div>
    </PageLayout>
  );
};

// Layout para páginas de admin
export const AdminLayout = ({ children, className, ...props }) => {
  return (
    <PageLayout
      showSidebar={true}
      className={cn("bg-muted", className)}
      {...props}
    >
      <div className="p-8">
        <div className="bg-card rounded-2xl border border-border/30 shadow-[0_1px_2px_0_rgba(0,0,0,0.05),0_1px_3px_0_rgba(0,0,0,0.1)] p-8">
          {children}
        </div>
      </div>
    </PageLayout>
  );
};
