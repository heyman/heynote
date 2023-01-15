<script>
    import HelloWorld from './components/HelloWorld.vue'
    import StatusBar from './components/StatusBar.vue'
    import Editor from './components/Editor.vue'
    

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
                theme: window.darkMode.initial,
                initialTheme: window.darkMode.initial,
                systemTheme: 'system',
            }
        },

        mounted() {
            window.darkMode.get().then((mode) => {
                this.theme = mode.computed
                this.systemTheme = mode.theme
            })
            window.darkMode.onChange((theme) => {
                this.theme = theme
            })
        },

        beforeUnmount() {
            window.darkMode.removeListener()
        },

        methods: {
            toggleTheme() {
                let newTheme
                // when the "system" theme is used, make sure that the first click always results in amn actual theme change
                if (this.initialTheme === "light") {
                    newTheme = this.systemTheme === "system" ? "dark" : (this.systemTheme === "dark" ? "light" : "system")
                } else {
                    newTheme = this.systemTheme === "system" ? "light" : (this.systemTheme === "light" ? "dark" : "system")
                }
                window.darkMode.set(newTheme)
                this.systemTheme = newTheme
            },

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
        :systemTheme="systemTheme"
        @toggleTheme="toggleTheme"
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
