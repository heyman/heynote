import { Annotation, EditorState, Compartment, Facet } from "@codemirror/state"
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
import { noteBlockExtension, blockLineNumbers, blockState } from "./block/block.js"
import { heynoteEvent, SET_CONTENT } from "./annotation.js";
import { changeCurrentBlockLanguage, triggerCurrenciesLoaded } from "./block/commands.js"
import { formatBlockContent } from "./block/format-code.js"
import { heynoteKeymap } from "./keymap.js"
import { emacsKeymap } from "./emacs.js"
import { heynoteCopyCut } from "./copy-paste"
import { languageDetection } from "./language-detection/autodetect.js"
import { autoSaveContent } from "./save.js"
import { todoCheckboxPlugin} from "./todo-checkbox.ts"
import { links } from "./links.js"

export const LANGUAGE_SELECTOR_EVENT = "openLanguageSelector"

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
        content, 
        focus=true, 
        theme="light", 
        saveFunction=null, 
        keymap="default", 
        emacsMetaKey,
        showLineNumberGutter=true, 
        showFoldGutter=true,
        bracketClosing=false,
        fontFamily,
        fontSize,
    }) {
        this.element = element
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
        this.defaultBlockToken = "text"
        this.defaultBlockAutoDetect = true

        const state = EditorState.create({
            doc: content || "",
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
                languageDetection(() => this),
                
                // set cursor blink rate to 1 second
                drawSelection({cursorBlinkRate:1000}),

                // add CSS class depending on dark/light theme
                EditorView.editorAttributes.of((view) => {
                    return {class: view.state.facet(EditorView.darkTheme) ? "dark-theme" : "light-theme"}
                }),

                saveFunction ? autoSaveContent(saveFunction, 2000) : [],

                todoCheckboxPlugin,
                markdown(),
                links,
            ],
        })

        // make sure saveFunction is called when page is unloaded
        if (saveFunction) {
            window.addEventListener("beforeunload", () => {
                saveFunction(this.getContent())
            })
        }

        this.view = new EditorView({
            state: state,
            parent: element,
        })

        // Ensure we have a parsed syntax tree when buffer is loaded. This prevents errors for large buffers
        // when moving the cursor to the end of the buffer when the program starts
        ensureSyntaxTree(state, state.doc.length, 5000)

        if (focus) {
            this.view.dispatch({
                selection: {anchor: this.view.state.doc.length, head: this.view.state.doc.length},
                scrollIntoView: true,
            })
            this.view.focus()
        }
    }

    getContent() {
        return this.view.state.sliceDoc()
    }

    setContent(content) {
        this.view.dispatch({
            changes: {
                from: 0,
                to: this.view.state.doc.length,
                insert: content,
            },
            annotations: [heynoteEvent.of(SET_CONTENT)],
        })
        this.view.dispatch({
            selection: {anchor: this.view.state.doc.length, head: this.view.state.doc.length},
            scrollIntoView: true,
        })
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
        this.element.dispatchEvent(new Event(LANGUAGE_SELECTOR_EVENT))
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

