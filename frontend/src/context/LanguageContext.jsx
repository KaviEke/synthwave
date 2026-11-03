import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import translations, { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from '../i18n/translations';

const STORAGE_KEY = 'syntronics-lang';

const readStoredLanguage = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return SUPPORTED_LANGUAGES.includes(saved) ? saved : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
};

// Resolve a dotted key ("hero.title") against a dictionary.
const resolve = (dict, key) =>
  key.split('.').reduce((node, part) => (node == null ? undefined : node[part]), dict);

export const LanguageContext = createContext({
  lang: DEFAULT_LANGUAGE,
  setLang: () => {},
  toggleLang: () => {},
  t: (key) => key,
});

export const LanguageProvider = ({ children }) => {
  const [lang, setLangState] = useState(readStoredLanguage);

  const setLang = useCallback((next) => {
    if (SUPPORTED_LANGUAGES.includes(next)) setLangState(next);
  }, []);

  const toggleLang = useCallback(() => {
    setLangState((prev) => (prev === 'en' ? 'si' : 'en'));
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* storage unavailable (private mode) – selection just won't persist */
    }
    // Drives the Sinhala font + line-height rules in index.css
    document.documentElement.lang = lang;
  }, [lang]);

  // t('a.b.c') -> string | array | object; falls back to English, then the key itself.
  const t = useCallback(
    (key) => {
      const value = resolve(translations[lang], key);
      if (value !== undefined) return value;
      const fallback = resolve(translations[DEFAULT_LANGUAGE], key);
      return fallback !== undefined ? fallback : key;
    },
    [lang]
  );

  const value = useMemo(() => ({ lang, setLang, toggleLang, t }), [lang, setLang, toggleLang, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => useContext(LanguageContext);
