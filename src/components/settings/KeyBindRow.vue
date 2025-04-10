<script>
    export default {
        props: [
            "keys", 
            "command", 
            "isDefault",
            "isOverridden",
        ],

        computed: {
            formattedKeys() {
                return this.keys.replaceAll(
                    "Mod", 
                    window.heynote.platform.isMac ? "⌘" : "Ctrl",
                )
            },
        },
    }
</script>

<template>
    <tr :class="{overridden:isOverridden}">
        <td class="source">
            {{ isDefault ? "Heynote" : "User" }}
        </td>
        <td class="key">
            <template v-if="keys">
                {{ formattedKeys }}
            </template>
        </td>
        <td class="command">
            <span v-if="!command" class="unbound">Unbound</span>
            <span class="command-name">{{ command }}</span>
        </td>
        <td class="actions">
            <template v-if="!isDefault">
                <button class="delete">Delete</button>
            </template>
        </td>
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
                .command-name
                    font-family: monospace
                    margin-right: 10px
                .unbound
                    font-style: italic
                    color: #999
    button
        padding: 0 10px
        height: 22px
        font-size: 12px
        background: none
        border: none
        border-radius: 2px
        margin-right: 2px
        cursor: pointer
        background: #ddd
        &:hover
            background: #ccc
        +dark-mode
            background: #555
            &:hover
                background: #666
        //&.delete
        //    background: #e95050
        //    &:hover
        //        background: #ce4848
        //    +dark-mode
        //        &.delete
        //            background: #ae1e1e
        //            &:hover
        //                background: #bf2222
</style>
