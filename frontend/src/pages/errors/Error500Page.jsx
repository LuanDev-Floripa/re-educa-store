import React from "react";
import { Link } from "react-router-dom";
import { Home, RefreshCw, Mail } from "lucide-react";

/**
 * Error500Page
 * Página de erro 500 com ações de recarregar e suporte.
 */
export default function Error500Page() {
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-muted dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        {/* Ilustração 500 */}
        <div className="mb-8 relative">
          <div className="text-[150px] md:text-[200px] font-bold text-gradient-error-orange leading-none">
            500
          </div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="text-6xl animate-bounce" aria-hidden="true">😵</div>
          </div>
        </div>

        {/* Mensagem */}
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          Erro Interno do Servidor
        </h1>

        <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
          Desculpe! Algo deu errado no nosso lado. Nossa equipe já foi
          notificada e está trabalhando para resolver.
        </p>

        {/* Ações */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <button
            onClick={handleReload}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-error-orange text-white rounded-lg font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200"
          >
            <RefreshCw size={20} />
            Tentar Novamente
          </button>

          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-background text-foreground rounded-lg font-semibold border-2 border-border hover:border-error hover:shadow-lg transition-all duration-200"
          >
            <Home size={20} />
            Voltar ao Início
          </Link>
        </div>

        {/* Informações Técnicas */}
        <div className="bg-white bg-background rounded-2xl shadow-xl p-8 border border-border dark:border-gray-700 mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            O que aconteceu?
          </h2>

          <div className="text-left space-y-3 text-muted-foreground">
            <p className="flex items-start gap-2">
              <span className="text-destructive">•</span>
              <span>Nosso servidor encontrou um problema inesperado</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-destructive">•</span>
              <span>Sua solicitação não pôde ser completada</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-destructive">•</span>
              <span>Nossa equipe foi notificada e está trabalhando na correção</span>
            </p>
          </div>
        </div>

        {/* Suporte */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-6 border border-blue-100 border-border">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Mail className="text-primary dark:text-blue-400" size={24} />
            <h3 className="text-lg font-semibold text-foreground">
              Precisa de ajuda imediata?
            </h3>
          </div>
          <p className="text-muted-foreground mb-4">
            Se o problema persistir, entre em contato com nosso suporte
          </p>
          <a
            href="mailto:suporte@re-educa.com"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Contatar Suporte
          </a>
        </div>

        {/* Footer */}
        <p className="mt-8 text-sm text-muted-foreground">
          Código de erro: 500 | Erro interno do servidor
        </p>
      </div>
    </div>
  );
}
