import LANG_DATA from "./iso-639-1.json"

const LANGUAGE_NAMES = Object.fromEntries(LANG_DATA.map(l => [l.code, l.name]))

export function getLanguageName(code) {
    const shortCode = code.substring(0, 2)
    if (LANGUAGE_NAMES[shortCode]) {
        return `${LANGUAGE_NAMES[shortCode]} (${code})`
    } else {
        return code
    }
}
