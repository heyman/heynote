import { syntaxTree } from "@codemirror/language"

import { HeynoteEditor } from "./editor.js"
import initialData from "./fixture.js"

let editor = new HeynoteEditor({
    element: document.getElementById("editor"),
    content: initialData,
})

/*// render syntax tree
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

