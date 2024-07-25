<script>
    export default {
        props: {
            name: String,
            level: Number,
            selected: Boolean,
            newFolder: Boolean,
        },

        watch: {
            selected() {
                if (this.selected) {
                    // scrollIntoViewIfNeeded is not supported in all browsers
                    // See: https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoViewIfNeeded
                    if (this.$el.scrollIntoViewIfNeeded) {
                        this.$el.scrollIntoViewIfNeeded({
                            behavior: "auto",
                            block: "nearest",
                        })
                    } else {
                        this.$el.scrollIntoView({
                            behavior: "auto",
                            block: "nearest",
                        })
                    }
                }
            }
        },

        computed: {
            className() {
                return {
                    folder: true,
                    selected: this.selected,
                    new: this.newFolder,
                }
            },
            
            style() {
                return {
                    "--indent-level": this.level,
                }
            }
        },
    }
</script>

<template>
    <div
        :class="className"
        :style="style"
    >
        <span class="name">{{ name }}</span>
        <button class="new-folder" tabindex="-1" @click="$emit('new-folder')">New folder (+)</button>
    </div>
</template>

<style lang="sass" scoped>
    .folder
        padding: 3px 6px
        font-size: 13px
        padding-left: calc(6px + var(--indent-level) * 16px)
        display: flex
        scroll-margin-top: 5px
        scroll-margin-bottom: 5px
        &:hover
            background: #f1f1f1
        &.selected
            background: #48b57e
            color: #fff
            &:hover
                background: #40a773
            .new-folder
                display: block
                color: rgba(255,255,255, 0.9)
        &.new
            font-style: italic
            color: rgba(0,0,0, 0.5)
            &.selected
                color: rgba(255,255,255, 0.8)


        .name
            flex-grow: 1
            overflow: hidden
            text-overflow: ellipsis
            white-space: nowrap
        .new-folder
            background: rgba(0,0,0, 0.15)
            border: none
            border-radius: 2px
            font-size: 10px
            display: none
            flex-shrink: 0
            cursor: pointer
</style>
