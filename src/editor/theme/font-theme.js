import { EditorView } from "@codemirror/view"

export const defaultFontFamily = "Hack"
export const defaultFontSize = 12


export function getFontTheme(fontFamily, fontSize) {
    fontSize = fontSize || defaultFontSize
    return EditorView.theme({
        '.cm-scroller': {
            fontFamily: fontFamily || defaultFontFamily,
            fontSize: (fontSize) +  "px",
        },
    })
}
