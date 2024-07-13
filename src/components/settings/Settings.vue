<script>
import KeyboardHotkey from "./KeyboardHotkey.vue"
import TabListItem from "./TabListItem.vue"
import TabContent from "./TabContent.vue"
import i18next from 'i18next';

const defaultFontFamily = window.heynote.defaultFontFamily
const defaultFontSize = window.heynote.defaultFontSize

export default {
    props: {
        initialKeymap: String,
        initialSettings: Object,
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
            language: [
                { name: "English", value: "en" },
                { name: "Chinese", value: "zh" }
            ],
            keymap: this.initialSettings.keymap,
            selectedLanguage: this.initialSettings.selectedLanguage,
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

            activeTab: "general",
            isWebApp: window.heynote.platform.isWebApp,
            customBufferLocation: !!this.initialSettings.bufferPath,
            systemFonts: [[defaultFontFamily, defaultFontFamily + " (default)"]],
            defaultFontSize: defaultFontSize,
            appVersion: "",
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
        this.setLocale(this.selectedLanguage)
    },
    beforeUnmount() {
        window.removeEventListener("keydown", this.onKeyDown);
    },
    methods: {
        setLocale(lang) {
            if (i18next.languages.includes(lang)) {
                i18next.changeLanguage(lang);
            }
        },
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
                selectedLanguage: this.selectedLanguage,
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
            })
            if (!this.showInDock) {
                this.showInMenu = true
            }
            this.setLocale(this.selectedLanguage)
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
    },
}
</script>

<template>
    <div class="settings">
        <div class="dialog">
            <div class="dialog-content">
                <nav class="sidebar">
                    <h1>Settings</h1>
                    <ul>
                        <TabListItem :name="$t('General')" tab="general" :activeTab="activeTab"
                            @click="activeTab = 'general'" />
                        <TabListItem :name="$t('Editing')" tab="editing" :activeTab="activeTab"
                            @click="activeTab = 'editing'" />
                        <TabListItem :name="$t('Appearance')" tab="appearance" :activeTab="activeTab"
                            @click="activeTab = 'appearance'" />
                        <TabListItem :name="isWebApp ? $t('Version') : $t('Updates')" tab="updates"
                            :activeTab="activeTab" @click="activeTab = 'updates'" />
                    </ul>
                </nav>
                <div class="settings-content">
                    <TabContent tab="general" :activeTab="activeTab">
                        <div class="row">
                            <div class="entry">
                                <h2>{{ $t('Keymap') }}</h2>
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
                                <h2>{{ $t('Global_Keyboard_Shortcut') }}</h2>
                                <label class="keyboard-shortcut-label">
                                    <input type="checkbox" v-model="enableGlobalHotkey" @change="updateSettings" />
                                    {{ $t('Enable_Global_Hotkey') }}

                                </label>

                                <KeyboardHotkey :disabled="!enableGlobalHotkey" v-model="globalHotkey"
                                    @change="updateSettings" />
                            </div>
                        </div>
                        <div class="row" v-if="!isWebApp">
                            <div class="entry">
                                <h2>{{ $t('Window_Application') }}</h2>
                                <label v-if="isMac">
                                    <input type="checkbox" v-model="showInDock" @change="updateSettings" />
                                    {{ $t('Show_in_dock') }}
                                </label>
                                <label>
                                    <input type="checkbox" :disabled="!showInDock" v-model="showInMenu"
                                        @change="updateSettings" />
                                    <template v-if="isMac">
                                        {{ $t('Show_in_menu_bar') }}
                                    </template>
                                    <template v-else>
                                        {{ $t('Show_in_system_tray') }}
                                    </template>
                                </label>
                                <label>
                                    <input type="checkbox" v-model="alwaysOnTop" @change="updateSettings" />
                                    {{ $t('Always_on_top') }}
                                </label>
                            </div>
                        </div>
                        <div class="row" v-if="!isWebApp">
                            <div class="entry buffer-location">
                                <h2>{{ $t('Buffer_File_Path') }}</h2>
                                <label class="keyboard-shortcut-label">
                                    <input type="checkbox" v-model="customBufferLocation"
                                        @change="onCustomBufferLocationChange" />
                                    {{ $t('Use_custom_buffer_file_location') }}

                                </label>
                                <div class="file-path">
                                    <button :disabled="!customBufferLocation" @click="selectBufferLocation">{{
                            $t('Select_Directory')
                        }}</button>
                                    <span class="path" v-show="customBufferLocation && bufferPath">{{ bufferPath
                                        }}</span>
                                </div>
                            </div>
                        </div>
                        <div class="row" v-if="!isWebApp">
                            <div class="entry buffer-location">
                                <h2>{{ $t('change_language') }}</h2>
                                <select ref="keymapSelector" v-model="selectedLanguage" @change="updateSettings"
                                    class="keymap">
                                    <template v-for="km in language" :key="km.value">
                                        <option :value="km.value">{{ km.name }}</option>
                                    </template>
                                </select>
                            </div>
                        </div>
                    </TabContent>

                    <TabContent tab="editing" :activeTab="activeTab">
                        <div class="row">
                            <div class="entry">
                                <h2>{{ $t('Input_settings') }}</h2>
                                <label>
                                    <input type="checkbox" v-model="bracketClosing" @change="updateSettings" />
                                    {{ $t('Auto_close_brackets_and_quotation_marks') }}
                                </label>
                            </div>
                        </div>
                    </TabContent>

                    <TabContent tab="appearance" :activeTab="activeTab">
                        <div class="row">
                            <div class="entry">
                                <h2>{{ $t('Gutters') }}</h2>
                                <label>
                                    <input type="checkbox" v-model="showLineNumberGutter" @change="updateSettings" />
                                    {{ $t('Show_line_numbers') }}
                                </label>

                                <label>
                                    <input type="checkbox" v-model="showFoldGutter" @change="updateSettings" />
                                    {{ $t('Show_fold_gutter') }}
                                </label>
                            </div>
                        </div>
                        <div class="row font-settings">
                            <div class="entry">
                                <h2>{{ $t('Font_Family') }}</h2>
                                <select v-model="fontFamily" @change="updateSettings" class="font-family">
                                    <option v-for="[font, label] in systemFonts" :selected="font === fontFamily"
                                        :value="font">{{ label }}
                                    </option>
                                </select>
                            </div>
                            <div class="entry">
                                <h2>{{ $t('Font_Size') }}</h2>
                                <select v-model="fontSize" @change="updateSettings" class="font-size">
                                    <option v-for="size in [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]"
                                        :selected="size === fontSize" :value="size">{{ size }}px{{ size ===
                            defaultFontSize ? " (default)" : "" }}</option>
                                </select>
                            </div>
                        </div>
                    </TabContent>

                    <TabContent tab="updates" :activeTab="activeTab">
                        <div class="row">
                            <div class="entry">
                                <h2>{{ $t('Current_Version') }}</h2>
                                <b>{{ appVersion }}</b>
                            </div>
                        </div>

                        <div class="row" v-if="!isWebApp">
                            <div class="entry">
                                <h2>{{ $t('Auto_Update') }}</h2>
                                <label>
                                    <input type="checkbox" v-model="autoUpdate" @change="updateSettings" />
                                    {{ $t('Periodically_check_for_new_updates') }}
                                </label>
                            </div>
                        </div>
                        <div class="row" v-if="!isWebApp">
                            <div class="entry">
                                <h2>{{ $t('Beta_Versions') }}</h2>
                                <label>
                                    <input type="checkbox" v-model="allowBetaVersions" @change="updateSettings" />
                                    {{ $t('Use_beta_versions_of_Heynote') }}
                                </label>
                            </div>
                        </div>
                    </TabContent>
                </div>
            </div>

            <div class="bottom-bar">
                <button @click="$emit('closeSettings')" class="close">Close</button>
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
