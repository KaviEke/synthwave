import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import translations, { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from '../i18n/translations';
import { siPhrases } from '../i18n/phrases';
import { localizeSwara, localizeDrum } from '../i18n/music';

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
  tr: (text) => text,
  sw: (value) => value,
  drum: (value) => value,
});

const interpolate = (text, vars) =>
  vars ? text.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined && vars[k] !== null ? vars[k] : m)) : text;

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

  // tr('English phrase', { vars }) -> Sinhala phrase from i18n/phrases.js when 'si' is active.
  // The English text is the key, so English rendering is byte-for-byte unchanged.
  const tr = useCallback(
    (text, vars) => {
      let out = text;
      if (lang !== DEFAULT_LANGUAGE) {
        const hit = siPhrases[text];
        if (hit !== undefined) out = hit;
        else if (import.meta.env.DEV) console.warn('[i18n] missing si phrase:', JSON.stringify(text));
      }
      return interpolate(out, vars);
    },
    [lang]
  );

  // Display-only helpers for live hardware values (swara names, drum names).
  const sw = useCallback((v) => localizeSwara(v, lang), [lang]);
  const drum = useCallback((v) => localizeDrum(v, lang), [lang]);

  const value = useMemo(
    () => ({ lang, setLang, toggleLang, t, tr, sw, drum }),
    [lang, setLang, toggleLang, t, tr, sw, drum]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => useContext(LanguageContext);
