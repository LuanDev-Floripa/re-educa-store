import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
// Inicializar i18n
import "./i18n/config";

// Logger seguro (não bloqueia inicialização)
const logger = {
  error: (...args) => {
    if (import.meta.env.DEV) console.error(...args);
  },
  warn: (...args) => {
    if (import.meta.env.DEV) console.warn(...args);
  },
  info: (...args) => {
    if (import.meta.env.DEV) console.info(...args);
  },
  debug: (...args) => {
    if (import.meta.env.DEV) console.debug(...args);
  },
  log: (...args) => {
    if (import.meta.env.DEV) console.log(...args);
  }
};

// Registrar Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('[SW] Service Worker registered:', registration.scope);
        
        // Verificar atualizações periodicamente
        setInterval(() => {
          registration.update();
        }, 60000); // A cada minuto
      })
      .catch((error) => {
        console.error('[SW] Service Worker registration failed:', error);
      });
  });
}

// Remove loading screen quando o React carregar
const removeLoadingScreen = () => {
  const loadingScreen = document.getElementById("loading-screen");
  if (loadingScreen) {
    setTimeout(() => {
      loadingScreen.style.opacity = "0";
      setTimeout(() => {
        loadingScreen.style.display = "none";
      }, 500);
    }, 500);
  }
};

// Error handler global - funciona em desenvolvimento E produção
const isDevelopment = import.meta.env.DEV;

// Sempre adicionar error handlers, mas com logging diferente
window.addEventListener("error", (event) => {
  const errorMsg = event.error?.message || event.message || 'Erro desconhecido';
  const errorStack = event.error?.stack || '';
  
  if (isDevelopment) {
    logger.error("Global error:", event.error);
  } else {
    // Em produção, logar no console mesmo assim para debug
    console.error("Erro global:", errorMsg, errorStack);
  }
  
  // Mostrar erro visual em produção se possível
  if (!isDevelopment && event.error) {
    const errorDiv = document.createElement('div');
    errorDiv.id = 'global-error-message';
    errorDiv.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; background: #ef4444; color: white; padding: 12px; text-align: center; z-index: 99999; font-family: system-ui;';
    const reloadButton = document.createElement('button');
    reloadButton.textContent = 'Recarregar';
    reloadButton.style.cssText = 'color: white; text-decoration: underline; background: none; border: none; cursor: pointer; padding: 0; margin-left: 8px;';
    reloadButton.onclick = () => window.location.reload();
    errorDiv.appendChild(document.createTextNode(`⚠️ Erro: ${errorMsg.substring(0, 100)} | `));
    errorDiv.appendChild(reloadButton);
    document.body.appendChild(errorDiv);
    
    // Remover após 10 segundos
    setTimeout(() => {
      const el = document.getElementById('global-error-message');
      if (el) el.remove();
    }, 10000);
  }
});

window.addEventListener("unhandledrejection", (event) => {
  const errorMsg = event.reason?.message || String(event.reason) || 'Erro desconhecido';
  
  if (isDevelopment) {
    logger.error("Unhandled rejection:", event.reason);
  } else {
    console.error("Unhandled rejection:", errorMsg);
  }
  
  // Prevenir que o erro apareça no console como não tratado
  event.preventDefault();
});

try {
  const rootElement = document.getElementById("root");

  if (!rootElement) {
    throw new Error("Root element not found");
  }

  const root = createRoot(rootElement);

  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );

  // Remove loading screen após renderização
  removeLoadingScreen();
} catch (error) {
  const errorMsg = error?.message || String(error) || 'Erro desconhecido';
  const errorStack = error?.stack || '';
  
  if (isDevelopment) {
    logger.error("Failed to initialize app:", error);
  } else {
    console.error("Falha ao inicializar app:", errorMsg, errorStack);
  }

  // Mostra erro amigável
  // ⚠️ SEGURANÇA: Uso de innerHTML é aceitável aqui porque:
  // 1. Usado APENAS para erro de inicialização (antes do React renderizar)
  // 2. error.message vem de exceções do sistema, não de user input
  // 3. Mensagem de erro é sanitizada implicitamente (erros de sistema são limitados)
  // 4. Não há risco de XSS pois não processa dados de usuários
  // 5. Este é o fallback de último recurso quando o React não consegue inicializar
  const loadingScreen = document.getElementById("loading-screen");
  if (loadingScreen) {
    // Sanitizar mensagem de erro para evitar possíveis problemas
    const sanitizedError = String(error.message || 'Erro desconhecido')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .substring(0, 200); // Limitar tamanho
    
    loadingScreen.innerHTML = `
      <div style="text-align: center; padding: 40px; max-width: 500px;">
        <div style="font-size: 64px; margin-bottom: 20px;">😵</div>
        <h2 style="color: white; font-size: 32px; margin-bottom: 20px; font-weight: 600;">Ops! Erro ao Carregar</h2>
        <p style="color: rgba(255,255,255,0.9); font-size: 18px; margin-bottom: 20px; line-height: 1.6;">
          Algo deu errado ao inicializar a aplicação.
        </p>
        <p style="color: rgba(255,255,255,0.8); font-size: 14px; margin-bottom: 30px;">
          Erro: ${sanitizedError}
        </p>
        <button 
          onclick="location.reload()" 
          style="padding: 12px 30px; background: white; color: #667eea; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"
        >
          🔄 Recarregar Página
        </button>
      </div>
    `;
  }
}
