import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import zh from '../locales/zh';
import en from '../locales/en';

const deviceLanguage = getLocales()[0]?.languageCode || 'zh';
const defaultLanguage = deviceLanguage.startsWith('zh') ? 'zh' : 'en';

i18n.use(initReactI18next).init({
  resources: {
    zh: { translation: zh },
    en: { translation: en },
  },
  lng: defaultLanguage,
  fallbackLng: 'zh',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
