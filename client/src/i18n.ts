import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

// ---------------------------------------------------------------------------
// Supported languages — single source of truth.
// Add a language here + drop a folder in /public/locales/<code>/ to ship it.
// ---------------------------------------------------------------------------
export type LanguageCode = 'en' | 'fr' | 'ar' | 'zh';

export type LanguageMeta = {
  code: LanguageCode;
  label: string;       // native name, shown in the switcher
  flag: string;        // emoji flag for quick visual id
  dir: 'ltr' | 'rtl';
  font?: string;       // optional font-family override applied to <html>
};

export const LANGUAGES: LanguageMeta[] = [
  { code: 'en', label: 'English',  flag: '🇬🇧', dir: 'ltr' },
  { code: 'fr', label: 'Français', flag: '🇫🇷', dir: 'ltr' },
  { code: 'ar', label: 'العربية',  flag: '🇸🇦', dir: 'rtl', font: "'Cairo', 'Noto Sans Arabic', sans-serif" },
  { code: 'zh', label: '中文',      flag: '🇨🇳', dir: 'ltr', font: "'Noto Sans SC', sans-serif" },
];

export const LANGUAGE_CODES = LANGUAGES.map((l) => l.code);

// Namespaces — one per feature surface so files stay small and lazy-load.
export const NAMESPACES = ['common', 'landing', 'auth', 'dashboard', 'join', 'contact', 'translation'] as const;

export function getLanguageMeta(code: string): LanguageMeta {
  return LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0]!;
}

/** Apply <html dir> + lang + font for the given language. Call on every change. */
export function applyDocumentLanguage(code: string): void {
  const meta = getLanguageMeta(code);
  const html = document.documentElement;
  html.setAttribute('lang', meta.code);
  html.setAttribute('dir', meta.dir);
  html.style.setProperty('--app-font', meta.font ?? '');
}

void i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: LANGUAGE_CODES,
    nonExplicitSupportedLngs: true, // 'en-US' → 'en'
    ns: ['common', 'translation'],  // loaded eagerly on boot
    defaultNS: 'common',
    fallbackNS: 'translation',      // legacy marketing keys live here
    load: 'languageOnly',           // ignore region (en-US → en)
    debug: false,
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'nomadmee_lang',
      caches: ['localStorage'],
    },
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    interpolation: {
      escapeValue: false, // React already escapes
    },
    react: {
      useSuspense: false, // avoid blocking render while a namespace loads
    },
  });

// Keep <html dir/lang/font> in sync with the active language.
i18n.on('languageChanged', applyDocumentLanguage);
applyDocumentLanguage(i18n.language || 'en');

export default i18n;
