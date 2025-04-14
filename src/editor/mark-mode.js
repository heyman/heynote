import {
    simplifySelection,
} from "@codemirror/commands"

/**
 * Takes a command that moves the cursor and a command that marks the selection, and returns a new command that
 * will run the mark command if we're in Emacs mark mode, or the move command otherwise.
 */
export function markModeMoveCommand(defaultCmd, markModeCmd) {
    return (editor) => {
        if (editor.selectionMarkMode) {
            return (view) => {
                markModeCmd(view)
                // we need to return true here instead of returning what the default command returns, since the default 
                // codemirror select commands will return false if the selection doesn't change, which in turn will 
                // make the default *move* command run which will kill the selection if we're in mark mode
                return true
            }
        } else {
            return (view) => defaultCmd(view)
        }
    }
}


export function toggleSelectionMarkMode(editor) {
    return (view) => {
        editor.selectionMarkMode = !editor.selectionMarkMode
        return true
    }
}

export function selectionMarkModeCancel(editor) {
    return (view) => {
        simplifySelection(view)
        editor.selectionMarkMode = false
        return true
    }
}
