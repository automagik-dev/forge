import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { SUPPORTED_I18N_CODES, uiLanguageToI18nCode } from './languages';
import { i18nLogger } from '@/lib/logger';

// Import translation files
import enCommon from './locales/en/common.json';
import enSettings from './locales/en/settings.json';
import enProjects from './locales/en/projects.json';
import enTasks from './locales/en/tasks.json';
import jaCommon from './locales/ja/common.json';
import jaSettings from './locales/ja/settings.json';
import jaProjects from './locales/ja/projects.json';
import jaTasks from './locales/ja/tasks.json';
import esCommon from './locales/es/common.json';
import esSettings from './locales/es/settings.json';
import esProjects from './locales/es/projects.json';
import esTasks from './locales/es/tasks.json';
import koCommon from './locales/ko/common.json';
import koSettings from './locales/ko/settings.json';
import koProjects from './locales/ko/projects.json';
import koTasks from './locales/ko/tasks.json';
import ptBRCommon from './locales/pt-BR/common.json';
import ptBRSettings from './locales/pt-BR/settings.json';
import ptBRProjects from './locales/pt-BR/projects.json';
import ptBRTasks from './locales/pt-BR/tasks.json';

const resources = {
  en: {
    common: enCommon,
    settings: enSettings,
    projects: enProjects,
    tasks: enTasks,
  },
  ja: {
    common: jaCommon,
    settings: jaSettings,
    projects: jaProjects,
    tasks: jaTasks,
  },
  es: {
    common: esCommon,
    settings: esSettings,
    projects: esProjects,
    tasks: esTasks,
  },
  ko: {
    common: koCommon,
    settings: koSettings,
    projects: koProjects,
    tasks: koTasks,
  },
  'pt-BR': {
    common: ptBRCommon,
    settings: ptBRSettings,
    projects: ptBRProjects,
    tasks: ptBRTasks,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: {
      'pt': ['pt-BR', 'en'],
      'default': ['en']
    },
    defaultNS: 'common',
    debug: import.meta.env.DEV,
    supportedLngs: SUPPORTED_I18N_CODES,
    nonExplicitSupportedLngs: true, // Allow 'pt' to resolve to 'pt-BR'
    load: 'all', // Load both 'pt-BR' and 'pt' variants

    interpolation: {
      escapeValue: false, // React already escapes
    },

    react: {
      useSuspense: false, // Avoid suspense for now to simplify initial setup
    },

    detection: {
      order: ['navigator', 'htmlTag'],
      caches: [], // Disable localStorage cache - we'll handle this via config
    },
  });

// Debug logging in development
if (import.meta.env.DEV) {
  i18nLogger.debug('i18n initialized:', i18n.isInitialized);
  i18nLogger.debug('i18n language:', i18n.language);
  i18nLogger.debug('i18n namespaces:', i18n.options.ns);
  i18nLogger.debug('Common bundle loaded:', i18n.hasResourceBundle('en', 'common'));
}

// Function to update language from config
export const updateLanguageFromConfig = (configLanguage: string) => {
  i18nLogger.log('updateLanguageFromConfig called with:', configLanguage);

  if (configLanguage === 'BROWSER') {
    // Use browser detection
    const detected = i18n.services.languageDetector?.detect();
    const detectedLang = Array.isArray(detected) ? detected[0] : detected;
    i18nLogger.log('Using browser detection, detected:', detectedLang);
    i18n.changeLanguage(detectedLang || 'en');
  } else {
    // Use explicit language selection with proper mapping
    const langCode = uiLanguageToI18nCode(configLanguage);
    i18nLogger.log('Mapped UI language', configLanguage, 'to i18n code:', langCode);

    if (langCode) {
      i18nLogger.log('Changing language to:', langCode);
      i18n.changeLanguage(langCode);
      i18nLogger.log('Current language after change:', i18n.language);
      i18nLogger.log('Has pt-BR settings bundle:', i18n.hasResourceBundle('pt-BR', 'settings'));
    } else {
      i18nLogger.warn(
        `Unknown UI language: ${configLanguage}, falling back to 'en'`
      );
      i18n.changeLanguage('en');
    }
  }
};

export default i18n;
