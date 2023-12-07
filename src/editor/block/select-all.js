import { ViewPlugin, Decoration } from "@codemirror/view"
import { StateField, StateEffect, RangeSetBuilder } from "@codemirror/state"
import { selectAll as defaultSelectAll } from "@codemirror/commands"

import { getActiveNoteBlock } from "./block"



/**
 * When the user presses C-a, we want to first select the whole block. But if the whole block is already selected, 
 * we want to instead select the whole document. This doesn't work for empty block, since the whole block is already 
 * selected (since it's empty). Therefore we use a StateField to keep track of whether the empty block is selected, 
 * and add a manual line decoration to visually indicate that the empty block is selected.
 */


export const emptyBlockSelected = StateField.define({
    create: () => {
        return null
    },
    update(value, tr) {
        if (tr.selection) {
            // if selection changes, reset the state
            return null
        } else {
            for (let e of tr.effects) {
                if (e.is(setEmptyBlockSelected)) {
                    // toggle the state to true
                    return e.value
                }
            }
        }
    },
    provide() {
        return ViewPlugin.fromClass(class {
            constructor(view) {
                this.decorations = emptyBlockSelectedDecorations(view)
            }
            update(update) {
                this.decorations = emptyBlockSelectedDecorations(update.view)
            }
        }, {
            decorations: v => v.decorations
        })
    }
})

/**
 * Effect that can be dispatched to set the empty block selected state
 */
 const setEmptyBlockSelected = StateEffect.define()

const decoration = Decoration.line({
    attributes: {class: "heynote-empty-block-selected"}
})
function emptyBlockSelectedDecorations(view) {
    const selectionPos = view.state.field(emptyBlockSelected)
    const builder = new RangeSetBuilder()
    if (selectionPos) {
        const line = view.state.doc.lineAt(selectionPos)
        builder.add(line.from, line.from, decoration)
    }
    return builder.finish()
}


export const selectAll = ({ state, dispatch }) => {
    const range = state.selection.asSingle().ranges[0]
    const block = getActiveNoteBlock(state)

    // handle empty blocks separately
    if (block.content.from === block.content.to) {
        // check if C-a has already been pressed, 
        if (state.field(emptyBlockSelected)) {
            // if the active block is already marked as selected we want to select the whole buffer
            return defaultSelectAll({state, dispatch})
        } else if (range.empty) {
            // if the empty block is not selected mark it as selected
            // the reason we check for range.empty is if there is a an empty block at the end of the document 
            // and the users presses C-a twice so that the whole buffer gets selected, the active block will 
            // still be empty but we don't want to mark it as selected
            dispatch({
                effects: setEmptyBlockSelected.of(block.content.from)
            })
        }
        return true
    }

    // check if all the text of the note is already selected, in which case we want to select all the text of the whole document
    if (range.from === block.content.from && range.to === block.content.to) {
        return defaultSelectAll({state, dispatch})
    }

    dispatch(state.update({
        selection: {anchor: block.content.from, head: block.content.to}, 
        userEvent: "select"
    }))

    return true
}


