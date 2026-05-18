'use client';

import { Locale, Messages, I18nContextType } from '@/types/i18n';
import { useState, useEffect, useContext, createContext } from 'react';

import en from '../i18n/locales/en.json';
import vi from '../i18n/locales/vi.json';

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const messages: Record<Locale, Messages> = { en, vi };

const getInitialLocale = () => {
  if (typeof window === 'undefined') return 'en';

  const savedLocale = localStorage.getItem('locale') as Locale;
  if (savedLocale) return savedLocale;

  const browserLang = navigator.language.toLowerCase();
  if (browserLang.startsWith('vi')) return 'vi';
  if (browserLang.startsWith('en')) return 'en';

  return 'en';
};

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    setLocaleState(getInitialLocale());
    setIsReady(true);
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('locale', newLocale);
  };

  if (!isReady) return null;

  return (
    <I18nContext.Provider value={{ locale, setLocale, t: messages[locale] }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }

  return context;
}
