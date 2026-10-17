<script>
    import { mapState, mapStores, mapWritableState } from "pinia"

    import { TITLE_BAR_BG_LIGHT, TITLE_BAR_BG_DARK, TITLE_BAR_BG_LIGHT_BLURRED, TITLE_BAR_BG_DARK_BLURRED } from "@/src/common/constants"
    import { useHeynoteStore } from "@/src/stores/heynote-store"
    import { useSettingsStore } from "@/src/stores/settings-store"

    import MainMenuButton from "./tabs/MainMenuButton.vue"
    import BufferTree from "./buffer-tree/BufferTree.vue"
    import LibrarySearch from "./library-search/LibrarySearch.vue"


    export default {
        components: {
            MainMenuButton,
            BufferTree,
            LibrarySearch,
        },

        data() {
            return {
                isResizing: false,
                resizeStartX: 0,
                resizeStartWidth: 0,
            }
        },

        mounted() {
            this.$refs.resizer.addEventListener("mousedown", this.onResizerMouseDown)
        },

        beforeUnmount() {
            this.$refs.resizer?.removeEventListener("mousedown", this.onResizerMouseDown)
            window.removeEventListener("mousemove", this.onWindowMouseMove)
            window.removeEventListener("mouseup", this.onWindowMouseUp)
        },

        computed: {
            ...mapState(useHeynoteStore, [
                "isFocused",
            ]),
            ...mapWritableState(useHeynoteStore, [
                "currentLeftPanel",
            ]),
            ...mapState(useSettingsStore, [
                "theme",
            ]),
            ...mapStores(useHeynoteStore, useSettingsStore),

            backgroundColor() {
                if (this.theme === "dark") {
                    return this.isFocused ? TITLE_BAR_BG_DARK : TITLE_BAR_BG_DARK_BLURRED
                } else {
                    return this.isFocused ? TITLE_BAR_BG_LIGHT : TITLE_BAR_BG_LIGHT_BLURRED
                }
            },

            style() {
                return {
                    backgroundColor: this.backgroundColor,
                }
            },

            resizerClass() {
                return {
                    resizer: true,
                    resizing: this.isResizing,
                }
            },
        },

        watch: {
            currentLeftPanel(newPanel, oldPanel) {
                if (oldPanel === "search" && newPanel !== "search") {
                    this.heynoteStore.hideLeftPanelOnLibrarySearchEscape = false
                }
            },
        },

        methods: {
            onResizerMouseDown(event) {
                if (event.button !== 0) {
                    return
                }
                event.preventDefault()
                this.isResizing = true
                this.resizeStartX = event.clientX
                this.resizeStartWidth = this.$el.getBoundingClientRect().width
                window.addEventListener("mousemove", this.onWindowMouseMove)
                window.addEventListener("mouseup", this.onWindowMouseUp)
            },

            onWindowMouseMove(event) {
                if (!this.isResizing) {
                    return
                }
                const delta = event.clientX - this.resizeStartX
                const width = this.resizeStartWidth + delta
                const minWidth = 120
                const maxWidth = Math.max(minWidth, Math.min(800, window.innerWidth - 200))
                const clampedWidth = Math.max(minWidth, Math.min(width, maxWidth))
                this.heynoteStore.leftPanelWidth = clampedWidth
            },

            onWindowMouseUp() {
                if (!this.isResizing) {
                    return
                }
                this.isResizing = false
                window.removeEventListener("mousemove", this.onWindowMouseMove)
                window.removeEventListener("mouseup", this.onWindowMouseUp)
                const width = Math.round(this.heynoteStore.leftPanelWidth)
                if (this.settingsStore.settings.leftPanelWidth !== width) {
                    this.settingsStore.updateSettings({
                        leftPanelWidth: width,
                    })
                }
            },
        },
    }
</script>

<template>
    <aside class="left-panel" :style="style">
        <div class="top-bar">
            <MainMenuButton />
        </div>
        <div class="left-panel-content">
            <BufferTree v-if="currentLeftPanel == 'buffer-tree'" />
            <LibrarySearch v-if="currentLeftPanel == 'search'" />
        </div>
        <div class="left-panel-tab-buttons">
            <button
                @click="() => currentLeftPanel='buffer-tree'"
                :class="{selected:currentLeftPanel=='buffer-tree'}"
            ><i class="icon buffers"></i>Buffers</button>
            <button
                @click="() => currentLeftPanel='search'"
                :class="{selected:currentLeftPanel=='search'}"
            ><i class="icon search"></i>Search</button>
        </div>
        <div
            :class="resizerClass"
            ref="resizer"
        ></div>
    </aside>
</template>

<style scoped lang="sass">
    .left-panel
        --resizer-color: #2482ce
        +dark-mode
            --resizer-color: #0060c7

        width: var(--left-panel-width)
        flex-shrink: 0
        height: 100%
        min-height: 0
        display: flex
        flex-direction: column
        position: relative

        .top-bar
            height: var(--tab-bar-height)
            flex-shrink: 0
            app-region: drag
            display: flex

        .left-panel-content
            flex-grow: 1
            min-height: 0
            //border-right: 1px solid var(--tab-bar-border-bottom-color)

        .left-panel-tab-buttons
            app-region: none
            padding: 0px
            display: flex
            align-items: center
            //justify-content: center
            width: 100%
            border-top: 1px solid var(--tab-bar-border-bottom-color)
            +dark-mode
                background: #282828
            button
                width: 50%
                background: none
                border: none
                //border-radius: 3px 3px 0 0
                padding: 5px 8px 6px 8px
                margin-right: 0px
                color: rgba(0,0,0, 0.6)
                cursor: pointer
                font-size: 12px
                position: relative
                top: -1px
                border-top: 1px solid transparent
                +dark-mode
                    color: rgba(255,255,255, 0.6)
                &:focus
                    outline: none
                &:focus-visible
                    box-shadow: inset 0 0 0 2px var(--ui-focus)
                    z-index: 1
                    +dark-mode
                        box-shadow: inset 0 0 0 2px var(--ui-accent)
                &:last-child  
                    margin-right: 0
                &:hover
                    background-color: rgba(0,0,0, 0.08)
                    +dark-mode
                        background-color: rgba(255,255,255, 0.08)
                &.selected
                    border-top: 1px solid rgba(0,0,0, 0.7)
                    +dark-mode
                        border-top: 1px solid rgba(255,255,255, 0.8)
                .icon
                    display: inline-block
                    width: 12px
                    height: 12px
                    background-size: 100%
                    background-repeat: no-repeat
                    margin-right: 5px
                    position: relative
                    top: 1px
                    &.buffers
                        background-image: url('@/assets/icons/files-light.svg')
                        +dark-mode
                            background-image: url('@/assets/icons/files-dark.svg')
                    &.search
                        background-image: url('@/assets/icons/search-light.svg')
                        width: 13px
                        height: 13px
                        top: 2px
                        +dark-mode
                            background-image: url('@/assets/icons/search-dark.svg')
        
        .resizer
            position: absolute
            top: 0
            right: 0
            bottom: 0
            width: 4px
            background-color: transparent
            transition: background-color 200ms ease
            cursor: col-resize
            &:hover
                background-color: var(--resizer-color)
                transition-delay: 300ms
            &.resizing
                background-color: var(--resizer-color)
</style>
