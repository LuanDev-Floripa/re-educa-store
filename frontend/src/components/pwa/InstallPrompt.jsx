import React, { useState, useEffect } from "react";
import logger from "@/utils/logger";
import { getItem, setItem } from "@/utils/storage";
import apiClient from "@/services/apiClient";
/**
 * Prompt de instalação PWA e notificações de atualização.
 * 
 * Componente que gerencia:
 * - Sugestão de instalação do PWA
 * - Limpeza de cache
 * - Aplicação de updates
 * - Status online/offline
 * - Badges e notificações
 * 
 * @component
 * @returns {JSX.Element|null} Componente de prompt PWA ou null se não deve ser exibido
 */
import { Card, CardContent } from "@/components/Ui/card";
import { Button } from "@/components/Ui/button";
import { Badge } from "@/components/Ui/badge";
import {
  Download,
  X,
  Smartphone,
  Monitor,
  Wifi,
  WifiOff,
  Bell,
  BellOff,
  RefreshCw,
} from "lucide-react";
import { usePWA, useOfflineCache, useAppUpdates } from "@/hooks/usePWA";
import { toast } from "sonner";

const InstallPrompt = () => {
  const {
    isOnline,
    isInstalled,
    canInstall,
    notificationPermission,
    installPWA,
    requestNotificationPermission,
    sendNotification,
    syncOfflineData,
  } = usePWA();

  const { cacheStatus, clearCache } = useOfflineCache();

  // Usar cacheStatus e clearCache
  /**
   * Limpa o cache offline e registra na API.
   */
  const handleClearCache = async () => {
    try {
      await clearCache();
      toast.success("Cache limpo com sucesso!");

      // Registrar limpeza de cache na API
      try {
        await apiClient.request("/analytics/cache-clear", {
          method: "POST",
          body: JSON.stringify({
            timestamp: new Date().toISOString(),
            cacheSize: Number(cacheStatus?.size) || 0,
          }),
        });
      } catch (error) {
        // Falha silenciosa - não crítico
        logger.warn("Não foi possível registrar limpeza de cache:", error);
      }
    } catch (error) {
      logger.error("Erro ao limpar cache:", error);
      toast.error("Erro ao limpar cache");
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

  /**
   * Instala o PWA e registra a instalação na API.
   */
  const handleInstall = async () => {
    try {
      const success = await installPWA?.();
      if (success) {
        setShowPrompt(false);
        toast.success("App instalado com sucesso!");

        // Registrar instalação na API
        try {
          await apiClient.request("/analytics/pwa-install", {
            method: "POST",
            body: JSON.stringify({
              platform: navigator?.platform || "",
              userAgent: navigator?.userAgent || "",
              timestamp: new Date().toISOString(),
            }),
          });
        } catch (error) {
          // Falha silenciosa - não crítico
          logger.warn("Não foi possível registrar instalação:", error);
        }
      } else {
        toast.error("Erro ao instalar o app");
      }
    } catch (error) {
      logger.error("Erro na instalação:", error);
      toast.error("Erro ao instalar o app");
    }
  };

  /**
   * Dispensa o prompt de instalação e salva preferência.
   */
  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    // Salva no localStorage para não mostrar novamente
    try {
      setItem("pwa-install-dismissed", "true");
    } catch (error) {
      // localStorage pode não estar disponível em modo privado ou storage cheio
      logger.warn("Não foi possível salvar preferência de instalação:", error);
    }
  };

  /**
   * Alterna permissões de notificação ou solicita permissão.
   */
  const handleNotificationToggle = async () => {
    if (notificationPermission === "granted") {
      // Testa notificação
      sendNotification?.("RE-EDUCA Store", {
        body: "Notificações funcionando perfeitamente!",
        tag: "test",
      });
    } else {
      await requestNotificationPermission?.();
    }
  };

  /**
   * Sincroniza dados offline quando voltar online.
   */
  const handleSync = async () => {
    try {
      await syncOfflineData?.();
      toast.success("Dados sincronizados!");
    } catch (error) {
      logger.error("Erro ao sincronizar dados:", error);
      toast.error("Erro ao sincronizar dados");
    }
  };

  /**
   * Aplica atualização do app quando disponível.
   */
  const handleUpdate = async () => {
    try {
      await applyUpdate?.();
      toast.success("Atualização aplicada! Recarregue a página.");
    } catch (error) {
      logger.error("Erro ao aplicar atualização:", error);
      toast.error("Erro ao aplicar atualização");
    }
  };

  /**
   * Verifica se o prompt já foi dispensado anteriormente.
   * Executa apenas uma vez na montagem do componente.
   */
  useEffect(() => {
    try {
      const dismissed = getItem("pwa-install-dismissed", false);
      if (dismissed === "true") {
        setDismissed(true);
      }
    } catch (error) {
      // localStorage pode não estar disponível em modo privado
      logger.warn("Não foi possível verificar preferência de instalação:", error);
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
                    Status do Cache: {typeof cacheStatus === "string" ? cacheStatus : (cacheStatus?.status || "desconhecido")}
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
                <Smartphone className="w-4 h-4 text-primary" />
                <span>Acesso direto da tela inicial</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <WifiOff className="w-4 h-4 text-primary" />
                <span>Funciona offline</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Bell className="w-4 h-4 text-primary" />
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
        <Card className="mb-4 shadow-lg border-2 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <RefreshCw className="w-5 h-5 text-primary" />
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
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                  <span role="status" aria-live="polite">Atualizando...</span>
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
              <div
                className={`w-2 h-2 rounded-full ${
                  isOnline ? "bg-primary" : "bg-destructive"
                }`}
              />
              <span className="text-sm font-medium">
                {isOnline ? "Online" : "Offline"}
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
                  notificationPermission === "granted"
                    ? "Notificações ativadas"
                    : "Ativar notificações"
                }
              >
                {notificationPermission === "granted" ? (
                  <Bell className="w-3 h-3 text-primary" />
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
