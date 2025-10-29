import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/Ui/card';
import { Button } from '@/components/Ui/button';
import { Badge } from '@/components/Ui/badge';
import { 
  Download, 
  X, 
  Smartphone, 
  Monitor,
  Wifi,
  WifiOff,
  Bell,
  BellOff,
  RefreshCw
} from 'lucide-react';
import { usePWA, useOfflineCache, useAppUpdates } from '@/hooks/usePWA';
import { toast } from 'sonner';

const InstallPrompt = () => {
  const {
    isOnline,
    isInstalled,
    canInstall,
    notificationPermission,
    installPWA,
    requestNotificationPermission,
    sendNotification,
    syncOfflineData
  } = usePWA();
  
  const { cacheStatus, clearCache } = useOfflineCache();
  
  // Usar cacheStatus e clearCache
  const handleClearCache = async () => {
    try {
      await clearCache();
      toast.success('Cache limpo com sucesso!');
      
      // Registrar limpeza de cache na API
      const token = localStorage.getItem('token');
      if (token) {
        await fetch('/api/analytics/cache-clear', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            timestamp: new Date().toISOString(),
            cacheSize: cacheStatus?.size || 0
          })
        });
      }
    } catch (error) {
      console.error('Erro ao limpar cache:', error);
      toast.error('Erro ao limpar cache');
    }
  };
  const { updateAvailable, isUpdating, applyUpdate } = useAppUpdates();
  
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Mostra prompt de instalação se não estiver instalado e puder instalar
    if (canInstall && !isInstalled && !dismissed) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000); // Mostra após 3 segundos
      
      return () => clearTimeout(timer);
    }
  }, [canInstall, isInstalled, dismissed]);

  const handleInstall = async () => {
    try {
      const success = await installPWA();
      if (success) {
        setShowPrompt(false);
        toast.success('App instalado com sucesso!');
        
        // Registrar instalação na API
        const token = localStorage.getItem('token');
        if (token) {
          await fetch('/api/analytics/pwa-install', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              platform: navigator.platform,
              userAgent: navigator.userAgent,
              timestamp: new Date().toISOString()
            })
          });
        }
      } else {
        toast.error('Erro ao instalar o app');
      }
    } catch (error) {
      console.error('Erro na instalação:', error);
      toast.error('Erro ao instalar o app');
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    // Salva no localStorage para não mostrar novamente
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  const handleNotificationToggle = async () => {
    if (notificationPermission === 'granted') {
      // Testa notificação
      sendNotification('RE-EDUCA Store', {
        body: 'Notificações funcionando perfeitamente!',
        tag: 'test'
      });
    } else {
      await requestNotificationPermission();
    }
  };

  const handleSync = async () => {
    await syncOfflineData();
  };

  const handleUpdate = async () => {
    await applyUpdate();
  };

  // Não mostra se já foi dispensado
  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed === 'true') {
      setDismissed(true);
    }
  }, []);

  if (!showPrompt && !updateAvailable) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      {/* Prompt de Instalação */}
      {showPrompt && (
        <Card className="mb-4 shadow-lg border-2 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Download className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Instalar RE-EDUCA Store</h3>
                  <p className="text-sm text-muted-foreground">
                    Acesso rápido e funcionalidades offline
                  </p>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Status do Cache: {cacheStatus}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="h-6 w-6 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <Smartphone className="w-4 h-4 text-green-500" />
                <span>Acesso direto da tela inicial</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <WifiOff className="w-4 h-4 text-blue-500" />
                <span>Funciona offline</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Bell className="w-4 h-4 text-purple-500" />
                <span>Notificações personalizadas</span>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleInstall} className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Instalar
              </Button>
              <Button variant="outline" onClick={handleClearCache}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Limpar Cache
              </Button>
              <Button variant="outline" onClick={handleDismiss}>
                Agora não
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notificação de Atualização */}
      {updateAvailable && (
        <Card className="mb-4 shadow-lg border-2 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <RefreshCw className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Atualização Disponível</h3>
                  <p className="text-sm text-muted-foreground">
                    Nova versão com melhorias e correções
                  </p>
                </div>
              </div>
            </div>
            
            <Button 
              onClick={handleUpdate} 
              disabled={isUpdating}
              className="w-full"
              variant="outline"
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Atualizando...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Atualizar Agora
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Status da Aplicação */}
      <Card className="shadow-lg">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                isOnline ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <span className="text-sm font-medium">
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            
            <div className="flex items-center gap-1">
              {isInstalled && (
                <Badge variant="secondary" className="text-xs">
                  <Monitor className="w-3 h-3 mr-1" />
                  PWA
                </Badge>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNotificationToggle}
                className="h-6 w-6 p-0"
                title={
                  notificationPermission === 'granted' 
                    ? 'Notificações ativadas' 
                    : 'Ativar notificações'
                }
              >
                {notificationPermission === 'granted' ? (
                  <Bell className="w-3 h-3 text-green-500" />
                ) : (
                  <BellOff className="w-3 h-3 text-muted-foreground" />
                )}
              </Button>
              
              {!isOnline && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSync}
                  className="h-6 w-6 p-0"
                  title="Sincronizar dados"
                >
                  <RefreshCw className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InstallPrompt;