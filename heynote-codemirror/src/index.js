import { HeynoteEditor } from "./editor.js"
import initialData from "./fixture.js"

let editor = new HeynoteEditor({
    element: document.getElementById("editor"),
    content: initialData,
})
