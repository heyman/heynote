import { expect, test } from "@playwright/test"
import { EditorState } from "@codemirror/state"

import { heynoteLang } from "../src/editor/lang-heynote/heynote.js"
import { getBlocksFromSyntaxTree, getBlocksFromString } from "../src/editor/block/block.js"

test("parse blocks from both syntax tree and string contents", async ({page}) => {
    const contents = `
∞∞∞text
Text Block A
∞∞∞text-a
Text Block B
∞∞∞json-a
{
"key": "value"
}
∞∞∞python
print("Hello, World!")
`
    const state = EditorState.create({
        doc: contents,
        extensions: heynoteLang(),
    })
    const treeBlocks = getBlocksFromSyntaxTree(state)
    const stringBlocks = getBlocksFromString(state)

    expect(treeBlocks).toEqual(stringBlocks)
})
