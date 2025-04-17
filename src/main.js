import './css/application.sass'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config';

import App from './components/App.vue'
import { loadCurrencies } from './currency'
import { useErrorStore } from './stores/error-store'
import { useHeynoteStore, initHeynoteStore } from './stores/heynote-store'


const pinia = createPinia()
const app = createApp(App)

app.use(pinia)
app.use(PrimeVue)
app.mount('#app').$nextTick(() => {
    // hide loading screen
    postMessage({ payload: 'removeLoading' }, '*')
})

const errorStore = useErrorStore()
//errorStore.addError("test error")
window.heynote.getInitErrors().then((errors) => {
    errors.forEach((e) => errorStore.addError(e))
})

initHeynoteStore()



// load math.js currencies
loadCurrencies()
setInterval(loadCurrencies, 1000 * 3600 * 4)

window.heynote.init()
