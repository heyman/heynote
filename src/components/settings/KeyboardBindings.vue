<script>
    import { mapState} from 'pinia'
    import draggable from 'vuedraggable'

    import { DEFAULT_KEYMAP, EMACS_KEYMAP } from "@/src/editor/keymap"
    import { useSettingsStore } from "@/src/stores/settings-store"
    import KeyBindRow from "./KeyBindRow.vue"
    import AddKeyBind from "./AddKeyBind.vue"

    export default {
        props: [
            "userKeys",
            "modelValue",
        ],
        components: {
            draggable,
            KeyBindRow,
            AddKeyBind,
        },

        data() {
            return {
                keymap: this.modelValue,
                addKeyBinding: false,
            }
        },

        mounted() {
            
        },

        watch: {
            addKeyBinding(newValue) {
                this.$emit("addKeyBindingDialogVisible", newValue)
            },
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
                this.$emit("update:modelValue", this.keymap)
            },

            onSaveKeyBinding(event) {
                this.keymap = [
                    {
                        key: event.key,
                        command: event.command,
                    },
                    ...this.keymap,
                ]
                //console.log("keymap", this.keymap)
                this.$emit("update:modelValue", this.keymap)
                this.addKeyBinding = false
            },

            deleteKeyBinding(index) {
                this.keymap = this.keymap.toSpliced(index, 1)
                this.$emit("update:modelValue", this.keymap)
            },
        },
    }
</script>

<template>
    <div class="container">
        <div class="header" :inert="addKeyBinding">
            <h2>Keyboard Bindings</h2>
            <!--<p>User key bindings can be reordered. Bindings that appear first take precedence</p>-->
            <div class="button-container">
                <button 
                    class="add-keybinding"
                    @click="addKeyBinding = !addKeyBinding"
                >Add Keybinding</button>
            </div>
        </div>
        
        <AddKeyBind 
            v-if="addKeyBinding" 
            @close="addKeyBinding = false"
            @save="onSaveKeyBinding"
        />

        <table :inert="addKeyBinding">
            <thead>
                <tr>
                    <th>Source</th>
                    <th>Key</th>
                    <th>Command</th>
                    <th></th>
                    <th></th>
                </tr>
            </thead>
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
                <template #item="{element, index}">
                    <KeyBindRow 
                        :keys="element.key"
                        :command="element.command"
                        :isDefault="element.isDefault"
                        :index="index"
                        @delete="deleteKeyBinding(index)"
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
    .header
        display: flex
        margin-bottom: 12px
        h2
            flex-grow: 1
            font-weight: 600
            font-size: 14px
            margin: 0
        .button-container
            .add-keybinding
                font-size: 12px
                height: 26px
                cursor: pointer
                
    
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
