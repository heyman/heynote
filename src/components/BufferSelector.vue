<script>
    import fuzzysort from 'fuzzysort'

    import { mapState, mapActions } from 'pinia'
    import { toRaw } from 'vue';
    import { SCRATCH_FILE_NAME } from "../common/constants"
    import { useHeynoteStore } from "../stores/heynote-store"

    export default {
        data() {
            return {
                selected: 0,
                actionButton: 0,
                filter: "",
                items: [],
                SCRATCH_FILE_NAME: SCRATCH_FILE_NAME,
                deleteConfirm: false,
            }
        },

        async mounted() {
            await this.updateBuffers()
            this.$refs.container.focus()
            this.$refs.input.focus()
            this.buildItems()
            if (this.items.length > 1) {
                this.selected = 1
            }
        },

        computed: {
            ...mapState(useHeynoteStore, [
                "buffers",
                "recentBufferPaths",
            ]),

            orderedItems() {
                const sortKeys = Object.fromEntries(this.recentBufferPaths.map((item, idx) => [item, idx]))
                const getSortScore = (item) => sortKeys[item.path] !== undefined ? sortKeys[item.path] : 1000
                const compareFunc = (a, b) => {
                    const sortScore = getSortScore(a) - getSortScore(b)
                    if (sortScore !== 0) {
                        // sort by recency first
                        return sortScore
                    } else {
                        // then notes in root
                        const aIsRoot = a.path.indexOf("/") === -1
                        const bIsRoot = b.path.indexOf("/") === -1
                        if (aIsRoot && !bIsRoot) {
                            return -1
                        } else if (!aIsRoot && bIsRoot) {
                            return 1
                        } else {
                            // last sort by path
                            return a.path.localeCompare(b.path)
                        }
                    }
                }
                return [...this.items].sort(compareFunc)
            },

            filteredItems() {
                let items
                if (this.filter === "") {
                    items = this.orderedItems
                    
                } else {
                    const searchResults = fuzzysort.go(this.filter, this.items, {
                        keys: ["name", "folder"],
                    })
                    items = searchResults.map((result) => {
                        const obj = {...result.obj}
                        const nameHighlight = result[0].highlight("<b>", "</b>")
                        const folderHighlight = result[1].highlight("<b>", "</b>")
                        obj.name = nameHighlight !== "" ? nameHighlight : obj.name
                        obj.folder = folderHighlight !== "" ? folderHighlight : obj.folder
                        return obj
                    })
                }
                
                const newNoteItem = {
                    name: "Create new…", 
                    createNew:true,
                }
                return [
                    ...items,
                    newNoteItem,
                ]
            },
        },

        methods: {
            ...mapActions(useHeynoteStore, [
                "updateBuffers",
                "editBufferMetadata",
                "deleteBuffer",
                "openCreateBuffer",
            ]),

            buildItems() {
                //console.log("buildItems", Object.entries(this.buffers))
                this.items = Object.entries(this.buffers).map(([path, metadata]) => {
                    return {
                        "path": path,
                        "name": metadata?.name || path,
                        "folder": path.split("/").slice(0, -1).join("/"),
                        "scratch": path === SCRATCH_FILE_NAME,
                    }
                })
            },

            onKeydown(event) {
                if (event.key === "Escape") {
                    event.preventDefault()
                    if (this.actionButton !== 0) {
                        this.hideActionButtons()
                    } else {
                        this.$emit("close")
                    }
                    return
                }

                if (this.filteredItems.length === 0) {
                    return
                }
                
                const item = this.filteredItems[this.selected]
                if (event.key === "ArrowDown") {
                    if (this.selected === this.filteredItems.length - 1) {
                        this.selected = 0
                    } else {
                        this.selected = Math.min(this.selected + 1, this.filteredItems.length - 1)
                    }
                    event.preventDefault()
                    this.$nextTick(() => {
                        this.$refs.container.querySelector(".selected").scrollIntoView({block: "nearest"})
                    })
                    this.actionButton = 0
                } else if (event.key === "ArrowUp") {
                    if (this.selected === 0) {
                        this.selected = this.filteredItems.length - 1
                    } else {
                        this.selected = Math.max(this.selected - 1, 0)
                    }
                    event.preventDefault()
                    this.$nextTick(() => {
                        this.$refs.container.querySelector(".selected").scrollIntoView({block: "nearest"})
                    })
                    this.actionButton = 0
                } else if (event.key === "ArrowRight" && this.itemHasActionButtons(item)) {
                    event.preventDefault()
                    this.actionButton = Math.min(2, this.actionButton + 1)
                } else if (event.key === "ArrowLeft" && this.itemHasActionButtons(item)) {
                    event.preventDefault()
                    this.actionButton = Math.max(0, this.actionButton - 1)
                    this.deleteConfirm = false
                } else if (event.key === "Enter") {
                    event.preventDefault()
                    if (this.actionButton === 1) {
                        //console.log("edit file:", path)
                        this.editBufferMetadata(item.path)
                    } else if (this.actionButton === 2) {
                        this.deleteConfirmNote(item.path)
                    } else {
                        this.selectItem(item)
                    }
                }
            },

            selectItem(item) {
                if (item.createNew) {
                    if (this.filteredItems.length === 1) {
                        this.openCreateBuffer("new", this.filter)
                    } else {
                        this.openCreateBuffer("new", "")
                    }
                } else {
                    this.$emit("openBuffer", item.path)
                }
            },

            itemHasActionButtons(item) {
                return !item.createNew && item.path !== SCRATCH_FILE_NAME
            },

            onInput(event) {
                // reset selection
                this.selected = 0
            },

            onFocusOut(event) {
                let container = this.$refs.container
                if (container !== event.relatedTarget && !container.contains(event.relatedTarget)) {
                    this.$emit("close")
                }
            },
            
            getItemClass(item, idx) {
                return {
                    "item": true,
                    "selected": idx === this.selected,
                    "action-buttons-visible": this.actionButton > 0,
                    "scratch": item.scratch,
                    "new-note": item.createNew,
                }
            },

            showActionButtons(idx) {
                this.selected = idx
                this.actionButton = 1
                this.deleteConfirm = false
                this.$refs.input.focus()
            },

            hideActionButtons() {
                this.actionButton = 0
                this.deleteConfirm = false
            },

            async deleteConfirmNote(path) {
                if (this.deleteConfirm) {
                    //console.log("delete file:", path)
                    await this.deleteBuffer(path)
                    this.hideActionButtons()
                    this.buildItems()
                    this.selected = Math.min(this.selected, this.items.length - 1)
                } else {
                    this.deleteConfirm = true
                    this.actionButton = 2
                    this.$refs.input.focus()
                }
            },
        }
    }
</script>

<template>
    <form class="note-selector" tabindex="-1" @focusout="onFocusOut" ref="container">
        <div class="input-container">
            <input 
                type="text" 
                ref="input"
                @keydown="onKeydown"
                @input="onInput"
                v-model="filter"
                autocomplete="off"
            />
        </div>
        <div class="scroller">
            <ul class="items" ref="itemsContainer">
                <template 
                    v-for="item, idx in filteredItems"
                    :key="item.path"
                >
                    <li v-if="item.createNew" class="line-separator"></li>
                    <li
                        :class="getItemClass(item, idx)"
                        @click="selectItem(item)"
                        ref="item"
                    >
                        <span class="name" v-html="item.name" />
                        <span class="path" v-html="item.folder" />
                        <span :class="{'action-buttons':true, 'visible':actionButton > 0 && idx === selected}">
                            <button 
                                v-if="actionButton > 0 && idx === selected"
                                :class="{'selected':actionButton === 1}"
                                @click.stop.prevent="editBufferMetadata(item.path)"
                            >Edit</button>
                            <button 
                                v-if="actionButton > 0 && idx === selected"
                                :class="{'delete':true, 'selected':actionButton === 2, 'confirm':deleteConfirm}"
                                @click.stop.prevent="deleteConfirmNote(item.path)"
                            >
                                <template v-if="deleteConfirm">
                                    Really Delete?
                                </template>
                                <template v-else>
                                    Delete
                                </template>
                            </button>
                            <button
                                class="show-actions"
                                v-if="itemHasActionButtons(item) && (actionButton === 0 || idx !== selected)"
                                @click.stop.prevent="showActionButtons(idx)"
                            ></button>
                        </span>
                    </li>
                </template>
            </ul>
        </div>
    </form>
</template>

<style scoped lang="sass">
    .note-selector
        font-size: 13px
        //background: #48b57e
        background: #efefef
        position: absolute
        top: 0
        left: 50%
        width: 420px
        transform: translateX(-50%)
        max-height: 100%
        box-sizing: border-box
        display: flex
        flex-direction: column
        border-radius: 0 0 5px 5px
        box-shadow: 0 0 10px rgba(0,0,0,0.3)
        +dark-mode
            background: #151516
            box-shadow: 0 0 10px rgba(0,0,0,0.5)
        +webapp-mobile
            max-width: calc(100% - 80px)

        .input-container
            padding: 10px
            input
                background: #fff
                padding: 4px 5px
                border: 1px solid #ccc
                box-sizing: border-box
                border-radius: 2px
                width: 100%
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
        
        .scroller
            overflow-y: auto
            padding: 0 10px 5px 10px
        
        .items
            > li.line-separator
                height: 1px
                background: rgba(0,0,0, 0.05)
                margin-left: -10px
                margin-right: -10px
                margin-top: 3px
                margin-bottom: 3px
                +dark-mode
                    background: rgba(255,255,255, 0.1)
            > li.item
                position: relative
                border-radius: 3px
                padding: 3px 12px
                line-height: 18px
                display: flex
                align-items: center
                scroll-margin-top: 6px
                scroll-margin-bottom: 6px
                &:hover
                    background: #e2e2e2
                    .action-buttons .show-actions
                        display: inline-block
                        background-image: url(@/assets/icons/arrow-right-black.svg)
                    &.selected .action-buttons .show-actions
                        background-image: url(@/assets/icons/arrow-right-white.svg)
                +dark-mode
                    color: rgba(255,255,255, 0.65)
                    &:hover
                        background: #29292a
                    .action-buttons button
                        color: #fff
                &.selected
                    background: #48b57e
                    color: #fff
                    &.action-buttons-visible
                        background: none
                        border: 1px solid #48b57e
                        padding: 2px 11px
                        color: #444
                    .action-buttons .show-actions
                        display: inline-block
                    +dark-mode
                        background: #1b6540
                        color: rgba(255,255,255, 0.87)
                        &.action-buttons-visible
                            background: none
                            border: 1px solid #1b6540
                            color: rgba(255,255,255, 0.65)
                &.scratch
                    font-weight: 600
                &.new-note
                    //font-size: 12px
                .name
                    margin-right: 12px
                    flex-shrink: 0
                    overflow: hidden
                    text-overflow: ellipsis
                    text-wrap: nowrap
                    ::v-deep(b)
                        font-weight: 700
                .path
                    opacity: 0.6
                    font-size: 12px
                    flex-shrink: 1
                    overflow: hidden
                    text-overflow: ellipsis
                    text-wrap: nowrap
                    ::v-deep(b)
                        font-weight: 700
                .action-buttons
                    position: absolute
                    top: 1px
                    right: 0px
                    padding: 0 1px
                    &.visible
                        background: #efefef
                        +dark-mode
                            background: #151516
                    button
                        padding: 0 10px
                        height: 20px
                        font-size: 12px
                        background: none
                        border: none
                        border-radius: 2px
                        margin-right: 2px
                        cursor: pointer
                        &:last-child
                            margin-right: 0
                        &:hover
                            background: rgba(0,0,0, 0.1)
                        +dark-mode
                            &:hover
                                background-color: rgba(255,255,255, 0.1)
                        &.selected
                            background: #48b57e
                            color: #fff
                            &:hover
                                background: #3ea471
                            &.delete
                                background: #e95050
                                &:hover
                                    background: #ce4848
                            +dark-mode
                                background: #1b6540
                                &:hover
                                    background: #1f7449
                                &.delete
                                    background: #ae1e1e
                                    &:hover
                                        background: #bf2222
                            &.confirm
                                font-weight: 600
                        &.show-actions
                            display: none
                            position: relative
                            top: 1px
                            padding: 1px 8px
                            //cursor: default
                            background-image: url(@/assets/icons/arrow-right-white.svg)
                            width: 22px
                            height: 19px
                            background-size: 19px
                            background-position: center center
                            background-repeat: no-repeat
                            +dark-mode
                                background-image: url(@/assets/icons/arrow-right-grey.svg)
</style>
