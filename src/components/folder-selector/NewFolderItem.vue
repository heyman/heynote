<script>
    import { sanitizeFilename } from "@/src/common/sanitize-filename.js"

    export default {
        props: {
            parentPath: String,
            level: Number,
            initialName: {
                type: String,
                default: "",
            },
            autoFocus: {
                type: Boolean,
                default: true,
            },
            showIndentGuides: {
                type: Boolean,
                default: false,
            },
        },

        data() {
            return {
                name: this.initialName,
                eventTriggered: false,
                nameError: false,
            }
        },

        mounted() {
            this.emitSuggestedPath()
            if (this.autoFocus) {
                this.$refs.input.focus()
                this.$refs.input.select()
            }
        },

        computed: {
            className() {
                return {
                    folder: true,
                    selected: true,
                    "show-indent-guides": this.showIndentGuides,
                }
            },
            
            style() {
                return {
                    "--indent-level": this.level,
                }
            },

            indentGuides() {
                return Array.from({ length: Math.max(0, this.level) }, (_, index) => index)
            },
        },

        methods: {
            emitSuggestedPath() {
                const sanitizedName = sanitizeFilename(this.name, "_")
                const suggestedPath = sanitizedName && !sanitizedName.startsWith(".")
                    ? (this.parentPath ? this.parentPath + window.heynote.buffer.pathSeparator + sanitizedName : sanitizedName)
                    : this.parentPath
                this.$emit("update-suggested-path", suggestedPath)
            },

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
                if (this.name === "") {
                    this.eventTriggered = true
                    this.$emit("cancel")
                } else {
                    const sanitizedName = sanitizeFilename(this.name, "_")
                    if (!sanitizedName || sanitizedName.startsWith(".")) {
                        this.nameError = true
                        this.$nextTick(() => this.$refs.input?.focus())
                        return
                    }
                    this.eventTriggered = true
                    this.$emit("create-folder", this.parentPath, sanitizedName)
                }
            },

            onInput() {
                this.nameError = false
                this.emitSuggestedPath()
            },
        },
    }
</script>

<template>
    <div
        :class="className"
        :style="style"
    >
        <template v-if="showIndentGuides">
            <span
                v-for="guideLevel in indentGuides"
                :key="guideLevel"
                class="indent-guide"
                :style="{ '--guide-level': guideLevel }"
            ></span>
        </template>
        <input 
            type="text" 
            v-model="name"
            :class="{ error: nameError }"
            ref="input"
            placeholder="New folder name"
            maxlength="60"
            @keydown.stop="onKeyDown"
            @input="onInput"
            @blur="finish"
        />
    </div>
</template>

<style lang="sass" scoped>
    .folder
        padding: 3px 6px
        font-size: 13px
        padding-left: calc(13px + var(--indent-level) * 20px)
        display: flex
        position: relative

        &.show-indent-guides
            .indent-guide
                position: absolute
                top: 0
                bottom: 0
                left: calc(14px + var(--guide-level) * 20px)
                width: 1px
                opacity: 0
                pointer-events: none
                background: rgba(0,0,0, 0.14)
                transition: opacity 80ms ease
                +dark-mode
                    background: rgba(255,255,255, 0.18)

        input
            width: 100%
            background: #fff
            border: none
            border-radius: 2px
            font-size: 13px
            height: 22px
            padding: 2px 4px
            font-style: italic
            border: 2px solid var(--ui-accent)
            &.error
                border-color: #b64b4b
            &:focus
                outline: none
            &::placeholder
                font-size: 12px
            +dark-mode
                background: #3b3b3b

    :global(.left-panel:hover) .folder.show-indent-guides .indent-guide,
    :global(.buffer-tree:hover) .folder.show-indent-guides .indent-guide
        opacity: 1

</style>
