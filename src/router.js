// src/router.js
import { createRouter, createWebHistory } from 'vue-router';
import Home from './views/Home.vue';
import authState from './services/auth-state';

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