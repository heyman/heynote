<script>
    export default {
        name: "InputToggle",
        props: {
            modelValue: Boolean,
            type: String,
        },
        emits: ["update:modelValue"],

        data() {
            return {};
        },

        computed: {
            className() {
                return {
                    "input-toggle": true,
                    active: this.modelValue,
                    "block": this.type === "block",
                    "case-sensitive": this.type === "case-sensitive",
                    "whole-words": this.type === "whole-words",
                    "regex": this.type === "regex",
                }
            },

            title() {
                switch (this.type) {
                    case "block":
                        return "Within Current Block";
                    case "case-sensitive":
                        return "Case Sensitive";
                    case "whole-words":
                        return "Match Whole Words";
                    case "regex":
                        return "Use Regular Expression";
                    default:
                        return "";
                }
            },
        },

        methods: {
            toggle() {
                if (!this.disabled) {
                    this.$emit("update:modelValue", !this.modelValue);
                }
            },
        },
    }
</script>

<template>
    <button
        :class="className"
        :title="title"
        @click="toggle"
    >
        <slot></slot>
    </button>
</template>

<style lang="sass" scoped>
    .input-toggle
        width: 22px
        height: 22px
        margin-right: 2px
        border: none
        border-radius: 2px
        cursor: pointer
        background-color: transparent
        background-size: 14px
        background-repeat: no-repeat
        background-position: center center

        &:hover
            background-color: rgba(0,0,0, 0.1)
            +dark-mode
                background-color: rgba(255,255,255, 0.15)
        
        &.active
            background-color: #DFF1E9
            border: 1px solid #48b57e
            +dark-mode
                background-color: #395f4f
        
        &:focus-visible
            border: 2px solid #48b57e
            outline: none
        
        &.block
            background-image: url('@/assets/icons/search-icons/block.svg')
            +dark-mode
                background-image: url('@/assets/icons/search-icons/block-dark.svg')
        &.case-sensitive
            background-image: url('@/assets/icons/search-icons/case-sensitive.svg')
            +dark-mode
                background-image: url('@/assets/icons/search-icons/case-sensitive-dark.svg')
        &.whole-words
            background-image: url('@/assets/icons/search-icons/whole-words.svg')
            +dark-mode
                background-image: url('@/assets/icons/search-icons/whole-words-dark.svg')
        &.regex
            background-image: url('@/assets/icons/search-icons/regex.svg')
            +dark-mode
                background-image: url('@/assets/icons/search-icons/regex-dark.svg')
</style>
