<script>
    import FolderItem from "./FolderItem.vue"
    import NewFolderItem from "./NewFolderItem.vue"

    export default {
        props: {
            directoryTree: Object,
            selectedPath: String,
        },

        components: {
            FolderItem,
            NewFolderItem,
        },

        data() {
            return {
                tree: this.directoryTree,
                selected: 0,
                filter: "",
                filterSearchStart: 0,
                filterTimeout: null,
            }
        },

        mounted() {
            this.selected = this.listItems.findIndex(item => item.path === this.selectedPath)
        },

        watch: {
            directoryTree(newVal) {
                this.tree = newVal
            },

            selected() {
                this.$emit("update:modelValue", this.listItems[this.selected].path)
            }
        },

        computed: {
            listItems() {
                const items = []
                const getListItems = (node, level) => {
                    items.push({
                        name: node.name, 
                        level: level,
                        path: node.path,
                        type: "folder",
                        createNewFolder: node.createNewFolder,
                        newFolder: node.newFolder,
                        open: node.open,
                    })
                    if (node.createNewFolder) {
                        items.push({
                            level: level + 1,
                            type: "new-folder",
                            path: node.path,
                        })
                    }
                    if (node.open && node.children) {
                        for (const child of node.children) {
                            getListItems(child, level + 1)
                        }
                    }
                }
                getListItems(this.tree, 0)
                return items
            },
        },

        methods: {
            onKeyDown(event) {
                //console.log("Keydown", event.key)
                if (event.key === "Enter") {
                    event.preventDefault()
                    this.$emit("click")
                } else if (event.key === "ArrowDown") {
                    event.preventDefault()
                    this.selected = Math.min(this.selected + 1, this.listItems.length - 1)
                } else if (event.key === "ArrowUp") {
                    event.preventDefault()
                    this.selected = Math.max(this.selected - 1, 0)
                } else if (event.key === "ArrowRight") {
                    event.preventDefault()
                    const node = this.getNode(this.listItems[this.selected].path)
                    node.open = true
                } else if (event.key === "ArrowLeft") {
                    event.preventDefault()
                    const node = this.getNode(this.listItems[this.selected].path)
                    node.open = false
                } else if (event.key === "+") {
                    event.preventDefault()
                    this.newFolderDialog(this.listItems[this.selected].path)
                } else if (event.key === "-") {
                    event.preventDefault()
                    this.removeNewFolder(this.listItems[this.selected].path)
                } else if (event.key === "PageDown") {
                    event.preventDefault()
                    this.selected = Math.min(this.selected + this.pageCount(), this.listItems.length - 1)
                } else if (event.key === "PageUp") {
                    event.preventDefault()
                    this.selected = Math.max(this.selected - this.pageCount(), 0)
                } else {
                    if (event.key.length === 1) {
                        this.filter += event.key
                        if (this.filter === "") {
                            this.filterSearchStart = this.selected
                        }
                        let idx = this.listItems.findIndex((item, idx) => idx > this.filterSearchStart && item.name.toLowerCase().startsWith(this.filter))
                        if (idx === -1) {
                            idx = this.listItems.findIndex((item, idx) => idx < this.filterSearchStart && item.name.toLowerCase().startsWith(this.filter))
                        }
                        if (idx !== -1) {
                            this.selected = idx
                            this.scheduleFilterReset()
                        } else {
                            this.filter = ""
                        }
                    }
                }
            },

            scheduleFilterReset() {
                if (this.filterTimeout) {
                    clearTimeout(this.filterTimeout)
                    this.filterTimeout = null
                }
                this.filterTimeout = setTimeout(() => {
                    this.filter = ""
                    this.filterSearchStart = 0
                }, 1000)
            },

            newFolderDialog(parentPath) {
                //console.log("Create new folder in", parentPath)
                const node = this.getNode(parentPath)
                node.createNewFolder = true
                node.open = true
            },

            createNewFolder(parentPath, name) {
                //console.log("Create new folder", name, "in", parentPath)
                const node = this.getNode(parentPath)
                node.createNewFolder = false
                node.children.unshift({
                    name: name,
                    path: parentPath === "" ? name : parentPath + "/" + name,
                    children: [],
                    newFolder: true,
                })
                this.selected++
                this.$refs.container.focus()
            },

            cancelNewFolder(path) {
                //console.log("Cancel new folder in", path)
                const node = this.getNode(path)
                node.createNewFolder = false
                this.$refs.container.focus()
            },

            removeNewFolder(path) {
                //console.log("Remove newly created folder:", path)
                const node = this.getNode(path)
                if (node.newFolder && path) {
                    const parentPath = path.split("/").slice(0, -1).join("/")
                    const parent = this.getNode(parentPath)
                    parent.children = parent.children.filter(child => child.path !== path)
                    this.selected--
                }
                this.$refs.container.focus()
            },

            getNode(path) {
                const getNodeFromList = (list, part) => list.find(node => node.name === part)
                const parts = path.split("/")
                let currentLevel = this.tree
                for (const part of parts) {
                    const node = getNodeFromList(currentLevel.children, part)
                    if (!node) {
                        return currentLevel
                    }
                    currentLevel = node
                }
                return currentLevel
            },

            pageCount() {
                return Math.max(1, Math.floor(this.$refs.container.clientHeight / 24) - 1)
            },

            folderClick(idx) {
                const node = this.getNode(this.listItems[idx].path)
                node.open = !node.open
                this.selected = idx
            },
        },
    }
</script>

<template>
    <button
        class="folder-select-container"
        ref="container"
        @keydown="onKeyDown"
        @click.stop.prevent="()=>{}"
    >
        <!--<div class="folder root selected">
            Heynote Root
        </div>
        <div class="folder indent">New Folder&hellip;</div>-->
        
        <template v-for="(item, idx) in listItems">
            <FolderItem
                v-if="item.type === 'folder'"
                :name="item.name"
                :level="item.level"
                :selected="idx === selected && !item.createNewFolder"
                :newFolder="item.newFolder"
                :open="item.open"
                @click="folderClick(idx)"
                @new-folder="newFolderDialog(item.path)"
            />
            <NewFolderItem
                v-else-if="item.type === 'new-folder'"
                :parentPath="item.path"
                :level="item.level"
                @cancel="() => cancelNewFolder(item.path)"
                @create-folder="createNewFolder"
            />
        </template>
    </button>
</template>

<style lang="sass" scoped>
    .folder-select-container
        width: 100%
        overflow-y: auto
        background: #fff
        border: 1px solid #ccc
        border-radius: 2px
        padding: 5px 5px
        text-align: left
        &:focus, &:focus-within
            outline: none
            border: 1px solid #fff
            outline: 2px solid #48b57e
        +dark-mode
            background: #262626
            border: 1px solid #363636
</style>
