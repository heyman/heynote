import { EditorSelection, EditorState, countColumn } from "@codemirror/state"
import { indentUnit, indentService } from "@codemirror/language"
import { indentMore } from "@codemirror/commands"

import { getNoteBlockFromPos } from "./block/block"
import { getLanguage } from "./languages"


export function indentation(indentType, tabSize) {
    let unit
    if (indentType === "tab") {
        unit = indentUnit.of("\t")
    } else if (indentType === "space") {
        unit = indentUnit.of(" ".repeat(tabSize))
    } else {
        throw new Error("Invalid indent type")
    }
    return [
        unit, 
        EditorState.tabSize.of(tabSize),
        indentService.of((context, pos) => {
            const block = getNoteBlockFromPos(context.state, pos)
            if (block && getLanguage(block.language.name)?.inheritIndentation) {
                return null
            }
            return undefined
        }),
    ]
}


export const insertIndentation = ({state, dispatch}) => {
    // if there is a selection, execute indentMore command
    if (state.selection.ranges.some(r => !r.empty)) {
        return indentMore({ state, dispatch })
    }

    if (state.facet(indentUnit) === "\t") {
        // if the indent unit is tabs, just insert tab character(s)
        dispatch(state.update(state.replaceSelection("\t", {scrollIntoView: true, userEvent: "input"})))
    } else {
        // if the indent unit is space, we need to figure out how many spaces to insert to align 
        // with the indendation columns (for each line)
        const tabSize = state.facet(EditorState.tabSize)

        const changes = state.changeByRange(range => {
            const line = state.doc.lineAt(range.head)
            // calculate the visual column the range is at, since there might be tab characters 
            // or other characters that takes up multiple characters
            const column = countColumn(line.text, tabSize, range.head - line.from)
            const spacesCount = tabSize - (column % tabSize)
            return {
                changes: {
                    from: range.head,
                    insert: " ".repeat(spacesCount),
                },
                range: EditorSelection.cursor(range.head + spacesCount),
            }
        })

        dispatch(state.update(changes, {
            scrollIntoView: true,
            userEvent: "input",
        }))
    }
    return true
}
