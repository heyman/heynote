<script>
    import { mapStores, mapState } from 'pinia'

    import { useHeynoteStore } from "@/src/stores/heynote-store"
    import BufferColorPicker from './BufferColorPicker.vue'

    export default {
        name: 'TabItem',
        components: { BufferColorPicker },
        props: [
            "title",
            "active",
            "path",
            "color",
        ],
        data() {
            return {
                textWidth: 0,
            }
        },
        mounted: function() {
            this.measureTextWidth()
        },
        watch: {
            title() {
                this.measureTextWidth()
            },

            active: {
                handler(isActive) {
                    if (isActive) {
                        this.$nextTick(() => {
                            this.$el.scrollIntoView({
                                inline: "nearest",
                                block: "nearest",
                            })
                        })
                    }
                },
                immediate: true,
            },
        },
        computed: {
            ...mapStores(useHeynoteStore),

            className() {
                return [
                    "tab-item",
                    ...(this.active ? ["active"] : []),
                    ...[this.textWidth > 120 ? "long" : "short"],
                ]
            },
        },
        methods: {
            measureTextWidth() {
                // measure the width of the tab which we use to give it either the "short" or "long" class
                const temp = document.createElement('span')
                temp.style.visibility = 'hidden'
                temp.style.position = 'absolute'
                temp.style.whiteSpace = 'nowrap'
                temp.style.padding = window.getComputedStyle(this.$el).padding
                temp.style.font = window.getComputedStyle(this.$el).font
                temp.textContent = this.$el.textContent
                document.body.appendChild(temp)
                this.textWidth = temp.offsetWidth + 23 // color button and gap
                document.body.removeChild(temp)
                //console.log("textWidth:", this.textWidth)
            },

            onClose() {
                this.heynoteStore.closeTab(this.path)
            },

            onContextMenu(event) {
                event.preventDefault()
                window.heynote.mainProcess.invoke('showTabContextMenu', this.path)
            },
        },
    }
</script>

<template>
    <li :class="className" :title="title" @contextmenu="onContextMenu">
        <span class="tab-label">
            <BufferColorPicker :path="path" :title="title" :color="color" />
            <span class="title">{{ title }}</span>
        </span>
        <button
            @click.stop="onClose"
            @mousedown.prevent
            class="close"
            tabindex="-1"
        ></button>
    </li>
</template>

<style lang="sass" scoped>
    li
        //app-region: none
        display: flex
        align-items: center
        box-sizing: border-box
        position: relative
        height: 25px
        margin-top: 0px
        margin-right: 3px
        padding: 0 22px 0 6px
        cursor: pointer
        border-radius: 5px 5px 0 0
        user-select: none
        color: rgba(0,0,0, 0.5)
        overflow: hidden
        flex-grow: 0
        flex-shrink: 1
        flex-basis: auto
        min-width: 84px
        text-align: left
        transition: background-color 250ms
        //font-weight: 600
        +dark-mode
            color: rgba(255, 255, 255, 0.3)
            height: 24px
            margin-top: 1px
        &.short
            width: 120px
        &.long
            width: max-content
            max-width: 300px
        &.active
            background: var(--tab-active-bg)
            color: rgba(0,0,0, 0.9)
            border: 1px solid #dbdbdb
            border-bottom: none
            padding: 0 21px 0 5px
            box-shadow: var(--tab-bar-inset-shadow)
            transition: none
            .blurred &
                background: var(--tab-active-bg-blurred)
            +dark-mode
                color: rgba(255, 255, 255, 0.8)
                border: none
                padding: 0 22px 0 6px
                //border-bottom: 1px solid #191d25
                //border-color: transparent
            .close
                right: 1px
                top: 3px
        &:hover
            background: #c5c5c5
            color: rgba(0,0,0, 0.9)
            transition: none
            //padding: 5px 16px 0px 16px
            //border-color: var(--tab-bar-border-bottom-color)
            box-shadow: var(--tab-bar-inset-shadow)
            +dark-mode
                background-color: #3a3a3a
                //border-bottom: 1px solid #191d25
                color: rgba(255, 255, 255, 0.9)
            &.active
                background: var(--tab-active-bg)
                +dark-mode
                    background: var(--tab-active-bg)
            .close
                display: block
        
        .tab-label
            display: flex
            align-items: center
            gap: 3px
            min-width: 0
            max-width: 100%
            height: 20px
        .title
            display: block
            min-width: 0
            white-space: nowrap
            max-width: 100%
            height: 16px
            line-height: 16px
            text-overflow: ellipsis
            overflow: hidden
        .close
            display: none
            position: absolute
            right: 2px
            top: 4px
            width: 17px
            height: 17px
            background: none
            border: none
            padding: 0
            background-image: url(@/assets/icons/close.svg)
            background-repeat: no-repeat
            background-size: 14px
            background-position: center center
            border-radius: 3px
            cursor: pointer
            &:hover
                background-color: rgba(0, 0, 0, 0.2)
                +dark-mode
                    background-color: rgba(0, 0, 0, 0.3)
            +dark-mode
                top: 3px
                right: 1px
</style>
