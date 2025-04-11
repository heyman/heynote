<script>
    import { mapState} from 'pinia'

    import { DEFAULT_KEYMAP, EMACS_KEYMAP } from "@/src/editor/keymap"
    import { useSettingsStore } from "@/src/stores/settings-store"
    import KeyBindRow from "./KeyBindRow.vue"

    export default {
        props: [
            "userKeys"
        ],
        components: {
            KeyBindRow,
        },

        data() {
            return {
                
            }
        },

        computed: {
            ...mapState(useSettingsStore, [
                "settings",
            ]),

            keymapOld() {
                const userKeys = [
                    {key: "Mod-Enter", command: null},
                ]
                
                // merge default keymap with user keymap
                const defaultKeys = Object.fromEntries(DEFAULT_KEYMAP.map(km => [km.key, km.command]))
                let mergedKeys = {...defaultKeys, ...Object.fromEntries(userKeys.map(km => [km.key, km.command]))}

                
                
                //console.log("defaultKeys:", defaultKeys)

                return Object.entries(mergedKeys).map(([key, command]) => {
                    return {
                        key: key,
                        command: command,
                        isDefault: defaultKeys[key] !== undefined && defaultKeys[key] === command,
                    }
                })
            },

            keymap() {
                //const userKeys = {
                //    "Mod-Enter": null,
                //    "Mod-Shift-A": "test",
                //}
                
                const keymap = this.settings.keymap === "emacs" ? EMACS_KEYMAP : DEFAULT_KEYMAP

                return [
                    ...Object.entries(this.userKeys).map(([key, command]) => {
                        return {key, command}
                    }),
                    
                    ...keymap.map((km) => {
                        return {
                            key: km.key,
                            command: km.command,
                            isDefault: true,
                            isOverridden: km.key in this.userKeys,
                        }
                    }),
                ]
            }
        },

        methods: {
            
        },
    }
</script>

<template>
    <div class="container">
        <h2>Keyboard Bindings</h2>
        <table>
            <tr>
                <th>Source</th>
                <th>Key</th>
                <th>Command</th>
                <th></th>
            </tr>
            <KeyBindRow 
                v-for="key in keymap" 
                :key="key.key" 
                :keys="key.key"
                :command="key.command"
                :isOverridden="key.isOverridden"
                :isDefault="key.isDefault"
            />
        </table>
    </div>
</template>

<style lang="sass" scoped>
    h2
        font-weight: 600
        margin-bottom: 20px
        font-size: 14px
    
    table
        width: 100%
        background: #f1f1f1
        border: 2px solid #f1f1f1
        +dark-mode
            background: #3c3c3c
            border: 2px solid #3c3c3c
        ::v-deep(tr)
            &:nth-child(2n)
                background: #fff
                +dark-mode
                    background: #333
            th
                text-align: left
                font-weight: 600
            th, td
                padding: 8px

</style>
