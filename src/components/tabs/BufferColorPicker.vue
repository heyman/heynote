<script>
    import { mapStores } from 'pinia'
    import { COLOR_SCHEMES, normalizeColorScheme } from '@/src/theme/schemes/index.js'
    import { resolveTheme } from '@/src/theme/resolve.js'
    import { useHeynoteStore } from '@/src/stores/heynote-store'
    import { useErrorStore } from '@/src/stores/error-store'
    import { useSettingsStore } from '@/src/stores/settings-store'

    export default {
        props: ['path', 'title', 'color'],

        data() {
            return {
                position: {},
                saving: false,
            }
        },

        computed: {
            ...mapStores(useHeynoteStore, useErrorStore, useSettingsStore),
            colors() {
                return COLOR_SCHEMES.map(scheme => ({
                    id: scheme.id,
                    label: scheme.label,
                    swatch: resolveTheme(scheme, this.settingsStore.theme).ui.statusBackground,
                }))
            },
            isOpen() {
                return this.heynoteStore.colorPickerPath === this.path
            },
            selectedColor() {
                return this.colors.find(option => option.id === normalizeColorScheme(this.color))
            },
        },

        mounted() {
            document.addEventListener('pointerdown', this.onOutsidePointerDown)
            window.addEventListener('resize', this.dismiss)
            window.addEventListener('scroll', this.onScroll, true)
        },

        beforeUnmount() {
            this.dismiss()
            document.removeEventListener('pointerdown', this.onOutsidePointerDown)
            window.removeEventListener('resize', this.dismiss)
            window.removeEventListener('scroll', this.onScroll, true)
        },

        watch: {
            path() { this.dismiss() },
            'heynoteStore.currentBufferPath'(path) {
                if (path !== this.path) this.dismiss()
            },
        },

        methods: {
            async toggle() {
                if (this.isOpen) {
                    this.dismiss()
                    return
                }
                this.heynoteStore.openBuffer(this.path, { focusEditor: false })
                // Let activation and the tab's scrollIntoView finish before opening.
                await this.$nextTick()
                await new Promise(resolve => requestAnimationFrame(resolve))
                if (this.heynoteStore.currentBufferPath !== this.path || !this.$refs.trigger) return
                const rect = this.$refs.trigger.getBoundingClientRect()
                this.position = {
                    left: `${Math.max(8, rect.left)}px`,
                    top: `${rect.bottom + 6}px`,
                }
                this.heynoteStore.colorPickerPath = this.path
                await this.$nextTick()
                if (this.isOpen && this.$refs.menu) {
                    const width = this.$refs.menu.getBoundingClientRect().width
                    this.position.left = `${Math.max(8, Math.min(rect.left, window.innerWidth - width - 8))}px`
                    await this.$nextTick()
                }
                if (this.isOpen) {
                    this.$refs.menu?.querySelector('[aria-checked="true"]')?.focus()
                }
            },

            dismiss() {
                if (this.isOpen) this.heynoteStore.colorPickerPath = null
            },

            closeAndFocusTrigger() {
                this.dismiss()
                this.$refs.trigger.focus()
            },

            onOutsidePointerDown(event) {
                if (!this.$refs.trigger.contains(event.target) && !this.$refs.menu?.contains(event.target)) {
                    this.dismiss()
                }
            },

            onScroll(event) {
                if (!this.$refs.menu?.contains(event.target)) {
                    this.dismiss()
                }
            },

            onKeydown(event) {
                // Let modified shortcuts reach the app's global key handler.
                if (event.ctrlKey || event.metaKey || event.altKey) return
                if (event.key === 'Enter' || event.key === ' ') {
                    event.stopPropagation()
                    return
                }
                if (!this.isOpen) return

                if (event.key === 'Escape') {
                    event.preventDefault()
                    event.stopPropagation()
                    this.closeAndFocusTrigger()
                } else if (event.key === 'Tab') {
                    event.stopPropagation()
                    this.closeAndFocusTrigger()
                } else if (['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
                    event.preventDefault()
                    event.stopPropagation()
                    const options = Array.from(this.$refs.menu.querySelectorAll('button'))
                    const index = options.indexOf(document.activeElement)
                    const direction = ['ArrowLeft', 'ArrowUp'].includes(event.key) ? -1 : 1
                    const next = event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 : (index + direction + options.length) % options.length
                    options[next].focus()
                }
            },

            async choose(color) {
                if (this.saving) return
                this.saving = true
                try {
                    await this.heynoteStore.updateBufferColor(this.path, color)
                    this.closeAndFocusTrigger()
                } catch (error) {
                    this.errorStore.addError(`Failed to save scratchpad color: ${error.message}`)
                } finally {
                    this.saving = false
                }
            },
        },
    }
</script>

<template>
    <button
        ref="trigger"
        type="button"
        class="buffer-color"
        :style="{ '--swatch-color': selectedColor.swatch }"
        :title="`Change color for ${title} (${selectedColor.label})`"
        :aria-label="`Change color for ${title} (${selectedColor.label})`"
        aria-haspopup="menu"
        :aria-expanded="isOpen"
        @pointerdown.stop
        @mousedown.stop
        @mouseup.stop
        @click.stop="toggle"
        @keydown="onKeydown"
    ><span></span></button>
    <Teleport to="body">
        <div
            v-if="isOpen"
            ref="menu"
            class="buffer-color-menu"
            role="menu"
            :aria-label="`Color for ${title}`"
            :style="position"
            @keydown="onKeydown"
            @click.stop
            @contextmenu.prevent
        >
            <button
                v-for="option in colors"
                :key="option.id"
                type="button"
                role="menuitemradio"
                :aria-label="option.label"
                :aria-checked="option.id === selectedColor.id"
                :title="option.label"
                :disabled="saving"
                :style="{ '--swatch-color': option.swatch }"
                @click="choose(option.id)"
            ><span></span></button>
        </div>
    </Teleport>
</template>

<style lang="sass" scoped>
    .buffer-color
        app-region: no-drag
        pointer-events: auto
        vertical-align: middle
        display: inline-flex
        align-items: center
        justify-content: center
        width: 20px
        height: 20px
        padding: 0
        background: transparent
        border: none
        border-radius: 50%
        cursor: pointer
        flex-shrink: 0
        &:focus-visible
            outline: 2px solid var(--ui-accent)
            outline-offset: 1px

    .buffer-color span, .buffer-color-menu span
        display: block
        width: 12px
        height: 12px
        border-radius: 50%
        background: var(--swatch-color)
        box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.15)

    .buffer-color-menu
        app-region: no-drag
        position: fixed
        z-index: 1000
        display: flex
        gap: 4px
        padding: 8px
        background: var(--panel-background)
        border: 1px solid var(--tab-bar-border-bottom-color)
        border-radius: 8px
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25)
        button
            display: flex
            align-items: center
            justify-content: center
            width: 26px
            height: 26px
            padding: 0
            border: 2px solid transparent
            border-radius: 50%
            background: transparent
            cursor: pointer
            &:focus-visible
                outline: 2px solid var(--ui-accent)
                outline-offset: 1px
            &[aria-checked=true]
                border-color: var(--ui-accent)
            span
                width: 16px
                height: 16px
</style>
