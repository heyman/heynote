import { EditorState, EditorSelection } from "@codemirror/state"
import { EditorView } from "@codemirror/view"

import { LANGUAGES } from './languages.js'
import { BLOCK_DELIMITER_REGEX } from './block/block-parsing.js'


function copiedRange(state) {
    let content = [], ranges = []
    for (let range of state.selection.ranges) {
        if (!range.empty) {
            content.push(state.sliceDoc(range.from, range.to))
            ranges.push(range)
        }
    }
    if (ranges.length == 0) {
        // if all ranges are empty, we want to copy each whole (unique) line for each selection
        const copiedLines = []
        for (let range of state.selection.ranges) {
            if (range.empty) {
                const line = state.doc.lineAt(range.head)
                const lineContent = state.sliceDoc(line.from, line.to)
                if (!copiedLines.includes(line.from)) {
                    content.push(lineContent)
                    ranges.push(range)
                    copiedLines.push(line.from)
                }
            }
        }
    }
    return { text: content.join(state.lineBreak), ranges }
}




/**
 * Set up event handlers for the browser's copy & cut events, that will replace block separators with newlines
 */
export const heynoteCopyCut = (editor) => {
    let copy, cut
    copy = cut = (event, view) => {
        copyCut(editor.view, event.type == "cut", editor)
        event.preventDefault()
    }

    return EditorView.domEventHandlers({
        copy,
        cut,
    })
}

const copyCut = (view, cut, editor) => {
    let { text, ranges } = copiedRange(view.state)
    text = text.replaceAll(BLOCK_DELIMITER_REGEX, "\n\n")
    navigator.clipboard.writeText(text)

    if (cut && !view.state.readOnly) {
        view.dispatch({
            changes: ranges,
            scrollIntoView: true,
            userEvent: "delete.cut"
        })
    }

    // if we're in Emacs mode, we want to exit mark mode in case we're in it
    editor.selectionMarkMode = false

    // if Editor.deselectOnCopy is set (e.g. we're in Emacs mode), we want to remove the selection after we've copied the text
    if (editor.deselectOnCopy && !cut) {
        const newSelection = EditorSelection.create(
            view.state.selection.ranges.map(r => EditorSelection.cursor(r.head)),
            view.state.selection.mainIndex,
        )
        view.dispatch(view.state.update({
            selection: newSelection,
        }))
    }
    return true
}


function doPaste(view, input) {
    let { state } = view, changes, i = 1, text = state.toText(input)
    let byLine = text.lines == state.selection.ranges.length
    if (byLine) {
        changes = state.changeByRange(range => {
            let line = text.line(i++)
            return {
                changes: { from: range.from, to: range.to, insert: line.text },
                range: EditorSelection.cursor(range.from + line.length)
            }
        })
    } else {
        changes = state.replaceSelection(text)
    }
    view.dispatch(changes, {
        userEvent: "input.paste",
        scrollIntoView: true
    })
}

/**
 * @param editor Editor instance
 * @returns CodeMirror command that copies the current selection to the clipboard
 */
export function copyCommand(editor) {
    return (view) => copyCut(view, false, editor)
}

/**
 * @param editor Editor instance
 * @returns CodeMirror command that cuts the current selection to the clipboard
 */
export function cutCommand(editor) {
    return (view) => copyCut(view, true, editor)
}

/**
 * CodeMirror command that pastes the clipboard content into the editor
 */
export async function pasteCommand(view) {
    return doPaste(view, await navigator.clipboard.readText())
}

