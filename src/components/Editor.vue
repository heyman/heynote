<script>
    import { HeynoteEditor, LANGUAGE_SELECTOR_EVENT } from '../editor/editor.js'
    import { syntaxTree } from "@codemirror/language"

    export default {
        props: [
            "theme",
            "development",
            "debugSyntaxTree",
        ],

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
                    language: e.language,
                    languageAuto: e.languageAuto,
                })
            })

            this.$refs.editor.addEventListener(LANGUAGE_SELECTOR_EVENT, (e) => {
                this.$emit("openLanguageSelector")
            })

            // load buffer content and create editor
            window.heynote.buffer.load().then((content) => {
                this.editor = new HeynoteEditor({
                    element: this.$refs.editor,
                    content: content,
                    theme: this.theme,
                    saveFunction: (content) => {
                        window.heynote.buffer.save(content)
                    },
                })
            })
            // set up window close handler that will save the buffer and quit
            window.heynote.onWindowClose(() => {
                window.heynote.buffer.saveAndQuit(this.editor.getContent())
            })

            // if debugSyntaxTree prop is set, display syntax tree for debugging
            if (this.debugSyntaxTree) {
                setTimeout(() => {
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

        watch: {
            theme(newTheme) {
                this.editor.setTheme(newTheme)
            },
        },

        methods: {
            setLanguage(language) {
                if (language === "auto") {
                    this.editor.setCurrentLanguage("text", true)
                } else {
                    this.editor.setCurrentLanguage(language, false)
                }
                this.editor.focus()
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

<style lang="sass">
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
