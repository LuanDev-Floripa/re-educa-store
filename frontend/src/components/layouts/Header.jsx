/**
 * Header Component - RE-EDUCA Store
 * 
 * Cabeçalho principal do site com navegação.
 * 
 * Funcionalidades:
 * - Menu de navegação responsivo
 * - Botão de calculadora de IMC
 * - Botão de carrinho
 * - Autenticação e perfil
 * - Notificações
 * - Menu mobile
 * 
 * @component
 * @param {Object} props - Props do componente
 * @param {Function} [props.onMenuClick] - Callback para clique no menu mobile
 * @returns {JSX.Element} Cabeçalho completo
 */
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/Ui/button";
import { useAuth } from "../../hooks/useAuth.jsx";
// import CartButton from "../cart/CartButton"; // Substituído por UnifiedAIAssistant
import IMCCalculatorPopup from "../tools/IMCCalculatorPopup";
import { Heart, User, Menu, X, Bell, Calculator } from "lucide-react";
import { cn } from "../../lib/utils";

export const Header = ({ onMenuClick }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);

  const navigation = [
    { name: "Início", href: "/" },
    { name: "Catálogo", href: "/catalog" },
    { name: "Ferramentas", href: "/tools" },
    { name: "Loja", href: "/store" },
    { name: "Sobre", href: "/about" },
  ];

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
  };

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Left side - Calculator and Logo */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Calculator Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCalculatorOpen(true)}
              className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              title="Calculadora de IMC"
            >
              <Calculator className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>

            {/* Logo */}
            <Link to="/" className="flex items-center space-x-1 sm:space-x-2">
              <Heart className="h-6 w-6 sm:h-8 sm:w-8 text-red-500" />
              <span className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                RE-EDUCA
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-gray-900 dark:hover:text-white",
                  location.pathname === item.href
                    ? "text-gray-900 dark:text-white"
                    : "text-gray-700 dark:text-gray-300",
                )}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-3 lg:space-x-4">
            {/* Notifications */}
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Bell className="h-4 w-4 lg:h-5 lg:w-5" />
            </Button>

            {/* Cart */}
            {/* <CartButton /> - Substituído por UnifiedAIAssistant (popup unificado) */}

            {/* User Menu */}
            {isAuthenticated ? (
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                  <User className="h-5 w-5" />
                </Button>

                {/* User Dropdown */}
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {user?.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {user?.email}
                      </p>
                    </div>

                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Perfil
                    </Link>

                    <Link
                      to="/settings"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Configurações
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Sair
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/login">
                  <Button variant="ghost">Entrar</Button>
                </Link>
                <Link to="/register">
                  <Button>Cadastrar</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={onMenuClick || (() => setIsMenuOpen(!isMenuOpen))}
              className="h-8 w-8"
            >
              {isMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-3 pt-2 pb-3 space-y-1 border-t border-gray-200 dark:border-gray-700">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    location.pathname === item.href
                      ? "text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700"
                      : "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800",
                  )}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}

              {isAuthenticated ? (
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {user?.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {user?.email}
                    </p>
                  </div>

                  <Link
                    to="/profile"
                    className="block px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Perfil
                  </Link>

                  <Link
                    to="/settings"
                    className="block px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Configurações
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-3 py-2.5 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                  >
                    Sair
                  </button>
                </div>
              ) : (
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700 space-y-1">
                  <Link
                    to="/login"
                    className="block px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Entrar
                  </Link>
                  <Link
                    to="/register"
                    className="block px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Cadastrar
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* IMC Calculator Popup */}
      <IMCCalculatorPopup
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
      />
    </header>
  );
};
