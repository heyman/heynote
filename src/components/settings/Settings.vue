<script>
    import { LANGUAGES } from '../../editor/languages.js'

    import KeyboardHotkey from "./KeyboardHotkey.vue"
    import TabListItem from "./TabListItem.vue"
    import TabContent from "./TabContent.vue"

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
        },

        data() {
            return {
                keymaps: [
                    { name: "Default", value: "default" },
                    { name: "Emacs", value: "emacs" },
                ],
                keymap: this.initialSettings.keymap,
                metaKey: this.initialSettings.emacsMetaKey,
                isMac: window.heynote.platform.isMac,
                showLineNumberGutter: this.initialSettings.showLineNumberGutter,
                showFoldGutter: this.initialSettings.showFoldGutter,
                allowBetaVersions: this.initialSettings.allowBetaVersions,
                enableGlobalHotkey: this.initialSettings.enableGlobalHotkey,
                globalHotkey: this.initialSettings.globalHotkey,
                showInDock: this.initialSettings.showInDock,
                showInMenu: this.initialSettings.showInMenu,
                alwaysOnTop: this.initialSettings.alwaysOnTop,
                bracketClosing: this.initialSettings.bracketClosing,
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
            }
        },

        async mounted() {
            if (window.queryLocalFonts !== undefined) {
                let localFonts = [... new Set((await window.queryLocalFonts()).map(f => f.family))].filter(f => f !== "Hack")
                localFonts = [...new Set(localFonts)].map(f => [f, f])
                this.systemFonts = [[defaultFontFamily, defaultFontFamily + " (default)"], ...localFonts]
            }

            window.addEventListener("keydown", this.onKeyDown);
            this.$refs.keymapSelector.focus()

            this.appVersion = await window.heynote.getVersion()
        },
        beforeUnmount() {
            window.removeEventListener("keydown", this.onKeyDown);
        },

        methods: {
            onKeyDown(event) {
                if (event.key === "Escape") {
                    this.$emit("closeSettings")
                }
            },

            updateSettings() {
                window.heynote.setSettings({
                    showLineNumberGutter: this.showLineNumberGutter,
                    showFoldGutter: this.showFoldGutter,
                    keymap: this.keymap,
                    emacsMetaKey: window.heynote.platform.isMac ? this.metaKey : "alt",
                    allowBetaVersions: this.allowBetaVersions,
                    enableGlobalHotkey: this.enableGlobalHotkey,
                    globalHotkey: this.globalHotkey,
                    showInDock: this.showInDock,
                    showInMenu: this.showInMenu || !this.showInDock,
                    alwaysOnTop: this.alwaysOnTop,
                    autoUpdate: this.autoUpdate,
                    bracketClosing: this.bracketClosing,
                    bufferPath: this.bufferPath,
                    fontFamily: this.fontFamily === defaultFontFamily ? undefined : this.fontFamily,
                    fontSize: this.fontSize === defaultFontSize ? undefined : this.fontSize,
                    defaultBlockLanguage: this.defaultBlockLanguage === "text" ? undefined : this.defaultBlockLanguage,
                    defaultBlockLanguageAutoDetect: this.defaultBlockLanguageAutoDetect === true ? undefined : this.defaultBlockLanguageAutoDetect,
                })
                if (!this.showInDock) {
                    this.showInMenu = true
                }
                if (this.theme != this.themeSetting) {
                    this.$emit("setTheme", this.theme)
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
                            :name="isWebApp ? 'Version' : 'Updates'" 
                            tab="updates" 
                            :activeTab="activeTab" 
                            @click="activeTab = 'updates'"
                        />
                    </ul>
                </nav>
                <div class="settings-content">
                    <TabContent tab="general" :activeTab="activeTab">
                        <div class="row">
                            <div class="entry">
                                <h2>Keymap</h2>
                                <select ref="keymapSelector" v-model="keymap" @change="updateSettings" class="keymap">
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
                                <h2>Buffer File Path</h2>
                                <label class="keyboard-shortcut-label">
                                    <input 
                                        type="checkbox" 
                                        v-model="customBufferLocation" 
                                        @change="onCustomBufferLocationChange"
                                    />
                                    Use custom buffer file location
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
            
            <div class="bottom-bar">
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
            box-sizing: border-box
            z-index: 2
            position: absolute
            left: 50%
            top: 50%
            transform: translate(-50%, -50%)
            width: 700px
            height: 560px
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
            .bottom-bar
                border-radius: 0 0 5px 5px
                background: #eee
                text-align: right
                padding: 10px 20px
                +dark-mode
                    background: #222
                .close
                    height: 28px
</style>
