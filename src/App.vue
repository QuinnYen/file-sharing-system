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
      </div>
    </nav>

    <router-view/>

    <footer class="footer">
      <p>&copy; {{ new Date().getFullYear() }} 雲端檔案上傳與分享系統 - 碩士課堂報告展示</p>
    </footer>
  </div>
</template>

<script>
export default {
  name: 'App'
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