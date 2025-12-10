<script>
    import { mapState } from 'pinia'
    import UpdateStatusItem from './UpdateStatusItem.vue'
    import { LANGUAGES } from '../editor/languages.js'
    import { useHeynoteStore } from "../stores/heynote-store"
    import { useSettingsStore } from "../stores/settings-store"
    
    const LANGUAGE_MAP = Object.fromEntries(LANGUAGES.map(l => [l.token, l]))
    const LANGUAGE_NAMES = Object.fromEntries(LANGUAGES.map(l => [l.token, l.name]))


    function formatDate(date) {
        const now = new Date();

        // normalize to local midnight for date-only comparison
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfGiven = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const diffDays = Math.floor((startOfToday - startOfGiven) / (1000 * 60 * 60 * 24));

        // Today: show just time
        if (diffDays === 0) {
            return date.toLocaleTimeString(undefined, {
                hour: "numeric",
                minute: "2-digit"
            });
        }

        // Yesterday: show "Yesterday, <time>"
        if (diffDays === 1) {
            const time = date.toLocaleTimeString(undefined, {
                hour: "numeric",
                minute: "2-digit"
            });
            return `Yesterday, ${time}`;
        }

        // Otherwise: full date + time, omit year if same
        const sameYear = date.getFullYear() === now.getFullYear();

        return date.toLocaleString(undefined, {
            year: sameYear ? undefined : "numeric",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit"
        });
    }

    function formatFulDate(date) {
        return date.toLocaleString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
            second: "2-digit",
        });
    }



    export default {
        props: [
            "autoUpdate",
            "allowBetaVersions",
        ],

        components: {
            UpdateStatusItem,
        },

        data() {
            return {
                isWebApp: window.heynote.platform.isWebApp,
            }
        },

        mounted() {
            
        },

        computed: {
            ...mapState(useHeynoteStore, [
                "currentBufferName",
                "currentCursorLine",
                "currentLanguage", 
                "currentSelectionSize", 
                "currentLanguage",
                "currentLanguageAuto",
                "currentCreatedTime",
            ]),
            ...mapState(useSettingsStore, [
                "spellcheckEnabled",
                "alwaysOnTop",
                "settings",
                "commandKeyBindingsMap",
            ]),

            languageName() {
                return LANGUAGE_NAMES[this.currentLanguage] || this.currentLanguage
            },

            className() {
                return `status`
            },

            supportsFormat() {
                const lang = LANGUAGE_MAP[this.currentLanguage]
                return !!lang ? lang.supportsFormat : false
            },

            cmdKey() {
                return window.heynote.platform.isMac ? "⌘" : "Ctrl"
            },

            formatBlockTitle() {
                return `Format Block Content (Alt + Shift + F)`
            },

            updatesEnabled() {
                return !!window.heynote.autoUpdate
            },

        formattedCreatedTime() {
            if (!this.currentCreatedTime) {
                return null
            }
            return formatDate(this.currentCreatedTime)
        },

        createdTimeTitle() {
            if (!this.currentCreatedTime) {
                return null
            }
            return "Block created " +  formatFulDate(this.currentCreatedTime)
        },
    },

        methods: {
            onSpellcheckingContextMenu(event) {
                event.preventDefault()
                window.heynote.mainProcess.invoke('showSpellcheckingContextMenu')
            },

            getTooltip(text, command) {
                const bindings = this.commandKeyBindingsMap[command]
                return bindings.length === 0 ? text : `${text} (${bindings[0]})`
            }
        },
    }
</script>

<template>
    <div :class="className">
        <div class="status-block line-number">
            Ln <span class="num">{{ currentCursorLine?.line }}</span>
            Col <span class="num">{{ currentCursorLine?.col }}</span>
            <template v-if="currentSelectionSize > 0">
                Sel <span class="num">{{ currentSelectionSize }}</span>
            </template>
        </div>
        <div 
            :title="createdTimeTitle"
            class="status-block created-time"
        >
            {{ formattedCreatedTime }}
        </div>
        <div class="spacer"></div>
        <div 
            @click.stop="$emit('openBufferSelector')"
            class="status-block note clickable"
            :title="getTooltip('Change Note', 'openBufferSelector')"
        >
            {{ currentBufferName }} 
        </div>
        <div 
            @click.stop="$emit('openLanguageSelector')"
            class="status-block lang clickable"
            :title="getTooltip('Change language for current block', 'openLanguageSelector')"
        >
            {{ languageName }} 
            <span v-if="currentLanguageAuto" class="auto">(auto)</span>
        </div>
        <div 
            v-if="supportsFormat"
            @click.stop="$emit('formatCurrentBlock')"
            class="status-block format clickable"
            :title="getTooltip('Format Block Content', 'formatBlockContent')"
        >
            <span class="icon icon-format"></span>
        </div>
        <div 
            @click.stop="$emit('toggleSpellcheck')"
            @mousedown.prevent
            @contextmenu="onSpellcheckingContextMenu"
            :class="'status-block spellcheck clickable' + (this.spellcheckEnabled ? ' spellcheck-enabled' : '')"
            :title="getTooltip('Spellchecking', 'toggleSpellcheck')"
        >
            <span class="icon icon-format"></span>
        </div>

        <div 
            v-if="!isWebApp"
            @click.stop="$emit('toggleAlwaysOnTop')"
            @mousedown.prevent
            class="status-block pin clickable"
            :title="getTooltip('Pin', 'toggleAlwaysOnTop')"
        >
            <span class="icon icon-format" :class="{'pinned': alwaysOnTop}"></span>
        </div>

        <UpdateStatusItem 
            v-if="updatesEnabled" 
            :autoUpdate="autoUpdate"
            :allowBetaVersions="allowBetaVersions"
        />
        <div 
            @click.stop="$emit('openSettings')"
            class="status-block settings clickable"
            title="Settings"
        >
            <span class="icon icon-format"></span>
        </div>
    </div>
</template>

<style scoped lang="sass">
    .status
        box-sizing: border-box
        height: 22px
        width: 100%
        background: var(--status-bar-background)
        color: var(--status-bar-color)
        font-family: "Open Sans"
        font-size: 12px
        padding-left: 0px
        padding-right: 0px
        display: flex
        flex-direction: row
        align-items: center
        user-select: none
        white-space: nowrap
        overflow: hidden

        .spacer
            flex-grow: 1
        
        .status-block
            box-sizing: border-box
            height: 22px
            padding: 4px 10px
            cursor: default
            &:first-child
                padding-left: 12px
            &:last-child
                padding-right: 12px
            &.clickable
                cursor: pointer
                &:hover
                    background-color: rgba(255,255,255, 0.1)
            .icon
                display: block
                width: 14px
                height: 22px
                +dark-mode
                    opacity: 0.9
        .line-number
            color: rgba(255, 255, 255, 0.7)
            .num
                color: rgba(255, 255, 255, 1.0)
            +dark-mode
                color: rgba(255, 255, 255, 0.55)
                .num
                    color: rgba(255, 255, 255, 0.75)
        .lang .auto
            color: rgba(255, 255, 255, 0.7)
            +dark-mode
                color: rgba(255, 255, 255, 0.55)
        
        .format
            padding-top: 0
            padding-bottom: 0
            .icon
                background-size: 16px
                background-repeat: no-repeat
                background-position: center center
                background-image: url("@/assets/icons/format.svg")

        .spellcheck
            padding-top: 0
            padding-bottom: 0
            opacity: 1.0
            .icon
                background-size: 13px
                background-repeat: no-repeat
                background-position: center center
                background-image: url("@/assets/icons/spellcheck-off.svg")
            &.spellcheck-enabled .icon
                background-image: url("@/assets/icons/spellcheck.svg")
        
        .pin
            padding-top: 0
            padding-bottom: 0
            .icon   
                background-size: 13px
                background-repeat: no-repeat
                background-position: center center
                background-image: url("@/assets/icons/pin.svg")
                &.pinned
                    background-image: url("@/assets/icons/pin-pinned.svg")
        
        .settings
            padding-top: 0
            padding-bottom: 0
            .icon
                background-size: 13px
                background-repeat: no-repeat
                background-position: center center
                background-image: url("@/assets/icons/settings.svg")

</style>
