import './css/application.sass'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './components/App.vue'
import { loadCurrencies } from './currency'
import { useErrorStore } from './stores/error-store'
import { useNotesStore, initNotesStore } from './stores/notes-store'


const pinia = createPinia()
const app = createApp(App)

app.use(pinia)
app.mount('#app').$nextTick(() => {
    // hide loading screen
    postMessage({ payload: 'removeLoading' }, '*')
})

const errorStore = useErrorStore()
//errorStore.addError("test error")
window.heynote.getInitErrors().then((errors) => {
    errors.forEach((e) => errorStore.addError(e))
})

initNotesStore()



// load math.js currencies
loadCurrencies()
setInterval(loadCurrencies, 1000 * 3600 * 4)

window.heynote.init()
