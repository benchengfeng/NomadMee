import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './common/i18n/en.json';
import fr from './common/i18n/fr.json';

i18n
  .use(initReactI18next) // Passes i18n instance to react-i18next
  .init({
    resources: {
      en: { translation: en },
      fr: { translation: fr },
    },
    lng: 'en', // Default language
    fallbackLng: 'en', // Fallback language
    interpolation: { escapeValue: false }, // React already escapes values
  });

export default i18n;
