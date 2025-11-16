import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '../i18n/locales/en/tasks.json';

i18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  ns: ['tasks'],
  defaultNS: 'tasks',
  resources: {
    en: {
      tasks: en,
    },
  },
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
