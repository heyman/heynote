<script>
    import { mapState, mapActions } from 'pinia'

    import { mapWritableState } from 'pinia'
    import { useNotesStore } from "../stores/notes-store"
    import { useErrorStore } from "../stores/error-store"

    import StatusBar from './StatusBar.vue'
    import Editor from './Editor.vue'
    import LanguageSelector from './LanguageSelector.vue'
    import NoteSelector from './NoteSelector.vue'
    import Settings from './settings/Settings.vue'
    import ErrorMessages from './ErrorMessages.vue'
    import NewNote from './NewNote.vue'

    export default {
        components: {
            Editor,
            StatusBar,
            LanguageSelector,
            Settings,
            NoteSelector,
            ErrorMessages,
            NewNote,
        },

        data() {
            return {
                theme: window.heynote.themeMode.initial,
                initialTheme: window.heynote.themeMode.initial,
                themeSetting: 'system',
                development: window.location.href.indexOf("dev=1") !== -1,
                showSettings: false,
                settings: window.heynote.settings,
            }
        },

        mounted() {
            window.heynote.themeMode.get().then((mode) => {
                this.theme = mode.computed
                this.themeSetting = mode.theme
            })
            const onThemeChange = (theme) => {
                this.theme = theme
                if (theme === "system") {
                    document.documentElement.setAttribute("theme", window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
                } else {
                    document.documentElement.setAttribute("theme", theme)
                }
            }
            onThemeChange(window.heynote.themeMode.initial)
            window.heynote.themeMode.onChange(onThemeChange)
            window.heynote.onSettingsChange((settings) => {
                this.settings = settings
            })
            window.heynote.onOpenSettings(() => {
                this.showSettings = true
            })
        },

        beforeUnmount() {
            window.heynote.themeMode.removeListener()
        },

        watch: {
            // when a dialog is closed, we want to focus the editor
            showLanguageSelector(value) { this.dialogWatcher(value) },
            showNoteSelector(value) { this.dialogWatcher(value) },
            showCreateNote(value) { this.dialogWatcher(value) },

            currentNotePath() {
                this.focusEditor()
            },
        },

        computed: {
            ...mapState(useNotesStore, [
                "currentNotePath",
                "showLanguageSelector",
                "showNoteSelector",
                "showCreateNote",
            ]),

            editorInert() {
                return this.showCreateNote || this.showSettings
            },
        },

        methods: {
            ...mapActions(useNotesStore, [
                "openLanguageSelector",
                "openNoteSelector",
                "openCreateNote",
                "closeDialog",
                "openNote",
            ]),

            // Used as a watcher for the booleans that control the visibility of editor dialogs. 
            // When a dialog is closed, we want to focus the editor
            dialogWatcher(value) {
                if (!value) {
                    this.focusEditor()
                }
            },

            focusEditor() {
                // we need to wait for the next tick for the cases when we set the inert attribute on the editor
                // in which case issuing a focus() call immediately would not work 
                this.$nextTick(() => {
                    this.$refs.editor.focus()
                })
            },

            openSettings() {
                this.showSettings = true
            },
            closeSettings() {
                this.showSettings = false
                this.focusEditor()
            },

            toggleTheme() {
                let newTheme
                // when the "system" theme is used, make sure that the first click always results in amn actual theme change
                if (this.initialTheme === "light") {
                    newTheme = this.themeSetting === "system" ? "dark" : (this.themeSetting === "dark" ? "light" : "system")
                } else {
                    newTheme = this.themeSetting === "system" ? "light" : (this.themeSetting === "light" ? "dark" : "system")
                }
                window.heynote.themeMode.set(newTheme)
                this.themeSetting = newTheme
                this.$refs.editor.focus()
            },

            onSelectLanguage(language) {
                this.closeDialog()
                this.$refs.editor.setLanguage(language)
            },

            formatCurrentBlock() {
                this.$refs.editor.formatCurrentBlock()
            },
        },
    }

</script>

<template>
    <div class="container">
        <Editor 
            :theme="theme"
            :development="development"
            :debugSyntaxTree="false"
            :keymap="settings.keymap"
            :emacsMetaKey="settings.emacsMetaKey"
            :showLineNumberGutter="settings.showLineNumberGutter"
            :showFoldGutter="settings.showFoldGutter"
            :bracketClosing="settings.bracketClosing"
            :fontFamily="settings.fontFamily"
            :fontSize="settings.fontSize"
            :defaultBlockLanguage="settings.defaultBlockLanguage || 'text'"
            :defaultBlockLanguageAutoDetect="settings.defaultBlockLanguageAutoDetect === undefined ? true : settings.defaultBlockLanguageAutoDetect"
            :inert="editorInert"
            class="editor"
            ref="editor"
        />
        <StatusBar 
            :theme="theme"
            :themeSetting="themeSetting"
            :autoUpdate="settings.autoUpdate"
            :allowBetaVersions="settings.allowBetaVersions"
            @toggleTheme="toggleTheme"
            @openNoteSelector="openNoteSelector"
            @openLanguageSelector="openLanguageSelector"
            @formatCurrentBlock="formatCurrentBlock"
            @openSettings="showSettings = true"
            @click="() => {$refs.editor.focus()}"
            class="status" 
        />
        <div class="overlay">
            <LanguageSelector 
                v-if="showLanguageSelector" 
                @selectLanguage="onSelectLanguage"
                @close="closeDialog"
            />
            <NoteSelector 
                v-if="showNoteSelector" 
                @openNote="openNote"
                @close="closeDialog"
            />
            <Settings 
                v-if="showSettings"
                :initialSettings="settings"
                @closeSettings="closeSettings"
            />
            <NewNote 
                v-if="showCreateNote"
                @close="closeDialog"
            />
            <ErrorMessages />
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
