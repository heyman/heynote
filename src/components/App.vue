<script>
    import { toRaw } from 'vue'
    import { mapState, mapActions } from 'pinia'

    import { mapWritableState, mapStores } from 'pinia'
    import { useHeynoteStore } from "../stores/heynote-store"
    import { useErrorStore } from "../stores/error-store"
    import { useSettingsStore } from "../stores/settings-store"
    import { useEditorCacheStore } from '../stores/editor-cache'

    import { OPEN_SETTINGS_EVENT, MOVE_BLOCK_EVENT, CHANGE_BUFFER_EVENT } from '@/src/common/constants'
    import { setImageFile } from "@/src/editor/image/image-parsing.js"

    import StatusBar from './StatusBar.vue'
    import Editor from './Editor.vue'
    import LanguageSelector from './LanguageSelector.vue'
    import BufferSelector from './BufferSelector.vue'
    import Settings from './settings/Settings.vue'
    import ErrorMessages from './ErrorMessages.vue'
    import NewBuffer from './NewBuffer.vue'
    import EditBuffer from './EditBuffer.vue'
    import TabBar from './tabs/TabBar.vue'
    import DrawImageModal from './draw/DrawImageModal.vue'

    export default {
        components: {
            Editor,
            StatusBar,
            LanguageSelector,
            Settings,
            BufferSelector,
            ErrorMessages,
            NewBuffer,
            EditBuffer,
            TabBar,
            DrawImageModal,
        },

        data() {
            return {
                development: window.location.href.indexOf("dev=1") !== -1,
                showSettings: false,
            }
        },

        mounted() {
            this.settingsStore.setUp()
            
            window.heynote.mainProcess.on(OPEN_SETTINGS_EVENT, () => {
                this.showSettings = true
            })

            window.heynote.mainProcess.on(MOVE_BLOCK_EVENT, (path) => {
                this.openMoveToBufferSelector()
            })

            window.heynote.mainProcess.on(CHANGE_BUFFER_EVENT, () => {
                this.openBufferSelector()
            })

            // Tab context menu events
            window.heynote.mainProcess.on('tab:close', (event, tabPath) => {
                this.heynoteStore.closeTab(tabPath)
            })

            window.heynote.mainProcess.on('tab:openNew', () => {
                this.openBufferSelector()
            })

            window.heynote.mainProcess.on('tab:createNew', () => {
                this.openCreateBuffer()
            })

            window.heynote.mainProcess.on('tab:editBuffer', (event, tabPath) => {
                this.heynoteStore.editBufferMetadata(tabPath)
            })

            window.heynote.mainProcess.on('tab:deleteBuffer', (event, tabPath) => {
                if (confirm(`Are you sure you want to delete the buffer "${this.heynoteStore.getBufferTitle(tabPath)}"?`)) {
                    this.deleteBuffer(tabPath)
                }
                this.focusEditor()
            })
        },

        beforeUnmount() {
            this.settingsStore.tearDown()
        },

        watch: {
            // when a dialog is closed, we want to focus the editor
            showLanguageSelector(value) { this.dialogWatcher(value) },
            showBufferSelector(value) { this.dialogWatcher(value) },
            showCreateBuffer(value) { this.dialogWatcher(value) },
            showEditBuffer(value) { this.dialogWatcher(value) },
            showMoveToBufferSelector(value) { this.dialogWatcher(value) },
            showCommandPalette(value) { this.dialogWatcher(value) },
            showDrawImageModal(value) { this.dialogWatcher(value) },

            currentBufferPath() {
                this.focusEditor()
            },

            currentBufferName() {
                window.heynote.setWindowTitle(this.currentBufferName)
            },
        },

        computed: {
            ...mapStores(useSettingsStore, useEditorCacheStore, useHeynoteStore),
            ...mapState(useHeynoteStore, [
                "currentBufferPath",
                "currentBufferName",
                "showLanguageSelector",
                "showBufferSelector",
                "showCreateBuffer",
                "showEditBuffer",
                "showMoveToBufferSelector",
                "showCommandPalette",
                "showDrawImageModal",
                "drawImageUrl",
                "drawImageId",
                "isFullscreen",
            ]),
            ...mapState(useSettingsStore, [
                "settings",
            ]),

            dialogVisible() {
                return this.showLanguageSelector || this.showBufferSelector || this.showCreateBuffer || this.showEditBuffer || this.showMoveToBufferSelector || this.showCommandPalette || this.showDrawImageModal || this.showSettings
            },

            editorInert() {
                return this.dialogVisible
            },

            showTabBar() {
                if (this.isFullscreen) {
                    return this.settings.showTabs && this.settings.showTabsInFullscreen
                } else {
                    return true
                }
            },
        },

        methods: {
            ...mapActions(useHeynoteStore, [
                "openMoveToBufferSelector",
                "openLanguageSelector",
                "openBufferSelector",
                "openCreateBuffer",
                "closeDialog",
                "closeBufferSelector",
                "openBuffer",
                "closeMoveToBufferSelector",
                "closeDrawImageModal",
                "deleteBuffer",
                "focusEditor",
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
                    this.$refs.editor?.focus()
                })
            },

            openSettings() {
                this.showSettings = true
            },
            closeSettings() {
                this.showSettings = false
                this.focusEditor()
            },

            onSelectLanguage(language) {
                this.closeDialog()
                this.$refs.editor.setLanguage(language)
            },

            formatCurrentBlock() {
                this.$refs.editor.formatCurrentBlock()
            },

            toggleSpellcheck() {
                this.heynoteStore.executeCommand("toggleSpellcheck")
            },

            toggleAlwaysOnTop() {
                this.heynoteStore.executeCommand("toggleAlwaysOnTop")
            },

            onMoveCurrentBlockToOtherEditor(path) {
                this.editorCacheStore.moveCurrentBlockToOtherEditor(path)
                this.closeMoveToBufferSelector()
            },

            async onSaveDrawImage(imageId, imageDataUrl) {
                try {
                    const editor = toRaw(this.heynoteStore.currentEditor)
                    if (!editor?.view) {
                        console.error("No active editor available to update image")
                        return
                    }
                    const response = await fetch(imageDataUrl)
                    const blob = await response.blob()
                    const filename = await window.heynote.buffer.saveImage({
                        data: new Uint8Array(await blob.arrayBuffer()),
                        mime: blob.type,
                    })
                    if (!filename) {
                        console.error("Failed to save image data")
                        return
                    }
                    const imageUrl = "heynote-file://image/" + encodeURIComponent(filename)
                    setImageFile(editor.view, imageId, imageUrl)
                } catch (error) {
                    console.error("Failed to save drawn image", error)
                } finally {
                    this.closeDrawImageModal()
                }
            },
        },
    }

</script>

<template>
    <TabBar v-if="showTabBar" />
    <div 
        class="container" 
        :class="{'tab-bar-visible':showTabBar}"
    >
        <Editor 
            v-if="currentBufferPath"
            :theme="settingsStore.theme"
            :development="development"
            :debugSyntaxTree="false"
            :inert="editorInert"
            class="editor"
            ref="editor"
        />
        <StatusBar 
            :autoUpdate="settings.autoUpdate"
            :allowBetaVersions="settings.allowBetaVersions"
            @openBufferSelector="openBufferSelector"
            @openLanguageSelector="openLanguageSelector"
            @formatCurrentBlock="formatCurrentBlock"
            @openSettings="showSettings = true"
            @toggleSpellcheck="toggleSpellcheck"
            @toggleAlwaysOnTop="toggleAlwaysOnTop"
            @click="() => {$refs.editor.focus()}"
            class="status" 
        />
        <div class="overlay">
            <LanguageSelector 
                v-if="showLanguageSelector" 
                @selectLanguage="onSelectLanguage"
                @close="closeDialog"
            />
            <BufferSelector 
                v-if="showBufferSelector || showCommandPalette" 
                :initialFilter="showCommandPalette ? '>' : ''"
                :commandsEnabled="true"
                @openBuffer="openBuffer"
                @openCreateBuffer="(nameSuggestion) => openCreateBuffer('new', nameSuggestion)"
                @close="closeBufferSelector"
            />
            <BufferSelector 
                v-if="showMoveToBufferSelector" 
                headline="Move block to..."
                :commandsEnabled="false"
                @openBuffer="onMoveCurrentBlockToOtherEditor"
                @openCreateBuffer="(nameSuggestion) => openCreateBuffer('currentBlock', nameSuggestion)"
                @close="closeMoveToBufferSelector"
            />
            <Settings 
                v-if="showSettings"
                :initialSettings="settingsStore.settings"
                :themeSetting="settingsStore.themeSetting"
                @closeSettings="closeSettings"
            />
            <NewBuffer 
                v-if="showCreateBuffer"
                @close="closeDialog"
            />
            <EditBuffer 
                v-if="showEditBuffer"
                @close="closeDialog"
            />
            <DrawImageModal
                v-if="showDrawImageModal"
                :imageUrl="drawImageUrl"
                :imageId="drawImageId"
                @close="closeDrawImageModal"
                @save="onSaveDrawImage"
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
        &.tab-bar-visible
            height: calc(100% - var(--tab-bar-height))
        .editor
            height: calc(100% - 21px)
        .status
            position: absolute
            bottom: 0
            left: 0
</style>
