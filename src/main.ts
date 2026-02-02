// pinia
import { createPinia } from 'pinia'
import * as THREE from 'three'
import { createApp } from 'vue'
import VueDOMPurifyHTML from 'vue-dompurify-html'
import svgIcon from '@/components/SvgIcon/index.vue'
import i18n from '@/locales/i18n'
// svg全局组件// 路由
import router from '@/router'
import App from './App.vue'
import './style.css'
import './style/markdown.css'
import './style/style.scss'
// 全局svg组件
import 'virtual:svg-icons-register'

// 在应用初始化时尽早设置主题和字体，避免页面加载时的闪烁
(function initializeThemeAndFont() {
    try {
        // 设置默认主题
        const html = document.documentElement
        html.setAttribute('data-theme', 'dracula')

        // 设置默认字体
        document.documentElement.style.setProperty('--app-font-family', `"微软雅黑", -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`)
    }
    catch (e) {
        console.warn('Failed to set initial theme and font:', e)
    }
})()

const app = createApp(App)
const pinia = createPinia()

app.config.globalProperties.$THREE = THREE // 挂载到原型
app.component('svg-icon', svgIcon)
app.use(router)
app.use(VueDOMPurifyHTML)
app.use(pinia)
app.use(i18n)
app.mount('#app')
