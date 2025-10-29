import React from 'react';
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { cn } from '../../lib/utils';

export const ErrorBoundary = ({ children }) => {
  const [hasError, setHasError] = React.useState(false);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const handleError = (error, errorInfo) => {
      console.error('Error caught by boundary:', error, errorInfo);
      setError(error);
      setHasError(true);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', (event) => {
      handleError(event.reason, { type: 'unhandledrejection' });
    });

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleError);
    };
  }, []);

  if (hasError) {
    return <ErrorFallback error={error} />;
  }

  return children;
};

export const ErrorFallback = ({ error, resetErrorBoundary }) => {
  const handleRetry = () => {
    if (resetErrorBoundary) {
      resetErrorBoundary();
    } else {
      window.location.reload();
    }
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
            Ops! Algo deu errado
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Encontramos um problema inesperado. Tente novamente ou entre em contato conosco.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-700 dark:text-red-300">
                {error.message || 'Erro desconhecido'}
              </p>
            </div>
          )}
          
          <div className="flex flex-col space-y-2">
            <Button onClick={handleRetry} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Tentar Novamente
            </Button>
            
            <div className="flex space-x-2">
              <Button variant="outline" onClick={handleGoBack} className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <Button variant="outline" onClick={handleGoHome} className="flex-1">
                <Home className="w-4 h-4 mr-2" />
                Início
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export const ErrorMessage = ({ 
  title = 'Erro', 
  message, 
  error, 
  onRetry, 
  className,
  variant = 'default' 
}) => {
  const variants = {
    default: 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300',
    warning: 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300',
    info: 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300',
  };

  return (
    <div className={cn(
      'border rounded-lg p-4',
      variants[variant],
      className
    )}>
      <div className="flex items-start">
        <AlertTriangle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-medium">{title}</h3>
          {message && (
            <p className="mt-1 text-sm">{message}</p>
          )}
          {error && (
            <details className="mt-2">
              <summary className="cursor-pointer text-sm font-medium">
                Detalhes do erro
              </summary>
              <pre className="mt-2 text-xs bg-black/10 dark:bg-white/10 rounded p-2 overflow-x-auto">
                {error.message || error}
              </pre>
            </details>
          )}
          {onRetry && (
            <Button
              size="sm"
              variant="outline"
              onClick={onRetry}
              className="mt-3"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Tentar Novamente
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export const NetworkError = ({ onRetry }) => {
  return (
    <ErrorMessage
      title="Erro de Conexão"
      message="Não foi possível conectar ao servidor. Verifique sua conexão com a internet e tente novamente."
      onRetry={onRetry}
      variant="warning"
    />
  );
};

export const NotFoundError = ({ resource = 'página' }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-gray-600 dark:text-gray-400" />
          </div>
          <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
            Página não encontrada
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            A {resource} que você está procurando não existe ou foi movida.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => window.history.back()} className="flex-1">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <Button onClick={() => window.location.href = '/'} className="flex-1">
              <Home className="w-4 h-4 mr-2" />
              Início
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};