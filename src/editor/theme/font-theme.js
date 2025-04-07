import { EditorView } from "@codemirror/view"
import { Facet } from "@codemirror/state"


/**
 * Check if the given font family is monospace by drawing test characters on a canvas
 */
function isMonospace(fontFamily) {
    const testCharacters = ['i', 'W', 'm', ' ']
    const testSize = '72px'
  
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    context.font = `${testSize} ${fontFamily}`
  
    const widths = testCharacters.map(char => context.measureText(char).width)
    return widths.every(width => width === widths[0])
}


export const isMonospaceFont = Facet.define({
    combine: values => values.length ? values[0] : true,
})

export function getFontTheme(fontFamily, fontSize) {
    fontSize = fontSize || window.heynote.defaultFontSize
    const computedFontFamily = fontFamily || window.heynote.defaultFontFamily
    return [
        EditorView.theme({
            '.cm-scroller': {
                fontFamily: computedFontFamily,
                fontSize: (fontSize) +  "px",
            },
        }),
        // in order to avoid a short flicker when the program is loaded with the default font (Hack), 
        // we hardcode Hack to be monospace
        isMonospaceFont.of(computedFontFamily === "Hack" ? true : isMonospace(computedFontFamily)),
    ]
}
