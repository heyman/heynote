import '../src/css/application.sass'
import '../assets/font/open-sans/open-sans.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config';

import App from '../src/components/App.vue'
import { loadCurrencies } from '../src/currency'

const pinia = createPinia()
const app = createApp(App)
app.use(pinia)
app.use(PrimeVue)
app.mount('#app')
//console.log("test:", app.hej.test)

// load math.js currencies
loadCurrencies()
setInterval(loadCurrencies, 1000 * 3600 * 4)
