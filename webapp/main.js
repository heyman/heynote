import '../src/css/application.sass'

import { createApp } from 'vue'
import App from '../src/components/App.vue'
import { loadCurrencies } from '../src/currency'

const app = createApp(App)
app.mount('#app')
//console.log("test:", app.hej.test)

// load math.js currencies
loadCurrencies()
setInterval(loadCurrencies, 1000 * 3600 * 4)
