import i18n from 'i18next';

// Import translation files directly
import en from '../i18n/en.json';
import fr from '../i18n/fr.json';

// Initialize i18next (without initReactI18next here)
i18n.init({
  resources: {
    en: {
      translation: en, // English translations
    },
    fr: {
      translation: fr, // French translations
    },
  },
  lng: 'en', // Default language
  fallbackLng: 'en', // Use 'en' if language is not found
  interpolation: {
    escapeValue: false, // React already escapes values
  },
});

export default i18n;
