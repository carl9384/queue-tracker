import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { setupI18n } from './i18n'
import { resolveInitialLocale, setLocale } from './store'

const initialLocale = resolveInitialLocale()
const i18n = setupI18n(initialLocale)

const app = createApp(App)
app.use(i18n)
app.mount('#app')

// Sync initial state: update URL and html lang
setLocale(initialLocale)
