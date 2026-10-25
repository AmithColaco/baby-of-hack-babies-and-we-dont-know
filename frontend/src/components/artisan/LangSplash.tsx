import { useTranslation } from 'react-i18next';
import { changeLanguage } from '../../i18n';

interface LangSplashProps {
  onDone: () => void;
}

export function LangSplash({ onDone }: LangSplashProps) {
  const { t, i18n } = useTranslation();

  const pick = (lang: 'en' | 'kn' | 'hi') => {
    changeLanguage(lang);
    onDone();
  };

  return (
    <div className="lang-splash" role="dialog" aria-modal="true" aria-label="Choose your language">
      <div>
        <div className="lang-splash__brand">KAARIGAR</div>
        <div className="lang-splash__sub">ಕಾರಿಗರ · कारीगर</div>
      </div>
      <p className="lang-splash__title">
        {t('artisan.choose_language', 'Choose your language / ಭಾಷೆ ಆಯ್ಕೆ ಮಾಡಿ / भाषा चुनें')}
      </p>
      <div className="lang-splash__buttons">
        <button
          type="button"
          className={`lang-splash__btn${i18n.language === 'en' ? ' lang-splash__btn--active' : ''}`}
          onClick={() => pick('en')}
          lang="en"
        >
          🇮🇳 English
        </button>
        <button
          type="button"
          className={`lang-splash__btn${i18n.language === 'kn' ? ' lang-splash__btn--active' : ''}`}
          onClick={() => pick('kn')}
          lang="kn"
        >
          🌿 ಕನ್ನಡ
        </button>
        <button
          type="button"
          className={`lang-splash__btn${i18n.language === 'hi' ? ' lang-splash__btn--active' : ''}`}
          onClick={() => pick('hi')}
          lang="hi"
        >
          🪔 हिंदी
        </button>
      </div>
    </div>
  );
}
