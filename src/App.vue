<!-- src/App.vue -->
<template>
  <div id="app">
    <nav class="navbar">
      <div class="navbar-brand">
        <router-link to="/">檔案上傳分享系統</router-link>
      </div>
      <div class="navbar-menu">
        <router-link to="/" class="nav-item">首頁</router-link>
        <router-link to="/about" class="nav-item">關於</router-link>
        
        <!-- 未登入用戶顯示登入按鈕 -->
        <router-link 
          v-if="!authState.isAuthenticated" 
          to="/login" 
          class="nav-item login-btn"
        >
          登入
        </router-link>
        
        <!-- 已登入用戶顯示用戶功能表 -->
        <div v-else class="user-menu">
          <div class="user-menu-trigger" @click="toggleUserMenu">
            <span>{{ userEmail }}</span>
            <i class="fas fa-chevron-down"></i>
          </div>
          
          <div class="user-menu-dropdown" v-if="showUserMenu">
            <router-link to="/profile" class="dropdown-item">
              <i class="fas fa-user"></i> 個人資料
            </router-link>
            <div class="dropdown-divider"></div>
            <a href="#" class="dropdown-item" @click.prevent="handleLogout">
              <i class="fas fa-sign-out-alt"></i> 登出
            </a>
          </div>
        </div>
      </div>
    </nav>

    <router-view/>

    <footer class="footer">
      <p>&copy; {{ new Date().getFullYear() }} 雲端檔案上傳與分享系統 - 碩士課堂報告展示</p>
    </footer>
  </div>
</template>

<script>
import authState from './services/auth-state';

export default {
  name: 'App',
  data() {
    return {
      showUserMenu: false
    };
  },
  computed: {
    authState() {
      return authState.state;
    },
    userEmail() {
      // 首先檢查本地存儲，這是最可靠的來源
      const storedEmail = localStorage.getItem('userEmail');
      if (storedEmail && storedEmail.includes('@')) {
        return storedEmail;
      }
      
      // 然後檢查 authState 中的 userInfo
      const email = this.authState.userInfo?.email;
      if (email && email.includes('@')) {
        return email;
      }
      
      // 最後檢查 user.attributes
      const attrEmail = this.authState.user?.attributes?.email;
      if (attrEmail && attrEmail.includes('@')) {
        return attrEmail;
      }
      
      // 如果所有來源都沒有有效的電子郵件，則返回通用名稱
      return '使用者';
    }
  },
  methods: {
    toggleUserMenu() {
      this.showUserMenu = !this.showUserMenu;
    },
    async handleLogout() {
      try {
        await authState.signOut();
        this.showUserMenu = false;
        this.$router.push('/login');
      } catch (error) {
        console.error('登出失敗', error);
      }
    }
  },
  created() {
    // 點擊其他地方關閉用戶選單
    document.addEventListener('click', (event) => {
      const userMenu = this.$el.querySelector('.user-menu');
      if (userMenu && !userMenu.contains(event.target)) {
        this.showUserMenu = false;
      }
    });
  }
}
</script>

<style>
/* 全局樣式 */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Helvetica Neue', Arial, sans-serif;
  line-height: 1.6;
  color: #333;
  background-color: #f9f9f9;
}

a {
  text-decoration: none;
  color: inherit;
}

button {
  cursor: pointer;
}

/* 導航欄 */
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background-color: #2196F3;
  color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.navbar-brand {
  font-size: 1.5rem;
  font-weight: bold;
}

.navbar-menu {
  display: flex;
  gap: 1.5rem;
  align-items: center;
}

.nav-item {
  padding: 0.5rem;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.nav-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.router-link-active {
  font-weight: bold;
  background-color: rgba(255, 255, 255, 0.2);
}

.login-btn {
  background-color: rgba(255, 255, 255, 0.2);
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-weight: bold;
}

/* 用戶選單 */
.user-menu {
  position: relative;
}

.user-menu-trigger {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.user-menu-trigger:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.user-menu-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  min-width: 200px;
  z-index: 100;
  margin-top: 0.5rem;
  overflow: hidden;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  color: #333;
  transition: background-color 0.3s;
}

.dropdown-item:hover {
  background-color: #f5f5f5;
}

.dropdown-divider {
  height: 1px;
  background-color: #e0e0e0;
  margin: 0.5rem 0;
}

/* 頁腳 */
.footer {
  text-align: center;
  padding: 2rem;
  margin-top: 3rem;
  color: #757575;
  background-color: #f5f5f5;
  border-top: 1px solid #e0e0e0;
}

/* 響應式設計 */
@media (max-width: 768px) {
  .navbar {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }
  
  .navbar-menu {
    width: 100%;
    justify-content: center;
  }
}
</style>