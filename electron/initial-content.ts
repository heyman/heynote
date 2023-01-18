import { isMac } from "./detect-platform.js"

const modChar = isMac ? "⌘" : "Ctrl"

export const initialContent = `
∞∞∞text
Welcome to Heynote!

[${modChar} + Enter]        Insert new note block at cursor
[${modChar} + L]            Change block language
[${modChar} + Down]         Goto next block
[${modChar} + Up]           Goto previous block
[${modChar} + A]            Select all text in a note block. Press again to select the whole scratchpad
[${modChar} + ⌥ + Up/Down]  Add additional cursor above/below
∞∞∞text-a
`

export const initialDevContent = `
∞∞∞text-a
Welcome to Heynote!

[⌘ + Enter]        Insert new note block
[⌘ + F]            Find text
[⌘ + A]            Select all text in a note block. Press again to select the whole scratchpad
[⌘ + Up]           Go to start of note (or start of previous note if already at the start)
[⌘ + Down]         Go to end of note (or end of next note if already at the end)
[⌘ + ⌥ + Up/Down]  Add additional cursor above/below

∞∞∞python-a
# hmm
def my_func():
  print("hejsan")


import {basicSetup} from "codemirror"
import {EditorView, keymap} from "@codemirror/view"
import {javascript} from "@codemirror/lang-javascript"
import {indentWithTab, insertTab, indentLess, indentMore} from "@codemirror/commands"
import {nord} from "./nord.mjs"
∞∞∞javascript-a
let editor = new EditorView({
  //extensions: [basicSetup, javascript()],
  extensions: [
    basicSetup, 
    javascript(), 
    //keymap.of([indentWithTab]),
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
  ],
  parent: document.getElementById("editor"),
})
∞∞∞json
{
    "name": "heynote-codemirror",
    "type": "module",
    "version": "1.0.0",
    "description": "",
    "main": "index.js",
    "scripts": {
        "test": "echo \"Error: no test specified\" && exit 1",
        "build": "rollup -c"
    },
    "keywords": [],
    "author": "",
    "license": "ISC",
    "dependencies": {
        "@codemirror/commands": "^6.1.2",
        "@codemirror/lang-javascript": "^6.1.2",
        "@codemirror/lang-json": "^6.0.1",
        "@codemirror/lang-python": "^6.1.1",
        "@rollup/plugin-node-resolve": "^15.0.1",
        "codemirror": "^6.0.1",
        "i": "^0.3.7",
        "npm": "^9.2.0",
        "rollup": "^3.8.1",
        "rollup-plugin-typescript2": "^0.34.1",
        "typescript": "^4.9.4"
    }
}
∞∞∞html
<html>
    <head>
        <title>Test</title>
    </head>
    <body>
        <h1>Test</h1>
        <script>
            console.log("hej")
        </script>
    </body>
</html>
∞∞∞sql
SELECT * FROM table WHERE id = 1;
∞∞∞text
Shopping list:

- Milk
- Eggs
- Bread
- Cheese`