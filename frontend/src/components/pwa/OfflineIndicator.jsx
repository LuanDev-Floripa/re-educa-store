import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/Ui/alert';
import { Button } from '@/components/Ui/button';
import { Badge } from '@/components/Ui/badge';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Download,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';

const OfflineIndicator = () => {
  const { isOnline, syncOfflineData } = usePWA();
  const [showIndicator, setShowIndicator] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);

  useEffect(() => {
    // Mostra indicador quando fica offline
    if (!isOnline) {
      setShowIndicator(true);
    } else {
      // Esconde após 3 segundos quando volta online
      const timer = setTimeout(() => {
        setShowIndicator(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await syncOfflineData();
      setLastSync(new Date());
    } catch (error) {
      console.error('Erro na sincronização:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const formatLastSync = (date) => {
    if (!date) return null;
    
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Agora mesmo';
    if (minutes < 60) return `${minutes} min atrás`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h atrás`;
    
    const days = Math.floor(hours / 24);
    return `${days} dias atrás`;
  };

  if (!showIndicator) {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 right-4 z-50 max-w-md mx-auto">
      <Alert className={`border-2 ${
        isOnline 
          ? 'border-green-200 bg-green-50 dark:bg-green-950' 
          : 'border-orange-200 bg-orange-50 dark:bg-orange-950'
      }`}>
        <div className="flex items-center gap-2">
          {isOnline ? (
            <CheckCircle className="w-4 h-4 text-green-600" />
          ) : (
            <WifiOff className="w-4 h-4 text-orange-600" />
          )}
          
          <AlertDescription className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  {isOnline ? 'Conexão restaurada!' : 'Você está offline'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isOnline 
                    ? 'Todas as funcionalidades estão disponíveis'
                    : 'Algumas funcionalidades podem estar limitadas'
                  }
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                {!isOnline && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSync}
                    disabled={isSyncing}
                    className="h-8"
                  >
                    {isSyncing ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                      <Download className="w-3 h-3" />
                    )}
                  </Button>
                )}
                
                <Badge variant={isOnline ? 'default' : 'secondary'} className="text-xs">
                  {isOnline ? 'Online' : 'Offline'}
                </Badge>
              </div>
            </div>
            
            {lastSync && (
              <p className="text-xs text-muted-foreground mt-1">
                Última sincronização: {formatLastSync(lastSync)}
              </p>
            )}
          </AlertDescription>
        </div>
      </Alert>
    </div>
  );
};

export default OfflineIndicator;