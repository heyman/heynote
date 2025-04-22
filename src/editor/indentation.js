import { EditorState } from "@codemirror/state"
import { indentUnit } from "@codemirror/language"

export function indentation(indentType, tabSize) {
    let unit
    if (indentType === "tab") {
        unit = indentUnit.of("\t")
    } else if (indentType === "space") {
        unit = indentUnit.of(" ".repeat(tabSize))
    } else {
        throw new Error("Invalid indent type")
    }
    return [unit, EditorState.tabSize.of(tabSize)]
}
