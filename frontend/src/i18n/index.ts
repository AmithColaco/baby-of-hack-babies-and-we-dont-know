// KAARIGAR — Comprehensive i18n Configuration (English, Kannada, Hindi)
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import kn from './kn.json';
import hi from './hi.json';

const savedLang = typeof localStorage !== 'undefined' ? localStorage.getItem('kaarigar_lang') || 'en' : 'en';

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
}

export function changeLanguage(lang: 'en' | 'kn' | 'hi') {
  i18n.changeLanguage(lang);
  try {
    localStorage.setItem('kaarigar_lang', lang);
    document.documentElement.lang = lang;
  } catch (e) {
    // ignore
  }
}

export default i18n;
