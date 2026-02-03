<script>
    import fuzzysort from 'fuzzysort'
    import AutoComplete from 'primevue/autocomplete'

    import { HEYNOTE_COMMANDS } from '@/src/editor/commands'
    import RecordKeyInput from './RecordKeyInput.vue'
    
    export default {
        name: "AddKeyBind",
        components: {
            AutoComplete,
            RecordKeyInput,
        },
        data() {
            return {
                key: "",
                command: "",
                commandSuggestions: [],
            }
        },
        computed: {
            commands() {
                
                return Object.entries(HEYNOTE_COMMANDS).map(([key, cmd]) => {
                    const description = cmd.category + ": " + cmd.description
                    return {
                        name: key,
                        category: cmd.category,
                        description: description,
                        key: cmd.description,
                        label: description,
                    }
                })
            },
        },

        mounted() {
            window.addEventListener("keydown", this.onKeyDown)
            this.$refs.keys.$el.focus()
        },
        beforeUnmount() {
            window.removeEventListener("keydown", this.onKeyDown)
        },

        methods: {
            onKeyDown(event) {
                if (event.key === "Escape" && document.activeElement !== this.$refs.keys.$el) {
                    this.$emit("close")
                }
            },

            onCommandSearch(event) {
                if (event.query === "") {
                    this.commandSuggestions = [...this.commands]
                } else {
                    const searchResults = fuzzysort.go(event.query, this.commands, {
                        keys: ["description", "name"],
                    })
                    this.commandSuggestions = searchResults.map((result) => {
                        const obj = {...result.obj}
                        const nameHighlight = result[0].highlight("<b>", "</b>")
                        obj.label = nameHighlight !== "" ? nameHighlight : obj.description
                        return obj
                    })
                }
            },

            onSave() {
                if (this.key === "" || this.command === "") {
                    return
                }
                this.$emit("save", {
                    key: this.key,
                    command: this.command.name,
                })
            },

            focusCommandSelector() {
                this.$refs.autocomplete.$el.querySelector("input").focus()
            },
        },
    }
</script>

<template>
    <div class="container add-key-binding-dialog">
        <div class="dialog">
            <div class="dialog-content">
                <h3>Add key binding</h3>
                <div class="form">
                    <div class="field">
                        <label>Key</label>
                        <RecordKeyInput 
                            v-model="key" 
                            @enter="focusCommandSelector"
                            @close="$emit('close')"
                            ref="keys"
                        />
                    </div>
                    <div class="field command-field">
                        <label>Command</label>
                        <AutoComplete
                            dropdown
                            forceSelection
                            v-model="command"
                            :suggestions="commandSuggestions"
                            :autoOptionFocus="true"
                            optionLabel="key"
                            :delay="0"
                            @complete="onCommandSearch"
                            ref="autocomplete"
                            emptySearchMessage="No commands found"
                            class="command-autocomplete"
                        >
                            <template #option="slotProps">
                                <div class="command-option">
                                    <span v-html="slotProps.option.label" />
                                </div>
                            </template>
                        </AutoComplete>
                    </div>
                </div>
            </div>
            <div class="footer">
                <button 
                    @click="onSave"
                    class="save"
                >Save</button>
                <button 
                    @click="$emit('close')"
                    class="cancel"
                 >Cancel</button>
            </div>
        </div>
    </div>
</template>

<style lang="sass" scoped>
    .container
        position: absolute
        top: 0
        left: 0
        right: 0
        bottom: 0
        background: rgba(255,255,255, 0.7)
        +dark-mode
            background: rgba(51,51,51, 0.7)
        
        .dialog
            width: 400px
            position: absolute
            top: 50%
            left: 50%
            transform: translate(-50%, -50%)
            display: flex
            flex-direction: column
            background: #fff
            border-radius: 5px
            box-shadow: 0 5px 30px rgba(0,0,0, 0.3)
            border: 2px solid #c0c0c0
            +dark-mode
                background: #333
                box-shadow: 0 5px 30px rgba(0,0,0, 0.7)
                border: 2px solid #555
            .dialog-content
                flex-grow: 1
                padding: 20px
                h3
                    font-size: 14px
                    font-weight: 600
                    text-align: center
                    margin: 0
                    margin-bottom: 30px
                .form
                    //display: flex
                    .field
                        //width: 50%
                        margin-bottom: 20px
                        &:last-child
                            margin-bottom: 0
                        label
                            display: block
                            margin-bottom: 8px
                        input.keys
                            width: 100%
                            padding: 4px
                            border-radius: 2px
                            border: 1px solid #ccc
                            &:focus
                                border: 1px solid rgba(0,0,0, 0)
                                outline: 2px solid var(--highlight-color)
                                //border: 1px solid var(--highlight-color)
                            +dark-mode
                                background: #202020
                                color: #fff
                                border: 1px solid #5a5a5a
                                &:focus
                                    border: 1px solid rgba(0,0,0, 0)
                        .command-autocomplete
                            width: 100%

            .footer
                padding: 10px
                background: #f1f1f1
                border-radius: 0 0 5px 5px
                text-align: right
                +dark-mode
                    background: #2c2c2c
                .cancel
                    float: left
</style>