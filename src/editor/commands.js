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
} from "./block/commands.js"
import { deleteLine } from "./block/delete-line.js"
import { formatBlockContent } from "./block/format-code.js"
import { transposeChars } from "./block/transpose-chars.js"

import { cutCommand, copyCommand, pasteCommand } from "./copy-paste.js"

import { emacsMoveCommand, toggleEmacsMarkMode, emacsCancel } from "./emacs-mode.js"


const cursorPreviousBlock = emacsMoveCommand(gotoPreviousBlock, selectPreviousBlock)
const cursorNextBlock = emacsMoveCommand(gotoNextBlock, selectNextBlock)
const cursorPreviousParagraph = emacsMoveCommand(gotoPreviousParagraph, selectPreviousParagraph)
const cursorNextParagraph = emacsMoveCommand(gotoNextParagraph, selectNextParagraph)


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

const HEYNOTE_COMMANDS = {
    //undo,
    //redo,

    addNewBlockAfterCurrent, addNewBlockBeforeCurrent, addNewBlockAfterLast, addNewBlockBeforeFirst, insertNewBlockAtCursor,    
    cursorPreviousBlock, cursorNextBlock,
    cursorPreviousParagraph, cursorNextParagraph,
    deleteBlock, deleteBlockSetCursorPreviousBlock,

    toggleEmacsMarkMode,
    emacsCancel,

    openLanguageSelector,
    openBufferSelector,
    openCommandPalette,
    openMoveToBuffer,
    openCreateNewBuffer,

    cut: cutCommand,
    copy: copyCommand,
}

// emacs-mode:ify all cursor/select commands from CodeMirror
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
    HEYNOTE_COMMANDS[`cursor${commandSuffix}`] = emacsMoveCommand(codeMirrorCommands[`cursor${commandSuffix}`], codeMirrorCommands[`select${commandSuffix}`])
    HEYNOTE_COMMANDS[`select${commandSuffix}`] = (editor) => codeMirrorCommands[`select${commandSuffix}`]
}

const NON_EDITOR_CONTEXT_COMMANDS = {
    selectAll,
    moveLineUp, moveLineDown,
    deleteLine,
    formatBlockContent,
    newCursorAbove, newCursorBelow,
    selectPreviousParagraph, selectNextParagraph,
    selectPreviousBlock, selectNextBlock,
    paste: pasteCommand,
    nothing,

    // directly from CodeMirror
    undo, redo,
    indentMore, indentLess,
    foldCode, unfoldCode,
    selectNextOccurrence,
    deleteCharBackward, deleteCharForward,
    deleteGroupBackward, deleteGroupForward,
    deleteLineBoundaryBackward, deleteLineBoundaryForward,
    deleteToLineEnd, deleteToLineStart,
    simplifySelection,
    splitLine,
    transposeChars,
    insertNewlineAndIndent,
    insertNewlineContinueMarkup,
}

for (const [key, cmCommand] of Object.entries(NON_EDITOR_CONTEXT_COMMANDS)) {
    HEYNOTE_COMMANDS[key] = (editor) => cmCommand
}

export { HEYNOTE_COMMANDS }
