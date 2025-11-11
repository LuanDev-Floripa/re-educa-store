import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Home, Search, ArrowLeft, MessageCircle } from "lucide-react";
import { Button } from "@/components/Ui/button";

/**
 * Error404Page
 * Página de erro 404 com ações de navegação e sugestões.
 */
export default function Error404Page() {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        {/* Ilustração 404 */}
        <div className="mb-8 relative">
          <div className="text-[150px] md:text-[200px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 leading-none">
            404
          </div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="text-6xl animate-bounce" aria-hidden="true">🤔</div>
          </div>
        </div>

        {/* Mensagem */}
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          Página Não Encontrada
        </h1>

        <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
          Ops! Parece que a página que você está procurando não existe ou foi
          movida.
        </p>

        {/* Ações */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-primary-purple text-white rounded-lg font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200"
          >
            <Home size={20} />
            Voltar ao Início
          </Link>

          <Button
            variant="outline"
            onClick={() => {
              if (window?.history?.back) {
                window.history.back();
              } else {
                navigate("/");
              }
            }}
            className="inline-flex items-center gap-2"
          >
            <ArrowLeft size={20} />
            Voltar
          </Button>
        </div>

        {/* Sugestões */}
        <div className="bg-white bg-background rounded-2xl shadow-xl p-8 border border-border dark:border-gray-700">
          <h2 className="text-xl font-semibold text-foreground mb-6">
            Que tal explorar?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/catalog"
              className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-primary/10 dark:hover:bg-gray-700 transition-colors group"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Search
                  className="text-primary"
                  size={24}
                />
              </div>
              <span className="font-medium text-foreground">
                Catálogo
              </span>
              <span className="text-sm text-muted-foreground dark:text-muted-foreground text-center">
                Explore nossos produtos
              </span>
            </Link>

            <Link
              to="/tools"
              className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-primary/10 dark:hover:bg-gray-700 transition-colors group"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="text-2xl">🧮</span>
              </div>
              <span className="font-medium text-foreground">
                Calculadoras
              </span>
              <span className="text-sm text-muted-foreground dark:text-muted-foreground text-center">
                Ferramentas de saúde
              </span>
            </Link>

            <Link
              to="/login"
              className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-primary/10 transition-colors group"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <MessageCircle
                  className="text-primary"
                  size={24}
                />
              </div>
              <span className="font-medium text-foreground">
                Suporte
              </span>
              <span className="text-sm text-muted-foreground dark:text-muted-foreground text-center">
                Precisa de ajuda?
              </span>
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-8 text-sm text-muted-foreground">
          Código de erro: 404 | Página não encontrada
        </p>
      </div>
    </div>
  );
}
