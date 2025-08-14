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
    toggleComment, toggleBlockComment, toggleLineComment,
} from "@codemirror/commands"
import { foldCode, unfoldCode, toggleFold } from "@codemirror/language"
import { 
    openSearchPanel, closeSearchPanel, findNext, findPrevious, 
    selectMatches, replaceNext, replaceAll, 
} from "./codemirror-search/search.js"
import { selectNextOccurrence, selectSelectionMatches } from "./search/selection-match.js"
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
import { insertDateAndTime } from "./date-time.js"
import { foldBlock, unfoldBlock, toggleBlockFold } from "./fold-gutter.js"
import { useHeynoteStore } from "../stores/heynote-store.js";
import { useSettingsStore } from "../stores/settings-store.js"
import { toggleSpellcheck, enableSpellcheck, disableSpellcheck } from "./spell-check.js"


const cursorPreviousBlock = markModeMoveCommand(gotoPreviousBlock, selectPreviousBlock)
const cursorNextBlock = markModeMoveCommand(gotoNextBlock, selectNextBlock)
const cursorPreviousParagraph = markModeMoveCommand(gotoPreviousParagraph, selectPreviousParagraph)
const cursorNextParagraph = markModeMoveCommand(gotoNextParagraph, selectNextParagraph)


const openLanguageSelector = (editor) => () => {
    useHeynoteStore().openLanguageSelector()
    return true
}
const openBufferSelector = (editor) => () => {
    useHeynoteStore().openBufferSelector()
    return true
}
const openCommandPalette = (editor) => () => {
    useHeynoteStore().openCommandPalette()
    return true
}
const openMoveToBuffer = (editor) => () => {
    useHeynoteStore().openMoveToBufferSelector()
    return true
}
const openCreateNewBuffer = (editor) => () => {
    useHeynoteStore().openCreateBuffer("new")
    return true
}

const closeCurrentTab = (editor) => () => {
    useHeynoteStore().closeCurrentTab()
    return true
}
const switchToLastTab = (editor) => () => {
    useHeynoteStore().switchToLastTab()
    return true
}
const nextTab = (editor) => () => {
    useHeynoteStore().nextTab()
}
const previousTab = (editor) => () => {
    useHeynoteStore().previousTab()
}

export function toggleAlwaysOnTop(editor) {
    return (view) => {
        const settingsStore = useSettingsStore()
        settingsStore.updateSettings({alwaysOnTop:!settingsStore.settings.alwaysOnTop})
        return true
    }
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
    openLanguageSelector: cmd(openLanguageSelector, "Block", "Select block language…"),
    openBufferSelector: cmd(openBufferSelector, "Buffer", "Switch buffer…"),
    openCommandPalette: cmd(openCommandPalette, "Editor", "Open command palette…"),
    openMoveToBuffer: cmd(openMoveToBuffer, "Block", "Move block to another buffer…"),
    openCreateNewBuffer: cmd(openCreateNewBuffer, "Buffer", "Create new buffer…"),
    cut: cmd(cutCommand, "Clipboard", "Cut selection"),
    copy: cmd(copyCommand, "Clipboard", "Copy selection"),
    foldBlock: cmd(foldBlock, "Block", "Fold block"),
    unfoldBlock: cmd(unfoldBlock, "Block", "Unfold block"),
    toggleBlockFold: cmd(toggleBlockFold, "Block", "Toggle block fold"),

    // tab commands
    closeCurrentTab: cmd(closeCurrentTab, "Buffer", "Close current tab"),
    switchToLastTab: cmd(switchToLastTab, "Buffer", "Switch to last tab"),
    previousTab: cmd(previousTab, "Buffer", "Switch to previous tab"),
    nextTab: cmd(nextTab, "Buffer", "Switch to next tab"),
    ...Object.fromEntries(Array.from({ length: 9 }, (_, i) => [
        "switchToTab" + (i+1), 
        cmdLessContext(() => {
            useHeynoteStore().switchToTabIndex(i)
        }, "Buffer", `Switch to tab ${i+1}`),
    ])),

    // spellcheck
    toggleSpellcheck: cmd(toggleSpellcheck, "Spellchecker", "Toggle Spellchecking"),
    enableSpellcheck: cmd(enableSpellcheck, "Spellchecker", "Enable Spellchecking"),
    disableSpellcheck: cmd(disableSpellcheck, "Spellchecker", "Disable Spellchecking"),
    toggleAlwaysOnTop: cmd(toggleAlwaysOnTop, "Window", "Toggle Always on top"),

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
    insertDateAndTime: cmdLessContext(insertDateAndTime, "Misc", "Insert date and time"),

    // directly from CodeMirror
    undo: cmdLessContext(undo, "Edit", "Undo"),
    redo: cmdLessContext(redo, "Edit", "Redo"),
    indentMore: cmdLessContext(indentMore, "Edit", "Indent more"),
    indentLess: cmdLessContext(indentLess, "Edit", "Indent less"),
    foldCode: cmdLessContext(foldCode, "Edit", "Fold code"),
    unfoldCode: cmdLessContext(unfoldCode, "Edit", "Unfold code"),
    toggleFold: cmdLessContext(toggleFold, "Edit", "Toggle fold"),
    selectNextOccurrence: cmdLessContext(selectNextOccurrence, "Cursor", "Select next occurrence"),
    selectSelectionMatches: cmdLessContext(selectSelectionMatches, "Cursor", "Select all selection matches"),
    openSearchPanel: cmdLessContext(openSearchPanel, "Search", "Open search panel"), 
    closeSearchPanel: cmdLessContext(closeSearchPanel, "Search", "Close search panel"),
    findNext: cmdLessContext(findNext, "Search", "Find next"),
    findPrevious: cmdLessContext(findPrevious, "Search", "Find previous"),
    selectMatches: cmdLessContext(selectMatches, "Search", "Select all matches"),
    replaceNext: cmdLessContext(replaceNext, "Search", "Replace next"),
    replaceAll: cmdLessContext(replaceAll, "Search", "Replace all"),
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
    toggleComment: cmdLessContext(toggleComment, "Edit", "Toggle comment"),
    toggleBlockComment: cmdLessContext(toggleBlockComment, "Edit", "Toggle block comment"),
    toggleLineComment: cmdLessContext(toggleLineComment, "Edit", "Toggle line comment"),
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
    "DocStart", "DocEnd",
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
