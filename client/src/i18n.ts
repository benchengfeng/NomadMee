
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './common/i18n/en.json';
import fr from './common/i18n/fr.json';

i18n
  .use(LanguageDetector) // Automatically detect language
  .use(initReactI18next) // Initialize react-i18next
  .init({
    fallbackLng: 'en', // Default language if language is not found
    debug: true, // Optional: For debugging purposes
    detection: {
      order: ['localStorage', 'navigator'], // Order of language detection
      caches: ['localStorage'], // Store language in localStorage
    },
    interpolation: {
      escapeValue: false, // React already escapes variables
    },
    resources: {
      en: { translation: en },
      fr: { translation: fr },
    },
  });

export default i18n;
