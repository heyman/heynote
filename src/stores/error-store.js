import { defineStore } from 'pinia'

export const useErrorStore = defineStore("errors", {
    state: () => ({
        errors: [],
    }),

    actions: {
        setErrors(errors) {
            this.errors = errors
        },

        addError(error) {
            this.errors.push(error)
        },

        popError() {
            this.errors.splice(0, 1)
        },
    },
})
