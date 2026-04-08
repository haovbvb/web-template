import { createI18n } from 'vue-i18n';
import { messages, type AppLocale } from './messages';

const LOCALE_KEY = 'app.locale';
const DEFAULT_LOCALE: AppLocale = 'zh-CN';

function resolveLocale(): AppLocale {
  const saved = localStorage.getItem(LOCALE_KEY);
  if (saved === 'zh-CN' || saved === 'en-US') {
    return saved;
  }

  const browserLocale = navigator.language.toLowerCase();
  if (browserLocale.startsWith('zh')) {
    return 'zh-CN';
  }

  return 'en-US';
}

const locale = resolveLocale();

export const i18n = createI18n({
  legacy: false,
  locale,
  fallbackLocale: DEFAULT_LOCALE,
  messages,
});

export function setAppLocale(locale: AppLocale) {
  i18n.global.locale.value = locale;
  localStorage.setItem(LOCALE_KEY, locale);
}
