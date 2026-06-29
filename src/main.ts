// ============================================================
// 应用入口 - Rocket.Chat 适配版
// ============================================================

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import App from './App.vue'
import router from './router'

// ---- 全局样式 ----
import './assets/css/define/global.less'
import './assets/css/define/theme.less'

const app = createApp(App)

// ---- Pinia ----
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
app.use(pinia)

// ---- Router ----
app.use(router)

// ---- 挂载 ----
app.mount('#app')
