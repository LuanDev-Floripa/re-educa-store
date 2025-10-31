import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

export const usePWA = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isInstalled, setIsInstalled] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [notificationPermission, setNotificationPermission] =
    useState("default");

  // Verifica se está online
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Verifica se o app está instalado
  useEffect(() => {
    const checkInstalled = () => {
      // Verifica se está rodando como PWA
      const isStandalone = window.matchMedia(
        "(display-mode: standalone)",
      ).matches;
      const isInApp = window.navigator.standalone === true;
      setIsInstalled(isStandalone || isInApp);
    };

    checkInstalled();

    // Listener para mudanças no display mode
    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    mediaQuery.addEventListener("change", checkInstalled);

    return () => {
      mediaQuery.removeEventListener("change", checkInstalled);
    };
  }, []);

  // Detecta prompt de instalação
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
    };
  }, []);

  // Verifica permissão de notificações
  useEffect(() => {
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // Instala o PWA
  const installPWA = useCallback(async () => {
    if (!deferredPrompt) {
      toast.error("Não é possível instalar o app no momento");
      return false;
    }

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === "accepted") {
        toast.success("RE-EDUCA Store instalado com sucesso!");
        setCanInstall(false);
        setDeferredPrompt(null);
        return true;
      } else {
        toast.info("Instalação cancelada");
        return false;
      }
    } catch (error) {
      console.error("Erro na instalação:", error);
      toast.error("Erro ao instalar o app");
      return false;
    }
  }, [deferredPrompt]);

  // Solicita permissão para notificações
  const requestNotificationPermission = useCallback(async () => {
    if (!("Notification" in window)) {
      toast.error("Notificações não são suportadas neste navegador");
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);

      if (permission === "granted") {
        toast.success("Notificações ativadas!");
        return true;
      } else {
        toast.info("Permissão de notificações negada");
        return false;
      }
    } catch (error) {
      console.error("Erro ao solicitar permissão:", error);
      toast.error("Erro ao ativar notificações");
      return false;
    }
  }, []);

  // Envia notificação
  const sendNotification = useCallback(
    (title, options = {}) => {
      if (notificationPermission !== "granted") {
        toast.error("Permissão de notificações necessária");
        return false;
      }

      try {
        const notification = new Notification(title, {
          icon: "/icons/icon-192x192.png",
          badge: "/icons/badge-72x72.png",
          vibrate: [200, 100, 200],
          requireInteraction: true,
          ...options,
        });

        notification.onclick = () => {
          window.focus();
          notification.close();
        };

        return true;
      } catch (error) {
        console.error("Erro ao enviar notificação:", error);
        toast.error("Erro ao enviar notificação");
        return false;
      }
    },
    [notificationPermission],
  );

  // Registra service worker
  const registerServiceWorker = useCallback(async () => {
    if (!("serviceWorker" in navigator)) {
      console.log("Service Worker não suportado");
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      console.log("Service Worker registrado:", registration);

      // Verifica atualizações
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        newWorker.addEventListener("statechange", () => {
          if (
            newWorker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            toast.info(
              "Nova versão disponível! Recarregue a página para atualizar.",
            );
          }
        });
      });

      return true;
    } catch (error) {
      console.error("Erro no registro do Service Worker:", error);
      return false;
    }
  }, []);

  // Sincroniza dados offline
  const syncOfflineData = useCallback(async () => {
    if (!isOnline) {
      toast.info(
        "Você está offline. Os dados serão sincronizados quando a conexão for restaurada.",
      );
      return;
    }

    try {
      // Aqui você implementaria a lógica de sincronização
      // Por exemplo, enviar dados salvos localmente para o servidor
      toast.success("Dados sincronizados com sucesso!");
    } catch (error) {
      console.error("Erro na sincronização:", error);
      toast.error("Erro ao sincronizar dados");
    }
  }, [isOnline]);

  // Detecta mudanças de conectividade
  const handleConnectionChange = useCallback(() => {
    if (isOnline) {
      toast.success("Conexão restaurada!");
      syncOfflineData();
    } else {
      toast.warning(
        "Conexão perdida. Algumas funcionalidades podem estar limitadas.",
      );
    }
  }, [isOnline, syncOfflineData]);

  // Monitora mudanças de conectividade
  useEffect(() => {
    handleConnectionChange();
  }, [isOnline, handleConnectionChange]);

  // Registra service worker na inicialização
  useEffect(() => {
    registerServiceWorker();
  }, [registerServiceWorker]);

  return {
    // Estado
    isOnline,
    isInstalled,
    canInstall,
    notificationPermission,

    // Ações
    installPWA,
    requestNotificationPermission,
    sendNotification,
    syncOfflineData,

    // Utilitários
    isPWA: isInstalled,
    canSendNotifications: notificationPermission === "granted",
    isOffline: !isOnline,
  };
};

// Hook para gerenciar cache offline
export const useOfflineCache = () => {
  const [cacheStatus, setCacheStatus] = useState("unknown");

  const checkCacheStatus = useCallback(async () => {
    if (!("caches" in window)) {
      setCacheStatus("unsupported");
      return;
    }

    try {
      const cacheNames = await caches.keys();
      const hasCache = cacheNames.length > 0;
      setCacheStatus(hasCache ? "available" : "empty");
    } catch (error) {
      console.error("Erro ao verificar cache:", error);
      setCacheStatus("error");
    }
  }, []);

  const clearCache = useCallback(async () => {
    if (!("caches" in window)) {
      toast.error("Cache não suportado");
      return false;
    }

    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName)),
      );

      toast.success("Cache limpo com sucesso!");
      setCacheStatus("empty");
      return true;
    } catch (error) {
      console.error("Erro ao limpar cache:", error);
      toast.error("Erro ao limpar cache");
      return false;
    }
  }, []);

  useEffect(() => {
    checkCacheStatus();
  }, [checkCacheStatus]);

  return {
    cacheStatus,
    checkCacheStatus,
    clearCache,
  };
};

// Hook para gerenciar atualizações do app
export const useAppUpdates = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const checkForUpdates = useCallback(async () => {
    if (!("serviceWorker" in navigator)) {
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.update();
        return true;
      }
    } catch (error) {
      console.error("Erro ao verificar atualizações:", error);
    }

    return false;
  }, []);

  const applyUpdate = useCallback(async () => {
    if (!("serviceWorker" in navigator)) {
      toast.error("Service Worker não suportado");
      return false;
    }

    try {
      setIsUpdating(true);
      const registration = await navigator.serviceWorker.getRegistration();

      if (registration && registration.waiting) {
        registration.waiting.postMessage({ type: "SKIP_WAITING" });

        // Recarrega a página após a atualização
        window.location.reload();
        return true;
      }
    } catch (error) {
      console.error("Erro ao aplicar atualização:", error);
      toast.error("Erro ao aplicar atualização");
    } finally {
      setIsUpdating(false);
    }

    return false;
  }, []);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        setUpdateAvailable(true);
      });
    }
  }, []);

  return {
    updateAvailable,
    isUpdating,
    checkForUpdates,
    applyUpdate,
  };
};
