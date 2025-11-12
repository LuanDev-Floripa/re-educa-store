/**
 * Configuração i18n - RE-EDUCA
 * Sistema de internacionalização usando react-i18next
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Importar traduções
import ptBR from './locales/pt-BR.json';
import enUS from './locales/en-US.json';

// Recursos de tradução
const resources = {
  'pt-BR': {
    translation: ptBR,
  },
  'en-US': {
    translation: enUS,
  },
};

// Configuração do i18next
i18n
  .use(LanguageDetector) // Detecta idioma do navegador
  .use(initReactI18next) // Passa i18n para react-i18next
  .init({
    resources,
    fallbackLng: 'pt-BR', // Idioma padrão
    lng: localStorage.getItem('i18nextLng') || 'pt-BR', // Idioma inicial
    
    // Namespaces (podemos adicionar mais no futuro)
    defaultNS: 'translation',
    ns: ['translation'],
    
    // Configurações de detecção
    detection: {
      // Ordem de detecção
      order: ['localStorage', 'navigator', 'htmlTag'],
      // Cache do idioma detectado
      caches: ['localStorage'],
      // Chave no localStorage
      lookupLocalStorage: 'i18nextLng',
    },
    
    // Interpolação
    interpolation: {
      escapeValue: false, // React já faz escape
    },
    
    // Debug (desabilitado em produção)
    debug: import.meta.env.DEV,
    
    // Configurações de compatibilidade
    react: {
      useSuspense: false, // Não usar Suspense para evitar problemas
    },
  });

export default i18n;
