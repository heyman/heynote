<script>
    import { mapStores, mapState } from 'pinia'

    import { TITLE_BAR_BG_LIGHT, TITLE_BAR_BG_DARK, TITLE_BAR_BG_LIGHT_BLURRED, TITLE_BAR_BG_DARK_BLURRED } from "@/src/common/constants"
    import { useEditorCacheStore } from "@/src/stores/editor-cache"
    import { useHeynoteStore } from "@/src/stores/heynote-store"
    import { useSettingsStore } from "@/src/stores/settings-store"

    import TabItem from './TabItem.vue'

    export default {
        components: {
            TabItem,
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
            ]),
            ...mapState(useSettingsStore, [
                "theme",
                "settings",
            ]),
            ...mapStores(useEditorCacheStore, useHeynoteStore),

            tabs() {
                return this.heynoteStore.openTabs.map((path) => {
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
            onMainMenuClick(event) {
                const x = event.target.offsetLeft
                const y = event.target.offsetTop + event.target.offsetHeight
                window.heynote.mainProcess.invoke("showMainMenu", x, y)
            },

            openBufferSelector() {
                this.heynoteStore.openBufferSelector()
            },
        },
    }
</script>

<template>
    <nav :class="className" :style="style">
        <div class="main-menu-container">
            <button class="main-menu"
                @click="onMainMenuClick"
            ></button>
        </div>
        <template v-if="showTabs">
            <div class="scroller">
                <ol>
                    <TabItem
                        v-for="tab in tabs"
                        :key="tab.path"
                        :path="tab.path"
                        :title="tab.title"
                        :active="tab.active"
                        @click.prevent="heynoteStore.openBuffer(tab.path)"
                        @mousedown.prevent
                    />
                    <li class="spacer"></li>
                </ol>
            </div>
            <div class="button-container">
                <button 
                    @click="openBufferSelector"
                    class="add-tab"
                ></button>
            </div>
        </template>
        <div 
            v-else
            class="title"
        >
            {{ currentBufferName }}
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
            box-shadow: var(--tab-bar-inset-shadow)
        
        .main-menu-container
            width: 37px
            flex-shrink: 0
            text-align: center
            button
                app-region: none
                border: none
                padding: 0
                margin: 0
                width: 18px
                height: 20px
                margin-top: 6px
                background: none
                background-image: url("@/assets/icons/vertical-dots-light.svg")
                background-repeat: no-repeat
                background-position: center
                background-size: 14px
                border-radius: 3px
                +dark-mode
                    background-image: url("@/assets/icons/vertical-dots-dark.svg")
                &:hover
                    background-color: #ccc
                    +dark-mode
                        background-color: #3a3a3a
            +platform-mac
                width: 80px
                button
                    display: none
            +platform-mac-fullscreen
                width: 16px
            +platform-webapp
                button
                    display: none

        .scroller
            margin-top: 5px
            //flex-grow: 1
            //width: 100%
            overflow-x: auto
            scrollbar-width: none
            app-region: none
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
