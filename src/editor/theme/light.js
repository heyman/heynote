import { EditorView } from "@codemirror/view";

export const heynoteLight = EditorView.theme({
    "&": {
        backgroundColor: "#fff",
    },
    ".cm-cursor, .cm-dropCursor": {
        borderLeftColor: "#000",
    },
    ".cm-gutters": {
        backgroundColor: "rgba(0,0,0, 0.04)",
        color: "rgba(0,0,0, 0.25)",
        border: "none",
        borderRight: "1px solid rgba(0,0,0, 0.05)",
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

    ".heynote-blocks-layer .block-even": {
        background: "#ffffff",
        borderTop: "1px solid #dfdfdf",
    },
    ".heynote-blocks-layer .block-odd": {
        background: "#f4f8f4",
        borderTop: "1px solid #dfdfdf",
    },
})


