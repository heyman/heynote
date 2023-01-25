<script>
    export default {
        props: {
            initialKeymap: String,
        },

        data() {
            return {
                keymaps: [
                    { name: "Default", value: "default" },
                    { name: "Emacs", value: "emacs" },
                ],
                keymap: this.initialKeymap,
                metaKey: window.heynote.keymap.getEmacsMetaKey(),
                isMac: window.heynote.platform.isMac,
            }
        },

        mounted() {
            window.addEventListener("keydown", this.onKeyDown);
            this.$refs.keymapSelector.focus()
        },
        beforeUnmount() {
            window.removeEventListener("keydown", this.onKeyDown);
        },

        watch: {
            keymap(value) {
                window.heynote.keymap.set(value)
            },

            metaKey(value) {
                window.heynote.keymap.setEmacsMetaKey(value)
            }
        },

        methods: {
            onKeyDown(event) {
                if (event.key === "Escape") {
                    this.$emit("closeSettings")
                }
            },
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
                        <select ref="keymapSelector" v-model="keymap">
                            <template v-for="km in keymaps" :key="km.value">
                                <option :selected="km.value === keymap" :value="km.value">{{ km.name }}</option>
                            </template>
                        </select>
                    </div>
                    <div class="entry" v-if="keymap === 'emacs' && isMac">
                        <h2>Meta Key</h2>
                        <select v-model="metaKey">
                            <option :selected="metaKey === 'meta'" value="meta">Command</option>
                            <option :selected="metaKey === 'alt'" value="alt">Option</option>
                        </select>
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
    =dark-mode()
        @media (prefers-color-scheme: dark)
            @content
    
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
