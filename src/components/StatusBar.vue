<script>
    const LANGUAGE_NAMES = {
        "text": "Plain Text",
        "javascript": "JavaScript",
        "json": "JSON",
        "python": "Python",
        "html": "HTML",
        "sql": "SQL",
        "markdown": "Markdown",
        "java": "Java",
        "lezer": "Lezer",
        "php": "PHP",
    }

    export default {
        props: [
            "line", 
            "column", 
            "language", 
            "languageAuto",
            "theme",
        ],

        mounted() {
            
        },

        computed: {
            languageName() {
                return LANGUAGE_NAMES[this.language] || this.language
            },

            className() {
                return `status ${this.theme}`
            },
        },
    }
</script>

<template>
    <div :class="className">
        <div class="status-block line-number">
            Ln <span class="num">{{ line }}</span>
            Col <span class="num">{{ column }}</span>
        </div>
        <div class="spacer"></div>
        <div class="status-block theme clickable" @click="$emit('toggleTheme')">{{ theme }}</div>
        <div class="status-block lang clickable">
            {{ languageName }} 
            <span v-if="languageAuto" class="auto">(auto)</span>
        </div>
    </div>
</template>

<style scoped lang="sass">
    .status
        box-sizing: border-box
        height: 22px
        width: 100%
        background: #48b57e
        color: #fff
        font-family: "Open Sans"
        font-size: 12px
        padding-left: 0px
        padding-right: 0px
        display: flex
        flex-direction: row
        user-select: none

        &.dark
            background: #0e1217
            color: rgba(255, 255, 255, 0.75)
            .status-block.line-number 
                color: rgba(255, 255, 255, 0.55)
                .num
                    color: rgba(255, 255, 255, 0.75)
            .status-block.lang .auto
                color: rgba(255, 255, 255, 0.55)

        .spacer
            flex-grow: 1
        
        .status-block
            padding: 2px 12px
            cursor: default
            &.clickable
                cursor: pointer
                &:hover
                    background: rgba(255,255,255, 0.1)
            &.line-number
                color: rgba(255, 255, 255, 0.7)
                .num
                    color: rgba(255, 255, 255, 1.0)
            &.lang
                .auto
                    color: rgba(255, 255, 255, 0.7)

</style>
