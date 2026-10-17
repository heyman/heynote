// @ts-check
import { THEME_DEFAULTS } from "./defaults.js"

/**
 * Resolve every role anew so a previous scheme's overrides cannot carry over.
 * @param {import("./types").ColorScheme} scheme
 * @param {import("./types").ThemeMode} mode
 * @returns {import("./types").ThemePalette}
 */
export function resolveTheme(scheme, mode) {
    const defaults = THEME_DEFAULTS[mode]
    return {
        ui: { ...defaults.ui, ...scheme.shared?.ui, ...scheme[mode]?.ui },
        syntax: { ...defaults.syntax, ...scheme.shared?.syntax, ...scheme[mode]?.syntax },
    }
}

/** @param {import("./types").ThemePalette} palette */
export function themeToCssVariables(palette) {
    /** @type {Record<string, string>} */
    const variables = {}
    for (const [group, colors] of Object.entries(palette)) {
        for (const [role, color] of Object.entries(colors)) {
            const name = role.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)
            variables[`--${group}-${name}`] = color
        }
    }
    return variables
}
