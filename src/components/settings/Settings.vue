<script>
    export default {
        props: {
            initialKeymap: String,
            initialSettings: Object,
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
                })
            }
        }
    }
</script>

<template>
    <div class="settings">
        <div class="dialog">
            <div>
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
                        <div class="checkbox">
                            <input 
                                type="checkbox" 
                                id="showLineNumbers"
                                v-model="showLineNumberGutter" 
                                @change="updateSettings"
                            />
                            <label for="showLineNumbers">Show line numbers</label>
                        </div>
                        <div class="checkbox">
                            <input 
                                type="checkbox" 
                                id="showFoldGutter"
                                v-model="showFoldGutter" 
                                @change="updateSettings"
                            />
                            <label for="showFoldGutter">Show fold gutter</label>
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="entry">
                        <h2>Beta Versions</h2>
                        <div class="checkbox">
                            <input 
                                type="checkbox" 
                                id="allowBetaVersions"
                                v-model="allowBetaVersions" 
                                @change="updateSettings"
                            />
                            <label for="allowBetaVersions">Use beta versions of Heynote</label>
                        </div>
                    </div>
                </div>
            </div>
            <button 
                @click="$emit('closeSettings')"
                class="close"
            >Close</button>
        </div>
        <div class="shader"></div>
    </div>
</template>

<style lang="sass">
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
            width: 100%
            height: 100%
            max-width: 700px
            max-height: 500px
            border-radius: 5px
            padding: 40px
            background: #fff
            color: #333
            &:active, &:selected, &:focus, &:focus-visible
                border: none
                outline: none
            +dark-mode
                background: #333
                color: #eee
            h1
                font-size: 20px
                font-weight: 600
                margin-bottom: 20px
            
            .row
                display: flex
                .entry
                    margin-bottom: 20px
                    margin-right: 20px
                    h2
                        font-weight: 600
                        margin-bottom: 10px
                    select
                        width: 200px
                        &:focus
                            outline: none

            .close
                height: 32px
                position: absolute
                bottom: 30px
                right: 30px
</style>
