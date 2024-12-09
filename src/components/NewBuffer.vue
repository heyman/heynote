<script>
    import slugify from '@sindresorhus/slugify';

    import { mapState, mapActions } from 'pinia'
    import { useHeynoteStore } from "../stores/heynote-store"

    import FolderSelector from './folder-selector/FolderSelector.vue'

    export default {
        data() {
            return {
                name: "",
                filename: "",
                tags: [],
                directoryTree: null,
                parentPath: "",
                errors: {
                    name: null,
                },
            }
        },
        components: {
            FolderSelector
        },

        async mounted() {
            if (!!this.createBufferParams.name) {
                this.name = this.createBufferParams.name
                this.$refs.nameInput.focus()
                this.$nextTick(() => {
                    this.$refs.nameInput.select()
                })
            } else {
                this.$refs.nameInput.focus()
            }

            this.updateBuffers()

            // build directory tree
            const directories = await window.heynote.buffer.getDirectoryList()
            const rootNode = {
                name: "Heynote Root",
                path: "",
                children: [],
                open: true,
            }
            const getNodeFromList = (list, part) => list.find(node => node.name === part)
                
            directories.forEach((path) => {
                const parts = path.split("/")
                let currentLevel = rootNode
                let currentParts = []
                parts.forEach(part => {
                    currentParts.push(part)
                    let node = getNodeFromList(currentLevel.children, part)
                    if (node) {
                        currentLevel = node
                    } else {
                        const currentPath = currentParts.join("/")
                        node = {
                            name: part,
                            children: [],
                            path: currentPath,
                            open: this.currentBufferPath.startsWith(currentPath),
                        }
                        currentLevel.children.push(node)
                        currentLevel = node
                    }
                })
            })
            //console.log("tree:", rootNode)
            this.directoryTree = rootNode
        },

        computed: {
            ...mapState(useHeynoteStore, [
                "buffers",
                "currentBufferPath",
                "createBufferParams",
            ]),

            currentNoteDirectory() {
                return this.currentBufferPath.split("/").slice(0, -1).join("/")
            },

            nameInputClass() {
                return {
                    "name-input": true,
                    "error": this.errors.name,
                }
            },

            dialogTitle() {
                return this.createBufferParams.mode === "currentBlock" ? "New Buffer from Block" : "New Buffer"
            },
        },

        methods: {
            ...mapActions(useHeynoteStore, [
                "updateBuffers",
                "createNewBuffer",
                "createNewBufferFromActiveBlock",
            ]),

            onKeydown(event) {
                if (event.key === "Escape") {
                    this.$emit("close")
                    event.preventDefault()
                } if (event.key === "Enter") {
                    // without preventDefault, the editor will receive a Enter keydown event on webapp (not in Electron)
                    event.preventDefault()
                    this.submit()
                }
            },

            onCancelKeydown(event) {
                if (event.key === "Enter") {
                    event.preventDefault()
                    event.stopPropagation()
                    this.cancel()
                }
            },

            cancel() {
                this.$emit("close")
            },

            onInputKeydown(event) {
                // redirect arrow keys and page up/down to folder selector
                const redirectKeys = ["ArrowDown", "ArrowUp", "PageDown", "PageUp"]
                if (redirectKeys.includes(event.key)) {
                    this.$refs.folderSelect.$el.dispatchEvent(new KeyboardEvent("keydown", {key: event.key}))
                    event.preventDefault()
                }
            },

            submit() {
                let slug = slugify(this.name)
                if (slug === "") {
                    this.errors.name = true
                    return
                }
                const parentPathPrefix = this.parentPath === "" ? "" : this.parentPath + "/"
                let path;
                for (let i=0; i<1000; i++) {
                    let filename = slug + ".txt"
                    path = parentPathPrefix + filename
                    if (!this.buffers[path]) {
                        break
                    }
                    slug = slugify(this.name + "-" + i)
                }
                if (this.buffers[path]) {
                    console.error("Failed to create buffer, path already exists", path)
                    this.errors.name = true
                    return
                }
                //console.log("Creating buffer", path, this.createBufferParams)
                if (this.createBufferParams.mode === "currentBlock") {
                    this.createNewBufferFromActiveBlock(path, this.name)
                } else if (this.createBufferParams.mode === "new") {
                    this.createNewBuffer(path, this.name)
                } else {
                    throw new Error("Unknown createBuffer Mode: " + this.createBufferParams.mode)
                }

                this.$emit("close")
                //this.$emit("create", this.$refs.input.value)
            },
        }
    }
</script>

<template>
    <div class="fader" @keydown="onKeydown" tabindex="-1">
        <form class="new-buffer" tabindex="-1" @focusout="onFocusOut" ref="container" @submit.prevent="submit">
            <div class="container">
                <h1>{{ dialogTitle }}</h1>
                <input 
                    placeholder="Name"
                    type="text" 
                    v-model="name"
                    :class="nameInputClass"
                    ref="nameInput"
                    @keydown="onInputKeydown"
                    @input="errors.name = false"
                    autocomplete="off"
                    data-1p-ignore
                />

                <label for="folder-select">Create in</label>
                <FolderSelector 
                    v-if="directoryTree"
                    :directoryTree="directoryTree"
                    :selectedPath="currentNoteDirectory"
                    id="folder-select" 
                    v-model="parentPath"
                    ref="folderSelect"
                />
            </div>
            <div class="bottom-bar">
                <button type="submit">Create New Buffer</button>
                <button 
                    class="cancel"
                    @keydown="onCancelKeydown"
                    @click.stop.prevent="cancel"
                >Cancel</button>
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
    .new-buffer
        font-size: 13px
        //background: #48b57e
        background: #efefef
        width: 420px
        position: absolute
        top: 0
        left: 50%
        transform: translateX(-50%)
        border-radius: 0 0 5px 5px
        box-shadow: 0 0 10px rgba(0,0,0,0.3)
        display: flex
        flex-direction: column
        max-height: 100%
        &:focus
            outline: none
        +dark-mode
            background: #151516
            box-shadow: 0 0 10px rgba(0,0,0,0.5)
            color: rgba(255,255,255, 0.7)
        +webapp-mobile
            max-width: calc(100% - 80px)
        
        .container
            padding: 10px
            min-height: 0
            display: flex
            flex-direction: column

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
                width: 100%
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
                &.error
                    background: #ffe9e9
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
            //background: #e3e3e3
            padding: 10px
            padding-top: 0
            display: flex
            justify-content: space-between
            button
                font-size: 12px
                height: 28px
                border: 1px solid #c5c5c5
                border-radius: 3px
                padding-left: 10px
                padding-right: 10px
                &:focus
                    outline-color: #48b57e
                +dark-mode
                    background: #444
                    border: none
                    color: rgba(255,255,255, 0.75)
                &[type="submit"]
                    order: 1
                &.cancel
                    order: 0
        
</style>
