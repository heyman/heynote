import { describe, expect, it } from "vitest"
import { THEME_DEFAULTS } from "../../src/theme/defaults.js"
import { resolveTheme, themeToCssVariables } from "../../src/theme/resolve.js"
import { COLOR_SCHEMES, getColorScheme, normalizeColorScheme } from "../../src/theme/schemes/index.js"

function luminance(hex) {
    const channels = hex.slice(1).match(/../g).map(channel => {
        const value = parseInt(channel, 16) / 255
        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
    })
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
}

function contrast(first, second) {
    const values = [luminance(first), luminance(second)]
    return (Math.max(...values) + 0.05) / (Math.min(...values) + 0.05)
}

function composite(overlay, background) {
    const [red, green, blue, alpha] = overlay.match(/[\d.]+/g).map(Number)
    const base = background.slice(1).match(/../g).map(channel => parseInt(channel, 16))
    return "#" + [red, green, blue].map((channel, index) =>
        Math.round(channel * alpha + base[index] * (1 - alpha)).toString(16).padStart(2, "0")
    ).join("")
}

describe("color themes", () => {
    it("inherits mode defaults and overrides individual roles in each group", () => {
        const scheme = {
            id: "custom", label: "Custom",
            shared: { ui: { accent: "#123456" }, syntax: { keyword: "#654321" } },
            light: { ui: { blockOdd: "#eeeeee" }, syntax: { string: "#abcdef" } },
            dark: { syntax: { keyword: "#fedcba" } },
        }
        const light = resolveTheme(scheme, "light")
        const dark = resolveTheme(scheme, "dark")

        expect(light.ui.accent).toBe("#123456")
        expect(dark.ui.accent).toBe("#123456")
        expect(light.ui.blockOdd).toBe("#eeeeee")
        expect(dark.ui.blockOdd).toBe(THEME_DEFAULTS.dark.ui.blockOdd)
        expect(light.syntax.keyword).toBe("#654321")
        expect(dark.syntax.keyword).toBe("#fedcba")
        expect(light.syntax.string).toBe("#abcdef")
        expect(dark.syntax.string).toBe(THEME_DEFAULTS.dark.syntax.string)
        expect(light.syntax.comment).toBe(THEME_DEFAULTS.light.syntax.comment)
        expect(dark.syntax.comment).toBe(THEME_DEFAULTS.dark.syntax.comment)
    })

    it("resolves fresh palettes without mutating defaults or other schemes", () => {
        const gray = getColorScheme("gray")
        const red = getColorScheme("red")
        const original = resolveTheme(red, "light")
        const palette = resolveTheme(red, "light")
        palette.syntax.keyword = "#000000"
        palette.ui.blockEven = "#123456"

        expect(resolveTheme(gray, "light")).toEqual(THEME_DEFAULTS.light)
        expect(resolveTheme(red, "light")).toEqual(original)
    })

    it("exports overrides and inherited defaults to CSS variables", () => {
        const override = { id: "custom", label: "Custom", dark: { syntax: { keyword: "#123456" } } }
        const custom = themeToCssVariables(resolveTheme(override, "dark"))
        const gray = themeToCssVariables(resolveTheme(getColorScheme("gray"), "dark"))

        expect(custom["--syntax-keyword"]).toBe("#123456")
        expect(gray["--syntax-keyword"]).toBe(THEME_DEFAULTS.dark.syntax.keyword)
        expect(gray["--ui-block-odd"]).toBe(THEME_DEFAULTS.dark.ui.blockOdd)
    })

    // WCAG 2.2 AA's 4.5:1 minimum for normal text is our readability target,
    // including syntax tokens on both block backgrounds and active-line overlays.
    // https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
    it.each(["light", "dark"])("keeps %s editor, footer, and math text readable", mode => {
        for (const scheme of COLOR_SCHEMES) {
            const { ui } = resolveTheme(scheme, mode)
            const context = `${scheme.id} ${mode}`
            for (const background of [ui.blockEven, ui.blockOdd]) {
                expect(contrast(ui.editorText, background), context).toBeGreaterThanOrEqual(4.5)
            }
            expect(contrast(ui.statusText, ui.statusBackground), context).toBeGreaterThanOrEqual(4.5)
            expect(contrast(ui.mathText, ui.mathBackground), context).toBeGreaterThanOrEqual(4.5)
        }
    })

    it.each(["light", "dark"])("keeps every %s syntax role readable on both blocks and the active line", mode => {
        for (const scheme of COLOR_SCHEMES) {
            const { ui, syntax } = resolveTheme(scheme, mode)
            const backgrounds = [ui.blockEven, ui.blockOdd]
            backgrounds.push(...backgrounds.map(background => composite(ui.activeLine, background)))
            for (const [role, color] of Object.entries(syntax)) {
                const foreground = color === "inherit" ? ui.editorText : color
                for (const background of backgrounds) {
                    expect(contrast(foreground, background), `${scheme.id} ${mode} ${role} on ${background}`).toBeGreaterThanOrEqual(4.5)
                }
            }
        }
    })

    it("falls back to gray for invalid metadata", () => {
        for (const value of [undefined, null, "grey", "unknown", "__proto__", 42, "yellow", "indigo", "violet", "teal"]) {
            expect(normalizeColorScheme(value)).toBe("gray")
            expect(getColorScheme(value).id).toBe("gray")
        }
    })
})
