<script>
    import { mapState, mapActions } from 'pinia'

    import { mapWritableState, mapStores } from 'pinia'
    import { useHeynoteStore } from "../stores/heynote-store"
    import { useErrorStore } from "../stores/error-store"
    import { useSettingsStore } from "../stores/settings-store"
    import { useEditorCacheStore } from '../stores/editor-cache'

    import { OPEN_SETTINGS_EVENT, MOVE_BLOCK_EVENT, CHANGE_BUFFER_EVENT } from '@/src/common/constants'

    import StatusBar from './StatusBar.vue'
    import Editor from './Editor.vue'
    import LanguageSelector from './LanguageSelector.vue'
    import BufferSelector from './BufferSelector.vue'
    import Settings from './settings/Settings.vue'
    import ErrorMessages from './ErrorMessages.vue'
    import NewBuffer from './NewBuffer.vue'
    import EditBuffer from './EditBuffer.vue'
    import TabBar from './tabs/TabBar.vue'
    import AIPanel from './AIPanel.vue'
    import ImagePreviewModal from './ImagePreviewModal.vue'

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
            AIPanel,
            ImagePreviewModal,
        },

        data() {
            return {
                development: window.location.href.indexOf("dev=1") !== -1,
                showSettings: false,
                showImagePreview: false,
                imagePreviewUrl: '',
                imagePreviewFilename: '',
                imagePreviewLoading: false,
                imagePreviewError: '',
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

            // Listen to AI invocation from command/shortcut
            this._onInvokeAI = () => {
                // Toggle: if panel is visible, close it; else open it with current block content
                if (this.heynoteStore.showAIPanel) {
                    this.heynoteStore.closeAIPanel()
                    return
                }
                let initial = ''
                try {
                    const current = this.heynoteStore.currentEditor
                    if (current && typeof current.getActiveBlockContent === 'function') {
                        const raw = current.getActiveBlockContent() || ''
                        const lines = raw.split('\n')
                        // 找到第一行非空内容，如果是以 ∞∞∞ 开头的分隔符，则移除
                        const firstNonEmptyIndex = lines.findIndex(l => (l || '').trim().length > 0)
                        if (firstNonEmptyIndex !== -1) {
                            const firstLine = (lines[firstNonEmptyIndex] || '').trim()
                            if (/^∞∞∞/.test(firstLine)) {
                                lines.splice(firstNonEmptyIndex, 1)
                            }
                        }
                        const body = lines.join('\n').trim()
                        if (body) {
                            initial = `帮我记录这条笔记\n\n${body}`
                        }
                    }
                } catch (e) {}
                this.heynoteStore.openAIPanel(initial)
            }
            window.addEventListener('invokeAIAgent', this._onInvokeAI)

            this._onImagePasted = async (e) => {
                const detail = e.detail || {}
                const file = detail.file
                const path = detail.path
                if (!file || !path) return

                try {
                    const editor = this.heynoteStore.currentEditor
                    if (!editor || editor.path !== path) {
                        // 只在当前 buffer 中处理粘贴
                        return
                    }

                    const settings = this.settingsStore.settings
                    const base = (settings.noteMateBaseUrl || 'http://localhost:80').replace(/\/$/, '')
                    const token = settings.noteMateAuthToken || ''

                    const form = new FormData()
                    form.append('file', file, file.name || 'image.png')
                    form.append('platform', 'heynote')
                    form.append('platform_id', settings.noteMateUserId || 'tmfc')

                    const resp = await fetch(`${base}/files/upload`, {
                        method: 'POST',
                        headers: {
                            ...(token ? { 'X-API-Key': token, 'Authorization': `Bearer ${token}` } : {}),
                        },
                        body: form,
                    })
                    if (!resp.ok) {
                        console.error('upload failed', resp.status, resp.statusText)
                        return
                    }
                    const data = await resp.json()
                    if (!data || !data.success || !data.key) {
                        console.error('upload error payload', data)
                        return
                    }

                    const filename = data.filename || file.name || ''
                    const placeholder = `![image nm-file:${data.key}](${filename})`
                    if (typeof editor.insertTextAtCursor === 'function') {
                        editor.insertTextAtCursor(placeholder)
                    }
                } catch (err) {
                    console.error('onImagePasted error', err)
                }
            }

            this._onOpenImagePreview = async (e) => {
                const detail = e.detail || {}
                const key = detail.key
                const filename = detail.filename || ''
                if (!key) return

                const settings = this.settingsStore.settings
                const base = (settings.noteMateBaseUrl || 'http://localhost:80').replace(/\/$/, '')
                const token = settings.noteMateAuthToken || ''

                this.imagePreviewFilename = filename
                this.imagePreviewLoading = true
                this.imagePreviewError = ''
                this.imagePreviewUrl = ''
                this.showImagePreview = true

                try {
                    const url = `${base}/files/url?key=${encodeURIComponent(key)}`
                    const resp = await fetch(url, {
                        method: 'GET',
                        headers: {
                            ...(token ? { 'X-API-Key': token, 'Authorization': `Bearer ${token}` } : {}),
                        },
                    })
                    if (!resp.ok) {
                        this.imagePreviewError = `加载失败：${resp.status} ${resp.statusText}`
                        return
                    }
                    const data = await resp.json()
                    if (!data || !data.success || !data.url) {
                        this.imagePreviewError = '接口返回异常'
                        return
                    }
                    this.imagePreviewUrl = data.url
                } catch (err) {
                    this.imagePreviewError = (err && err.message) || String(err)
                } finally {
                    this.imagePreviewLoading = false
                }
            }

            window.addEventListener('heynoteImagePasted', this._onImagePasted)
            window.addEventListener('heynoteOpenImagePreview', this._onOpenImagePreview)
        },

        beforeUnmount() {
            this.settingsStore.tearDown()
            window.removeEventListener('invokeAIAgent', this._onInvokeAI)
            window.removeEventListener('heynoteImagePasted', this._onImagePasted)
            window.removeEventListener('heynoteOpenImagePreview', this._onOpenImagePreview)
        },

        watch: {
            // when a dialog is closed, we want to focus the editor
            showLanguageSelector(value) { this.dialogWatcher(value) },
            showBufferSelector(value) { this.dialogWatcher(value) },
            showCreateBuffer(value) { this.dialogWatcher(value) },
            showEditBuffer(value) { this.dialogWatcher(value) },
            showMoveToBufferSelector(value) { this.dialogWatcher(value) },
            showCommandPalette(value) { this.dialogWatcher(value) },

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
                "isFullscreen",
            ]),
            ...mapState(useSettingsStore, [
                "settings",
            ]),

            dialogVisible() {
                return this.showLanguageSelector || this.showBufferSelector || this.showCreateBuffer || this.showEditBuffer || this.showMoveToBufferSelector || this.showCommandPalette || this.showSettings
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

            closeImagePreview() {
                this.showImagePreview = false
                this.imagePreviewUrl = ''
                this.imagePreviewError = ''
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
            <AIPanel v-if="heynoteStore.showAIPanel" />
            <ImagePreviewModal
                v-if="showImagePreview"
                :url="imagePreviewUrl"
                :filename="imagePreviewFilename"
                :loading="imagePreviewLoading"
                :error="imagePreviewError"
                @close="closeImagePreview"
            />
            <NewBuffer 
                v-if="showCreateBuffer"
                @close="closeDialog"
            />
            <EditBuffer 
                v-if="showEditBuffer"
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
        &.tab-bar-visible
            height: calc(100% - var(--tab-bar-height))
        .editor
            height: calc(100% - 21px)
        .status
            position: absolute
            bottom: 0
            left: 0
</style>
