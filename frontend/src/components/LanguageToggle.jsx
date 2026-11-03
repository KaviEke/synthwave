import React from 'react';
import { useLanguage } from '../context/LanguageContext';

// Segmented "EN | සිං" switch. Styling lives in index.css (.lang-toggle).
const OPTIONS = [
  { code: 'en', label: 'EN', nameKey: 'nav.english' },
  { code: 'si', label: 'සිං', nameKey: 'nav.sinhala' },
];

export default function LanguageToggle() {
  const { lang, setLang, t } = useLanguage();

  return (
    <div className="lang-toggle" role="group" aria-label={t('nav.languageLabel')}>
      {OPTIONS.map(({ code, label, nameKey }, i) => (
        <React.Fragment key={code}>
          {i > 0 && <span className="lang-toggle__divider" aria-hidden="true">|</span>}
          <button
            type="button"
            lang={code}
            className={`lang-toggle__option${lang === code ? ' is-active' : ''}`}
            aria-pressed={lang === code}
            aria-label={t(nameKey)}
            title={t(nameKey)}
            onClick={() => setLang(code)}
          >
            {label}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
}
