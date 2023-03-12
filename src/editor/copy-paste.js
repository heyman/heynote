import { EditorState, EditorSelection } from "@codemirror/state"
import { EditorView } from "@codemirror/view"

import { LANGUAGES } from './languages.js';
import { setEmacsMarkMode } from "./emacs.js"


const languageTokensMatcher = LANGUAGES.map(l => l.token).join("|")
const blockSeparatorRegex = new RegExp(`\\n∞∞∞(${languageTokensMatcher})(-a)?\\n`, "g")


function copiedRange(state) {
    let content = [], ranges = []
    for (let range of state.selection.ranges) if (!range.empty) {
        content.push(state.sliceDoc(range.from, range.to))
        ranges.push(range)
    }
    return { text: content.join(state.lineBreak), ranges }
}




export const heynoteCopyPaste = (editor) => {
    let copy, cut
    copy = cut = (event, view) => {
        let { text, ranges } = copiedRange(view.state)
        text = text.replaceAll(blockSeparatorRegex, "\n\n")
        let data = event.clipboardData
        if (data) {
            event.preventDefault()
            data.clearData()
            data.setData("text/plain", text)
        }
        if (event.type == "cut" && !view.state.readOnly) {
            view.dispatch({
                changes: ranges,
                scrollIntoView: true,
                userEvent: "delete.cut"
            })
        }
        
        // if we're in Emacs mode, we want to exit mark mode in case we're in it
        setEmacsMarkMode(false)

        // if Editor.deselectOnCopy is set (e.g. we're in Emacs mode), we want to remove the selection after we've copied the text
        if (editor.deselectOnCopy && event.type == "copy") {
            const newSelection = EditorSelection.create(
                view.state.selection.ranges.map(r => EditorSelection.cursor(r.head)),
                view.state.selection.mainIndex,
            )
            view.dispatch(view.state.update({
                selection: newSelection,
            }))
        }
    }

    return EditorView.domEventHandlers({
        copy,
        cut,
    })
}
