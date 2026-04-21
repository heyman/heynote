import os from "os";
import { keyHelpStr } from "../shared-utils/key-helper";
import { safeTranslate } from "../src/locales/i18n-core";

// Get system locale or default to English
let systemLocale = 'en';

try {
  // First try to get language from browser (works in both dev and production)
  if (typeof navigator !== 'undefined' && navigator.language) {
    let browserLang = navigator.language.split('-')[0];
    if (navigator.language === 'zh-TW' || navigator.language === 'zh-HK' || navigator.language === 'zh-MO') {
      systemLocale = 'zh-TW';
    } else if (browserLang === 'zh' || browserLang === 'en' || browserLang === 'ja' || browserLang === 'ko') {
      systemLocale = browserLang;
    }
  } 
  // Fallback to Electron system locale (only works in production)
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

const created = (new Date()).toISOString()

// Use safeTranslate directly without Vue dependency
const t = (key) => safeTranslate(systemLocale, key);

export const initialContent = `
{"formatVersion":"1.0.0","name":"Scratch"}
∞∞∞text;created=${created}
${t('initialContent.welcome')}

${keyHelpStr(os.platform())}
∞∞∞markdown;created=${created}
${t('initialContent.documentation')}
∞∞∞math;created=${created}
${t('initialContent.mathBlock')}
∞∞∞markdown;created=${created}
${t('initialContent.markdownBlock')}
∞∞∞text-a;created=${created}
`

export const initialDevContent = initialContent + `
∞∞∞python-a;created=2022-12-15T11:57:40.988Z
# hmm
def my_func():
  print("hejsan")

∞∞∞javascript-a;created=2025-12-15T11:57:40.988Z
import {basicSetup} from "codemirror"
import {EditorView, keymap} from "@codemirror/view"
import {javascript} from "@codemirror/lang-javascript"
import {indentWithTab, insertTab, indentLess, indentMore} from "@codemirror/commands"
import {nord} from "./nord.mjs"

let editor = new EditorView({
  //extensions: [basicSetup, javascript()],
  extensions: [
    basicSetup, 
    javascript(), 
    //keymap.of([indentWithTab]),
    keymap.of([
      {
          key: 'Tab',
          preventDefault: true,
          //run: insertTab,
          run: indentMore,
      },
      {
          key: 'Shift-Tab',
          preventDefault: true,
          run: indentLess,
      },
    ]),
    nord,
  ],
  parent: document.getElementById("editor"),
})
∞∞∞json
{
    "name": "heynote-codemirror",
    "type": "module",
    "version": "1.0.0",
    "description": "",
    "main": "index.js",
    "scripts": {
        "test": "echo \"Error: no test specified\" && exit 1",
        "build": "rollup -c"
    },
    "keywords": [],
    "author": "",
    "license": "ISC",
    "dependencies": {
        "@codemirror/commands": "^6.1.2",
        "@codemirror/lang-javascript": "^6.1.2",
        "@codemirror/lang-json": "^6.0.1",
        "@codemirror/lang-python": "^6.1.1",
        "@rollup/plugin-node-resolve": "^15.0.1",
        "codemirror": "^6.0.1",
        "i": "^0.3.7",
        "npm": "^9.2.0",
        "rollup": "^3.8.1",
        "rollup-plugin-typescript2": "^0.34.1",
        "typescript": "^4.9.4"
    }
}
∞∞∞html
<html>
    <head>
        <title>Test</title>
    </head>
    <body>
        <h1>Test</h1>
        <script>
            console.log("hej")
        </script>
    </body>
</html>
∞∞∞sql;created=${created}
SELECT * FROM table WHERE id = 1;
∞∞∞text;created=${created}
Shopping list:

- Milk
- Eggs
- Bread
- Cheese`

