<script>
    export default {
        props: [
            "disabled",
            "modelValue",
        ],
        emits: ["update:modelValue"],

        data() {
            let keys = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")
            keys = keys.concat([
                "Plus",
                "Space",
                "Tab",
                "Capslock",
                "Numlock",
                "Scrolllock",
                "Backspace",
                "Delete",
                "Insert",
                "Return",
                "Up",
                "Down",
                "Left",
                "Right",
                "Home",
                "End",
                "PageUp",
                "PageDown",
                "Escape",
                "PrintScreen",
            ])
            for (let i=1; i<=12; i++) {
                keys.push("F" + i)
            }
            for (let i=0; i<=9; i++) {
                keys.push("num" + i)
            }
            keys = keys.concat(')!@#$%^&*(:;:+=<,_->.?/~`{][|\\}"'.split(""))
            return {
                isMac: window.heynote.platform.isMac,
                isWindows: window.heynote.platform.isWindows,
                cmdOrCtrl: false,
                ctrl: false,
                shift: false,
                alt: false,
                altGr: false,
                super: false,
                key: "",
                keys: keys,
            }
        },

        watch: {
            modelValue: {
                immediate: true,
                handler(value) {
                    if (value) {
                        const keys = value.split("+")
                        this.cmdOrCtrl = keys.includes("CmdOrCtrl")
                        this.ctrl = keys.includes("Ctrl")
                        this.shift = keys.includes("Shift")
                        this.alt = keys.includes("Alt")
                        this.altGr = !this.isMac && !this.isWindows && keys.includes("AltGr")
                        this.super = keys.includes("Super")
                        this.key = keys[keys.length - 1]
                    }
                }
            }
        },

        computed: {
            className() {
                return {
                    "keyboard-hotkey": true,
                    "disabled": this.disabled,
                }
            },
        },

        methods: {
            onChange() {
                // create accelerator
                const acceleratorKeys = []
                if (this.cmdOrCtrl) {
                    acceleratorKeys.push("CmdOrCtrl")
                }
                if (this.ctrl) {
                    acceleratorKeys.push("Ctrl")
                }
                if (this.shift) {
                    acceleratorKeys.push("Shift")
                }
                if (this.alt) {
                    acceleratorKeys.push("Alt")
                }
                if (this.altGr) {
                    acceleratorKeys.push("AltGr")
                }
                if (this.super) {
                    acceleratorKeys.push("Super")
                }
                if (this.key) {
                    acceleratorKeys.push(this.key)
                }
                if (acceleratorKeys.length > 0) {
                    const accelerator = acceleratorKeys.join("+")
                    //console.log("accelerator:", accelerator)
                    this.$emit("update:modelValue", accelerator)
                }
            }
        },
    }
</script>

<template>
    <div :class="className">
        <label class="modifier">
            <input type="checkbox" v-model="cmdOrCtrl" @change="onChange" />
            <span v-if="isMac" class="text">Command</span>
            <span v-else class="text">Ctrl</span>
        </label>
        <label class="modifier">
            <input type="checkbox" v-model="shift" @change="onChange" />
            <span class="text">Shift</span>
        </label>
        <label v-if="isMac" class="modifier">
            <input type="checkbox" v-model="ctrl" @change="onChange" />
            <span  class="text">Ctrl</span>
        </label>
        <label class="modifier">
            <input type="checkbox" v-model="alt" @change="onChange" />
            <span v-if="isMac" class="text">Option</span>
            <span v-else class="text">Alt</span>
        </label>
        <label v-if="!isMac" class="modifier">
            <input type="checkbox" v-model="altGr" @change="onChange" />
            <span  class="text">AltGr</span>
        </label>
        <label v-if="!isMac" class="modifier">
            <input type="checkbox" v-model="super" @change="onChange" />
            <span  class="text">Win</span>
        </label>
        <select v-model="key" @change="onChange">
            <option v-for="k in keys" :key="k" :value="k">{{ k }}</option>
        </select>
    </div>
</template>

<style lang="sass" scoped>
    .keyboard-hotkey
        display: flex
        padding: 7px
        border-radius: 3px
        border: 1px solid #c4c4c4
        background: #eee
        +dark-mode
            border: 1px solid #666
            background: #555

        &.disabled
            opacity: 0.3

        .modifier
            margin-right: 5px
            user-select: none
            .text
                position: relative
                top: -2px
        select
            margin-right: 5px
</style>
