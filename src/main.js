// src/main.js
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// 導入 Amplify
import { Amplify } from 'aws-amplify'
// 導入我們的獨立配置
import amplifyConfig from './amplify-config'

// 用錯誤處理包裝 Amplify 配置
try {
  console.log('正在配置 Amplify...', JSON.stringify(amplifyConfig, null, 2));
  
  // 初始化 Amplify - 使用專門的配置文件
  Amplify.configure(amplifyConfig);
  
  console.log('Amplify 配置成功');
} catch (error) {
  console.error('Amplify 配置失敗:', error);
}

// Amplify 日誌級別設置 (可選，用於調試)
// import { ConsoleLogger } from '@aws-amplify/core';
// ConsoleLogger.LOG_LEVEL = 'DEBUG'; // 可選值: VERBOSE, DEBUG, INFO, WARN, ERROR

// 創建 Vue 應用
const app = createApp(App)

// 使用路由
app.use(router)

// 導入 auth-service 作為全局服務
import authService from './services/auth-service'
app.config.globalProperties.$auth = authService;

// 掛載應用
app.mount('#app')

// 添加 FontAwesome 字體圖標（CDN 方式）
const script = document.createElement('script')
script.src = 'https://kit.fontawesome.com/a076d05399.js'
script.crossOrigin = 'anonymous'
document.head.appendChild(script)