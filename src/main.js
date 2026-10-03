import { createApp } from 'vue'
import App from './App.vue'
import { registerPlugins } from '@/plugins'
import '@fontsource/roboto/latin-400.css'
import '@fontsource/roboto/latin-500.css'
import '@fontsource/roboto/latin-700.css'
import './styles/app.css'
import './services/pwa'
const app=createApp(App)
registerPlugins(app)
app.mount('#app')
