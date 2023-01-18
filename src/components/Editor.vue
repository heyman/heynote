<script>
    import { HeynoteEditor } from '../editor/editor.js'

    export default {
        props: [
            "theme",
            "development",
        ],
        mounted() {
            this.$refs.editor.addEventListener("selectionChange", (e) => {
                //console.log("selectionChange:", e)
                this.$emit("cursorChange", {
                    cursorLine: e.cursorLine,
                    language: e.language,
                    languageAuto: e.languageAuto,
                })
            })

            this.$refs.editor.addEventListener("openLanguageSelector", (e) => {
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
    <div class="editor" ref="editor"></div>
</template>

<style>
    .editor {
        width: 100%;
        background-color: #f1f1f1;
    }
</style>
