import { EditorView } from "@codemirror/view"
import { darkSyntax } from "./syntax.js"

const darkTheme = EditorView.theme({
    '&': {
        color: "var(--ui-editor-text)",
        backgroundColor: "var(--ui-editor-background)"
    },
    '.cm-content': {
        caretColor: "var(--ui-cursor)",
    },
    '.cm-cursor, .cm-dropCursor': { borderLeftColor: "var(--ui-cursor)" },
    '.cm-selectionBackground': {
        backgroundColor: "var(--ui-selection-blur)",
    },
    '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground': {
        backgroundColor: "var(--ui-selection)",
    },
    '.cm-activeLine.heynote-empty-block-selected': {
        "background-color": "var(--ui-selection)",
    },
    '.cm-panels': {
        backgroundColor: "var(--ui-search-panel-background)",
        color: "var(--ui-search-panel-text)",
    },
    '.cm-panels .cm-textfield': {
        backgroundColor: "var(--ui-input-background)",
        border: "1px solid var(--ui-input-border)",
        color: "var(--ui-input-text)",
    },
    '.cm-panels .cm-textfield:focus': {
        border: "1px solid var(--ui-accent)",
        outline: "1px solid var(--ui-accent)",
    },
    '.cm-panels .cm-button': {
        background: "var(--ui-button-background)",
        color: "var(--ui-button-text)",
        border: "none",
    },
    ".cm-panels .cm-button:hover, .cm-panels .cm-button:focus": { background: "var(--ui-button-hover)" },
    ".cm-taskmarker-toggle input[type=checkbox]": { accentColor: "var(--ui-task-marker)" },
    ".cm-panel.cm-search [name=close]" : {
        color: "var(--ui-close-icon-text)",
    },

    ".cm-searchMatch": {
        backgroundColor: "var(--ui-search-match)",
    },
    ".cm-searchMatch-selected": {
        backgroundColor: "var(--ui-search-match-selected)",
        outline: "1px solid var(--ui-search-match-outline)",
    },

    '.cm-activeLine': { backgroundColor: "var(--ui-active-line)" },
    '.cm-selectionMatch': {
        backgroundColor: "var(--ui-selection-match)",
    },
    '&.cm-focused .cm-matchingBracket, &.cm-focused .cm-nonmatchingBracket': {
        outline: "0.5px solid var(--ui-bracket-outline)"
    },
    '&.cm-focused .cm-matchingBracket': {
        backgroundColor: "var(--ui-bracket-match)",
        color: "inherit",
    },
    '&.cm-focused .cm-nonmatchingBracket': {
        backgroundColor: "var(--ui-bracket-mismatch)",
        outline: "0.5px solid var(--ui-bracket-mismatch-outline)"
    },
    '.cm-gutters': {
        backgroundColor: "var(--ui-gutter-background)",
        color: "var(--ui-gutter-text)",
        border: 'none',
    },
    '.cm-activeLineGutter': {
        backgroundColor: "transparent",
        color: "var(--ui-active-gutter-text)"
    },
    '.cm-foldPlaceholder': {
        backgroundColor: 'transparent',
        border: 'none',
        color: "var(--ui-fold-text)"
    },
    '.cm-tooltip': {
        border: 'none',
        backgroundColor: "var(--ui-tooltip-background)"
    },
    '.cm-tooltip .cm-tooltip-arrow:before': {
        borderTopColor: 'transparent',
        borderBottomColor: 'transparent'
    },
    '.cm-tooltip .cm-tooltip-arrow:after': {
        borderTopColor: "var(--ui-tooltip-background)",
        borderBottomColor: "var(--ui-tooltip-background)"
    },
    '.cm-tooltip-autocomplete': {
        '& > ul > li[aria-selected]': {
            backgroundColor: "var(--ui-autocomplete-selected-background)",
            color: "var(--ui-autocomplete-selected-text)"
        }
    },
    ".heynote-blocks-layer .block-even": {
        background: "var(--ui-block-even)",
        borderTop: "1px solid var(--ui-block-border)",
    },
    ".heynote-blocks-layer .block-odd": {
        background: "var(--ui-block-odd)",
        borderTop: "1px solid var(--ui-block-border)",
    },
    ".heynote-math-result .inner": {
        background: "var(--ui-math-background)",
        color: "var(--ui-math-text)",
        boxShadow: "0 0 3px var(--ui-math-shadow)",
    },
    '.heynote-math-result-copied': {
        color: "var(--ui-math-copied-text)",
    },

    '.cm-highlightSpace': {
        'background-image': 'radial-gradient(circle at 50% 54%, var(--ui-whitespace) 11%, transparent 5%)',
    },
    '.cm-highlightTab': {
        'background-image': `url("data:image/svg+xml,%3C%3Fxml version='1.0' encoding='UTF-8' standalone='no'%3F%3E%3C!DOCTYPE svg PUBLIC '-//W3C//DTD SVG 1.1//EN' 'http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd'%3E%3Csvg width='100%25' height='100%25' viewBox='0 0 20 20' version='1.1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' xml:space='preserve' xmlns:serif='http://www.serif.com/' style='fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;'%3E%3Cg%3E%3Cpath d='M15.063,9.457l-12.424,0.061l0,0.978l12.518,-0.061l-2.48,2.526l0.7,0.707l2.917,-2.967l0.006,0.006l0.7,-0.707l-3.599,-3.657l-0.7,0.707l2.362,2.407Z' style='fill:%23fff;fill-opacity:0.15;'/%3E%3C/g%3E%3C/svg%3E")`,
    },
}, { dark: true });

export const heynoteDark = [darkTheme, darkSyntax]
export { darkHighlightStyle } from "./syntax.js"
export { darkTheme }
