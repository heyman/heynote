import { EditorView } from "@codemirror/view"

export function getFontTheme(fontFamily, fontSize) {
    fontSize = fontSize || window.heynote.defaultFontSize
    return EditorView.theme({
        '.cm-scroller': {
            fontFamily: fontFamily || window.heynote.defaultFontFamily,
            fontSize: (fontSize) +  "px",
        },
    })
}
