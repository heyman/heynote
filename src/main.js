import './css/application.sass'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './components/App.vue'
import { loadCurrencies } from './currency'
import { useErrorStore } from './stores/error-store'


const pinia = createPinia()
const app = createApp(App)

app.use(pinia)
app.mount('#app').$nextTick(() => {
    // hide loading screen
    postMessage({ payload: 'removeLoading' }, '*')
})

const errorStore = useErrorStore()
window.heynote.getInitErrors().then((errors) => {
    errors.forEach((e) => errorStore.addError(e))
})




// load math.js currencies
loadCurrencies()
setInterval(loadCurrencies, 1000 * 3600 * 4)

