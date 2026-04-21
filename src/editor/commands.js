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
    insertTab,
} from "@codemirror/commands"
import { foldCode, unfoldCode, toggleFold } from "@codemirror/language"
import { 
    openSearchPanel, closeSearchPanel, findNext, findPrevious, 
    selectMatches, replaceNext, replaceAll, 
} from "@codemirror/search"
import { selectNextOccurrence, selectSelectionMatches } from "./search/selection-match.js"
import { insertNewlineContinueMarkup } from "@codemirror/lang-markdown"

import { 
    addNewBlockAfterCurrent, addNewBlockBeforeCurrent, addNewBlockAfterLast, addNewBlockAfterLastAndScrollDown, 
    addNewBlockBeforeFirst, insertNewBlockAtCursor, 
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

import { cutCommand, copyCommand, pasteCommand } from "./clipboard/copy-paste.js"

import { markModeMoveCommand, toggleSelectionMarkMode, selectionMarkModeCancel } from "./mark-mode.js"
import { insertDateAndTime } from "./date-time.js"
import { foldBlock, unfoldBlock, toggleBlockFold } from "./fold-gutter.js"
import { useHeynoteStore } from "../stores/heynote-store.js";
import { useSettingsStore } from "../stores/settings-store.js"
import { toggleSpellcheck, enableSpellcheck, disableSpellcheck } from "./spell-check.js"
import { insertIndentation } from "./indentation.js"
import { toggleCheckbox } from "./todo-checkbox.ts"
import { i18n } from "../locales/i18n"


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
const reopenLastClosedTab = (editor) => () => {
    useHeynoteStore().reopenLastClosedTab()
    return true
}
const switchToLastTab = (editor) => () => {
    useHeynoteStore().switchToLastTab()
    return true
}
const nextTab = (editor) => () => {
    useHeynoteStore().nextTab()
    return true
}
const previousTab = (editor) => () => {
    useHeynoteStore().previousTab()
    return true
}

export function toggleAlwaysOnTop(editor) {
    return (view) => {
        const settingsStore = useSettingsStore()
        settingsStore.updateSettings({alwaysOnTop:!settingsStore.settings.alwaysOnTop})
        return true
    }
}

export function toggleLeftPanel(editor) {
    return (view) => {
        useHeynoteStore().toggleLeftPanel()
        return true
    }
}

const nothing = (view) => {
    return true
}

const cmd = (f, category, key) => ({
    run: f,
    name: f.name,
    get description() {
        return i18n.t(key)
    },
    category: category,
    i18nKey: key,
})

const cmdLessContext = (f, category, key) => ({
    run: (editor) => f,
    name: f.name,
    get description() {
        return i18n.t(key)
    },
    category: category,
    i18nKey: key,
})


const HEYNOTE_COMMANDS = {
    addNewBlockAfterCurrent: cmd(addNewBlockAfterCurrent, "Block", "commands.addNewBlockAfterCurrent"),
    addNewBlockBeforeCurrent: cmd(addNewBlockBeforeCurrent, "Block", "commands.addNewBlockBeforeCurrent"),
    addNewBlockAfterLast: cmd(addNewBlockAfterLast, "Block", "commands.addNewBlockAfterLast"),
    addNewBlockAfterLastAndScrollDown: cmd(addNewBlockAfterLastAndScrollDown, "Block", "commands.addNewBlockAfterLastAndScrollDown"),
    addNewBlockBeforeFirst: cmd(addNewBlockBeforeFirst, "Block", "commands.addNewBlockBeforeFirst"),
    insertNewBlockAtCursor: cmd(insertNewBlockAtCursor, "Block", "commands.insertNewBlockAtCursor"),
    deleteBlock: cmd(deleteBlock, "Block", "commands.deleteBlock"),
    deleteBlockSetCursorPreviousBlock: cmd(deleteBlockSetCursorPreviousBlock, "Block", "commands.deleteBlockSetCursorPreviousBlock"),
    cursorPreviousBlock: cmd(cursorPreviousBlock, "Cursor", "commands.cursorPreviousBlock"),
    cursorNextBlock: cmd(cursorNextBlock, "Cursor", "commands.cursorNextBlock"),
    cursorPreviousParagraph: cmd(cursorPreviousParagraph, "Cursor", "commands.cursorPreviousParagraph"),
    cursorNextParagraph: cmd(cursorNextParagraph, "Cursor", "commands.cursorNextParagraph"),
    toggleSelectionMarkMode: cmd(toggleSelectionMarkMode, "Cursor", "commands.toggleSelectionMarkMode"),
    selectionMarkModeCancel: cmd(selectionMarkModeCancel, "Cursor", "commands.selectionMarkModeCancel"),
    openLanguageSelector: cmd(openLanguageSelector, "Block", "commands.openLanguageSelector"),
    openBufferSelector: cmd(openBufferSelector, "Buffer", "commands.openBufferSelector"),
    openCommandPalette: cmd(openCommandPalette, "Editor", "commands.openCommandPalette"),
    openMoveToBuffer: cmd(openMoveToBuffer, "Block", "commands.openMoveToBuffer"),
    openCreateNewBuffer: cmd(openCreateNewBuffer, "Buffer", "commands.openCreateNewBuffer"),
    cut: cmd(cutCommand, "Clipboard", "commands.cut"),
    copy: cmd(copyCommand, "Clipboard", "commands.copy"),
    foldBlock: cmd(foldBlock, "Block", "commands.foldBlock"),
    unfoldBlock: cmd(unfoldBlock, "Block", "commands.unfoldBlock"),
    toggleBlockFold: cmd(toggleBlockFold, "Block", "commands.toggleBlockFold"),
    toggleLeftPanel: cmd(toggleLeftPanel, "Editor", "commands.toggleLeftPanel"),

    // tab commands
    closeCurrentTab: cmd(closeCurrentTab, "Buffer", "commands.closeCurrentTab"),
    reopenLastClosedTab: cmd(reopenLastClosedTab, "Buffer", "commands.reopenLastClosedTab"),
    switchToLastTab: cmd(switchToLastTab, "Buffer", "commands.switchToLastTab"),
    previousTab: cmd(previousTab, "Buffer", "commands.previousTab"),
    nextTab: cmd(nextTab, "Buffer", "commands.nextTab"),
    ...Object.fromEntries(Array.from({ length: 9 }, (_, i) => [
        "switchToTab" + (i+1), 
        cmdLessContext(() => {
            useHeynoteStore().switchToTabIndex(i)
            return true
        }, "Buffer", `commands.switchToTab${i+1}`),
    ])),

    // spellcheck
    toggleSpellcheck: cmd(toggleSpellcheck, "Spellchecker", "commands.toggleSpellcheck"),
    enableSpellcheck: cmd(enableSpellcheck, "Spellchecker", "commands.enableSpellcheck"),
    disableSpellcheck: cmd(disableSpellcheck, "Spellchecker", "commands.disableSpellcheck"),
    toggleAlwaysOnTop: cmd(toggleAlwaysOnTop, "Window", "commands.toggleAlwaysOnTop"),

    // commands without editor context
    paste: cmdLessContext(pasteCommand, "Clipboard", "commands.paste"),
    selectAll: cmdLessContext(selectAll, "Selection", "commands.selectAll"),
    moveLineUp: cmdLessContext(moveLineUp, "Edit", "commands.moveLineUp"),
    moveLineDown: cmdLessContext(moveLineDown, "Edit", "commands.moveLineDown"),
    deleteLine: cmdLessContext(deleteLine, "Edit", "commands.deleteLine"),
    formatBlockContent: cmdLessContext(formatBlockContent, "Block", "commands.formatBlockContent"),
    moveCurrentBlockUp: cmdLessContext(moveCurrentBlockUp, "Block", "commands.moveCurrentBlockUp"),
    moveCurrentBlockDown: cmdLessContext(moveCurrentBlockDown, "Block", "commands.moveCurrentBlockDown"),
    newCursorAbove: cmdLessContext(newCursorAbove, "Cursor", "commands.newCursorAbove"),
    newCursorBelow: cmdLessContext(newCursorBelow, "Cursor", "commands.newCursorBelow"),
    selectPreviousParagraph: cmdLessContext(selectPreviousParagraph, "Selection", "commands.selectPreviousParagraph"),
    selectNextParagraph: cmdLessContext(selectNextParagraph, "Selection", "commands.selectNextParagraph"),
    selectPreviousBlock: cmdLessContext(selectPreviousBlock, "Selection", "commands.selectPreviousBlock"),
    selectNextBlock: cmdLessContext(selectNextBlock, "Selection", "commands.selectNextBlock"),
    nothing: cmdLessContext(nothing, "Misc", "commands.nothing"),
    insertDateAndTime: cmdLessContext(insertDateAndTime, "Misc", "commands.insertDateAndTime"),
    insertIndentation: cmdLessContext(insertIndentation, "Edit", "commands.insertIndentation"),

    // directly from CodeMirror
    undo: cmdLessContext(undo, "Edit", "commands.undo"),
    redo: cmdLessContext(redo, "Edit", "commands.redo"),
    indentMore: cmdLessContext(indentMore, "Edit", "commands.indentMore"),
    indentLess: cmdLessContext(indentLess, "Edit", "commands.indentLess"),
    foldCode: cmdLessContext(foldCode, "Edit", "commands.foldCode"),
    unfoldCode: cmdLessContext(unfoldCode, "Edit", "commands.unfoldCode"),
    toggleFold: cmdLessContext(toggleFold, "Edit", "commands.toggleFold"),
    selectNextOccurrence: cmdLessContext(selectNextOccurrence, "Cursor", "commands.selectNextOccurrence"),
    selectSelectionMatches: cmdLessContext(selectSelectionMatches, "Cursor", "commands.selectSelectionMatches"),
    openSearchPanel: cmdLessContext(openSearchPanel, "Search", "commands.openSearchPanel"), 
    closeSearchPanel: cmdLessContext(closeSearchPanel, "Search", "commands.closeSearchPanel"),
    findNext: cmdLessContext(findNext, "Search", "commands.findNext"),
    findPrevious: cmdLessContext(findPrevious, "Search", "commands.findPrevious"),
    selectMatches: cmdLessContext(selectMatches, "Search", "commands.selectMatches"),
    replaceNext: cmdLessContext(replaceNext, "Search", "commands.replaceNext"),
    replaceAll: cmdLessContext(replaceAll, "Search", "commands.replaceAll"),
    deleteCharBackward: cmdLessContext(deleteCharBackward, "Edit", "commands.deleteCharBackward"),
    deleteCharForward: cmdLessContext(deleteCharForward, "Edit", "commands.deleteCharForward"),
    deleteGroupBackward: cmdLessContext(deleteGroupBackward, "Edit", "commands.deleteGroupBackward"),
    deleteGroupForward: cmdLessContext(deleteGroupForward, "Edit", "commands.deleteGroupForward"),
    deleteLineBoundaryBackward: cmdLessContext(deleteLineBoundaryBackward, "Edit", "commands.deleteLineBoundaryBackward"),
    deleteLineBoundaryForward: cmdLessContext(deleteLineBoundaryForward, "Edit", "commands.deleteLineBoundaryForward"),
    deleteToLineEnd: cmdLessContext(deleteToLineEnd, "Edit", "commands.deleteToLineEnd"),
    deleteToLineStart: cmdLessContext(deleteToLineStart, "Edit", "commands.deleteToLineStart"),
    simplifySelection: cmdLessContext(simplifySelection, "Cursor", "commands.simplifySelection"),
    splitLine: cmdLessContext(splitLine, "Edit", "commands.splitLine"),
    transposeChars: cmdLessContext(transposeChars, "Edit", "commands.transposeChars"),
    insertNewlineAndIndent: cmdLessContext(insertNewlineAndIndent, "Edit", "commands.insertNewlineAndIndent"),
    insertNewlineContinueMarkup: cmdLessContext(insertNewlineContinueMarkup, "Markdown", "commands.insertNewlineContinueMarkup"),
    toggleCheckbox: cmdLessContext(toggleCheckbox, "Markdown", "commands.toggleCheckbox"),
    toggleComment: cmdLessContext(toggleComment, "Edit", "commands.toggleComment"),
    toggleBlockComment: cmdLessContext(toggleBlockComment, "Edit", "commands.toggleBlockComment"),
    toggleLineComment: cmdLessContext(toggleLineComment, "Edit", "commands.toggleLineComment"),
    insertTab: cmdLessContext(insertTab, "Edit", "commands.insertTab"),
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
    const cursorKey = `commands.cursor${commandSuffix}`
    const selectKey = `commands.select${commandSuffix}`
    
    HEYNOTE_COMMANDS[`cursor${commandSuffix}`] = {
        run: markModeMoveCommand(codeMirrorCommands[`cursor${commandSuffix}`], codeMirrorCommands[`select${commandSuffix}`]),
        name: `cursor${commandSuffix}`,
        get description() {
            return i18n.t(cursorKey)
        },
        category: "Cursor",
        i18nKey: cursorKey,
    }
    HEYNOTE_COMMANDS[`select${commandSuffix}`] = {
        run: (editor) => codeMirrorCommands[`select${commandSuffix}`],
        name: `select${commandSuffix}`,
        get description() {
            return i18n.t(selectKey)
        },
        category: "Cursor",
        i18nKey: selectKey,
    }
}

export { HEYNOTE_COMMANDS }
