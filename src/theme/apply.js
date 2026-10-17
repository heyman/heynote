// @ts-check
import { resolveTheme, themeToCssVariables } from "./resolve.js"

/**
 * @param {import("./types").ColorScheme} scheme
 * @param {import("./types").ThemeMode} mode
 * @param {HTMLElement} root
 */
export function applyTheme(scheme, mode, root = document.documentElement) {
    root.dataset.bufferColor = scheme.id
    for (const [name, value] of Object.entries(themeToCssVariables(resolveTheme(scheme, mode)))) {
        root.style.setProperty(name, value)
    }
}
