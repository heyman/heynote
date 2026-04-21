<script>
    import { mapStores, mapState, mapWritableState } from 'pinia'
    import draggable from 'vuedraggable'

    import { TITLE_BAR_BG_LIGHT, TITLE_BAR_BG_DARK, TITLE_BAR_BG_LIGHT_BLURRED, TITLE_BAR_BG_DARK_BLURRED } from "@/src/common/constants"
    import { useEditorCacheStore } from "@/src/stores/editor-cache"
    import { useHeynoteStore } from "@/src/stores/heynote-store"
    import { useSettingsStore } from "@/src/stores/settings-store"

    import TabItem from './TabItem.vue'
    import MainMenuButton from './MainMenuButton.vue'

    export default {
        components: {
            TabItem,
            MainMenuButton,
            draggable,
        },

        data() {
            return {
                isMac: window.heynote.platform.isMac,
            }
        },

        computed: {
            ...mapState(useHeynoteStore, [
                "isFocused",
                "currentBufferName",
                "showLeftPanel",
            ]),
            ...mapState(useSettingsStore, [
                "theme",
                "settings",
            ]),
            ...mapWritableState(useHeynoteStore, ["openTabs"]),
            ...mapStores(useEditorCacheStore, useHeynoteStore),

            tabs() {
                return this.openTabs.map((path) => {
                    //console.log("tab:", path)
                    return {
                        path: path,
                        title: this.heynoteStore.getBufferTitle(path),
                        active: path === this.heynoteStore.currentBufferPath,
                    }
                })
            },

            className() {
                return {
                    "tab-bar": true,
                    "blurred": !this.isFocused,
                    "show-tabs": this.showTabs,
                }
            },

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

            showTabs() {
                return this.settings.showTabs
            },
        },

        methods: {
            openBufferSelector() {
                this.heynoteStore.openBufferSelector()
            },

            dragEnd(event) {
                //console.log("drag end:", event)
                this.heynoteStore.focusEditor()
                this.openTabs.splice(event.newIndex, 0, this.openTabs.splice(event.oldIndex, 1)[0])
                this.heynoteStore.saveTabsState()
            },
        },
    }
</script>

<template>
    <nav :class="className" :style="style">
        <MainMenuButton v-if="!showLeftPanel" />
        <template v-if="showTabs">
            <div class="scroller" tabindex="-1">
                <draggable 
                    :list="tabs" 
                    tag="ol"
                    group="tabs" 
                    ghost-class="ghost"
                    @end="dragEnd" 
                    item-key="path"
                >
                    <template #item="{element, index}">
                        <TabItem
                            :path="element.path"
                            :title="element.title"
                            :active="element.active"
                            @click.prevent="heynoteStore.openBuffer(element.path)"
                            @mouseup="heynoteStore.focusEditor"
                        />
                    </template>
                    <template #footer>
                        <li class="spacer" v-if="tabs.length > 0"></li>
                    </template>
                </draggable>
            </div>
            <div class="button-container">
                <button 
                    @click="openBufferSelector"
                    class="add-tab"
                    tabindex="-1"
                ></button>
            </div>
        </template>
        <div 
            v-else
            class="title"
        >
            {{ currentBufferName ?? "Heynote" }}
        </div>
    </nav>
</template>

<style lang="sass" scoped>
    .tab-bar
        app-region: drag
        display: flex
        height: var(--tab-bar-height)
        padding: 0
        border-bottom: 1px solid var(--tab-bar-border-bottom-color)
        
        +platform-windows-linux
            padding-right: 140px
        +platform-windows-linux-fullscreen
            padding-right: 0
        
        &.show-tabs
            //box-shadow: var(--tab-bar-inset-shadow)
            position: relative
            &:after
                content: "\0020"
                display: block
                position: absolute
                bottom: -1px
                width: 100%
                height: 1px /* when 0 no shadow is displayed*/
                box-shadow: rgba(0,0,0, 0.15) 0 0 5px 0
                +dark-mode
                    box-shadow: rgba(0,0,0, 0.5) 0 0 5px 0
                //box-shadow: #fff 0 0 5px 0

        .scroller
            margin-top: 5px
            //flex-grow: 1
            //width: 100%
            overflow-x: auto
            scrollbar-width: none
            app-region: none
            +dark-mode
                // needed to make the tabs visually aligned with the editor, since the editor's border-left
                // (when the left panel is enabled) is much more discreet in dark mode, and looks more like
                // it's part of the background
                margin-left: 1px
            ol
                display: flex
                list-style: none
                margin: 0
                padding: 0
                > li.spacer
                    flex-shrink: 0
                    width: 7px
        .button-container
            app-region: drag
            border-left: 1px solid #e6e6e6
            padding-top: 4px
            padding-left: 8px
            padding-right: 8px
            display: flex
            align-items: center
            +dark-mode
                border-left: 1px solid #242424
            .add-tab
                app-region: none
                width: 20px
                height: 20px
                border: none
                background: none
                border-radius: 3px
                cursor: pointer
                transition: background-color 250ms
                background-image: url("@/assets/icons/plus-light.svg")
                background-repeat: no-repeat
                background-position: center
                background-size: 14px
                +dark-mode
                    background-image: url("@/assets/icons/plus-dark.svg")
                &:hover
                    transition: none
                    background-color: #ccc
                    +dark-mode
                        background-color: #3a3a3a
        
        .title
            pointer-events: none
            text-align: center
            position: absolute
            left: 0
            top: 0
            right: 0
            height: var(--tab-bar-height)
            line-height: var(--tab-bar-height)
            padding: 0 80px
            overflow: hidden
            text-overflow: ellipsis
            white-space: nowrap
            font-family: var(--system-font)
            font-size: 13px
            font-weight: bold
            color: #444
            +dark-mode
                color: #aaa
            +platform-windows-linux
                padding: 0 140px

        &.blurred .title
            color: #888
            +dark-mode
                color: #666

</style>
