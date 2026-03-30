import { createI18n } from 'vue-i18n';
import enUS from './en-US.json';
import ptBR from './pt-BR.json';

export type SupportedLocale = 'en-US' | 'pt-BR';

export const supportedLocales: SupportedLocale[] = ['en-US', 'pt-BR'];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let i18nInstance: any = null;

export function setupI18n(initialLocale: SupportedLocale) {
  const i18n = createI18n({
    legacy: false,
    locale: initialLocale,
    fallbackLocale: 'en-US',
    messages: {
      'en-US': enUS,
      'pt-BR': ptBR,
    },
  });
  i18nInstance = i18n;
  return i18n;
}

export function setI18nLocale(locale: SupportedLocale): void {
  if (i18nInstance) {
    i18nInstance.global.locale.value = locale;
  }
}

export function getI18nT(): (key: string, ...args: unknown[]) => string {
  if (!i18nInstance) throw new Error('i18n not initialized');
  return i18nInstance.global.t;
}

export function isSupportedLocale(value: string): value is SupportedLocale {
  return supportedLocales.includes(value as SupportedLocale);
}
