<script>
    import { HeynoteEditor } from '../editor/editor.js'
    import { syntaxTree } from "@codemirror/language"
    import { toRaw } from 'vue';
    import { mapState, mapWritableState, mapActions } from 'pinia'
    import { useErrorStore } from "../stores/error-store"
    import { useHeynoteStore } from "../stores/heynote-store.js"
    import { useEditorCacheStore } from "../stores/editor-cache"

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
            }
        },

        mounted() {
            this.loadBuffer(this.currentBufferPath)

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
            loadNewEditor() {
                //console.log("currentBufferPath changed to", path)
                this.loadBuffer(this.currentBufferPath)
            },

            theme(newTheme) {
                this.eachEditor(editor => {
                    editor.setTheme(newTheme)
                })
            },

            keymap() {
                this.eachEditor(editor => {
                    editor.setKeymap(this.keymap, this.emacsMetaKey)
                })
            },

            emacsMetaKey() {
                this.eachEditor(editor => {
                    editor.setKeymap(this.keymap, this.emacsMetaKey)
                })
            },

            showLineNumberGutter(show) {
                this.eachEditor(editor => {
                    editor.setLineNumberGutter(show)
                })
            },

            showFoldGutter(show) {
                this.eachEditor(editor => {
                    editor.setFoldGutter(show)
                })
            },

            bracketClosing(value) {
                this.eachEditor(editor => {
                    editor.setBracketClosing(value)
                })
            },

            fontFamily() {
                this.eachEditor(editor => {
                    editor.setFont(this.fontFamily, this.fontSize)
                })
            },
            fontSize() {
                this.eachEditor(editor => {
                    editor.setFont(this.fontFamily, this.fontSize)
                })
            },
            defaultBlockLanguage() {
                this.eachEditor(editor => {
                    editor.setDefaultBlockLanguage(this.defaultBlockLanguage, this.defaultBlockLanguageAutoDetect)
                })
            },
            defaultBlockLanguageAutoDetect() {
                this.eachEditor(editor => {
                    editor.setDefaultBlockLanguage(this.defaultBlockLanguage, this.defaultBlockLanguageAutoDetect)
                })
            },
        },

        computed: {
            ...mapState(useHeynoteStore, [
                "currentBufferPath",
                "libraryId",
            ]),
            ...mapWritableState(useHeynoteStore, [
                "currentEditor",
                "currentBufferName",
            ]),

            loadNewEditor() {
                return `${this.currentBufferPath}|${this.libraryId}`
            },
        },

        methods: {
            ...mapActions(useErrorStore, ["addError"]),
            ...mapActions(useEditorCacheStore, ["getEditor", "addEditor", "eachEditor"]),

            loadBuffer(path) {
                //console.log("loadBuffer", path)
                if (this.editor) {
                    this.editor.hide()
                }

                let cachedEditor = this.getEditor(path)
                if (cachedEditor) {
                    //console.log("show cached editor")
                    this.editor = cachedEditor
                    toRaw(this.editor).show()
                } else {
                    //console.log("create new editor")
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
                    } catch (e) {
                        this.addError("Error! " + e.message)
                        throw e
                    }
                    this.addEditor(path, toRaw(this.editor))
                }

                this.currentEditor = toRaw(this.editor)
                window._heynote_editor = toRaw(this.editor)
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
