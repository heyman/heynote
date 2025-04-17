<script>
    import { HEYNOTE_COMMANDS } from '@/src/editor/commands'
    
    export default {
        props: [
            "keys", 
            "command", 
            "isDefault",
            "source",
        ],

        computed: {
            formattedKeys() {
                return this.keys.replaceAll(
                    "Mod", 
                    window.heynote.platform.isMac ? "⌘" : "Ctrl",
                )
            },

            commandLabel() {
                const cmd = HEYNOTE_COMMANDS[this.command]
                if (cmd) {
                    return `${cmd.category}: ${cmd.description}`
                }
                return HEYNOTE_COMMANDS[this.command]?.description ||this.command
            },
        },
    }
</script>

<template>
    <tr>
        <td class="source">
            {{ source }}
        </td>
        <td class="key">
            <template v-if="keys">
                {{ formattedKeys }}
            </template>
        </td>
        <td class="command">
            <span class="command-name">{{ commandLabel }}</span>
        </td>
        <td class="actions">
            <button 
                v-if="!isDefault"
                @click="$emit('delete')"
                class="delete"
            >Delete</button>
        </td>

        <td v-if="!isDefault" class="drag-handle"></td>
        <td v-else></td>
    </tr>
</template>

<style lang="sass" scoped>
    tr
        &.overridden
            text-decoration: line-through
            color: rgba(0,0,0, 0.4)
            +dark-mode
                color: rgba(255,255,255, 0.4)
        td
            &.key
                //letter-spacing: 1px
            &.command
                //
            &.drag-handle
                width: 24px
                padding: 0
                cursor: ns-resize
                background-color: rgba(0,0,0, 0.02)
                background-size: 20px
                background-repeat: no-repeat
                background-position: center center
                background-image: url(@/assets/icons/drag-vertical-light.svg)
                +dark-mode
                    background-color: rgba(0,0,0, 0.08)
                    background-image: url(@/assets/icons/drag-vertical-dark.svg)
                &:hover
                    background-color: rgba(0,0,0, 0.05)
                    +dark-mode
                        background-color: rgba(0,0,0, 0.25)
    button.delete
        padding: 0 10px
        height: 22px
        font-size: 12px
        background: none
        border: none
        border-radius: 2px
        cursor: pointer
        background: #ddd
        &:hover
            background: #ccc
        +dark-mode
            background: #555
            &:hover
                background: #666
</style>
