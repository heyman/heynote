// @ts-check
import gray from "./gray.js"
import red from "./red.js"
import orange from "./orange.js"
import green from "./green.js"
import blue from "./blue.js"
import purple from "./purple.js"
import pink from "./pink.js"

/** @type {import("../types").ColorScheme[]} */
export const COLOR_SCHEMES = [gray, red, orange, green, blue, purple, pink]

/** @param {unknown} color */
export function normalizeColorScheme(color) {
    return COLOR_SCHEMES.find(scheme => scheme.id === color)?.id || "gray"
}

/** @param {unknown} color */
export function getColorScheme(color) {
    return COLOR_SCHEMES.find(scheme => scheme.id === normalizeColorScheme(color)) || gray
}
