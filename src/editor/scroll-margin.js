import { EditorState, Compartment } from "@codemirror/state"
import { EditorView, ViewPlugin } from "@codemirror/view"
import { getActiveNoteBlock, getLastNoteBlock, getBlockLineFromPos } from "./block/block"

const NUM_LINES_MARGIN = 5

export function scrollMargin() {
    const marginCompartment = new Compartment()
    let lineHeight = 16

    function getMarginSize(lines) {
        return lineHeight * lines
    }
    function margins(top) {
        return EditorView.scrollMargins.of(() => ({ top, bottom: getMarginSize(NUM_LINES_MARGIN) }))
    }

    let currentTopMargin = getMarginSize(NUM_LINES_MARGIN)

    // Transaction extender that will set a dynamic top scroll margin if we're in the last block,
    // so that one can have the blocks start at the top of the viewport without any of the blocks 
    // above it visible
    const dynamicScrollMargins = EditorState.transactionExtender.of(tr => {
        if (!tr.selection) {
            return
        }
        const state = tr.state
        const lineNum = getBlockLineFromPos(state, state.selection.asSingle().main.from)?.line
        if (!lineNum) {
            return
        }
        // set the desired top margin 
        let topMargin
        if (getActiveNoteBlock(state).range == getLastNoteBlock(state).range && lineNum <= NUM_LINES_MARGIN) {
            // if we're in the first lines of the last block, we'll set a top margin equal to the number 
            // of lines above the cursor
            topMargin = getMarginSize(lineNum - 1)
        } else {
            // otherwise use the default top margin
            topMargin = getMarginSize(NUM_LINES_MARGIN)
        }

        // if the desired top margin is something else than the current, add an effect that changes the margin
        if (topMargin !== currentTopMargin) {
            currentTopMargin = topMargin
            return {
                effects: [
                    marginCompartment.reconfigure(margins(topMargin))
                ]
            }
        }
        return null
    })

    // keep track of the line height
    const lineHeightViewPlugin = ViewPlugin.fromClass(class {
        constructor(view) {
            this.view = view
            lineHeight = this.view.defaultLineHeight
        }
        update(update) {
            if (update.geometryChanged) {
                lineHeight = this.view.defaultLineHeight
            }
        }
    })

    return [
        dynamicScrollMargins,
        lineHeightViewPlugin,
        marginCompartment.of(margins(getMarginSize(NUM_LINES_MARGIN))),
    ]
}

export function getScrollMargins(editor) {
    const margins = { top: 0, bottom: 0, left: 0, right: 0 }

    for (const provider of editor.view.state.facet(EditorView.scrollMargins)) {
        const m = provider(editor.view)
        if (m.top != null) margins.top += m.top
        if (m.bottom != null) margins.bottom += m.bottom
        if (m.left != null) margins.left += m.left
        if (m.right != null) margins.right += m.right
    }

    return margins
}
