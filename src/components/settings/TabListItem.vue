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
        user-select: none
        cursor: pointer
        &:hover
            background: #f1f1f1
            +dark-mode
                background: #292929
        &.active
            background: #48b57e
            color: #fff
            cursor: default
            +dark-mode
                background: #1b6540
                
</style>