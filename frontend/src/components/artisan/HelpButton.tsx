import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface HelpButtonProps {
  screenText: string;
}

export function HelpButton({ screenText }: HelpButtonProps) {
  const [open, setOpen] = useState(false);
  const { t, i18n } = useTranslation();

  const speak = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(screenText);
      const langMap: Record<string, string> = { kn: 'kn-IN', hi: 'hi-IN', en: 'en-IN' };
      utter.lang = langMap[i18n.language] || 'en-IN';
      window.speechSynthesis.speak(utter);
    }
  };

  return (
    <>
      <button
        type="button"
        className="a-help-btn"
        aria-label={t('artisan.help', 'Help')}
        aria-expanded={open}
        onClick={() => setOpen(v => !v)}
      >
        ?
      </button>
      {open && (
        <div className="a-help-panel" role="dialog" aria-modal="false" aria-label={t('artisan.help_panel', 'Help')}>
          <div className="a-help-panel__title">{t('artisan.help', 'Help')}</div>
          <p className="a-help-panel__text">{screenText}</p>
          {'speechSynthesis' in window && (
            <button type="button" className="a-help-panel__listen" onClick={speak} aria-label={t('artisan.listen', 'Listen')}>
              <span aria-hidden="true">🔊</span> {t('artisan.listen', 'Listen')}
            </button>
          )}
        </div>
      )}
    </>
  );
}
