import { EditorView } from "@codemirror/view"
import { lightSyntax } from "./syntax.js"

const lightTheme = EditorView.theme({
    "&": {
        backgroundColor: "var(--ui-editor-background)",
        color: "var(--ui-editor-text)",
    },
    ".cm-panels": {
        backgroundColor: "var(--ui-search-panel-background)",
        color: "var(--ui-search-panel-text)",
    },
    ".cm-panels .cm-textfield": {
        backgroundColor: "var(--ui-input-background)",
        border: "1px solid var(--ui-input-border)",
        color: "var(--ui-input-text)",
    },
    '.cm-panels .cm-button': {
        background: "var(--ui-button-background)",
        color: "var(--ui-button-text)",
    },
    '.cm-panels .cm-button:focus': {
        background: "var(--ui-button-hover)"
    },
    '.cm-panels .cm-button:hover': {
        background: "var(--ui-button-hover)"
    },
    '.cm-panels .cm-textfield:focus': {
        border: "1px solid var(--ui-accent)",
        outline: "1px solid var(--ui-accent)",
    },
    ".cm-panel.cm-search [name=close]" : {
        color: "var(--ui-close-icon-text)",
    },

    ".cm-cursor, .cm-dropCursor": {
        borderLeftColor: "var(--ui-cursor)",
    },
    ".cm-gutters": {
        backgroundColor: "var(--ui-gutter-background)",
        color: "var(--ui-gutter-text)",
        border: "none",
        borderRight: "1px solid var(--ui-gutter-border)",
    },
    ".cm-activeLineGutter": {
        backgroundColor: "transparent",
        color: "var(--ui-active-gutter-text)"
    },
    ".cm-activeLine": {
        backgroundColor: "var(--ui-active-line)",
    },
    '.cm-foldPlaceholder': {
        backgroundColor: 'transparent',
        border: 'none',
        color: "var(--ui-fold-text)"
    },
    ".cm-selectionBackground": {
        background: "var(--ui-selection-blur)",
    },
    "&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground": {
        background: "var(--ui-selection)",
    },
    '.cm-activeLine.heynote-empty-block-selected': {
        "background-color": "var(--ui-selection)",
    },

    ".heynote-blocks-layer .block-even": {
        background: "var(--ui-block-even)",
        borderTop: "1px solid var(--ui-block-border)",
    },
    ".heynote-blocks-layer .block-odd": {
        background: "var(--ui-block-odd)",
        borderTop: "1px solid var(--ui-block-border)",
    },

    ".cm-content": { caretColor: "var(--ui-cursor)" },
    ".cm-selectionMatch": { backgroundColor: "var(--ui-selection-match)" },
    "&.cm-focused .cm-matchingBracket": {
        backgroundColor: "var(--ui-bracket-match)",
        outline: "0.5px solid var(--ui-bracket-outline)",
    },
    "&.cm-focused .cm-nonmatchingBracket": {
        backgroundColor: "var(--ui-bracket-mismatch)",
        outline: "0.5px solid var(--ui-bracket-mismatch-outline)",
    },
    ".cm-tooltip": { backgroundColor: "var(--ui-tooltip-background)" },
    ".cm-tooltip-autocomplete ul li[aria-selected]": {
        backgroundColor: "var(--ui-autocomplete-selected-background)",
        color: "var(--ui-autocomplete-selected-text)",
    },
    ".cm-taskmarker-toggle input[type=checkbox]": {
        accentColor: "var(--ui-task-marker)",
    },
})

export const heynoteLight = [lightTheme, lightSyntax]
