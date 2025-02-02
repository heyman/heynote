<script>
    import { DEFAULT_KEYMAP} from "@/src/editor/keymap"
    import KeyBindRow from "./KeyBindRow.vue"

    export default {
        components: {
            KeyBindRow,
        },

        data() {
            return {
                
            }
        },

        computed: {
            keymapOld() {
                const userKeys = [
                    {key: "Mod-Enter", run: null},
                ]
                
                // merge default keymap with user keymap
                const defaultKeys = Object.fromEntries(DEFAULT_KEYMAP.map(km => [km.key, km.run]))
                let mergedKeys = {...defaultKeys, ...Object.fromEntries(userKeys.map(km => [km.key, km.run]))}

                
                
                //console.log("defaultKeys:", defaultKeys)

                return Object.entries(mergedKeys).map(([key, run]) => {
                    return {
                        key: key,
                        run: run,
                        isDefault: defaultKeys[key] !== undefined && defaultKeys[key] === run,
                    }
                })
            },

            keymap() {
                const userKeys = {
                    "Mod-Enter": null,
                    "Mod-Shift-A": "test",
                }
                
                return [
                    ...Object.entries(userKeys).map(([key, run]) => {
                        return {key, run}
                    }),
                    
                    ...DEFAULT_KEYMAP.map((km) => {
                        return {
                            key: km.key,
                            run: km.run,
                            isDefault: true,
                            isOverridden: km.key in userKeys,
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
                :command="key.run"
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
            background: #444
            border: 2px solid #444
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
