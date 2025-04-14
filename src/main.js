// src/main.js
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { Amplify } from 'aws-amplify'
import authService from './services/auth-service'

// 初始化 Amplify
Amplify.configure(authService.getConfig());

// 創建 Vue 應用
const app = createApp(App)

// 使用路由
app.use(router)

// 添加全局身份驗證方法
app.config.globalProperties.$auth = authService;

// 掛載應用
app.mount('#app')

// 添加 FontAwesome 字體圖標（CDN 方式）
const script = document.createElement('script')
script.src = 'https://kit.fontawesome.com/a076d05399.js'
script.crossOrigin = 'anonymous'
document.head.appendChild(script)