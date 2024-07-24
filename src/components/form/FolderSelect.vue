<script>
    export default {
        props: {
            tree: Array,
        },

        methods: {
            onKeyDown(event) {
                console.log("Keydown", event.key)
                if (event.key === "Enter") {
                    event.preventDefault()
                    this.$emit("click")
                }
            },
        }
    }
</script>

<template>
    <button
        class="folder-select-container"
        @keydown="onKeyDown"
        @click.stop.prevent="()=>{}"
    >
        <div class="folder root selected">
            Heynote Root
        </div>
        <div class="folder indent">New Folder&hellip;</div>
    </button>
</template>

<style lang="sass" scoped>
    .folder-select-container
        width: 100%
        background: #fff
        border: 1px solid #ccc
        border-radius: 2px
        padding: 5px 5px
        text-align: left
        &:focus
            outline: none
            border: 1px solid #fff
            outline: 2px solid #48b57e

        .folder
            padding: 3px 6px
            font-size: 13px
            &.selected
                background: #48b57e
                color: #fff
            &.indent
                padding-left: 16px
</style>
