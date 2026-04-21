import { safeTranslate } from "../src/locales/i18n-core";

// Get system locale or default to English
function getSystemLocale() {
  let systemLocale = 'en';
  
  try {
    // First try to get language from browser
    if (typeof navigator !== 'undefined' && navigator.language) {
      let browserLang = navigator.language.split('-')[0];
      if (navigator.language === 'zh-TW' || navigator.language === 'zh-HK' || navigator.language === 'zh-MO') {
        systemLocale = 'zh-TW';
      } else if (browserLang === 'zh' || browserLang === 'en' || browserLang === 'ja' || browserLang === 'ko') {
        systemLocale = browserLang;
      }
    } 
    // Fallback to Electron system locale
    else {
      const { app } = require('electron');
      if (app && app.getLocale) {
        const locale = app.getLocale();
        if (locale === 'zh-TW' || locale === 'zh-HK' || locale === 'zh-MO') {
          systemLocale = 'zh-TW';
        } else {
          const lang = locale.split('-')[0];
          if (lang === 'zh' || lang === 'en' || lang === 'ja' || lang === 'ko') {
            systemLocale = lang;
          }
        }
      }
    }
  } catch (e) {
    // Ignore errors, default to English
  }
  
  return systemLocale;
}

const t = (key: string) => safeTranslate(getSystemLocale(), key);

export const keyHelpStr = (platform: string, extended: boolean = false) => {
    const modChar = platform === "darwin" ? "⌘" : "Ctrl"
    const altChar = platform === "darwin" ? "⌥" : "Alt"

    const keyHelp = [
        [`${modChar} + Enter`, t('keybindings.addBlockBelow')],
        [`${altChar} + Enter`, t('keybindings.addBlockBefore')],
        [`${modChar} + Shift + Enter`, t('keybindings.addBlockEnd')],
        [`${altChar} + Shift + Enter`, t('keybindings.addBlockStart')],
        [`${modChar} + ${altChar} + Enter`, t('keybindings.splitBlock')],
        [`${modChar} + L`, t('keybindings.changeLanguage')],
        [`${modChar} + N`, t('keybindings.createBuffer')],
        [`${modChar} + S`, t('keybindings.moveBlock')],
        [`${modChar} + P`, t('keybindings.openSelector')],
        [`${modChar} + Shift + P`, t('keybindings.openPalette')],
        [`${modChar} + Down`, t('keybindings.nextBlock')],
        [`${modChar} + Up`, t('keybindings.previousBlock')],
        [`${modChar} + A`, t('keybindings.selectAll')],
        [`${modChar} + ${altChar} + Up/Down`, t('keybindings.addCursor')],
        [`${altChar} + Shift + F`, t('keybindings.formatBlock')],
    ]

    if (extended) {
        keyHelp.push(
            [`${modChar} + ${altChar} + [`, t('keybindings.foldBlock')],
            [`${modChar} + ${altChar} + ]`, t('keybindings.unfoldBlock')],
            [`${modChar} + ${altChar} + .`, t('keybindings.toggleFold')],
        )
    }
    
    const keyMaxLength = keyHelp.map(([key]) => key.length).reduce((a, b) => Math.max(a, b))

    return keyHelp.map(([key, help]) => `${key.padEnd(keyMaxLength)}   ${help}`).join("\n")
}