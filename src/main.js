import './css/application.sass'

import { createApp } from 'vue'
import App from './components/App.vue'
import { loadCurrencies } from './currency'
import i18n from './locals'


const app = createApp(App)
app.use(i18n)
app.mount('#app').$nextTick(() => {
    // hide loading screen
    postMessage({ payload: 'removeLoading' }, '*')
})




// load math.js currencies
loadCurrencies()
setInterval(loadCurrencies, 1000 * 3600 * 4)

