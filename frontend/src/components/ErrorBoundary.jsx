/**
 * Error Boundary Component
 * Captura erros em qualquer componente filho e exibe UI de fallback
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import logger from '../utils/logger';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from './Ui/button';

class ErrorBoundaryClass extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Atualiza o estado para exibir UI de fallback
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log do erro
    logger.error('Error Boundary caught an error:', {
      error: error.toString(),
      errorInfo: errorInfo.componentStack,
      url: window.location.href
    });

    this.setState(prevState => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));

    // Em produção, enviar para serviço de monitoramento (Sentry, etc)
    if (import.meta.env.PROD && window.Sentry) {
      window.Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack
          }
        }
      });
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    if (this.props.navigate) {
      this.props.navigate('/');
    } else {
      // Fallback de segurança caso navigate não esteja disponível
      window.location.href = '/';
    }
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, errorCount } = this.state;
      const { fallback } = this.props;

      // Se fornecido fallback customizado, usa ele
      if (fallback) {
        return fallback({
          error,
          errorInfo,
          resetError: this.handleReset
        });
      }

      // UI padrão de erro
      return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
          <div className="max-w-md w-full bg-card rounded-lg shadow-lg p-6 sm:p-8">
            <div className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 mx-auto bg-destructive/10 rounded-full mb-4">
              <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-destructive" />
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-center text-foreground mb-2">
              Ops! Algo deu errado
            </h1>

            <p className="text-center text-sm sm:text-base text-muted-foreground mb-6">
              Desculpe pelo inconveniente. Ocorreu um erro inesperado.
            </p>

            {/* Detalhes do erro (apenas em desenvolvimento) */}
            {import.meta.env.DEV && error && (
              <details className="mb-6 p-4 bg-muted rounded-lg">
                <summary className="cursor-pointer font-medium text-sm text-foreground mb-2">
                  Detalhes do erro (dev only)
                </summary>
                <div className="mt-2 text-xs font-mono text-muted-foreground overflow-auto max-h-40">
                  <p className="text-destructive font-bold mb-2">
                    {error.toString()}
                  </p>
                  {errorInfo && (
                    <pre className="whitespace-pre-wrap break-words">
                      {errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              </details>
            )}

            {/* Aviso se erro persistir */}
            {errorCount > 2 && (
              <div className="mb-6 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                <p className="text-sm text-foreground">
                  ⚠️ O erro está ocorrendo repetidamente. Recomendamos limpar o cache ou entrar em contato com o suporte.
                </p>
              </div>
            )}

            {/* Ações */}
            <div className="space-y-2">
              <Button
                onClick={this.handleReset}
                className="w-full"
                variant="default"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Tentar Novamente
              </Button>

              <Button
                onClick={this.handleReload}
                className="w-full"
                variant="outline"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Recarregar Página
              </Button>

              <Button
                onClick={this.handleGoHome}
                className="w-full"
                variant="ghost"
              >
                <Home className="w-4 h-4 mr-2" />
                Voltar para Home
              </Button>
            </div>

            {/* Informações de suporte */}
            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-xs text-center text-muted-foreground">
                Se o problema persistir, entre em contato com o suporte.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrapper funcional para usar useNavigate
const ErrorBoundary = (props) => {
  const navigate = useNavigate();
  return <ErrorBoundaryClass {...props} navigate={navigate} />;
};

export default ErrorBoundary;
