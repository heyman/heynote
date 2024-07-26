<script>
    import { HeynoteEditor } from '../editor/editor.js'
    import { syntaxTree } from "@codemirror/language"
    import { toRaw } from 'vue';
    import { mapState, mapWritableState, mapActions } from 'pinia'
    import { useErrorStore } from "../stores/error-store"
    import { useNotesStore } from "../stores/notes-store"

    const NUM_EDITOR_INSTANCES = 5

    export default {
        props: {
            theme: String,
            development: Boolean,
            debugSyntaxTree: Boolean,
            keymap: {
                type: String,
                default: "default",
            },
            emacsMetaKey: {
                type: String,
                default: "alt",
            },
            showLineNumberGutter: {
                type: Boolean,
                default: true,
            },
            showFoldGutter: {
                type: Boolean,
                default: true,
            },
            bracketClosing: {
                type: Boolean,
                default: false,
            },
            fontFamily: String,
            fontSize: Number,
            defaultBlockLanguage: String,
            defaultBlockLanguageAutoDetect: Boolean,
        },

        components: {},

        data() {
            return {
                syntaxTreeDebugContent: null,
                editor: null,
                editorCache: {
                    lru: [],
                    cache: {}
                },
            }
        },

        mounted() {
            this.loadBuffer(this.currentNotePath)

            // set up window close handler that will save the buffer and quit
            window.heynote.onWindowClose(() => {
                window.heynote.buffer.saveAndQuit([
                    [this.editor.path, this.editor.getContent()],
                ])
            })

            window.document.addEventListener("currenciesLoaded", this.onCurrenciesLoaded)

            // if debugSyntaxTree prop is set, display syntax tree for debugging
            if (this.debugSyntaxTree) {
                setInterval(() => {
                    function render(tree) {
                        let lists = ''
                        tree.iterate({
                            enter(type) {
                                lists += `<ul><li>${type.name} (${type.from},${type.to})`
                            },
                            leave() {
                                lists += '</ul>'
                            }
                        })
                        return lists
                    }
                    this.syntaxTreeDebugContent = render(syntaxTree(this.editor.view.state))
                }, 1000)
            }
        },

        beforeUnmount() {
            window.document.removeEventListener("currenciesLoaded", this.onCurrenciesLoaded)
        },

        watch: {
            currentNotePath(path) {
                //console.log("currentNotePath changed to", path)
                this.loadBuffer(path)
            },

            theme(newTheme) {
                toRaw(this.editor).setTheme(newTheme)
            },

            keymap() {
                toRaw(this.editor).setKeymap(this.keymap, this.emacsMetaKey)
            },

            emacsMetaKey() {
                toRaw(this.editor).setKeymap(this.keymap, this.emacsMetaKey)
            },

            showLineNumberGutter(show) {
                toRaw(this.editor).setLineNumberGutter(show)
            },

            showFoldGutter(show) {
                toRaw(this.editor).setFoldGutter(show)
            },

            bracketClosing(value) {
                toRaw(this.editor).setBracketClosing(value)
            },

            fontFamily() {
                toRaw(this.editor).setFont(this.fontFamily, this.fontSize)
            },
            fontSize() {
                toRaw(this.editor).setFont(this.fontFamily, this.fontSize)
            },
            defaultBlockLanguage() {
                toRaw(this.editor).setDefaultBlockLanguage(this.defaultBlockLanguage, this.defaultBlockLanguageAutoDetect)
            },
            defaultBlockLanguageAutoDetect() {
                toRaw(this.editor).setDefaultBlockLanguage(this.defaultBlockLanguage, this.defaultBlockLanguageAutoDetect)
            },
        },

        computed: {
            ...mapState(useNotesStore, [
                "currentNotePath",
            ]),
            ...mapWritableState(useNotesStore, [
                "currentEditor",
                "currentNoteName",
            ]),
        },

        methods: {
            ...mapActions(useErrorStore, ["addError"]),

            loadBuffer(path) {
                if (this.editor) {
                    this.editor.hide()
                }

                if (this.editorCache.cache[path]) {
                    // editor is already loaded, just switch to it
                    console.log("Switching to cached editor", path)
                    toRaw(this.editor).hide()
                    this.editor = this.editorCache.cache[path]
                    toRaw(this.editor).show()
                    //toRaw(this.editor).currenciesLoaded()
                    this.currentEditor = toRaw(this.editor)
                    window._heynote_editor = toRaw(this.editor)
                    // move to end of LRU
                    this.editorCache.lru = this.editorCache.lru.filter(p => p !== path)
                    this.editorCache.lru.push(path)
                } else {
                    // check if we need to free up a slot
                    if (this.editorCache.lru.length >= NUM_EDITOR_INSTANCES) {
                        const pathToFree = this.editorCache.lru.shift()
                        console.log("Freeing up editor slot", pathToFree)
                        this.editorCache.cache[pathToFree].destroy()
                        delete this.editorCache.cache[pathToFree]
                        this.editorCache.lru = this.editorCache.lru.filter(p => p !== pathToFree)
                    }

                    // create new Editor instance
                    console.log("Loading new editor", path)
                    try {
                        this.editor = new HeynoteEditor({
                            element: this.$refs.editor,
                            path: path,
                            theme: this.theme,
                            keymap: this.keymap,
                            emacsMetaKey: this.emacsMetaKey,
                            showLineNumberGutter: this.showLineNumberGutter,
                            showFoldGutter: this.showFoldGutter,
                            bracketClosing: this.bracketClosing,
                            fontFamily: this.fontFamily,
                            fontSize: this.fontSize,
                            defaultBlockToken: this.defaultBlockLanguage,
                            defaultBlockAutoDetect: this.defaultBlockLanguageAutoDetect,
                        })
                        this.currentEditor = toRaw(this.editor)
                        window._heynote_editor = toRaw(this.editor)
                        this.editorCache.cache[path] = this.editor
                        this.editorCache.lru.push(path)
                    } catch (e) {
                        this.addError("Error! " + e.message)
                        throw e
                    }
                }
            },

            setLanguage(language) {
                const editor = toRaw(this.editor)
                if (language === "auto") {
                    editor.setCurrentLanguage(null, true)
                } else {
                    editor.setCurrentLanguage(language, false)
                }
                editor.focus()
            },

            formatCurrentBlock() {
                const editor = toRaw(this.editor)
                editor.formatCurrentBlock()
                editor.focus()
            },

            onCurrenciesLoaded() {
                if (this.editor) {
                    toRaw(this.editor).currenciesLoaded()
                }
            },

            focus() {
                toRaw(this.editor).focus()
            },
        },
    }
</script>

<template>
    <div>
        <div class="editor" ref="editor"></div>
        <div 
            v-if="debugSyntaxTree"
            v-html="syntaxTreeDebugContent"
            class="debug-syntax-tree"
        ></div>
    </div>
</template>

<style lang="sass" scoped>
    .debug-syntax-tree
        position: absolute
        top: 0
        bottom: 0
        right: 0
        width: 50%
        background-color: rgba(240, 240, 240, 0.85)
        color: #000
        font-size: 12px
        font-family: monospace
        padding: 10px
        overflow: auto

        ul
            padding-left: 20px
        > ul
            padding-left: 0
</style>
