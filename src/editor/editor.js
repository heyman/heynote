import { Annotation, EditorState, Compartment, Facet, EditorSelection, Transaction } from "@codemirror/state"
import { EditorView, keymap, drawSelection, ViewPlugin, lineNumbers } from "@codemirror/view"
import { indentUnit, forceParsing, foldGutter, ensureSyntaxTree } from "@codemirror/language"
import { markdown } from "@codemirror/lang-markdown"
import { closeBrackets } from "@codemirror/autocomplete";

import { heynoteLight } from "./theme/light.js"
import { heynoteDark } from "./theme/dark.js"
import { heynoteBase } from "./theme/base.js"
import { getFontTheme } from "./theme/font-theme.js";
import { customSetup } from "./setup.js"
import { heynoteLang } from "./lang-heynote/heynote.js"
import { noteBlockExtension, blockLineNumbers, blockState, getActiveNoteBlock, triggerCursorChange } from "./block/block.js"
import { heynoteEvent, SET_CONTENT, DELETE_BLOCK } from "./annotation.js";
import { changeCurrentBlockLanguage, triggerCurrenciesLoaded, getBlockDelimiter, deleteBlock } from "./block/commands.js"
import { formatBlockContent } from "./block/format-code.js"
import { heynoteKeymap } from "./keymap.js"
import { emacsKeymap } from "./emacs.js"
import { heynoteCopyCut } from "./copy-paste"
import { languageDetection } from "./language-detection/autodetect.js"
import { autoSaveContent } from "./save.js"
import { todoCheckboxPlugin} from "./todo-checkbox.ts"
import { links } from "./links.js"
import { NoteFormat } from "../common/note-format.js"
import { AUTO_SAVE_INTERVAL } from "../common/constants.js"
import { useHeynoteStore } from "../stores/heynote-store.js";
import { useErrorStore } from "../stores/error-store.js";


function getKeymapExtensions(editor, keymap) {
    if (keymap === "emacs") {
        return emacsKeymap(editor)
    } else {
        return heynoteKeymap(editor)
    }
}


export class HeynoteEditor {
    constructor({
        element, 
        path,
        content, 
        focus=true, 
        theme="light", 
        keymap="default", 
        emacsMetaKey,
        showLineNumberGutter=true, 
        showFoldGutter=true,
        bracketClosing=false,
        fontFamily,
        fontSize,
        defaultBlockToken,
        defaultBlockAutoDetect,
    }) {
        this.element = element
        this.path = path
        this.themeCompartment = new Compartment
        this.keymapCompartment = new Compartment
        this.lineNumberCompartmentPre = new Compartment
        this.lineNumberCompartment = new Compartment
        this.foldGutterCompartment = new Compartment
        this.readOnlyCompartment = new Compartment
        this.closeBracketsCompartment = new Compartment
        this.deselectOnCopy = keymap === "emacs"
        this.emacsMetaKey = emacsMetaKey
        this.fontTheme = new Compartment
        this.setDefaultBlockLanguage(defaultBlockToken, defaultBlockAutoDetect)
        this.contentLoaded = false
        this.notesStore = useHeynoteStore()
        this.errorStore = useErrorStore()
        this.name = ""
        

        const state = EditorState.create({
            doc: "",
            extensions: [
                this.keymapCompartment.of(getKeymapExtensions(this, keymap)),
                heynoteCopyCut(this),

                //minimalSetup,
                this.lineNumberCompartment.of(showLineNumberGutter ? [lineNumbers(), blockLineNumbers] : []),
                customSetup, 
                this.foldGutterCompartment.of(showFoldGutter ? [foldGutter()] : []),

                this.closeBracketsCompartment.of(bracketClosing ? [closeBrackets()] : []),

                this.readOnlyCompartment.of([]),
                
                this.themeCompartment.of(theme === "dark" ? heynoteDark : heynoteLight),
                heynoteBase,
                this.fontTheme.of(getFontTheme(fontFamily, fontSize)),
                indentUnit.of("    "),
                EditorView.scrollMargins.of(f => {
                    return {top: 80, bottom: 80}
                }),
                heynoteLang(),
                noteBlockExtension(this),
                languageDetection(path, () => this),
                
                // set cursor blink rate to 1 second
                drawSelection({cursorBlinkRate:1000}),

                // add CSS class depending on dark/light theme
                EditorView.editorAttributes.of((view) => {
                    return {class: view.state.facet(EditorView.darkTheme) ? "dark-theme" : "light-theme"}
                }),

                autoSaveContent(this, AUTO_SAVE_INTERVAL),

                todoCheckboxPlugin,
                markdown(),
                links,
            ],
        })

        // make sure saveFunction is called when page is unloaded
        window.addEventListener("beforeunload", () => {
            this.save()
        })

        this.view = new EditorView({
            state: state,
            parent: element,
        })
        
        //this.setContent(content)
        this.setReadOnly(true)
        this.loadContent().then(() => {
            this.setReadOnly(false)
        })

        if (focus) {
            this.view.focus()
        }
    }

    async save() {
        if (!this.contentLoaded) {
            return
        }
        const content = this.getContent()
        if (content === this.diskContent) {
            return
        }
        //console.log("saving:", this.path)
        this.diskContent = content
        await window.heynote.buffer.save(this.path, content)
    }

    getContent() {
        this.note.content = this.view.state.sliceDoc()
        this.note.cursors = this.view.state.selection.toJSON()
        
        const ranges = this.note.cursors.ranges
        if (ranges.length == 1 && ranges[0].anchor == 0 && ranges[0].head == 0) {
            console.log("DEBUG!! Cursor is at 0,0")
            console.trace()
        }
        return this.note.serialize()
    }

    async loadContent() {
        //console.log("loading content", this.path)
        const content = await window.heynote.buffer.load(this.path)
        this.diskContent = content
        this.contentLoaded = true
        this.setContent(content)

        // set up content change listener
        this.onChange = (content) => {
            this.diskContent = content
            this.setContent(content)
        }
        window.heynote.buffer.addOnChangeCallback(this.path, this.onChange)
    }

    setContent(content) {
        try {
            this.note = NoteFormat.load(content)
            this.setReadOnly(false)
        } catch (e) {
            this.setReadOnly(true)
            this.errorStore.addError(`Failed to load note: ${e.message}`)
            throw new Error(`Failed to load note: ${e.message}`)
        }
        this.name = this.note.metadata?.name || this.path
        
        return new Promise((resolve) => {
            // set buffer content
            this.view.dispatch({
                changes: {
                    from: 0,
                    to: this.view.state.doc.length,
                    insert: this.note.content,
                },
                annotations: [heynoteEvent.of(SET_CONTENT), Transaction.addToHistory.of(false)],
            })

            // Ensure we have a parsed syntax tree when buffer is loaded. This prevents errors for large buffers
            // when moving the cursor to the end of the buffer when the program starts
            ensureSyntaxTree(this.view.state, this.view.state.doc.length, 5000)

            // Set cursor positions
            // We use requestAnimationFrame to avoid a race condition causing the scrollIntoView to sometimes not work
            requestAnimationFrame(() => {
                if (this.note.cursors) {
                    this.view.dispatch({
                        selection: EditorSelection.fromJSON(this.note.cursors),
                        scrollIntoView: true,
                    })
                } else {
                    // if metadata doesn't contain cursor position, we set the cursor to the end of the buffer
                    this.view.dispatch({
                        selection: {anchor: this.view.state.doc.length, head: this.view.state.doc.length},
                        scrollIntoView: true,
                    })
                }
                resolve()
            })
        })
    }

    setName(name) {
        this.note.metadata.name = name
        this.name = name
        triggerCursorChange(this.view)
    }

    getBlocks() {
        return this.view.state.facet(blockState)
    }

    getCursorPosition() {
        return this.view.state.selection.main.head
    }

    focus() {
        this.view.focus()
    }

    setReadOnly(readOnly) {
        this.view.dispatch({
            effects: this.readOnlyCompartment.reconfigure(readOnly ? [EditorState.readOnly.of(true)] : []),
        })
    }

    setFont(fontFamily, fontSize) {
        this.view.dispatch({
            effects: this.fontTheme.reconfigure(getFontTheme(fontFamily, fontSize)),
        })
    }

    setTheme(theme) {
        this.view.dispatch({
            effects: this.themeCompartment.reconfigure(theme === "dark" ? heynoteDark : heynoteLight),
        })
    }

    setKeymap(keymap, emacsMetaKey) {
        this.deselectOnCopy = keymap === "emacs"
        this.emacsMetaKey = emacsMetaKey
        this.view.dispatch({
            effects: this.keymapCompartment.reconfigure(getKeymapExtensions(this, keymap)),
        })
    }

    openLanguageSelector() {
        this.notesStore.openLanguageSelector()
    }

    openBufferSelector() {
        this.notesStore.openBufferSelector()
    }

    openCreateBuffer(createMode) {
        this.notesStore.openCreateBuffer(createMode)
    }

    async createNewBuffer(path, name) {
        const data = getBlockDelimiter(this.defaultBlockToken, this.defaultBlockAutoDetect)
        await this.notesStore.saveNewBuffer(path, name, data)

        // by using requestAnimationFrame we avoid a race condition where rendering the block backgrounds
        // would fail if we immediately opened the new note (since the block UI wouldn't have time to update 
        // after the block was deleted)
        requestAnimationFrame(() => {
            this.notesStore.openBuffer(path)
        })
    }

    async createNewBufferFromActiveBlock(path, name) {
        const block = getActiveNoteBlock(this.view.state)
        if (!block) {
            return
        }
        const data = this.view.state.sliceDoc(block.range.from, block.range.to)
        await this.notesStore.saveNewBuffer(path, name, data)
        deleteBlock(this)(this.view)

        // by using requestAnimationFrame we avoid a race condition where rendering the block backgrounds
        // would fail if we immediately opened the new note (since the block UI wouldn't have time to update 
        // after the block was deleted)
        requestAnimationFrame(() => {
            this.notesStore.openBuffer(path)
        })
    }

    setCurrentLanguage(lang, auto=false) {
        changeCurrentBlockLanguage(this.view.state, this.view.dispatch, lang, auto)
    }

    setLineNumberGutter(show) {
        this.view.dispatch({
            effects: this.lineNumberCompartment.reconfigure(show ? [lineNumbers(), blockLineNumbers] : []),
        })
    }

    setFoldGutter(show) {
        this.view.dispatch({
            effects: this.foldGutterCompartment.reconfigure(show ? [foldGutter()] : []),
        })
    }

    setBracketClosing(value) {
        this.view.dispatch({
            effects: this.closeBracketsCompartment.reconfigure(value ? [closeBrackets()] : []),
        })
    }

    setDefaultBlockLanguage(token, autoDetect) {
        this.defaultBlockToken = token
        this.defaultBlockAutoDetect = autoDetect
    }

    formatCurrentBlock() {
        formatBlockContent({
            state: this.view.state, 
            dispatch: this.view.dispatch,
        })
    }

    currenciesLoaded() {
        triggerCurrenciesLoaded(this.view.state, this.view.dispatch)
    }

    destroy(save=true) {
        if (this.onChange) {
            window.heynote.buffer.removeOnChangeCallback(this.path, this.onChange)
        }
        if (save) {
            this.save()
        }
        this.view.destroy()
        window.heynote.buffer.close(this.path)
    }

    hide() {
        //console.log("hiding element", this.view.dom)
        this.view.dom.style.setProperty("display", "none", "important")
    }
    show() {
        //console.log("showing element", this.view.dom)
        this.view.dom.style.setProperty("display", "")
        triggerCursorChange(this.view)
    }
}



/*// set initial data
editor.update([
    editor.state.update({
        changes:{
            from: 0,
            to: editor.state.doc.length,
            insert: initialData,
        },
        annotations: heynoteEvent.of(INITIAL_DATA),
    })
])*/

