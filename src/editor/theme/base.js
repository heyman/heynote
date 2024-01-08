import { EditorView } from '@codemirror/view';


export const heynoteBase = EditorView.theme({
    ".cm-panels": {
        fontSize: "12px",
    },
    ".cm-panels .cm-panel": {
        boxShadow: "0 0 10px rgba(0,0,0,0.15)",
        padding: "8px 12px",
    },
    '.cm-panels .cm-textfield': {
        fontSize: "1em",
        borderRadius: "2px",
    },
    '.cm-panels .cm-button': {
        border: "none",
        borderRadius: "2px",
        fontSize: "1em",
        cursor: "pointer",
        padding: "2px 12px",
    },
    '.cm-panels .cm-button:focus': {
        border: "none",
        outline: "2px solid #48b57e",
        outlineOffset: "1px",
    },
    ".cm-panel.cm-search label": {
        fontSize: "1em",
    },
    ".cm-panel.cm-search input[type=checkbox]": {
        position: "relative",
        top: "2px",
    },
    ".cm-panel.cm-search input[type=checkbox]:focus-visible": {
        outline: "2px auto #48b57e",
        outlineOffset: "2px",
        //borderRadius: "3px",
    },
    ".cm-panel.cm-search [name=close]" : {
        fontSize: "18px",
        right: "4px",
        top: "4px",
        width: "22px",
        height: "22px",
        border: "2px solid transparent",
        borderRadius: "2px",
        cursor: "pointer",
    },
    ".cm-panel.cm-search [name=close]:focus-visible" : {
        border: "2px solid #48b57e",
        outline: "none",
    },

    "&.cm-editor.cm-focused": {
        outline: "none",
    },
    ".cm-content": {
        paddingTop: 4,
    },
    '.cm-gutters': {
        padding: '0 2px 0 4px',
        userSelect: 'none',
    },
    '.cm-foldGutter': {
        marginLeft: '0px',
    },
    '.cm-foldGutter .cm-gutterElement': {
        opacity: 0,
        transition: "opacity 400ms",
    },
    '.cm-gutters:hover .cm-gutterElement': {
        opacity: 1,
    },
    '.cm-cursor, .cm-dropCursor': {
        borderLeftWidth:'2px', 
        paddingTop: '4px',
        marginTop: '-2px',
    },
    '.heynote-blocks-layer': {
        width: '100%',
    },
    '.heynote-blocks-layer .block-even, .heynote-blocks-layer .block-odd': {
        width: '100%',
        boxSizing: 'content-box',
    },
    '.heynote-blocks-layer .block-even:first-child': {
        borderTop: 'none',
    },
    '.heynote-block-start': {
        height: '12px',
    },
    '.heynote-block-start.first': {
        height: '0px',
    },
    '.heynote-math-result': {
        paddingLeft: "12px",
        position: "relative",
    },
    '.heynote-math-result .inner': {
        background: '#48b57e',
        color: '#fff',
        padding: '0px 4px',
        borderRadius: '2px',
        boxShadow: '0 0 3px rgba(0,0,0, 0.1)',
        cursor: 'pointer',
        whiteSpace: "nowrap",
    },
    '.heynote-math-result-copied': {
        position: "absolute",
        top: "0px",
        left: "0px",
        marginLeft: "calc(100% + 10px)",
        width: "60px",
        transition: "opacity 500ms",
        transitionDelay: "1000ms",
        color: "rgba(0,0,0, 0.8)",
    },
    '.heynote-math-result-copied.fade-out': {
        opacity: 0,
    },
    '.heynote-link': {
        textDecoration: "underline",
    },
})
