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
      // 嘗試從本地存儲先恢復一些基本狀態
      let recoveredEmail = null;
      try {
        const storedEmail = localStorage.getItem('userEmail');
        if (storedEmail && storedEmail.includes('@')) {
          console.log('從本地存儲恢復用戶電子郵件:', storedEmail);
          recoveredEmail = storedEmail;
          // 臨時設置為已認證，避免閃爍登出
          state.isAuthenticated = true;
        }
      } catch (e) {
        console.warn('從本地存儲恢復狀態失敗:', e);
      }

      const { success, user, userInfo, isAuthenticated } = await authService.getCurrentUser();
      
      if (success && isAuthenticated) {
        state.isAuthenticated = true;
        state.user = user;
        
        // 建立或更新 userInfo，確保電子郵件正確
        if (recoveredEmail) {
          // 如果有從本地恢復的電子郵件，優先使用它
          state.userInfo = {
            ...(userInfo || {}),
            email: recoveredEmail,
            username: user?.username || recoveredEmail,
            emailVerified: true
          };
        } else if (userInfo) {
          // 嘗試使用 userInfo 中的電子郵件
          state.userInfo = userInfo;
          
          // 如果 userInfo 中的電子郵件看起來不像電子郵件（可能是 UUID），
          // 嘗試從 user.attributes 或其他地方獲取
          if (!userInfo.email || !userInfo.email.includes('@')) {
            const emailFromAttrs = user?.attributes?.email;
            if (emailFromAttrs && emailFromAttrs.includes('@')) {
              state.userInfo.email = emailFromAttrs;
            }
          }
        } else if (user) {
          // 從用戶對象創建 userInfo
          state.userInfo = {
            username: user.username,
            email: user.attributes?.email || recoveredEmail || user.username, // 使用最好的電子郵件來源 
            emailVerified: true // 默認為已驗證
          };
        }
        
        // 確保我們始終有一個合理的電子郵件，保存到本地儲存
        if (state.userInfo && state.userInfo.email && state.userInfo.email.includes('@')) {
          try {
            localStorage.setItem('userEmail', state.userInfo.email);
            sessionStorage.setItem('userEmail', state.userInfo.email);
            console.log('已保存用戶電子郵件到本地儲存:', state.userInfo.email);
          } catch (e) {
            console.warn('保存電子郵件到儲存失敗:', e);
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