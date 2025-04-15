<script>
    export default {
        props: ["tab", "activeTab", "name"],

        computed: {
            tabClass() {
                return "tab-" + this.tab + " " + (this.tab === this.activeTab ? "active" : "")
            }
        }
    }
</script>

<template>
    <li :class="tabClass">{{ name }}</li>
</template>

<style scoped lang="sass">
    li
        padding: 9px 20px
        font-size: 13px
        line-height: 1.3
        user-select: none
        cursor: pointer
        &:hover
            background: #f1f1f1
            +dark-mode
                background: #292929
        &.active
            background: var(--highlight-color)
            color: #fff
            cursor: default
            +dark-mode
                // needed for specificity (to not be overridden by :hover in dark mode)
                background: var(--highlight-color)
                
</style>