import { EditorView } from "@codemirror/view";
import { HighlightStyle, syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { tags } from '@lezer/highlight';

const selection = "#77baff8c"
const selectionBlur = "#b2c2ca85"

const lightTheme = EditorView.theme({
    "&": {
        backgroundColor: "#fff",
    },
    '.cm-panels .cm-button': {
        background: "#959b98",//"#48b57e",
        color: "#fff",
    },
    '.cm-panels .cm-button:focus': {
        background: "#8b928e"
    },
    '.cm-panels .cm-button:hover': {
        background: "#8b928e"
    },
    '.cm-panels .cm-textfield:focus': {
        border: "1px solid #48b57e",
        outline: "1px solid #48b57e",
    },
    ".cm-panel.cm-search [name=close]" : {
        color: "rgba(0,0,0, 0.8)",
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
        background: selectionBlur,
    },
    "&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground": {
        background: selection,
    },
    '.cm-activeLine.heynote-empty-block-selected': {
        "background-color": selection,
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

const highlightStyle = HighlightStyle.define([
    ...defaultHighlightStyle.specs,

    // override heading style, in order to remove the ugly underline
    { tag: tags.heading, fontWeight: 'bold'},
])

const heynoteLight = [
    lightTheme,
    syntaxHighlighting(highlightStyle),
];

export { heynoteLight };
