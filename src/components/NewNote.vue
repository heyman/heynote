<script>
    import { mapState, mapActions } from 'pinia'
    import { useNotesStore } from "../stores/notes-store"

    import FolderSelect from './form/FolderSelect.vue'

    export default {
        data() {
            return {
                name: "",
                filename: "",
                tags: [],
            }
        },
        components: {
            FolderSelect
        },

        async mounted() {
            await this.updateNotes()
            this.$refs.nameInput.focus()
        },

        computed: {
            ...mapState(useNotesStore, [
                "notes",
            ]),
        },

        methods: {
            ...mapActions(useNotesStore, [
                "updateNotes",
            ]),

            onKeydown(event) {
                if (event.key === "Escape") {
                    this.$emit("close")
                    event.preventDefault()
                }
            },

            onSubmit(event) {
                event.preventDefault()
                console.log("Creating note", this.name)
                this.$emit("close")
                //this.$emit("create", this.$refs.input.value)
            },
        }
    }
</script>

<template>
    <div class="fader" @keydown="onKeydown" tabindex="-1">
        <form class="new-note" tabindex="-1" @focusout="onFocusOut" ref="container" @submit="onSubmit">
            <div class="container">
                <h1>New Note from Block</h1>
                <input 
                    placeholder="Name"
                    type="text" 
                    v-model="name"
                    class="name-input"
                    ref="nameInput"
                />

                <label for="folder-select">Create in</label>
                <FolderSelect id="folder-select" />
            </div>
            <div class="bottom-bar">
                <button type="submit">Create Note</button>
            </div>
        </form>
    </div>
</template>

<style scoped lang="sass">    
    .fader
        position: fixed
        top: 0
        left: 0
        bottom: 0
        right: 0
        background: rgba(0,0,0, 0.2)
    .new-note
        font-size: 13px
        //background: #48b57e
        background: #efefef
        position: absolute
        top: 0
        left: 50%
        transform: translateX(-50%)
        border-radius: 0 0 5px 5px
        box-shadow: 0 0 10px rgba(0,0,0,0.3)
        &:focus
            outline: none
        +dark-mode
            background: #333
            box-shadow: 0 0 10px rgba(0,0,0,0.5)
            color: rgba(255,255,255, 0.7)
        +webapp-mobile
            max-width: calc(100% - 80px)
        
        .container
            padding: 10px

            h1
                font-weight: bold
                margin-bottom: 14px
            
            label
                display: block
                margin-bottom: 6px
                //padding-left: 2px
                font-size: 12px
                font-weight: 600

            
            .name-input
                width: 400px
                background: #fff
                padding: 4px 5px
                border: 1px solid #ccc
                box-sizing: border-box
                border-radius: 2px
                margin-bottom: 16px
                &:focus
                    outline: none
                    border: 1px solid #fff
                    outline: 2px solid #48b57e
                +dark-mode
                    background: #3b3b3b
                    color: rgba(255,255,255, 0.9)
                    border: 1px solid #5a5a5a
                    &:focus
                        border: 1px solid #3b3b3b
                +webapp-mobile
                    font-size: 16px
                    max-width: 100%
        
        .bottom-bar
            border-radius: 0 0 5px 5px
            background: #e3e3e3
            padding: 10px
            display: flex
            justify-content: flex-end
            +dark-mode
                background: #222
            button
                font-size: 12px
                height: 28px
                border: 1px solid #c5c5c5
                border-radius: 3px
                padding-left: 10px
                padding-right: 10px
                &:focus
                    outline-color: #48b57e
        
</style>
