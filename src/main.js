import './css/application.sass'

import { createApp } from 'vue'
import App from './components/App.vue'
import { loadCurrencies } from './currency'


import i18next from 'i18next';
import I18NextVue from 'i18next-vue';
import { en } from './locals/en/en';
import { zh } from './locals/zh/zh';

i18next.init({
  lng: 'en',
  interpolation: {
    escapeValue: false
  },
  fallbackLng: false,
  resources: {
    en:{
      translation: en
    },
    zh:{
      translation: zh
    }
  }
});

const app = createApp(App)

app.use(I18NextVue, {
  i18next,
  rerenderOn: [ 'languageChanged', 'loaded'],
});

app.mount('#app').$nextTick(() => {
    // hide loading screen
    postMessage({ payload: 'removeLoading' }, '*')
})



// load math.js currencies
loadCurrencies()
setInterval(loadCurrencies, 1000 * 3600 * 4)

