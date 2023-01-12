import { EditorView } from "@codemirror/view";

export const heynoteLight = EditorView.theme({
    "&": {
        //color: base04,
        backgroundColor: "#f5f5f5",
    },
    ".cm-content": {
        //caretColor: cursor,
        paddingTop: 0,
    },
    ".cm-cursor, .cm-dropCursor": {
        borderLeftColor: "#000",
    },
    ".cm-gutters": {
        backgroundColor: "transparent",
        color: "rgba(0,0,0, 0.25)",
        border: "none",
        borderRight: "1px solid rgba(0,0,0, 0.07)",
    },
    ".cm-activeLineGutter": {
        backgroundColor: "transparent",
        color: "rgba(0,0,0, 0.6)"
    },
    ".cm-activeLine": {
        backgroundColor: "rgba(0,0,0, 0.04)",
    },
    ".cm-selectionBackground": {
        background: "#b2c2ca85",
    },
    "&.cm-focused .cm-selectionBackground": {
        background: "#77baff8c",
    },
})


