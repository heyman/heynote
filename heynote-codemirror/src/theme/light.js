import { EditorView } from '@codemirror/view';

export const heynoteLight = EditorView.theme({
    '&': {
        //color: base04,
        backgroundColor: "#f5f5f5",
    },
    '.cm-content': {
        //caretColor: cursor,
        paddingTop: 0,
    },
    '.cm-cursor, .cm-dropCursor': {
        borderLeftColor: '#000',
    },
    '.cm-gutters': {
        //backgroundColor: 'transparent',
        //backgroundColor: 'rgba(0,0,0, 0.03)',
        color: 'rgba(0,0,0, 0.25)',
        border: 'none',
    },
    '.cm-activeLineGutter': {
        backgroundColor: "transparent",
        color: 'rgba(0,0,0, 0.6)'
    },
    '.cm-activeLine': {
        backgroundColor: "rgba(0,0,0, 0.04)",
    },
})


