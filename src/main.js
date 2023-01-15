import './css/application.sass'

import { createApp } from 'vue'
import App from './App.vue'


const app = createApp(App)

app.mount('#app').$nextTick(() => {
    // hide loading screen
    postMessage({ payload: 'removeLoading' }, '*')
})
