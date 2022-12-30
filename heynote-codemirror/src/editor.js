import {Annotation, EditorState, Compartment} from "@codemirror/state"
import {EditorView, keymap, drawSelection} from "@codemirror/view"

import {indentWithTab, insertTab, indentLess, indentMore} from "@codemirror/commands"
import {nord} from "./theme/nord.mjs"
import initialData from "./fixture.js"
import { customSetup } from "./setup.js"
import { heynoteLang } from "./lang-heynote/heynote.js"
import { noteBlockExtension } from "./note-block.js"
import { heynoteEvent, INITIAL_DATA } from "./annotation.js"


let state = EditorState.create({
    extensions: [
        /*keymap.of([
            {
                key: "Shift-Tab",
                preventDefault: true,
                run: () => {
                    console.log("debug:", syntaxTree(editor.state).toString())
                },
            },
        ]),*/
        customSetup, 
        //minimalSetup,
        
        keymap.of([
            {
                key: 'Tab',
                preventDefault: true,
                //run: insertTab,
                run: indentMore,
            },
            {
                key: 'Shift-Tab',
                preventDefault: true,
                run: indentLess,
            },
        ]),
        nord,
        
        heynoteLang(),
        noteBlockExtension(),
        
        // set cursor blink rate to 1 second
        drawSelection({cursorBlinkRate:1000}),
    ],
})

let editor = new EditorView({
    state,
    parent: document.getElementById("editor"),
})

// set initial data
editor.update([
    editor.state.update({
        changes:{
            from: 0,
            to: editor.state.doc.length,
            insert: initialData,
        },
        annotations: heynoteEvent.of(INITIAL_DATA),
    })
])


editor.dispatch({
    selection: {anchor: editor.state.doc.length, head: editor.state.doc.length},
    scrollIntoView: true,
})
editor.focus()








/*
// render syntax tree
setTimeout(() => {
    function render(tree) {
        let lists = ''
        tree.iterate({
            enter(type) {
                lists += `<ul><li>${type.name} (${type.from},${type.to})`
            },
            leave() {
                lists += '</ul>'
            }
        })
        return lists
    }
    let html = render(syntaxTree(editor.state))
    document.getElementById("syntaxTree").innerHTML = html;
}, 1000)
*/