<script>
    import sanitizeFilename from "./sanitize-filename.js"

    export default {
        props: {
            parentPath: String,
            level: Number,
        },

        data() {
            return {
                name: "",
                eventTriggered: false,
            }
        },

        mounted() {
            this.$refs.input.focus()
        },

        computed: {
            className() {
                return {
                    folder: true,
                    selected: true
                }
            },
            
            style() {
                return {
                    "--indent-level": this.level,
                }
            }
        },

        methods: {
            onKeyDown(event) {
                if (event.key === "Enter") {
                    event.preventDefault()
                    event.stopPropagation()
                    this.finish()
                } else if (event.key === "Escape") {
                    event.preventDefault()
                    event.stopPropagation()
                    this.name = ""
                    this.finish()
                }
            },

            finish() {
                if (this.eventTriggered) {
                    return
                }
                this.eventTriggered = true
                if (this.name === "") {
                    this.$emit("cancel")
                } else {
                    this.$emit("create-folder", this.parentPath, sanitizeFilename(this.name, "_"))
                }
            },
        },
    }
</script>

<template>
    <div
        :class="className"
        :style="style"
    >
        <input 
            type="text" 
            v-model="name"
            ref="input"
            placeholder="New folder name"
            maxlength="60"
            @keydown.stop="onKeyDown"
            @blur="finish"
        />
    </div>
</template>

<style lang="sass" scoped>
    .folder
        padding: 3px 6px
        font-size: 13px
        padding-left: calc(0px + var(--indent-level) * 16px)
        display: flex
        background: #f1f1f1
        +dark-mode
            background-color: #39393a
                

        input
            width: 100%
            background: #fff
            border: none
            border-radius: 2px
            font-size: 13px
            height: 16px
            padding: 2px 4px
            font-style: italic
            border: 2px solid #48b57e
            &:focus
                outline: none
            &::placeholder
                font-size: 12px
            +dark-mode
                background: #3b3b3b

</style>
