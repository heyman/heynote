<script>
    import { toRaw} from 'vue';
    import { mapStores, mapState } from 'pinia'
    import { i18n } from "../../locales/i18n"
    import { useSettingsStore } from "@/src/stores/settings-store.js"
    import { useHeynoteStore } from "@/src/stores/heynote-store"

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
                showWhitespace: this.initialSettings.showWhitespace,
                showTabs: this.initialSettings.showTabs,
                showTabsInFullscreen: this.initialSettings.showTabsInFullscreen,
                showLeftPanel: this.initialSettings.showLeftPanel ?? false,
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
                cursorBlinkRate: this.initialSettings.cursorBlinkRate ?? 1000,
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
                language: i18n.locale.value || 'en',

                // Tracks if the add key binding dialog is visible (so that we can set inert on the save button)
                addKeyBindingDialogVisible: false,
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
            ...mapStores(useSettingsStore, useHeynoteStore),
        },

        methods: {
            onKeyDown(event) {
                if (event.key === "Escape" && !this.addKeyBindingDialogVisible) {
                    this.$emit("closeSettings")
                }
            },

            updateSettings() {
                if (this.heynoteStore.showLeftPanel !== this.showLeftPanel) {
                    this.heynoteStore.setLeftPanelVisible(this.showLeftPanel, false)
                }
                this.settingsStore.updateSettings({
                    showLineNumberGutter: this.showLineNumberGutter,
                    showFoldGutter: this.showFoldGutter,
                    showWhitespace: this.showWhitespace,
                    showTabs: this.showTabs,
                    showTabsInFullscreen: this.showTabsInFullscreen,
                    showLeftPanel: this.showLeftPanel,
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
                    cursorBlinkRate: this.cursorBlinkRate,
                    defaultBlockLanguage: this.defaultBlockLanguage === "text" ? undefined : this.defaultBlockLanguage,
                    defaultBlockLanguageAutoDetect: this.defaultBlockLanguageAutoDetect === true ? undefined : this.defaultBlockLanguageAutoDetect,
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

            updateLanguage() {
                i18n.setLocale(this.language);
            },
        }
    }
</script>

<template>
    <div class="settings">
        <div class="dialog">
            <div class="dialog-content">
                <nav class="sidebar">
                    <h1>{{ $t('settings.title') }}</h1>
                    <ul>
                        <TabListItem 
                            :name="$t('settings.general')" 
                            tab="general" 
                            :activeTab="activeTab" 
                            @click="activeTab = 'general'"
                        />
                        <TabListItem 
                            :name="$t('settings.editing')" 
                            tab="editing"
                            :activeTab="activeTab" 
                            @click="activeTab = 'editing'"
                        />
                        <TabListItem 
                            :name="$t('settings.appearance')" 
                            tab="appearance"
                            :activeTab="activeTab" 
                            @click="activeTab = 'appearance'"
                        />
                        <TabListItem 
                            :name="$t('settings.keyBindings')" 
                            tab="keyboard-bindings" 
                            :activeTab="activeTab" 
                            @click="activeTab = 'keyboard-bindings'"
                        />
                        <TabListItem 
                            :name="isWebApp ? $t('settings.version') : $t('settings.updates')" 
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
                                <h2>{{ $t('settings.globalKeyboardShortcut') }}</h2>
                                <label class="keyboard-shortcut-label">
                                    <input 
                                        type="checkbox" 
                                        v-model="enableGlobalHotkey" 
                                        @change="updateSettings"
                                    />
                                    {{ $t('settings.enableGlobalHotkey') }}
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
                                <h2>{{ $t('settings.windowApplication') }}</h2>
                                <label v-if="isMac">
                                    <input
                                        type="checkbox"
                                        v-model="showInDock"
                                        @change="updateSettings"
                                    />
                                    {{ $t('settings.showInDock') }}
                                </label>
                                <label>
                                    <input
                                        type="checkbox"
                                        :disabled="!showInDock"
                                        v-model="showInMenu"
                                        @change="updateSettings"
                                    />
                                    <template v-if="isMac">
                                        {{ $t('settings.showInMenuBar') }}
                                    </template>
                                    <template v-else>
                                        {{ $t('settings.showInSystemTray') }}
                                    </template>
                                </label>
                                <label>
                                    <input
                                        type="checkbox"
                                        v-model="alwaysOnTop"
                                        @change="updateSettings"
                                    />
                                    {{ $t('settings.alwaysOnTop') }}
                                </label>
                            </div>
                        </div>
                        <div class="row" v-if="!isWebApp">
                            <div class="entry buffer-location">
                                <h2>{{ $t('settings.bufferFilesPath') }}</h2>
                                <label class="keyboard-shortcut-label">
                                    <input 
                                        type="checkbox" 
                                        v-model="customBufferLocation" 
                                        @change="onCustomBufferLocationChange"
                                    />
                                    {{ $t('settings.useCustomLocation') }}
                                </label>
                                <div class="file-path">
                                    <button
                                        :disabled="!customBufferLocation"
                                        @click="selectBufferLocation"
                                    >{{ $t('settings.selectDirectory') }}</button>
                                    <span class="path" v-show="customBufferLocation && bufferPath">{{ bufferPath }}</span>
                                </div>
                            </div>
                        </div>
                    </TabContent>

                    <TabContent tab="editing" :activeTab="activeTab">
                        <div class="row">
                            <div class="entry">
                                <h2>{{ $t('settings.inputSettings') }}</h2>
                                <label>
                                    <input 
                                        type="checkbox"
                                        v-model="bracketClosing"
                                        @change="updateSettings"
                                    />
                                    {{ $t('settings.autoCloseBrackets') }}
                                </label>
                            </div>  
                        </div>
                        <div class="row">
                            <div class="entry">
                                <h2>{{ $t('settings.tabSize') }}</h2>
                                <select v-model="tabSize" @change="updateSettings" class="tab-size">
                                    <option
                                        v-for="size in [1, 2, 3, 4, 5, 6, 7, 8]"
                                        :key="size"
                                        :selected="tabSize === size"
                                        :value="size"
                                    >{{ size }} {{ size === 1 ? $t('settings.space') : $t('settings.spaces') }}</option>
                                </select>
                            </div>
                            <div class="entry">
                                <h2>{{ $t('settings.indentUsing') }}</h2>
                                <select v-model="indentType" @change="updateSettings" class="indent-type">
                                    <option value="space" :selected="indentType === 'space'">{{ $t('settings.spacesLabel') }}</option>
                                    <option value="tab" :selected="indentType === 'tab'">{{ $t('settings.tabsLabel') }}</option>
                                </select>
                            </div>
                        </div>
                        <div class="row">
                            <div class="entry">
                                <h2>{{ $t('settings.defaultBlockLanguage') }}</h2>
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
                                    {{ $t('settings.autoDetection') }}
                                </label>
                            </div>  
                        </div>
                    </TabContent>

                    <TabContent tab="appearance" :activeTab="activeTab">
                        <div class="row">
                            <div class="entry">
                                <h2>{{ $t('settings.colorTheme') }}</h2>
                                <select v-model="theme" @change="updateSettings" class="theme">
                                    <option :selected="theme === 'system'" value="system">{{ $t('settings.system') }}</option>
                                    <option :selected="theme === 'light'" value="light">{{ $t('settings.light') }}</option>
                                    <option :selected="theme === 'dark'" value="dark">{{ $t('settings.dark') }}</option>
                                </select>
                            </div>
                        </div>
                        <div class="row">
                            <div class="entry">
                                <h2>{{ $t('settings.language') }}</h2>
                                <select v-model="language" @change="updateLanguage" class="language">
                                    <option :selected="language === 'zh'" value="zh">{{ $t('settings.chineseSimplified') }}</option>
                                    <option :selected="language === 'zh-TW'" value="zh-TW">{{ $t('settings.chineseTraditional') }}</option>
                                    <option :selected="language === 'en'" value="en">{{ $t('settings.english') }}</option>
                                    <option :selected="language === 'ja'" value="ja">{{ $t('settings.japanese') }}</option>
                                    <option :selected="language === 'ko'" value="ko">{{ $t('settings.korean') }}</option>
                                </select>
                            </div>
                        </div>
                        <div class="row">
                            <div class="entry">
                                <h2>{{ $t('settings.guttersWhitespace') }}</h2>
                                <label>
                                    <input 
                                        type="checkbox" 
                                        v-model="showLineNumberGutter" 
                                        @change="updateSettings"
                                    />
                                    {{ $t('settings.showLineNumbers') }}
                                </label>
                                
                                <label>
                                    <input 
                                        type="checkbox" 
                                        v-model="showFoldGutter" 
                                        @change="updateSettings"
                                    />
                                    {{ $t('settings.showFoldGutter') }}
                                </label>

                                <label>
                                    <input 
                                        type="checkbox" 
                                        v-model="showWhitespace" 
                                        @change="updateSettings"
                                    />
                                    {{ $t('settings.showWhitespace') }}
                                </label>
                            </div>
                        </div>
                        <div class="row font-settings">
                            <div class="entry">
                                <h2>{{ $t('settings.fontFamily') }}</h2>
                                <select v-model="fontFamily" @change="updateSettings" class="font-family">
                                    <option
                                        v-for="[font, label] in systemFonts"
                                        :selected="font === fontFamily"
                                        :value="font"
                                    >{{ label }}</option>
                                </select>
                            </div>
                            <div class="entry">
                                <h2>{{ $t('settings.fontSize') }}</h2>
                                <select v-model="fontSize" @change="updateSettings" class="font-size">
                                    <option
                                        v-for="size in [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]"
                                        :selected="size === fontSize"
                                        :value="size"
                                    >{{ size }}px{{ size === defaultFontSize ? $t('settings.default') : "" }}</option>
                                </select>
                            </div>
                        </div>
                        <div class="row">
                            <div class="entry">
                                <h2>{{ $t('settings.cursorBlinkRate') }}</h2>
                                <select v-model.number="cursorBlinkRate" @change="updateSettings" class="cursor-blink-rate">
                                    <option :value="0">{{ $t('settings.off') }}</option>
                                    <option :value="250">{{ $t('settings.ms', { ms: 250 }) }}</option>
                                    <option :value="500">{{ $t('settings.ms', { ms: 500 }) }}</option>
                                    <option :value="750">{{ $t('settings.ms', { ms: 750 }) }}</option>
                                    <option :value="1000">{{ $t('settings.ms', { ms: 1000 }) }} {{ $t('settings.default') }}</option>
                                    <option :value="1250">{{ $t('settings.ms', { ms: 1250 }) }}</option>
                                    <option :value="1500">{{ $t('settings.ms', { ms: 1500 }) }}</option>
                                    <option :value="2000">{{ $t('settings.ms', { ms: 2000 }) }}</option>
                                </select>
                            </div>
                        </div>

                        <div class="row">
                            <div class="entry">
                                <h2>{{ $t('settings.tabs') }}</h2>
                                <label>
                                    <input 
                                        type="checkbox" 
                                        v-model="showTabs" 
                                        @change="updateSettings"
                                    />
                                    {{ $t('settings.showTabs') }}
                                </label>
                                
                                <label>
                                    <input 
                                        type="checkbox" 
                                        v-model="showTabsInFullscreen" 
                                        @change="updateSettings"
                                        :disabled="!showTabs"
                                    />
                                    {{ $t('settings.showTabsInFullscreen') }}
                                </label>
                            </div>
                        </div>
                        <div class="row">
                            <div class="entry">
                                <h2>Sidebar</h2>
                                <label>
                                    <input
                                        type="checkbox"
                                        v-model="showLeftPanel"
                                        @change="updateSettings"
                                    />
                                    Show sidebar
                                </label>
                            </div>
                        </div>
                    </TabContent>

                    <TabContent tab="keyboard-bindings" :activeTab="activeTab">
                        <div class="row">
                            <div class="entry">
                                <h2>{{ $t('settings.keymap') }}</h2>
                                <select v-model="keymap" @change="updateSettings" class="keymap">
                                    <template v-for="km in keymaps" :key="km.value">
                                        <option :selected="km.value === keymap" :value="km.value">{{ km.name }}</option>
                                    </template>
                                </select>
                            </div>
                            <div class="entry" v-if="keymap === 'emacs' && isMac">
                                <h2>{{ $t('settings.metaKey') }}</h2>
                                <select v-model="metaKey" @change="updateSettings" class="metaKey">
                                    <option :selected="metaKey === 'meta'" value="meta">{{ $t('settings.command') }}</option>
                                    <option :selected="metaKey === 'alt'" value="alt">{{ $t('settings.option') }}</option>
                                </select>
                            </div>
                        </div>
                        <KeyboardBindings 
                            :userKeys="keyBindings ? keyBindings : {}"
                            v-model="keyBindings"
                            @addKeyBindingDialogVisible="addKeyBindingDialogVisible = $event"
                        />
                    </TabContent>
                    
                    <TabContent tab="updates" :activeTab="activeTab">
                        <div class="row">
                            <div class="entry">
                                <h2>{{ $t('settings.currentVersion') }}</h2>
                                <b>{{ appVersion }}</b>
                            </div>
                        </div>

                        <div class="row" v-if="!isWebApp">
                            <div class="entry">
                                <h2>{{ $t('settings.autoUpdate') }}</h2>
                                <label>
                                    <input 
                                        type="checkbox" 
                                        v-model="autoUpdate" 
                                        @change="updateSettings"
                                    />
                                    {{ $t('settings.periodicallyCheckUpdates') }}
                                </label>
                            </div>
                        </div>
                        <div class="row" v-if="!isWebApp">
                            <div class="entry">
                                <h2>{{ $t('settings.betaVersions') }}</h2>
                                <label>
                                    <input 
                                        type="checkbox" 
                                        v-model="allowBetaVersions" 
                                        @change="updateSettings"
                                    />
                                    {{ $t('settings.useBetaVersions') }}
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
                >{{ $t('settings.close') }}</button>
            </div>
        </div>
        <div class="shader"></div>
    </div>
</template>

<style lang="sass" scoped>
    .settings
        z-index: 500 // Above the search panel and other overlays
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
                            .language
                                width: 150px
                        
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
