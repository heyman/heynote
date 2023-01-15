<script>
    import { ref, shallowRef } from 'vue'
    import { HeynoteEditor } from '../editor/editor.js'
    import testContent from "../editor/fixture.js"

    const initialContent = `
∞∞∞text-a
Welcome to Heynote!

[⌘ + Enter]        Insert new note block
[⌘ + A]            Select all text in a note block. Press again to select the whole scratchpad
[⌘ + ⌥ + Up/Down]  Add additional cursor above/below
∞∞∞text-a
`

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

            this.editor = new HeynoteEditor({
                element: this.$refs.editor,
                content: this.development ? testContent : initialContent,
                theme: this.theme,
            })
        },

        watch: {
            theme(newTheme) {
                this.editor.setTheme(newTheme)
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
