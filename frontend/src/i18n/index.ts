// KAARIGAR — Comprehensive i18n Configuration (English, Kannada, Hindi)
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import kn from './kn.json';
import hi from './hi.json';
import { initDomTranslator, applyDomTranslation, translateText, type SupportedLanguage } from './translator';

const savedLang = (typeof localStorage !== 'undefined' ? localStorage.getItem('kaarigar_lang') || 'en' : 'en') as SupportedLanguage;

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      kn: { translation: kn },
      hi: { translation: hi },
    },
    lng: savedLang,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
  });

if (typeof document !== 'undefined') {
  document.documentElement.lang = savedLang;
  // Initialize universal DOM translator
  initDomTranslator(savedLang);
}

// Re-apply DOM translation whenever languageChanged event fires
i18n.on('languageChanged', (lng) => {
  const lang = (lng === 'kn' || lng === 'hi') ? lng : 'en';
  applyDomTranslation(lang);
});

export function changeLanguage(lang: SupportedLanguage) {
  i18n.changeLanguage(lang);
  try {
    localStorage.setItem('kaarigar_lang', lang);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
  } catch (e) {
    // ignore
  }
  // Immediately translate visible DOM words while preserving numbers & special characters
  applyDomTranslation(lang);
}

export { translateText };
export default i18n;

