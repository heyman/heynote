<script>
    import { mapState, mapActions } from 'pinia'
    import { useErrorStore } from "../stores/error-store"

    export default {
        computed: {
            ...mapState(useErrorStore, ["errors"]),
        },

        methods: {
            ...mapActions(useErrorStore, ["popError"]),

            pluralize(count, singular, plural) {
                return count === 1 ? singular : plural
            },
        },
    }
</script>


<template>
    <div 
        class="error-messages"
        v-if="errors && errors.length > 0"
    >
        <div class="dialog">
            <div class="dialog-content">
                <h1>Error</h1>
                <p>
                    {{ errors[0] }}
                </p>
            </div>
            <div class="bottom-bar">
                <div style="flex-grow:1;">
                    <div
                        v-if="errors.length > 1"
                        class="count"
                    >
                        {{ errors.length-1 }} more {{ pluralize(errors.length-1, "error", "errors") }}
                    </div>
                </div>
                <button 
                    @click="popError"
                    class="close"
                >Close</button>
            </div>
        </div>
        <div class="shader"></div>
    </div>
</template>


<style lang="sass" scoped>
    .error-messages
        position: fixed
        top: 0
        left: 0
        bottom: 0
        right: 0

        .shader
            z-index: 1
            position: absolute
            top: 0
            left: 0
            bottom: 0
            right: 0
            background: rgba(0, 0, 0, 0.5)
        
        .dialog
            box-sizing: border-box
            z-index: 2
            position: absolute
            left: 50%
            top: 50%
            transform: translate(-50%, -50%)
            width: 440px
            height: 200px
            max-width: 100%
            max-height: 100%
            display: flex
            flex-direction: column
            border-radius: 5px
            background: #fff
            color: #333
            box-shadow: 0 0 25px rgba(0, 0, 0, 0.2)
            overflow-y: auto
            &:active, &:selected, &:focus, &:focus-visible
                border: none
                outline: none
            +dark-mode
                background: #333
                color: #eee
                box-shadow: 0 0 25px rgba(0, 0, 0, 0.3)
            .dialog-content
                flex-grow: 1
                padding: 30px
                h1
                    font-size: 14px
                    font-weight: 700
                    display: block
                    margin-bottom: 1em
            
            .bottom-bar
                border-radius: 0 0 5px 5px
                background: #eee
                padding: 10px 20px
                display: flex
                align-items: center
                +dark-mode
                    background: #222
                .close
                    height: 28px
</style>
