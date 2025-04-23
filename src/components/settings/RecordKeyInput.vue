<script>
    import { keyName, base } from "w3c-keyname"

    export default {
        props: [
            "modelValue",
        ],

        data() {
            return {
                keys: this.modelValue ? this.modelValue.split(" ") : [],
            }
        },

        computed: {
            key() {
                return this.keys.join(" ")
            },
        },

        watch: {
            modelValue(newValue) {
                this.keys = this.modelValue ? this.modelValue.split(" ") : []
            },
            key(newValue) {
                this.$emit("update:model-value", newValue)
            },
        },

        methods: {
            onKeyDown(event) {
                event.preventDefault()
                //console.log("event", event, event.code, keyName(event))

                if (event.key === "Enter") {
                    this.$emit("enter")
                } else if (event.key === "Escape") {
                    if (this.keys.length > 0) {
                        this.keys = []
                    } else {
                        // setTimeout is used to ensure that the settings dialog's keydown listener 
                        // doesn't close the whole settings dialog
                        setTimeout(() => {
                            this.$emit("close")
                        }, 0)
                    }
                } else if (["Alt", "Control", "Meta", "Shift"].includes(event.key)) {

                } else {
                    if (this.keys.length >= 2) {
                        this.keys = []
                    }
                    let keyCombo = ""
                    if (event.altKey) {
                        keyCombo += "Alt-"
                    }
                    if (event.ctrlKey) {
                        keyCombo += "Ctrl-"
                    }
                    if (event.metaKey) {
                        keyCombo += "Meta-"
                    }
                    if (event.shiftKey) {
                        keyCombo += "Shift-"
                    }
                    let key = base[event.keyCode]
                    if (key) {
                        if (key === " ") {
                            key = "Space"
                        }
                        keyCombo += key
                        this.keys.push(keyCombo)
                    }
                }
            },
        },
    }
</script>

<template>
    <input 
        type="text" 
        :value="key" 
        @keydown.prevent="onKeyDown"
        class="keys"
        readonly
    >
</template>
