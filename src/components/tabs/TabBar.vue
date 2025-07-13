<script>
    import { mapStores, mapState } from 'pinia'

    import { useEditorCacheStore } from "@/src/stores/editor-cache"
    import { useHeynoteStore } from "@/src/stores/heynote-store"

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
            ...mapStores(useEditorCacheStore, useHeynoteStore),
            ...mapState(useHeynoteStore, [
                "isFullscreen",
            ]),

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
                    "fullscreen": this.isFullscreen,
                    "mac": this.isMac,
                }
            },
        },
    }
</script>

<template>
    <nav :class="className">
        <div class="scroller">
            <ol>
                <!--<TabItem
                    title="Scratch"
                    :active="true"
                />
                <TabItem
                    title="Climbing"
                />-->
                <TabItem
                    v-for="tab in tabs"
                    :key="tab.path"
                    :path="tab.path"
                    :title="tab.title"
                    :active="tab.active"
                    @click="heynoteStore.openBuffer(tab.path)"
                />
            </ol>
        </div>
        <div class="button-container">
            <button 
                @click="heynoteStore.openBufferSelector"
                class="add-tab"
            ></button>
        </div>
    </nav>
</template>

<style lang="sass" scoped>
    .tab-bar
        app-region: drag
        display: flex
        //align-items: center
        height: var(--tab-bar-height)
        padding: 0
        padding-left: 38px
        background-color: #e1e2e2
        border-bottom: 1px solid var(--tab-bar-border-bottom-color)
        box-shadow: var(--tab-bar-inset-shadow)
        +dark-mode
            background-color: #1b1c1d
        &.mac
            padding-left: 90px
            &.fullscreen
                padding-left: 38px
        .scroller
            margin-top: 5px
            //flex-grow: 1
            //app-region: none
            //width: 100%
            overflow-x: auto
            scrollbar-width: none
            ol
                app-region: none
                display: flex
                list-style: none
                margin: 0
                padding: 0
        .button-container
            app-region: drag
            border-left: 1px solid #dbdbdb
            padding-top: 4px
            padding-left: 8px
            padding-right: 8px
            display: flex
            align-items: center
            +dark-mode
                border-left: 1px solid #282828
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

</style>
