import { EditorView } from '@codemirror/view';


export const heynoteBase = EditorView.theme({
    ".cm-content": {
        paddingTop: 4,
    },
    '.cm-scroller': {
        fontFamily: "Menlo, Monaco, 'Courier New', monospace",
    },
    '.cm-gutters': {
        padding: '0 2px 0 4px',
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
        height:'19px !important', 
        marginTop:'-2px !important'
    },
})
