import os from "os";
import { keyHelpStr } from "../shared-utils/key-helper";

export const initialContent = `
{"formatVersion":"1.0.0","name":"Scratch"}
∞∞∞text
Welcome to Heynote! 👋

${keyHelpStr(os.platform())}
∞∞∞markdown
Read full documentation at https://heynote.com/docs
∞∞∞math
This is a Math block. Here, rows are evaluated as math expressions. 

radius = 5
area = radius^2 * PI
sqrt(9)

It also supports some basic unit conversions, including currencies:

13 inches in cm
time = 3900 seconds to minutes
time * 2

1 EUR in USD
∞∞∞markdown
In Markdown blocks, lists with [x] and [ ] are rendered as checkboxes:

- [x] Download Heynote
- [ ] Try out Heynote
∞∞∞text-a
`

export const initialDevContent = initialContent + `
∞∞∞python-a
# hmm
def my_func():
  print("hejsan")

∞∞∞javascript-a
import {basicSetup} from "codemirror"
import {EditorView, keymap} from "@codemirror/view"
import {javascript} from "@codemirror/lang-javascript"
import {indentWithTab, insertTab, indentLess, indentMore} from "@codemirror/commands"
import {nord} from "./nord.mjs"

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

