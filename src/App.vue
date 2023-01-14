<script>
    import HelloWorld from './components/HelloWorld.vue'
    import StatusBar from './components/StatusBar.vue'
    import Editor from './components/Editor.vue'

    console.log("[App.vue]", `Hello world from Electron ${process.versions.electron}!`)

    export default {
        components: {
            HelloWorld,
            Editor,
            StatusBar,
        },

        data() {
            return {
                line: 1,
                column: 1,
                language: "plaintext",
                languageAuto: true,
                theme: "dark",
            }
        },

        methods: {
            onCursorChange(e) {
                //console.log("onCursorChange:", e)
                this.line = e.cursorLine.line
                this.column = e.cursorLine.col
                this.language = e.language
                this.languageAuto = e.languageAuto
            },
        },
    }

</script>

<template>
    <Editor 
        @cursorChange="onCursorChange"
        :theme="theme"
        class="editor"
    />
    <StatusBar 
        :line="line" 
        :column="column" 
        :language="language" 
        :languageAuto="languageAuto"
        :theme="theme"
        class="status" 
    />
</template>

<style scoped lang="sass">
    .editor
        height: calc(100% - 21px)
    .status
        position: absolute
        bottom: 0
        left: 0
</style>
