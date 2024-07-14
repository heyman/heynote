<script>
    import { HeynoteEditor, LANGUAGE_SELECTOR_EVENT } from '../editor/editor.js'
    import { syntaxTree } from "@codemirror/language"

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
            }
        },

        mounted() {
            this.$refs.editor.addEventListener("selectionChange", (e) => {
                //console.log("selectionChange:", e)
                this.$emit("cursorChange", {
                    cursorLine: e.cursorLine,
                    selectionSize: e.selectionSize,
                    language: e.language,
                    languageAuto: e.languageAuto,
                })
            })

            this.$refs.editor.addEventListener(LANGUAGE_SELECTOR_EVENT, (e) => {
                this.$emit("openLanguageSelector")
            })

            // load buffer content and create editor
            window.heynote.buffer.load().then((content) => {
                let diskContent = content
                this.editor = new HeynoteEditor({
                    element: this.$refs.editor,
                    content: content,
                    theme: this.theme,
                    saveFunction: (content) => {
                        if (content === diskContent) {
                            return
                        }
                        diskContent = content
                        window.heynote.buffer.save(content)
                    },
                    keymap: this.keymap,
                    emacsMetaKey: this.emacsMetaKey,
                    showLineNumberGutter: this.showLineNumberGutter,
                    showFoldGutter: this.showFoldGutter,
                    bracketClosing: this.bracketClosing,
                    fontFamily: this.fontFamily,
                    fontSize: this.fontSize,
                })
                window._heynote_editor = this.editor
                window.document.addEventListener("currenciesLoaded", this.onCurrenciesLoaded)
                this.editor.setDefaultBlockLanguage(this.defaultBlockLanguage, this.defaultBlockLanguageAutoDetect)

                // set up buffer change listener
                window.heynote.buffer.onChangeCallback((event, content) => {
                    diskContent = content
                    this.editor.setContent(content)
                })
            })
            // set up window close handler that will save the buffer and quit
            window.heynote.onWindowClose(() => {
                window.heynote.buffer.saveAndQuit(this.editor.getContent())
            })

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
            theme(newTheme) {
                this.editor.setTheme(newTheme)
            },

            keymap() {
                this.editor.setKeymap(this.keymap, this.emacsMetaKey)
            },

            emacsMetaKey() {
                this.editor.setKeymap(this.keymap, this.emacsMetaKey)
            },

            showLineNumberGutter(show) {
                this.editor.setLineNumberGutter(show)
            },

            showFoldGutter(show) {
                this.editor.setFoldGutter(show)
            },

            bracketClosing(value) {
                this.editor.setBracketClosing(value)
            },

            fontFamily() {
                this.editor.setFont(this.fontFamily, this.fontSize)
            },
            fontSize() {
                this.editor.setFont(this.fontFamily, this.fontSize)
            },
            defaultBlockLanguage() {
                this.editor.setDefaultBlockLanguage(this.defaultBlockLanguage, this.defaultBlockLanguageAutoDetect)
            },
            defaultBlockLanguageAutoDetect() {
                this.editor.setDefaultBlockLanguage(this.defaultBlockLanguage, this.defaultBlockLanguageAutoDetect)
            },
        },

        methods: {
            setLanguage(language) {
                if (language === "auto") {
                    this.editor.setCurrentLanguage(null, true)
                } else {
                    this.editor.setCurrentLanguage(language, false)
                }
                this.editor.focus()
            },

            formatCurrentBlock() {
                this.editor.formatCurrentBlock()
                this.editor.focus()
            },

            onCurrenciesLoaded() {
                this.editor.currenciesLoaded()
            },

            focus() {
                this.editor.focus()
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
