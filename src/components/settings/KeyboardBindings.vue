<script>
    import { mapState} from 'pinia'
    import draggable from 'vuedraggable'

    import { DEFAULT_KEYMAP, EMACS_KEYMAP } from "@/src/editor/keymap"
    import { useSettingsStore } from "@/src/stores/settings-store"
    import KeyBindRow from "./KeyBindRow.vue"

    export default {
        props: [
            "userKeys",
            "modelValue",
        ],
        components: {
            KeyBindRow,
            draggable,
        },

        data() {
            return {
                keymap: this.modelValue,
                //fixedKeymap: [],
            }
        },

        mounted() {
            /*const defaultKeymap = this.settings.keymap === "emacs" ? EMACS_KEYMAP : DEFAULT_KEYMAP
            this.fixedKeymap = defaultKeymap.map((km) => {
                return {
                    key: km.key,
                    command: km.command,
                    isDefault: true,
                }
            })*/
            /*
            const keymap = this.settings.keymap === "emacs" ? EMACS_KEYMAP : DEFAULT_KEYMAP
            this.testKeymap = [
                ...this.userKeys,
                {"key": "Mod-Enter", command: "yay"},
                {"key": "Mod-Enter n", command: "nay"},
                {"key": "Ctrl-o", command: null},
            ]
             
            this.fixedKeymap = keymap.map((km) => {
                return {
                    key: km.key,
                    command: km.command,
                    isDefault: true,
                    isOverridden: km.key in this.userKeys,
                }
            })*/
        },

        computed: {
            ...mapState(useSettingsStore, [
                "settings",
            ]),

            fixedKeymap() {
                const defaultKeymap = (this.settings.keymap === "emacs" ? EMACS_KEYMAP : []).map((km) => ({
                    key: km.key,
                    command: km.command,
                    isDefault: true,
                    source: "Emacs",
                }))
                return defaultKeymap.concat(
                    DEFAULT_KEYMAP.map((km) => ({
                        key: km.key,
                        command: km.command,
                        isDefault: true,
                        source: "Default",
                    }))
                )
            },
        },

        methods: {
            onDragEnd(event) {
                console.log("onDragEnd", this.testKeymap)
                this.$emit("update:modelValue", this.keymap)
            },
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
                <th></th>
            </tr>
            <draggable 
                v-model="keymap" 
                tag="tbody"
                group="keymap" 
                ghost-class="ghost"
                handle=".drag-handle"
                @start="drag=true" 
                @end="onDragEnd" 
                item-key="key"
            >
                <template #item="{element}">
                    <KeyBindRow 
                        :keys="element.key"
                        :command="element.command"
                        :isDefault="element.isDefault"
                        source="User"
                    />
                </template>
            </draggable>
            <tbody>
                <KeyBindRow 
                    v-for="key in fixedKeymap" 
                    :key="key.key" 
                    :keys="key.key"
                    :command="key.command"
                    :isDefault="key.isDefault"
                    :source="key.source"
                />
            </tbody>
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
            background: #333
            border: 2px solid #3c3c3c
        ::v-deep(tr)
            background: #fff
            border-bottom: 2px solid #f1f1f1
            +dark-mode
                background: #333
                border-bottom: 2px solid #3c3c3c
            &.ghost
                background: #48b57e
                color: #fff
                +dark-mode
                    background: #1b6540
            th
                text-align: left
                font-weight: 600
            th, td
                padding: 8px
                &.actions
                    padding: 6px
                    button
                        height: 20px
                        font-size: 11px
        
        tbody
            margin-bottom: 20px

</style>
