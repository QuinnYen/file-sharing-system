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
      const { success, user, userInfo, isAuthenticated } = await authService.getCurrentUser();
      
      if (success && isAuthenticated) {
        state.isAuthenticated = true;
        state.user = user;
        
        // 使用返回的 userInfo 或創建默認值
        if (userInfo) {
          state.userInfo = userInfo;
          
          // 如果有用戶信息且有電子郵件，保存到本地儲存
          if (userInfo.email) {
            try {
              localStorage.setItem('userEmail', userInfo.email);
              sessionStorage.setItem('userEmail', userInfo.email);
              console.log('已保存 userInfo 電子郵件到本地儲存:', userInfo.email);
            } catch (e) {
              console.warn('保存 userInfo 電子郵件到本地儲存失敗:', e);
            }
          }
        } else if (user) {
          // 從用戶對象創建 userInfo
          state.userInfo = {
            username: user.username,
            email: user.attributes?.email || user.username, // 防止 undefined
            emailVerified: true // 默認為已驗證
          };
          
          // 如果從 user 對象獲取到電子郵件，保存到本地儲存
          if (user.attributes && user.attributes.email) {
            try {
              localStorage.setItem('userEmail', user.attributes.email);
              sessionStorage.setItem('userEmail', user.attributes.email);
              console.log('已保存 user.attributes 電子郵件到本地儲存:', user.attributes.email);
            } catch (e) {
              console.warn('保存 user.attributes 電子郵件到本地儲存失敗:', e);
            }
          }
        }
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
      const { success, user, error, needConfirmation } = await authService.signIn(username, password);
      
      if (success) {
        state.isAuthenticated = true;
        state.user = user;
        
        // 獲取用戶詳細信息，確保有合理的默認值
        state.userInfo = {
          username: user.username,
          email: user.attributes?.email || username, // 使用用戶名作為預設郵箱
          emailVerified: true // 默認已驗證
        };
        
        return { success: true };
      } else {
        state.error = error;
        
        // 如果需要確認，添加這個標誌
        if (needConfirmation) {
          return { success: false, error, needConfirmation: true, username };
        }
        
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