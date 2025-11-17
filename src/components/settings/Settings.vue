<script>
    import { toRaw} from 'vue';
    import { mapStores, mapState } from 'pinia'
    import { useSettingsStore } from "@/src/stores/settings-store.js"

    import { LANGUAGES } from '../../editor/languages.js'
    import KeyboardHotkey from "./KeyboardHotkey.vue"
    import TabListItem from "./TabListItem.vue"
    import TabContent from "./TabContent.vue"
    import KeyboardBindings from './KeyboardBindings.vue'

    const defaultFontFamily = window.heynote.defaultFontFamily
    const defaultFontSize = window.heynote.defaultFontSize
    const defaultDefaultBlockLanguage = "text"
    const defaultDefaultBlockLanguageAutoDetect = true
    
    export default {
        props: {
            initialKeymap: String,
            initialSettings: Object,
            themeSetting: String,
        },
        components: {
            KeyboardHotkey,
            TabListItem,
            TabContent,
            KeyboardBindings,
        },

        data() {
            //console.log("settings:", this.initialSettings)
            return {
                keymaps: [
                    { name: "Default", value: "default" },
                    { name: "Emacs", value: "emacs" },
                ],
                keymap: this.initialSettings.keymap,
                keyBindings: this.initialSettings.keyBindings || [],
                metaKey: this.initialSettings.emacsMetaKey,
                isMac: window.heynote.platform.isMac,
                showLineNumberGutter: this.initialSettings.showLineNumberGutter,
                showFoldGutter: this.initialSettings.showFoldGutter,
                showTabs: this.initialSettings.showTabs,
                showTabsInFullscreen: this.initialSettings.showTabsInFullscreen,
                allowBetaVersions: this.initialSettings.allowBetaVersions,
                enableGlobalHotkey: this.initialSettings.enableGlobalHotkey,
                globalHotkey: this.initialSettings.globalHotkey,
                showInDock: this.initialSettings.showInDock,
                showInMenu: this.initialSettings.showInMenu,
                alwaysOnTop: this.initialSettings.alwaysOnTop,
                bracketClosing: this.initialSettings.bracketClosing,
                indentType: this.initialSettings.indentType || "space",
                tabSize: this.initialSettings.tabSize || 4,
                autoUpdate: this.initialSettings.autoUpdate,
                bufferPath: this.initialSettings.bufferPath,
                fontFamily: this.initialSettings.fontFamily || defaultFontFamily,
                fontSize: this.initialSettings.fontSize || defaultFontSize,
                languageOptions: LANGUAGES.map(l => {
                    return {
                        "value": l.token, 
                        "name": l.token == "text" ? l.name + " (default)" : l.name,
                    }
                }).sort((a, b) => {
                    return a.name.localeCompare(b.name)
                }),
                defaultBlockLanguage: this.initialSettings.defaultBlockLanguage || defaultDefaultBlockLanguage,
                defaultBlockLanguageAutoDetect: this.initialSettings.defaultBlockLanguageAutoDetect === false ? false : defaultDefaultBlockLanguageAutoDetect,

                activeTab: "general",
                isWebApp: window.heynote.platform.isWebApp,
                customBufferLocation: !!this.initialSettings.bufferPath,
                systemFonts: [[defaultFontFamily, defaultFontFamily + " (default)"]],
                defaultFontSize: defaultFontSize,
                appVersion: "",
                theme: this.themeSetting,

                // tracks if the add key binding dialog is visible (so that we can set inert on the save button)
                addKeyBindingDialogVisible: false,

                // Integrations
                noteMateAuthToken: this.initialSettings.noteMateAuthToken || "",
                noteMateBaseUrl: this.initialSettings.noteMateBaseUrl || "http://localhost:80",
                noteMateUserId: this.initialSettings.noteMateUserId || "tmfc",
                noteMateSidebarHotkey: this.initialSettings.noteMateSidebarHotkey || "",
                testConnectStatus: "",
                testConnectLoading: false,
            }
        },

        async mounted() {
            window.addEventListener("keydown", this.onKeyDown);

            this.appVersion = await window.heynote.getVersion()

            if (window.queryLocalFonts !== undefined) {
                let localFonts = [... new Set((await window.queryLocalFonts()).map(f => f.family))].filter(f => f !== "Hack")
                localFonts = [...new Set(localFonts)].map(f => [f, f])
                this.systemFonts = [[defaultFontFamily, defaultFontFamily + " (default)"], ...localFonts]
            }
        },
        beforeUnmount() {
            window.removeEventListener("keydown", this.onKeyDown);
        },

        watch: {
            keyBindings(newKeyBindings) {
                this.updateSettings()
            }
        },

        computed: {
            ...mapStores(useSettingsStore),
        },

        methods: {
            onKeyDown(event) {
                if (event.key === "Escape" && !this.addKeyBindingDialogVisible) {
                    this.$emit("closeSettings")
                }
            },

            updateSettings() {
                this.settingsStore.updateSettings({
                    showLineNumberGutter: this.showLineNumberGutter,
                    showFoldGutter: this.showFoldGutter,
                    showTabs: this.showTabs,
                    showTabsInFullscreen: this.showTabsInFullscreen,
                    keymap: this.keymap,
                    keyBindings: this.keyBindings.map((kb) => toRaw(kb)),
                    emacsMetaKey: window.heynote.platform.isMac ? this.metaKey : "alt",
                    allowBetaVersions: this.allowBetaVersions,
                    enableGlobalHotkey: this.enableGlobalHotkey,
                    globalHotkey: this.globalHotkey,
                    showInDock: this.showInDock,
                    showInMenu: this.showInMenu || !this.showInDock,
                    alwaysOnTop: this.alwaysOnTop,
                    autoUpdate: this.autoUpdate,
                    bracketClosing: this.bracketClosing,
                    indentType: this.indentType,
                    tabSize: this.tabSize,
                    bufferPath: this.bufferPath,
                    fontFamily: this.fontFamily === defaultFontFamily ? undefined : this.fontFamily,
                    fontSize: this.fontSize === defaultFontSize ? undefined : this.fontSize,
                    defaultBlockLanguage: this.defaultBlockLanguage === "text" ? undefined : this.defaultBlockLanguage,
                    defaultBlockLanguageAutoDetect: this.defaultBlockLanguageAutoDetect === true ? undefined : this.defaultBlockLanguageAutoDetect,
                    // Integrations
                    noteMateAuthToken: this.noteMateAuthToken,
                    noteMateBaseUrl: this.noteMateBaseUrl,
                    noteMateSidebarHotkey: this.noteMateSidebarHotkey,
                })
                if (!this.showInDock) {
                    this.showInMenu = true
                }
                if (this.theme != this.themeSetting) {
                    this.settingsStore.setTheme(this.theme)
                }
            },

            async selectBufferLocation() {
                const path = await window.heynote.buffer.selectLocation()
                if (path) {
                    this.bufferPath = path
                    this.updateSettings()
                }
            },

            onCustomBufferLocationChange() {
                if (!this.customBufferLocation) {
                    this.bufferPath = ""
                    this.updateSettings()
                }
            },

            async testNoteMateConnection() {
                const base = (this.noteMateBaseUrl || "").trim().replace(/\/$/, "")
                if (!base) {
                    this.testConnectStatus = "Please enter Base URL"
                    return
                }
                const ctrl = new AbortController()
                const timer = setTimeout(() => ctrl.abort(), 10000)
                this.testConnectLoading = true
                this.testConnectStatus = "Testing..."
                const t0 = performance.now()
                try {
                    const resp = await fetch(`${base}/invoke`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            ...(this.noteMateAuthToken ? { 'X-API-Key': this.noteMateAuthToken, 'Authorization': `Bearer ${this.noteMateAuthToken}` } : {}),
                        },
                        body: JSON.stringify({
                            message: 'ping', images: [], model: 'gpt-4o-mini', thread_id: null,
                            platform: 'heynote', platform_id: 'tmfc'
                        }),
                        signal: ctrl.signal,
                    })
                    const dt = Math.round(performance.now() - t0)
                    if (resp.ok) {
                        this.testConnectStatus = `OK (${dt}ms)`
                    } else if (resp.status === 401) {
                        this.testConnectStatus = `Unauthorized (401). Check API Key.`
                    } else {
                        this.testConnectStatus = `Error ${resp.status} ${resp.statusText}`
                    }
                } catch (e) {
                    if (e?.name === 'AbortError') {
                        this.testConnectStatus = 'Timeout'
                    } else {
                        this.testConnectStatus = `Failed: ${e?.message || e}`
                    }
                } finally {
                    clearTimeout(timer)
                    this.testConnectLoading = false
                }
            },
        }
    }
</script>

<template>
    <div class="settings">
        <div class="dialog">
            <div class="dialog-content">
                <nav class="sidebar">
                    <h1>Settings</h1>
                    <ul>
                        <TabListItem 
                            name="General" 
                            tab="general" 
                            :activeTab="activeTab" 
                            @click="activeTab = 'general'"
                        />
                        <TabListItem 
                            name="Editing" 
                            tab="editing"
                            :activeTab="activeTab" 
                            @click="activeTab = 'editing'"
                        />
                        <TabListItem 
                            name="Appearance" 
                            tab="appearance"
                            :activeTab="activeTab" 
                            @click="activeTab = 'appearance'"
                        />
                        <TabListItem 
                            name="Key Bindings" 
                            tab="keyboard-bindings" 
                            :activeTab="activeTab" 
                            @click="activeTab = 'keyboard-bindings'"
                        />
                        <TabListItem 
                            name="NoteMate" 
                            tab="notemate" 
                            :activeTab="activeTab" 
                            @click="activeTab = 'notemate'"
                        />
                        <TabListItem 
                            :name="isWebApp ? 'Version' : 'Updates'" 
                            tab="updates" 
                            :activeTab="activeTab" 
                            @click="activeTab = 'updates'"
                        />
                    </ul>
                </nav>
                <div class="settings-content">
                    <TabContent tab="general" :activeTab="activeTab">
                        <div class="row" v-if="!isWebApp">
                            <div class="entry">
                                <h2>Global Keyboard Shortcut</h2>
                                <label class="keyboard-shortcut-label">
                                    <input 
                                        type="checkbox" 
                                        v-model="enableGlobalHotkey" 
                                        @change="updateSettings"
                                    />
                                    Enable Global Hotkey
                                </label>
                                
                                <KeyboardHotkey 
                                    :disabled="!enableGlobalHotkey"
                                    v-model="globalHotkey"
                                    @change="updateSettings"
                                />
                            </div>
                        </div>
                        <div class="row" v-if="!isWebApp">
                            <div class="entry">
                                <h2>Window / Application</h2>
                                <label v-if="isMac">
                                    <input
                                        type="checkbox"
                                        v-model="showInDock"
                                        @change="updateSettings"
                                    />
                                    Show in dock
                                </label>
                                <label>
                                    <input
                                        type="checkbox"
                                        :disabled="!showInDock"
                                        v-model="showInMenu"
                                        @change="updateSettings"
                                    />
                                    <template v-if="isMac">
                                        Show in menu bar
                                    </template>
                                    <template v-else>
                                        Show in system tray
                                    </template>
                                </label>
                                <label>
                                    <input
                                        type="checkbox"
                                        v-model="alwaysOnTop"
                                        @change="updateSettings"
                                    />
                                    Always on top
                                </label>
                            </div>
                        </div>
                        <div class="row" v-if="!isWebApp">
                            <div class="entry buffer-location">
                                <h2>Buffer Files Path</h2>
                                <label class="keyboard-shortcut-label">
                                    <input 
                                        type="checkbox" 
                                        v-model="customBufferLocation" 
                                        @change="onCustomBufferLocationChange"
                                    />
                                    Use custom location for the buffer files
                                </label>
                                <div class="file-path">
                                    <button
                                        :disabled="!customBufferLocation"
                                        @click="selectBufferLocation"
                                    >Select Directory</button>
                                    <span class="path" v-show="customBufferLocation && bufferPath">{{ bufferPath }}</span>
                                </div>
                            </div>
                        </div>
                    </TabContent>

                    <TabContent tab="editing" :activeTab="activeTab">
                        <div class="row">
                            <div class="entry">
                                <h2>Input settings</h2>
                                <label>
                                    <input 
                                        type="checkbox"
                                        v-model="bracketClosing"
                                        @change="updateSettings"
                                    />
                                    Auto-close brackets and quotation marks
                                </label>
                            </div>  
                        </div>
                        <div class="row">
                            <div class="entry">
                                <h2>Tab Size</h2>
                                <select v-model="tabSize" @change="updateSettings" class="tab-size">
                                    <option
                                        v-for="size in [1, 2, 3, 4, 5, 6, 7, 8]"
                                        :key="size"
                                        :selected="tabSize === size"
                                        :value="size"
                                    >{{ size }} {{ size === 1 ? 'space' : 'spaces' }}</option>
                                </select>
                            </div>
                            <div class="entry">
                                <h2>Indent Using</h2>
                                <select v-model="indentType" @change="updateSettings" class="indent-type">
                                    <option value="space" :selected="indentType === 'space'">Spaces</option>
                                    <option value="tab" :selected="indentType === 'tab'">Tabs</option>
                                </select>
                            </div>
                        </div>
                        <div class="row">
                            <div class="entry">
                                <h2>Default Block Language</h2>
                                <select v-model="defaultBlockLanguage" @change="updateSettings" class="block-language">
                                    <template v-for="lang in languageOptions" :key="lang.value">
                                        <option :selected="lang.value === defaultBlockLanguage" :value="lang.value">{{ lang.name }}</option>
                                    </template>
                                </select>
                                <label>
                                    <input
                                        type="checkbox"
                                        v-model="defaultBlockLanguageAutoDetect"
                                        @change="updateSettings"
                                        class="language-auto-detect"
                                    />
                                    Auto-detection (default: on)
                                </label>
                            </div>  
                        </div>
                    </TabContent>

                    <TabContent tab="appearance" :activeTab="activeTab">
                        <div class="row">
                            <div class="entry">
                                <h2>Color Theme</h2>
                                <select v-model="theme" @change="updateSettings" class="theme">
                                    <option :selected="theme === 'system'" value="system">System</option>
                                    <option :selected="theme === 'light'" value="light">Light</option>
                                    <option :selected="theme === 'dark'" value="dark">Dark</option>
                                </select>
                            </div>
                        </div>
                        <div class="row">
                            <div class="entry">
                                <h2>Gutters</h2>
                                <label>
                                    <input 
                                        type="checkbox" 
                                        v-model="showLineNumberGutter" 
                                        @change="updateSettings"
                                    />
                                    Show line numbers
                                </label>
                                
                                <label>
                                    <input 
                                        type="checkbox" 
                                        v-model="showFoldGutter" 
                                        @change="updateSettings"
                                    />
                                    Show fold gutter
                                </label>
                            </div>
                        </div>
                        <div class="row font-settings">
                            <div class="entry">
                                <h2>Font Family</h2>
                                <select v-model="fontFamily" @change="updateSettings" class="font-family">
                                    <option
                                        v-for="[font, label] in systemFonts"
                                        :selected="font === fontFamily"
                                        :value="font"
                                    >{{ label }}</option>
                                </select>
                            </div>
                            <div class="entry">
                                <h2>Font Size</h2>
                                <select v-model="fontSize" @change="updateSettings" class="font-size">
                                    <option
                                        v-for="size in [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]"
                                        :selected="size === fontSize"
                                        :value="size"
                                    >{{ size }}px{{ size === defaultFontSize ? " (default)" : "" }}</option>
                                </select>
                            </div>
                        </div>

                        <div class="row">
                            <div class="entry">
                                <h2>Tabs</h2>
                                <label>
                                    <input 
                                        type="checkbox" 
                                        v-model="showTabs" 
                                        @change="updateSettings"
                                    />
                                    Show tabs
                                </label>
                                
                                <label>
                                    <input 
                                        type="checkbox" 
                                        v-model="showTabsInFullscreen" 
                                        @change="updateSettings"
                                        :disabled="!showTabs"
                                    />
                                    Show tabs in fullscreen mode
                                </label>
                            </div>
                        </div>
                    </TabContent>

                    <TabContent tab="keyboard-bindings" :activeTab="activeTab">
                        <div class="row">
                            <div class="entry">
                                <h2>Keymap</h2>
                                <select v-model="keymap" @change="updateSettings" class="keymap">
                                    <template v-for="km in keymaps" :key="km.value">
                                        <option :selected="km.value === keymap" :value="km.value">{{ km.name }}</option>
                                    </template>
                                </select>
                            </div>
                            <div class="entry" v-if="keymap === 'emacs' && isMac">
                                <h2>Meta Key</h2>
                                <select v-model="metaKey" @change="updateSettings" class="metaKey">
                                    <option :selected="metaKey === 'meta'" value="meta">Command</option>
                                    <option :selected="metaKey === 'alt'" value="alt">Option</option>
                                </select>
                            </div>
                        </div>
                        <KeyboardBindings 
                            :userKeys="keyBindings ? keyBindings : {}"
                            v-model="keyBindings"
                            @addKeyBindingDialogVisible="addKeyBindingDialogVisible = $event"
                        />
                    </TabContent>
                    
                    <TabContent tab="notemate" :activeTab="activeTab">
                        <div class="row">
                            <div class="entry" style="width:100%">
                                <h2>NoteMate</h2>
                                <div class="nm-card">
                                    <div class="nm-title">NoteMate</div>
                                    <label class="nm-field">
                                        <span>API Base URL</span>
                                        <input
                                            type="text"
                                            :value="noteMateBaseUrl"
                                            @input="(e) => { noteMateBaseUrl = e.target.value; updateSettings() }"
                                            placeholder="http://localhost:80"
                                        />
                                    </label>
                                    <div class="nm-row">
                                        <label class="nm-field" style="width:100%">
                                            <span>API Key</span>
                                            <input
                                                type="password"
                                                :value="noteMateAuthToken"
                                                @input="(e) => { noteMateAuthToken = e.target.value; updateSettings() }"
                                                placeholder="Enter API Key"
                                            />
                                        </label>
                                    </div>
                                    <div class="nm-actions">
                                        <span class="nm-status">{{ testConnectStatus }}</span>
                                        <button @click="testNoteMateConnection" :disabled="testConnectLoading">{{ testConnectLoading ? 'Testing...' : 'Test Connection' }}</button>
                                    </div>
                                </div>
                                <div style="margin-top: 24px; max-width: 520px;">
                                    <h2>Sidebar Hotkey</h2>
                                    <p style="font-size: 12px; margin-bottom: 6px;">Set the keyboard shortcut to open / close the NoteMate sidebar in the client.</p>
                                    <KeyboardHotkey
                                        v-model="noteMateSidebarHotkey"
                                        @change="updateSettings"
                                    />
                                </div>
                            </div>
                        </div>
                    </TabContent>
                    
                    <TabContent tab="updates" :activeTab="activeTab">
                        <div class="row">
                            <div class="entry">
                                <h2>Current Version</h2>
                                <b>{{ appVersion }}</b>
                            </div>
                        </div>

                        <div class="row" v-if="!isWebApp">
                            <div class="entry">
                                <h2>Auto Update</h2>
                                <label>
                                    <input 
                                        type="checkbox" 
                                        v-model="autoUpdate" 
                                        @change="updateSettings"
                                    />
                                    Periodically check for new updates
                                </label>
                            </div>
                        </div>
                        <div class="row" v-if="!isWebApp">
                            <div class="entry">
                                <h2>Beta Versions</h2>
                                <label>
                                    <input 
                                        type="checkbox" 
                                        v-model="allowBetaVersions" 
                                        @change="updateSettings"
                                    />
                                    Use beta versions of Heynote
                                </label>
                            </div>
                        </div>
                    </TabContent>
                </div>
            </div>
            
            <div class="bottom-bar" :inert="addKeyBindingDialogVisible">
                <button 
                    @click="$emit('closeSettings')"
                    class="close"
                >Close</button>
            </div>
        </div>
        <div class="shader"></div>
    </div>
</template>

<style lang="sass" scoped>
    .settings
        z-index: 500 // above the search panel and other overlays
        position: fixed
        top: 0
        left: 0
        bottom: 0
        right: 0

        .shader
            z-index: 1
            position: absolute
            top: 0
            left: 0
            bottom: 0
            right: 0
            background: rgba(0, 0, 0, 0.5)
        
        .dialog
            --dialog-height: 600px
            --bottom-bar-height: 48px
            box-sizing: border-box
            z-index: 2
            position: absolute
            left: 50%
            top: 50%
            transform: translate(-50%, -50%)
            width: 820px
            height: var(--dialog-height)
            max-width: 100%
            max-height: 100%
            display: flex
            flex-direction: column
            border-radius: 5px
            background: #fff
            color: #333
            box-shadow: 0 0 25px rgba(0, 0, 0, 0.2)
            overflow-y: auto
            &:active, &:selected, &:focus, &:focus-visible
                border: none
                outline: none
            +dark-mode
                background: #333
                color: #eee
                box-shadow: 0 0 25px rgba(0, 0, 0, 0.3)
            .dialog-content
                flex-grow: 1
                display: flex
                height: calc(var(--dialog-height) - var(--bottom-bar-height))
                .sidebar
                    box-sizing: border-box
                    width: 140px
                    border-right: 1px solid #eee
                    padding-top: 20px
                    +dark-mode
                        border-right: 1px solid #222
                    h1
                        font-size: 16px
                        font-weight: 700
                        margin-bottom: 20px
                        padding: 0 20px
                        margin-bottom: 20px
                .settings-content
                    flex-grow: 1
                    padding: 40px
                    overflow-y: auto
                    position: relative
                    select
                        height: 22px
                        margin: 4px 0
                    .row
                        display: flex
                        .entry
                            margin-bottom: 24px
                            margin-right: 20px
                            &:last-child
                                margin-right: 0
                            h2
                                font-weight: 600
                                margin-bottom: 10px
                                font-size: 14px
                            select
                                width: 200px
                                &:focus
                                    outline: none
                            label
                                display: block
                                user-select: none
                                &.keyboard-shortcut-label
                                    margin-bottom: 14px
                                > input[type=checkbox]
                                    position: relative
                                    top: 2px
                                    left: -3px
                        &.font-settings
                            display: flex
                            .font-family
                                width: 280px
                            .font-size
                                width: 120px
                        
                        .buffer-location 
                            width: 100%
                            .file-path
                                display: flex
                                > button
                                    flex-shrink: 0
                                    padding: 3px 8px
                                .path
                                    flex-grow: 1
                                    margin-left: 10px
                                    font-size: 12px
                                    font-family: "Hack"
                                    padding: 5px 8px
                                    border-radius: 3px
                                    background: #f1f1f1
                                    color: #555
                                    white-space: nowrap
                                    overflow-x: auto
                                    +dark-mode
                                        background: #222
                                        color: #aaa

                        // NoteMate card styles
                        .nm-card
                            box-sizing: border-box
                            // Match KeyboardHotkey box exactly
                            border: 1px solid #c4c4c4
                            border-radius: 3px
                            padding: 7px
                            background: #eee
                            margin-top: 6px
                            +dark-mode
                                border: 1px solid #666
                                background: #555
                            .nm-title
                                font-weight: 600
                                margin-bottom: 8px
                            .nm-row
                                display: grid
                                grid-template-columns: 1fr 1fr
                                gap: 10px
                                @media (max-width: 860px)
                                    grid-template-columns: 1fr
                            .nm-field
                                display: block
                                margin-bottom: 8px
                                span
                                    display: block
                                    font-size: 12px
                                    opacity: .85
                                    margin-bottom: 3px
                                input
                                    width: 100%
                                    padding: 6px 8px
                                    box-sizing: border-box
                                    border: 1px solid #ddd
                                    border-radius: 6px
                                    background: #fff
                                    color: #333
                                    +dark-mode
                                        border: 1px solid #333
                                        background: #1e1e1e
                                        color: #eee
                            .nm-hint
                                font-size: 12px
                                opacity: .7
                                margin-top: 4px
                            .nm-actions
                                margin-top: 10px
                                display: flex
                                align-items: center
                                gap: 8px
                                justify-content: flex-end
                                .nm-status
                                    font-size: 12px
            .bottom-bar
                box-sizing: border-box
                height: var(--bottom-bar-height)
                border-radius: 0 0 5px 5px
                background: #eee
                text-align: right
                padding: 10px 20px
                +dark-mode
                    background: #222
                .close
                    height: 28px
                    cursor: pointer
</style>
