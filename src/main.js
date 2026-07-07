import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './assets/styles.css'
import './mobile layout/mobile.css'

// Paksa clear service worker lama saat ada update besar
if ('serviceWorker' in navigator && localStorage.getItem('sw-ver') !== 'v3') {
  localStorage.setItem('sw-ver', 'v3')
  navigator.serviceWorker.getRegistrations().then(regs => {
    if (regs.length) Promise.all(regs.map(r => r.unregister())).then(() => location.reload())
  })
}

const app = createApp(App)
app.use(createPinia())
app.mount('#app')
