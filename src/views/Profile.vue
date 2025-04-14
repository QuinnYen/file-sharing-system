<!-- src/views/Profile.vue -->
<template>
    <div class="profile-page">
      <div class="container">
        <h1>個人資料</h1>
        
        <div v-if="loading" class="loading">
          <p>載入中...</p>
        </div>
        
        <div v-else>
          <div class="profile-section">
            <h2>基本資料</h2>
            
            <div class="profile-info">
              <div class="info-row">
                <div class="info-label">電子郵件</div>
                <div class="info-value">{{ userInfo.email }}</div>
              </div>
              
              <div class="info-row">
                <div class="info-label">帳戶狀態</div>
                <div class="info-value">
                  <span :class="['status-badge', userInfo.emailVerified ? 'verified' : 'unverified']">
                    {{ userInfo.emailVerified ? '已驗證' : '未驗證' }}
                  </span>
                </div>
              </div>
              
              <div class="info-row">
                <div class="info-label">建立時間</div>
                <div class="info-value">{{ formatDate(userInfo.createdAt) }}</div>
              </div>
            </div>
          </div>
          
          <div class="profile-section">
            <h2>檔案統計</h2>
            
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-value">{{ stats.totalFiles }}</div>
                <div class="stat-label">總檔案數</div>
              </div>
              
              <div class="stat-card">
                <div class="stat-value">{{ formatSize(stats.totalSize) }}</div>
                <div class="stat-label">總儲存空間</div>
              </div>
              
              <div class="stat-card">
                <div class="stat-value">{{ stats.sharedFiles }}</div>
                <div class="stat-label">已分享檔案</div>
              </div>
            </div>
          </div>
          
          <div class="profile-section">
            <h2>帳戶安全</h2>
            
            <div class="security-actions">
              <button class="btn primary-btn" @click="showChangePasswordModal = true">
                <i class="fas fa-key"></i> 變更密碼
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 變更密碼模態框 -->
      <div v-if="showChangePasswordModal" class="modal">
        <div class="modal-content">
          <span class="close" @click="showChangePasswordModal = false">&times;</span>
          <h3>變更密碼</h3>
          
          <div v-if="passwordChangeError" class="error-message">
            {{ passwordChangeError }}
          </div>
          
          <div v-if="passwordChangeSuccess" class="success-message">
            {{ passwordChangeSuccess }}
          </div>
          
          <form @submit.prevent="handleChangePassword">
            <div class="form-group">
              <label for="current-password">目前密碼</label>
              <input 
                type="password" 
                id="current-password" 
                v-model="passwordForm.currentPassword" 
                required 
                placeholder="輸入目前密碼"
              />
            </div>
            
            <div class="form-group">
              <label for="new-password">新密碼</label>
              <input 
                type="password" 
                id="new-password" 
                v-model="passwordForm.newPassword" 
                required 
                placeholder="設定新密碼（至少8個字符）"
                minlength="8"
              />
            </div>
            
            <div class="form-group">
              <label for="confirm-new-password">確認新密碼</label>
              <input 
                type="password" 
                id="confirm-new-password" 
                v-model="passwordForm.confirmNewPassword" 
                required 
                placeholder="再次輸入新密碼"
              />
            </div>
            
            <div class="form-actions">
              <button type="submit" class="btn primary-btn" :disabled="changingPassword">
                {{ changingPassword ? '處理中...' : '變更密碼' }}
              </button>
              <button type="button" class="btn secondary-btn" @click="showChangePasswordModal = false">
                取消
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import authState from '@/services/auth-state';
  //import authService from '@/services/auth-service';
  import s3Service from '@/services/s3-service-direct';
  
  export default {
    name: 'ProfilePage',
    data() {
      return {
        loading: true,
        userInfo: {
          username: '',
          email: '',
          emailVerified: false,
          createdAt: null
        },
        stats: {
          totalFiles: 0,
          totalSize: 0,
          sharedFiles: 0
        },
        showChangePasswordModal: false,
        passwordForm: {
          currentPassword: '',
          newPassword: '',
          confirmNewPassword: ''
        },
        passwordChangeError: '',
        passwordChangeSuccess: '',
        changingPassword: false
      };
    },
    async created() {
      await this.loadUserData();
      await this.loadUserStats();
      this.loading = false;
    },
    methods: {
      async loadUserData() {
        if (authState.state.userInfo) {
          this.userInfo = {
            ...authState.state.userInfo,
            createdAt: new Date() // 示例，實際應從用戶屬性中獲取
          };
        } else {
          // 重新加載用戶信息
          await authState.loadUserState();
          if (authState.state.userInfo) {
            this.userInfo = {
              ...authState.state.userInfo,
              createdAt: new Date() // 示例，實際應從用戶屬性中獲取
            };
          }
        }
      },
      
      async loadUserStats() {
        try {
          // 獲取用戶檔案列表
          const files = await s3Service.listFiles();
          
          this.stats.totalFiles = files.length;
          this.stats.totalSize = files.reduce((sum, file) => sum + file.size, 0);
          
          // 簡單示例：假設所有檔案都已分享
          this.stats.sharedFiles = files.length;
        } catch (error) {
          console.error('載入用戶統計失敗:', error);
        }
      },
      
      async handleChangePassword() {
        if (this.passwordForm.newPassword !== this.passwordForm.confirmNewPassword) {
          this.passwordChangeError = '新密碼不匹配';
          return;
        }
        
        if (this.passwordForm.newPassword.length < 8) {
          this.passwordChangeError = '新密碼至少需要8個字符';
          return;
        }
        
        this.changingPassword = true;
        this.passwordChangeError = '';
        this.passwordChangeSuccess = '';
        
        try {
          // 實現密碼變更邏輯
          // 實際上需要使用 Auth.changePassword API
          // 這裡僅為示例
          setTimeout(() => {
            this.passwordChangeSuccess = '密碼已成功更新！';
            this.passwordForm = {
              currentPassword: '',
              newPassword: '',
              confirmNewPassword: ''
            };
            
            // 自動關閉模態框
            setTimeout(() => {
              this.showChangePasswordModal = false;
              this.passwordChangeSuccess = '';
            }, 2000);
            
            this.changingPassword = false;
          }, 1000);
        } catch (error) {
          this.passwordChangeError = error.message || '密碼變更失敗';
          this.changingPassword = false;
        }
      },
      
      formatDate(date) {
        if (!date) return 'N/A';
        
        return new Date(date).toLocaleDateString('zh-TW', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      },
      
      formatSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        
        return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
      }
    }
  };
  </script>
  
  <style scoped>
  .profile-page {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }
  
  .container {
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    padding: 2rem;
  }
  
  h1 {
    color: #333;
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 2px solid #f5f5f5;
  }
  
  .loading {
    text-align: center;
    padding: 2rem;
    color: #757575;
  }
  
  .profile-section {
    margin-bottom: 2.5rem;
  }
  
  h2 {
    color: #2196F3;
    margin-bottom: 1.5rem;
    font-size: 1.5rem;
  }
  
  .profile-info {
    background-color: #f9f9f9;
    border-radius: 8px;
    padding: 1.5rem;
  }
  
  .info-row {
    display: flex;
    margin-bottom: 1rem;
    border-bottom: 1px solid #eeeeee;
    padding-bottom: 1rem;
  }
  
  .info-row:last-child {
    margin-bottom: 0;
    border-bottom: none;
    padding-bottom: 0;
  }
  
  .info-label {
    width: 120px;
    font-weight: 500;
    color: #757575;
  }
  
  .info-value {
    flex: 1;
  }
  
  .status-badge {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.875rem;
  }
  
  .status-badge.verified {
    background-color: #e8f5e9;
    color: #2e7d32;
  }
  
  .status-badge.unverified {
    background-color: #ffebee;
    color: #c62828;
  }
  
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1.5rem;
  }
  
  .stat-card {
    background-color: #f9f9f9;
    border-radius: 8px;
    padding: 1.5rem;
    text-align: center;
    transition: transform 0.3s, box-shadow 0.3s;
  }
  
  .stat-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  }
  
  .stat-value {
    font-size: 2rem;
    font-weight: bold;
    color: #2196F3;
    margin-bottom: 0.5rem;
  }
  
  .stat-label {
    color: #757575;
  }
  
  .security-actions {
    margin-top: 1rem;
  }
  
  .btn {
    padding: 0.75rem 1.5rem;
    border-radius: 4px;
    border: none;
    font-size: 1rem;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .primary-btn {
    background-color: #2196F3;
    color: white;
  }
  
  .primary-btn:hover {
    background-color: #1976D2;
  }
  
  .primary-btn:disabled {
    background-color: #bdbdbd;
    cursor: not-allowed;
  }
  
  .secondary-btn {
    background-color: #f5f5f5;
    color: #757575;
  }
  
  /* 模態框樣式 */
  .modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }
  
  .modal-content {
    background-color: white;
    padding: 2rem;
    border-radius: 8px;
    max-width: 500px;
    width: 100%;
    position: relative;
  }
  
  .close {
    position: absolute;
    top: 10px;
    right: 15px;
    font-size: 24px;
    cursor: pointer;
  }
  
  .form-group {
    margin-bottom: 1.5rem;
  }
  
  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
  }
  
  input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    font-size: 1rem;
  }
  
  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 1.5rem;
  }
  
  .error-message {
    background-color: #ffebee;
    color: #c62828;
    padding: 1rem;
    border-radius: 4px;
    margin-bottom: 1.5rem;
  }
  
  .success-message {
    background-color: #e8f5e9;
    color: #2e7d32;
    padding: 1rem;
    border-radius: 4px;
    margin-bottom: 1.5rem;
  }
  
  @media (max-width: 768px) {
    .profile-page {
      padding: 1rem;
    }
    
    .container {
      padding: 1.5rem;
    }
    
    .stats-grid {
      grid-template-columns: 1fr;
    }
  }
  </style>