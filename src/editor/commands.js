import * as codeMirrorCommands from "@codemirror/commands"
import { 
    undo, redo, 
    indentMore, indentLess,
    deleteCharBackward, deleteCharForward,
    deleteGroupBackward, deleteGroupForward,
    deleteLineBoundaryBackward, deleteLineBoundaryForward,
    deleteToLineEnd, deleteToLineStart,
    simplifySelection,
    splitLine,
    insertNewlineAndIndent,
} from "@codemirror/commands"
import { foldCode, unfoldCode } from "@codemirror/language"
import { selectNextOccurrence } from "@codemirror/search"
import { insertNewlineContinueMarkup } from "@codemirror/lang-markdown"

import { 
    addNewBlockAfterCurrent, addNewBlockBeforeCurrent, addNewBlockAfterLast, addNewBlockBeforeFirst, insertNewBlockAtCursor, 
    gotoPreviousBlock, gotoNextBlock, selectNextBlock, selectPreviousBlock,
    gotoPreviousParagraph, gotoNextParagraph, selectNextParagraph, selectPreviousParagraph,
    moveLineUp, moveLineDown,
    selectAll,
    deleteBlock, deleteBlockSetCursorPreviousBlock,
    newCursorBelow, newCursorAbove,
    moveCurrentBlockUp, moveCurrentBlockDown,
} from "./block/commands.js"
import { deleteLine } from "./block/delete-line.js"
import { formatBlockContent } from "./block/format-code.js"
import { transposeChars } from "./block/transpose-chars.js"

import { cutCommand, copyCommand, pasteCommand } from "./copy-paste.js"

import { markModeMoveCommand, toggleSelectionMarkMode, selectionMarkModeCancel } from "./mark-mode.js"


const cursorPreviousBlock = markModeMoveCommand(gotoPreviousBlock, selectPreviousBlock)
const cursorNextBlock = markModeMoveCommand(gotoNextBlock, selectNextBlock)
const cursorPreviousParagraph = markModeMoveCommand(gotoPreviousParagraph, selectPreviousParagraph)
const cursorNextParagraph = markModeMoveCommand(gotoNextParagraph, selectNextParagraph)


const openLanguageSelector = (editor) => () => {
    editor.openLanguageSelector()
    return true
}
const openBufferSelector = (editor) => () => {
    editor.openBufferSelector()
    return true
}
const openCommandPalette = (editor) => () => {
    editor.openCommandPalette()
    return true
}
const openMoveToBuffer = (editor) => () => {
    editor.openMoveToBufferSelector()
    return true
}
const openCreateNewBuffer = (editor) => () => {
    editor.openCreateBuffer("new")
    return true
}
const nothing = (view) => {
    return true
}

const cmd = (f, category, description) => ({
    run: f,
    name: f.name,
    description: description,
    category: category,
})

const cmdLessContext = (f, category, description) => ({
    run: (editor) => f,
    name: f.name,
    description: description,
    category: category,
})


const HEYNOTE_COMMANDS = {
    addNewBlockAfterCurrent: cmd(addNewBlockAfterCurrent, "Block", "Add new block after current block"),
    addNewBlockBeforeCurrent: cmd(addNewBlockBeforeCurrent, "Block", "Add new block before current block"),
    addNewBlockAfterLast: cmd(addNewBlockAfterLast, "Block", "Add new block after last block"),
    addNewBlockBeforeFirst: cmd(addNewBlockBeforeFirst, "Block", "Add new block before first block"),
    insertNewBlockAtCursor: cmd(insertNewBlockAtCursor, "Block", "Insert new block at cursor"),
    deleteBlock: cmd(deleteBlock, "Block", "Delete block"),
    deleteBlockSetCursorPreviousBlock: cmd(deleteBlockSetCursorPreviousBlock, "Block", "Delete block and set cursor to previous block"),
    cursorPreviousBlock: cmd(cursorPreviousBlock, "Cursor", "Move cursor to previous block"),
    cursorNextBlock: cmd(cursorNextBlock, "Cursor", "Move cursor to next block"),
    cursorPreviousParagraph: cmd(cursorPreviousParagraph, "Cursor", "Move cursor to previous paragraph"),
    cursorNextParagraph: cmd(cursorNextParagraph, "Cursor", "Move cursor to next paragraph"),
    toggleSelectionMarkMode: cmd(toggleSelectionMarkMode, "Cursor", "Toggle selection mark mode"),
    selectionMarkModeCancel: cmd(selectionMarkModeCancel, "Cursor", "Cancel selection mark mode"),
    openLanguageSelector: cmd(openLanguageSelector, "Block", "Select block language"),
    openBufferSelector: cmd(openBufferSelector, "Buffer", "Buffer selector"),
    openCommandPalette: cmd(openCommandPalette, "Editor", "Open command palette"),
    openMoveToBuffer: cmd(openMoveToBuffer, "Block", "Move block to another buffer"),
    openCreateNewBuffer: cmd(openCreateNewBuffer, "Buffer", "Create new buffer"),
    cut: cmd(cutCommand, "Clipboard", "Cut selection"),
    copy: cmd(copyCommand, "Clipboard", "Copy selection"),

    // commands without editor context
    paste: cmdLessContext(pasteCommand, "Clipboard", "Paste from clipboard"),
    selectAll: cmdLessContext(selectAll, "Selection", "Select all"),
    moveLineUp: cmdLessContext(moveLineUp, "Edit", "Move line up"),
    moveLineDown: cmdLessContext(moveLineDown, "Edit", "Move line down"),
    deleteLine: cmdLessContext(deleteLine, "Edit", "Delete line"),
    formatBlockContent: cmdLessContext(formatBlockContent, "Block", "Format block content"),
    moveCurrentBlockUp: cmdLessContext(moveCurrentBlockUp, "Block", "Move current block up"),
    moveCurrentBlockDown: cmdLessContext(moveCurrentBlockDown, "Block", "Move current block down"),
    newCursorAbove: cmdLessContext(newCursorAbove, "Cursor", "Add cursor above"),
    newCursorBelow: cmdLessContext(newCursorBelow, "Cursor", "Add cursor below"),
    selectPreviousParagraph: cmdLessContext(selectPreviousParagraph, "Selection", "Select to previous paragraph"),
    selectNextParagraph: cmdLessContext(selectNextParagraph, "Selection", "Select to next paragraph"),
    selectPreviousBlock: cmdLessContext(selectPreviousBlock, "Selection", "Select to previous block"),
    selectNextBlock: cmdLessContext(selectNextBlock, "Selection", "Select to next block"),
    nothing: cmdLessContext(nothing, "Misc", "Do nothing"),

    // directly from CodeMirror
    undo: cmdLessContext(undo, "Edit", "Undo"),
    redo: cmdLessContext(redo, "Edit", "Redo"),
    indentMore: cmdLessContext(indentMore, "Edit", "Indent more"),
    indentLess: cmdLessContext(indentLess, "Edit", "Indent less"),
    foldCode: cmdLessContext(foldCode, "Edit", "Fold code"),
    unfoldCode: cmdLessContext(unfoldCode, "Edit", "Unfold code"),
    selectNextOccurrence: cmdLessContext(selectNextOccurrence, "Cursor", "Select next occurrence"),
    deleteCharBackward: cmdLessContext(deleteCharBackward, "Edit", "Delete character backward"),
    deleteCharForward: cmdLessContext(deleteCharForward, "Edit", "Delete character forward"),
    deleteGroupBackward: cmdLessContext(deleteGroupBackward, "Edit", "Delete group backward"),
    deleteGroupForward: cmdLessContext(deleteGroupForward, "Edit", "Delete group forward"),
    deleteLineBoundaryBackward: cmdLessContext(deleteLineBoundaryBackward, "Edit", "Delete from start of wrapped line"),
    deleteLineBoundaryForward: cmdLessContext(deleteLineBoundaryForward, "Edit", "Delete to end of wrapped line"),
    deleteToLineEnd: cmdLessContext(deleteToLineEnd, "Edit", "Delete to end of line"),
    deleteToLineStart: cmdLessContext(deleteToLineStart, "Edit", "Delete from start of line"),
    simplifySelection: cmdLessContext(simplifySelection, "Cursor", "Simplify selection"),
    splitLine: cmdLessContext(splitLine, "Edit", "Split line"),
    transposeChars: cmdLessContext(transposeChars, "Edit", "Transpose characters"),
    insertNewlineAndIndent: cmdLessContext(insertNewlineAndIndent, "Edit", "Insert newline and indent"),
    insertNewlineContinueMarkup: cmdLessContext(insertNewlineContinueMarkup, "Markdown", "Insert newline and continue todo lists/block quotes"),
}

// selection mark-mode:ify all cursor/select commands from CodeMirror
for (let commandSuffix of [
    "CharLeft", "CharRight",
    "CharBackward", "CharForward",
    "LineUp", "LineDown",
    "LineStart", "LineEnd",
    "GroupLeft", "GroupRight",
    "GroupForward", "GroupBackward",
    "PageUp", "PageDown",
    "SyntaxLeft", "SyntaxRight",
    "SubwordBackward", "SubwordForward",
    "LineBoundaryBackward", "LineBoundaryForward",
]) {
    HEYNOTE_COMMANDS[`cursor${commandSuffix}`] = {
        run: markModeMoveCommand(codeMirrorCommands[`cursor${commandSuffix}`], codeMirrorCommands[`select${commandSuffix}`]),
        name: `cursor${commandSuffix}`,
        description: `cursor${commandSuffix}`,
        category: "Cursor",
    }
    HEYNOTE_COMMANDS[`select${commandSuffix}`] = {
        run: (editor) => codeMirrorCommands[`select${commandSuffix}`],
        name: `select${commandSuffix}`,
        description: `select${commandSuffix}`,
        category: "Cursor",
    }
}

export { HEYNOTE_COMMANDS }
