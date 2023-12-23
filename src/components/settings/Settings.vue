<script>
    import KeyboardHotkey from "./KeyboardHotkey.vue"

    export default {
        props: {
            initialKeymap: String,
            initialSettings: Object,
        },
        components: {
            KeyboardHotkey,
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
            }
        },

        mounted() {
            window.addEventListener("keydown", this.onKeyDown);
            this.$refs.keymapSelector.focus()
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
                    emacsMetaKey: this.metaKey,
                    allowBetaVersions: this.allowBetaVersions,
                    enableGlobalHotkey: this.enableGlobalHotkey,
                    globalHotkey: this.globalHotkey,
                })
            }
        }
    }
</script>

<template>
    <div class="settings">
        <div class="dialog">
            <div class="dialog-content">
                <h1>Settings</h1>
                <div class="row">
                    <div class="entry">
                        <h2>Keymap</h2>
                        <select ref="keymapSelector" v-model="keymap" @change="updateSettings">
                            <template v-for="km in keymaps" :key="km.value">
                                <option :selected="km.value === keymap" :value="km.value">{{ km.name }}</option>
                            </template>
                        </select>
                    </div>
                    <div class="entry" v-if="keymap === 'emacs' && isMac">
                        <h2>Meta Key</h2>
                        <select v-model="metaKey" @change="updateSettings">
                            <option :selected="metaKey === 'meta'" value="meta">Command</option>
                            <option :selected="metaKey === 'alt'" value="alt">Option</option>
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
                <div class="row">
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
                <div class="row">
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
            overflow-y: auto
            &:active, &:selected, &:focus, &:focus-visible
                border: none
                outline: none
            +dark-mode
                background: #333
                color: #eee
            .dialog-content
                flex-grow: 1
                padding: 40px
                h1
                    font-size: 20px
                    font-weight: 600
                    margin-bottom: 20px
                
                .row
                    display: flex
                    .entry
                        margin-bottom: 24px
                        margin-right: 20px
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
