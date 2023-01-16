<script>
    import StatusBar from './StatusBar.vue'
    import Editor from './Editor.vue'
    import LanguageSelector from './LanguageSelector.vue'

    export default {
        components: {
            Editor,
            StatusBar,
            LanguageSelector,
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
                development: window.location.href.indexOf("dev=1") !== -1,
                showLanguageSelector: false,
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

            openLanguageSelector() {
                this.showLanguageSelector = true
            },

            closeLanguageSelector() {
                this.showLanguageSelector = false
                this.$refs.editor.focus()
            },

            onLanguageSelect(language) {
                this.showLanguageSelector = false
                this.$refs.editor.setLanguage(language)
            },
        },
    }

</script>

<template>
    <div class="container">
        <Editor 
            @cursorChange="onCursorChange"
            :theme="theme"
            :development="development"
            class="editor"
            ref="editor"
            @openLanguageSelector="openLanguageSelector"
        />
        <StatusBar 
            :line="line" 
            :column="column" 
            :language="language" 
            :languageAuto="languageAuto"
            :theme="theme"
            :systemTheme="systemTheme"
            @toggleTheme="toggleTheme"
            @openLanguageSelector="openLanguageSelector"
            class="status" 
        />
        <div class="overlay">
            <LanguageSelector 
                v-if="showLanguageSelector" 
                @select="onLanguageSelect"
                @close="closeLanguageSelector"
            />
        </div>
    </div>
</template>

<style scoped lang="sass">
    .container
        width: 100%
        height: 100%
        position: relative
        .editor
            height: calc(100% - 21px)
        .status
            position: absolute
            bottom: 0
            left: 0
</style>
