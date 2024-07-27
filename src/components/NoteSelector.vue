<script>
    import fuzzysort from 'fuzzysort'

    import { mapState, mapActions } from 'pinia'
    import { toRaw } from 'vue';
    import { useNotesStore } from "../stores/notes-store"

    export default {
        data() {
            return {
                selected: 0,
                filter: "",
                items: [],
            }
        },

        async mounted() {
            await this.updateNotes()
            this.$refs.container.focus()
            this.$refs.input.focus()
            this.items = Object.entries(this.notes).map(([path, metadata]) => {
                return {
                    "path": path,
                    "name": metadata?.name || path,
                    "folder": path.split("/").slice(0, -1).join("/"),
                    "scratch": path === "buffer-dev.txt",
                }
            })
            if (this.items.length > 1) {
                this.selected = 1
            }
        },

        computed: {
            ...mapState(useNotesStore, [
                "notes",
                "recentNotePaths",
            ]),

            orderedItems() {
                const sortKeys = Object.fromEntries(this.recentNotePaths.map((item, idx) => [item, idx]))
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
                if (this.filter === "") {
                    return this.orderedItems
                } else {
                    const searchResults = fuzzysort.go(this.filter, this.items, {
                        keys: ["name", "folder"],
                    })
                    return searchResults.map((result) => {
                        const obj = {...result.obj}
                        const nameHighlight = result[0].highlight("<b>", "</b>")
                        const folderHighlight = result[1].highlight("<b>", "</b>")
                        obj.name = nameHighlight !== "" ? nameHighlight : obj.name
                        obj.folder = folderHighlight !== "" ? folderHighlight : obj.folder
                        return obj
                    })
                }
            },
        },

        methods: {
            ...mapActions(useNotesStore, [
                "updateNotes",
            ]),

            onKeydown(event) {
                if (event.key === "ArrowDown") {
                    if (this.selected === this.filteredItems.length - 1) {
                        this.selected = 0
                    } else {
                        this.selected = Math.min(this.selected + 1, this.filteredItems.length - 1)
                    }
                    event.preventDefault()
                    if (this.selected === this.filteredItems.length - 1) {
                        this.$refs.container.scrollIntoView({block: "end"})
                    } else {
                        this.$refs.item[this.selected].scrollIntoView({block: "nearest"})
                    }
                    
                } else if (event.key === "ArrowUp") {
                    if (this.selected === 0) {
                        this.selected = this.filteredItems.length - 1
                    } else {
                        this.selected = Math.max(this.selected - 1, 0)
                    }
                    event.preventDefault()
                    if (this.selected === 0) {
                        this.$refs.container.scrollIntoView({block: "start"})
                    } else {
                        this.$refs.item[this.selected].scrollIntoView({block: "nearest"})
                    }
                } else if (event.key === "Enter") {
                    this.selectItem(this.filteredItems[this.selected].path)
                    event.preventDefault()
                } else if (event.key === "Escape") {
                    this.$emit("close")
                    event.preventDefault()
                }
            },

            selectItem(path) {
                this.$emit("openNote", path)
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
                    "selected": idx === this.selected,
                    "scratch": item.scratch,
                }
            }
        }
    }
</script>

<template>
    <div class="scroller">
        <form class="note-selector" tabindex="-1" @focusout="onFocusOut" ref="container">
            <input 
                type="text" 
                ref="input"
                @keydown="onKeydown"
                @input="onInput"
                v-model="filter"
            />
            <ul class="items">
                <li
                    v-for="item, idx in filteredItems"
                    :key="item.path"
                    :class="getItemClass(item, idx)"
                    @click="selectItem(item.path)"
                    ref="item"
                >
                    <span class="name" v-html="item.name" />
                    <span class="path" v-html="item.folder" />
                </li>
            </ul>
        </form>
    </div>
</template>

<style scoped lang="sass">
    .scroller
        //overflow: auto
        //position: fixed
        //top: 0
        //left: 0
        //bottom: 0
        //right: 0
    .note-selector
        font-size: 13px
        padding: 10px
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

        input
            background: #fff
            padding: 4px 5px
            border: 1px solid #ccc
            box-sizing: border-box
            border-radius: 2px
            width: 100%
            margin-bottom: 10px
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
        
        .items
            overflow-y: auto
            > li
                border-radius: 3px
                padding: 5px 12px
                cursor: pointer
                display: flex
                align-items: center
                &:hover
                    background: #e2e2e2
                &.selected
                    background: #48b57e
                    color: #fff
                &.scratch
                    font-weight: 600
                +dark-mode
                    color: rgba(255,255,255, 0.53)
                    &:hover
                        background: #29292a
                    &.selected
                        background: #1b6540
                        color: rgba(255,255,255, 0.87)
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
</style>
