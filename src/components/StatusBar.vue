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
        <div class="status-block lang">
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
        background-color: #48b57e
        color: #fff
        font-family: "Open Sans"
        font-size: 12px
        padding-left: 7px
        padding-right: 7px
        display: flex
        flex-direction: row

        .spacer
            flex-grow: 1
        
        .status-block
            padding: 2px 5px
            cursor: default
            &.line-number
                color: rgba(255, 255, 255, 0.7)
                .num
                    color: rgba(255, 255, 255, 1.0)
            &.lang
                .auto
                    color: rgba(255, 255, 255, 0.7)

</style>
