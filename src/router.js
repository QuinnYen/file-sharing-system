// src/router.js
import { createRouter, createWebHistory } from 'vue-router';
import Home from './views/Home.vue';
import authState from './services/auth-state';
// 添加 authService 的導入
import authService from './services/auth-service';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: { requiresAuth: true } // 需要身份驗證
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('./views/About.vue')
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('./views/Login.vue'),
    meta: { guest: true } // 僅限未登入用戶
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('./views/Profile.vue'),
    meta: { requiresAuth: true } // 需要身份驗證
  }
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
});

// 導航守衛
router.beforeEach(async (to, from, next) => {
  // 嘗試檢查本地存儲認證狀態
  if (!authState.state.isAuthenticated && !authState.state.loading) {
    // 檢查localStorage中是否有userEmail，如果有可能是認證狀態未正確恢復
    const storedEmail = localStorage.getItem('userEmail');
    if (storedEmail) {
      console.log('檢測到存儲的用戶Email，嘗試恢復認證狀態');
      
      // 更新 sessionStorage 以保持一致性
      sessionStorage.setItem('userEmail', storedEmail);
      
      // 重新加載用戶狀態
      authState.state.loading = true;
      await authState.loadUserState().catch(err => {
        console.warn('恢復認證狀態失敗:', err);
      });
      
      // 如果認證狀態恢復失敗，但我們有電子郵件，強制設置 userInfo
      if (!authState.state.isAuthenticated && storedEmail.includes('@')) {
        console.log('認證狀態恢復失敗，但有電子郵件，嘗試自動登入');
        // 再次嘗試從 authService 獲取用戶資訊
        const userSession = await authService.checkAndRepairAuthState().catch(() => ({}));
        
        if (userSession.fixed) {
          // 再次載入用戶狀態
          await authState.loadUserState().catch(err => {
            console.warn('二次恢復嘗試失敗:', err);
          });
        }
      }
    }
  }

  // 檢查是否需要重新載入用戶狀態
  if (authState.state.loading) {
    try {
      // 等待身份狀態載入
      await new Promise(resolve => {
        const checkLoading = () => {
          if (!authState.state.loading) {
            resolve();
          } else {
            setTimeout(checkLoading, 100);
          }
        };
        checkLoading();
      });
    } catch (error) {
      console.error('載入用戶狀態時出錯:', error);
    }
  }
  
  const isAuthenticated = authState.state.isAuthenticated;
  
  // 需要身份驗證的路由
  if (to.meta.requiresAuth && !isAuthenticated) {
    next({ name: 'Login' });
  } 
  // 僅限訪客的路由（已登入用戶會被重定向）
  else if (to.meta.guest && isAuthenticated) {
    next({ name: 'Home' });
  } 
  // 其他情況正常導航
  else {
    next();
  }
});

export default router;