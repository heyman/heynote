<script>
    import { ref, shallowRef } from 'vue'
    import { HeynoteEditor } from '../editor/editor.js'
    import initialData from "../editor/fixture.js"

    export default {
        props: [
            "theme",
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
                //content: "\n∞∞∞text\n",
                content: initialData,
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
