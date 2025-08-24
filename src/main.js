// main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { registerPlugins } from '@/plugins'
import 'unfonts.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
registerPlugins(app)

app.mount('#app')
