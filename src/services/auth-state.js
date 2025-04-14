// src/services/auth-state.js
import { reactive, readonly } from 'vue';
import authService from './auth-service';

// 創建響應式狀態物件
const state = reactive({
  isAuthenticated: false,
  user: null,
  userInfo: null,
  loading: true,
  error: null
});

// 狀態操作方法
const actions = {
  // 初始載入用戶狀態
  async loadUserState() {
    state.loading = true;
    try {
      const { success, user, isAuthenticated } = await authService.getCurrentUser();
      
      if (success && isAuthenticated) {
        state.isAuthenticated = true;
        state.user = user;
        
        // 獲取用戶詳細信息
        state.userInfo = {
          username: user.username,
          email: user.attributes.email,
          emailVerified: user.attributes.email_verified === 'true'
        };
      } else {
        state.isAuthenticated = false;
        state.user = null;
        state.userInfo = null;
      }
      
      state.error = null;
    } catch (error) {
      state.error = error.message;
      state.isAuthenticated = false;
    } finally {
      state.loading = false;
    }
  },
  
  // 登入
  async signIn(username, password) {
    state.loading = true;
    state.error = null;
    
    try {
      const { success, user, error } = await authService.signIn(username, password);
      
      if (success) {
        state.isAuthenticated = true;
        state.user = user;
        
        // 獲取用戶詳細信息
        state.userInfo = {
          username: user.username,
          email: user.attributes.email,
          emailVerified: user.attributes.email_verified === 'true'
        };
        
        return { success: true };
      } else {
        state.error = error;
        return { success: false, error };
      }
    } catch (err) {
      state.error = err.message;
      return { success: false, error: err.message };
    } finally {
      state.loading = false;
    }
  },
  
  // 登出
  async signOut() {
    state.loading = true;
    
    try {
      const { success, error } = await authService.signOut();
      
      if (success) {
        state.isAuthenticated = false;
        state.user = null;
        state.userInfo = null;
        return { success: true };
      } else {
        state.error = error;
        return { success: false, error };
      }
    } catch (err) {
      state.error = err.message;
      return { success: false, error: err.message };
    } finally {
      state.loading = false;
    }
  }
};

// 初始化檢查
actions.loadUserState();

// 導出唯讀狀態和操作方法
export default {
  state: readonly(state),
  ...actions
};