<script>
    export default {
        props: ["tab", "activeTab"],

        computed: {
            className() {
                return "tab-content tab-" + this.tab + " " + (this.tab === this.activeTab ? "active" : "")
            }
        }
    }
</script>

<template>
    <div :class="className">
        <slot></slot>
    </div>
</template>

<style scoped lang="sass">
    .tab-content
        display: none
        &.active
            display: block
</style>
