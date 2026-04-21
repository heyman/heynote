import { App, Plugin, ref, reactive, computed } from 'vue';
import { safeTranslate, Locale, messages } from './i18n-core';

// Vue plugin version
export function createI18n(initialLocale: Locale = 'en') {
  const currentLocale = ref<Locale>(initialLocale);
  
  // Detect language from browser
  try {
    if (typeof navigator !== 'undefined' && navigator.language) {
      let browserLang = navigator.language.split('-')[0] as Locale;
      if (navigator.language === 'zh-TW' || navigator.language === 'zh-HK' || navigator.language === 'zh-MO') {
        browserLang = 'zh-TW';
      }
      if (browserLang === 'zh' || browserLang === 'en' || browserLang === 'ja' || browserLang === 'ko' || browserLang === 'zh-TW') {
        currentLocale.value = browserLang;
      } else {
        // Default to English for unsupported languages
        currentLocale.value = 'en';
      }
    }
  } catch (e) {
    // Ignore if navigator is unavailable (SSR, etc.)
  }
  
  // Attempt to get system language from Electron main process
  if (typeof window !== 'undefined' && (window as any).heynote?.getSystemLocale) {
    (window as any).heynote.getSystemLocale().then((systemLocale: string) => {
      let locale = systemLocale.split('-')[0] as Locale;
      if (systemLocale === 'zh-TW' || systemLocale === 'zh-HK' || systemLocale === 'zh-MO') {
        locale = 'zh-TW';
      }
      if (locale === 'zh' || locale === 'en' || locale === 'ja' || locale === 'ko' || locale === 'zh-TW') {
        currentLocale.value = locale;
      } else {
        // Default to English for unsupported languages
        currentLocale.value = 'en';
      }
    }).catch(() => {});
  }
  
  const t = (key: string, params?: Record<string, any>): string => {
    return safeTranslate(currentLocale.value, key, params);
  };
  
  const setLocale = (locale: Locale) => {
    if (messages[locale]) {
      currentLocale.value = locale;
    }
  };
  
  const i18nApi = {
    global: {
      locale: currentLocale,
      t,
    },
    t,
    locale: computed(() => currentLocale.value),
    setLocale,
  };
  
  const plugin: Plugin = {
    install(app: App) {
      app.config.globalProperties.$t = t;
      app.config.globalProperties.$i18n = {
        locale: currentLocale,
        setLocale,
      };
      app.provide('i18n', i18nApi);
    }
  };
  
  return { ...i18nApi, install: plugin.install, plugin };
}

// Create default instance
export const defaultI18n = createI18n();
export const i18n = defaultI18n;
export const t = defaultI18n.t;

// Compatible with old export style
export default defaultI18n;