// Core i18n functionality without Vue dependencies

// Type definitions
export type Locale = 'en' | 'zh' | 'ja' | 'ko' | 'zh-TW';

// Import locale files
import enMessages from './en.js';
import zhMessages from './zh.js';
import jaMessages from './ja.js';
import koMessages from './ko.js';
import zhTwMessages from './zh-TW.js';

export const messages: Record<Locale, any> = {
  en: enMessages,
  zh: zhMessages,
  ja: jaMessages,
  ko: koMessages,
  'zh-TW': zhTwMessages,
};

/**
 * Safe translation function: never throws exceptions
 */
export function safeTranslate(
  locale: Locale | string,
  key: string,
  params?: Record<string, any>,
  fallbackLocale: Locale = 'en'
): string {
  try {
    // 1. Split path by dots
    const keys = key.split('.');
    
    // 2. Look up in current locale
    let result = messages[locale as Locale];
    for (const k of keys) {
      if (result && typeof result === 'object' && k in result) {
        result = result[k];
      } else {
        result = undefined;
        break;
      }
    }
    
    // 3. Fallback to English if not found
    if (typeof result !== 'string') {
      result = messages[fallbackLocale];
      for (const k of keys) {
        if (result && typeof result === 'object' && k in result) {
          result = result[k];
        } else {
          result = undefined;
          break;
        }
      }
    }
    
    // 4. Still not found, return original key (better than blank)
    if (typeof result !== 'string') {
      return key;
    }
    
    // 5. Interpolation handling (safely wrapped)
    if (params) {
      Object.keys(params).forEach(p => {
        result = result.replace(new RegExp(`{${p}}`, 'g'), String(params[p]));
      });
      // Simple plural handling
      if (params.count !== undefined) {
        result = result.replace(/{count, plural, one{(.*?)} other{(.*?)}}/g,
          (_, one, other) => (params.count === 1 ? one : other)
        );
      }
    }
    
    return result;
  } catch (e) {
    console.error(`[i18n] Translation error for key "${key}"`, e);
    return key; // Final fallback: return key name
  }
}
