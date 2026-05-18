import en from '@/i18n/locales/en.json';

type Locale = 'en' | 'vi';

type Messages = typeof en;

interface I18nContextType {
  t: Messages;
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export type { Locale, Messages, I18nContextType };
