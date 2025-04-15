<!-- src/components/FileList.vue -->
<template>
  <div class="file-list">
    <h2>檔案列表</h2>
    
    <!-- 載入中狀態 -->
    <div v-if="loading" class="loading">
      <p>正在載入檔案列表...</p>
    </div>
    
    <!-- 錯誤訊息 -->
    <div v-else-if="error" class="error-message">
      <p>{{ error }}</p>
      <button @click="loadFiles">重試</button>
    </div>
    
    <!-- 未登入提示 -->
    <div v-else-if="!isAuthenticated" class="login-prompt">
      <p>請先登入以查看您的檔案</p>
      <router-link to="/login" class="login-btn">登入</router-link>
    </div>
    
    <!-- 無檔案時顯示 -->
    <div v-else-if="files.length === 0" class="no-files">
      <p>目前沒有上傳任何檔案</p>
    </div>
    
    <!-- 檔案列表 -->
    <div v-else class="files-container">
      <div class="files-header">
        <span class="file-name">檔案名稱</span>
        <span class="file-size">大小</span>
        <span class="file-date">上傳日期</span>
        <span class="file-expiry">過期時間</span>
        <span class="file-actions">操作</span>
      </div>
      
      <div v-for="file in files" :key="file.key" class="file-item">
        <div class="file-name">
          <i class="fas fa-file"></i>
          {{ file.name }}
        </div>
        <div class="file-size">{{ formatFileSize(file.size) }}</div>
        <div class="file-date">{{ formatDate(file.lastModified) }}</div>
        <div class="file-expiry">
          <span v-if="file.expiresAt" :class="['expiry-badge', getExpiryClass(file.expiresAt)]">
            {{ formatExpiryTime(file.expiresAt) }}
          </span>
          <span v-else>永不過期</span>
        </div>
        <div class="file-actions">
          <button class="action-btn download" @click="downloadFile(file)" title="下載">
            <i class="fas fa-download"></i>
          </button>
          <button class="action-btn share" @click="shareFile(file)" title="分享">
            <i class="fas fa-share-alt"></i>
          </button>
          <button class="action-btn edit" @click="editExpiry(file)" title="編輯過期時間">
            <i class="fas fa-clock"></i>
          </button>
          <button class="action-btn delete" @click="confirmDelete(file)" title="刪除">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    </div>
    
    <!-- 分享模態框 -->
    <div v-if="showShareModal" class="modal">
      <div class="modal-content">
        <span class="close" @click="showShareModal = false">&times;</span>
        <h3>分享檔案</h3>
        <p>{{ selectedFile?.name }}</p>
        
        <div class="share-options">
          <div class="option">
            <input 
              type="radio" 
              id="public-link" 
              value="public" 
              v-model="shareType"
              @change="generateShareLink" 
            />
            <label for="public-link">公開連結</label>
          </div>
          <div class="option">
            <input 
              type="radio" 
              id="temporary-link" 
              value="temporary" 
              v-model="shareType"
              @change="generateShareLink" 
            />
            <label for="temporary-link">臨時連結（24小時有效）</label>
          </div>
        </div>
        
        <div class="share-link">
          <input type="text" v-model="shareLink" readonly />
          <button @click="copyShareLink">複製連結</button>
        </div>
        
        <div v-if="copySuccess" class="copy-success">
          連結已複製到剪貼簿
        </div>
      </div>
    </div>
    
    <!-- 過期時間編輯模態框 -->
    <div v-if="showExpiryModal" class="modal">
      <div class="modal-content">
        <span class="close" @click="showExpiryModal = false">&times;</span>
        <h3>編輯過期時間</h3>
        <p>檔案: {{ selectedFile?.name }}</p>
        
        <div class="expiry-form">
          <div class="form-option">
            <input 
              type="radio" 
              id="expiry-none" 
              value="none" 
              v-model="expiryType"
            />
            <label for="expiry-none">永不過期</label>
          </div>
          
          <div class="form-option">
            <input 
              type="radio" 
              id="expiry-24h" 
              value="24" 
              v-model="expiryType"
            />
            <label for="expiry-24h">24小時後過期</label>
          </div>
          
          <div class="form-option">
            <input 
              type="radio" 
              id="expiry-72h" 
              value="72" 
              v-model="expiryType"
            />
            <label for="expiry-72h">3天後過期</label>
          </div>
          
          <div class="form-option">
            <input 
              type="radio" 
              id="expiry-168h" 
              value="168" 
              v-model="expiryType"
            />
            <label for="expiry-168h">7天後過期</label>
          </div>
          
          <div class="form-option">
            <input 
              type="radio" 
              id="expiry-custom-date" 
              value="custom" 
              v-model="expiryType"
            />
            <label for="expiry-custom-date">自訂日期</label>
            
            <input 
              v-if="expiryType === 'custom'" 
              type="date"
              class="custom-date"
              v-model="customExpiryDate"
              :min="minDateString"
            />
          </div>
        </div>
        
        <div class="modal-actions">
          <button class="save-btn" @click="saveExpiry" :disabled="savingExpiry">
            {{ savingExpiry ? '儲存中...' : '儲存' }}
          </button>
          <button class="cancel-btn" @click="showExpiryModal = false">取消</button>
        </div>
      </div>
    </div>
    
    <!-- 刪除確認模態框 -->
    <div v-if="showDeleteModal" class="modal">
      <div class="modal-content">
        <span class="close" @click="showDeleteModal = false">&times;</span>
        <h3>確認刪除</h3>
        <p>確定要刪除檔案 "{{ selectedFile?.name }}" 嗎？</p>
        <p class="warning">此操作無法撤銷。</p>
        
        <div class="modal-actions">
          <button class="cancel-btn" @click="showDeleteModal = false">取消</button>
          <button class="delete-btn" @click="deleteFile">刪除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// 引入服務
import s3Service from '@/services/s3-service-direct';
import authState from '@/services/auth-state';

export default {
  name: 'FileList',
  data() {
    return {
      files: [],
      loading: true,
      error: null,
      showShareModal: false,
      showDeleteModal: false,
      showExpiryModal: false,
      selectedFile: null,
      shareType: 'public',
      shareLink: '',
      copySuccess: false,
      
      // 過期時間編輯
      expiryType: 'none',
      customExpiryDate: null,
      savingExpiry: false,
      
      // 最小日期（明天）
      minDateString: this.getMinDateString()
    };
  },
  computed: {
    isAuthenticated() {
      return authState.state.isAuthenticated;
    }
  },
  created() {
    this.loadFiles();
    
    // 監聽用戶狀態變化
    this.$watch(
      () => authState.state.isAuthenticated,
      (newValue) => {
        if (newValue) {
          this.loadFiles();
        } else {
          this.files = [];
        }
      }
    );
  },
  methods: {
    // 修改 FileList.vue 的 loadFiles 方法

    async loadFiles() {
      this.loading = true;
      this.error = null;
      
      if (!this.isAuthenticated) {
        this.loading = false;
        console.log('未登入，不載入檔案');
        return;
      }
      
      try {
        console.log('開始載入檔案列表...');
        const response = await s3Service.listFiles();
        
        // 檢查是否是錯誤響應
        if (response && response.success === false) {
          this.error = response.error || '獲取檔案列表失敗';
          this.files = [];
          console.error('檔案列表載入失敗:', this.error);
          return;
        }
        
        // 正常數組處理
        this.files = response;
        
        // 現有的檔案處理邏輯...
      } catch (error) {
        console.error('載入檔案列表時出錯:', error);
        this.error = `無法載入檔案列表: ${error.message || '未知錯誤'}`;
        this.files = [];
      } finally {
        this.loading = false;
      }
    },
    
    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes';
      
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(1024));
      
      return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
    },
    formatDate(date) {
      if (!date) return '';
      
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    },
    formatExpiryTime(date) {
      if (!date) return '永不過期';
      
      const expiryDate = new Date(date);
      const now = new Date();
      
      // 如果已過期
      if (expiryDate < now) {
        return '已過期';
      }
      
      // 計算剩餘時間
      const diffMs = expiryDate - now;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      
      if (diffDays > 0) {
        return `${diffDays}天${diffHours}小時後過期`;
      } else {
        return `${diffHours}小時後過期`;
      }
    },
    getExpiryClass(date) {
      if (!date) return '';
      
      const expiryDate = new Date(date);
      const now = new Date();
      
      // 如果已過期
      if (expiryDate < now) {
        return 'expired';
      }
      
      // 計算剩餘時間
      const diffMs = expiryDate - now;
      const diffHours = diffMs / (1000 * 60 * 60);
      
      if (diffHours <= 24) {
        return 'expiring-soon';
      } else {
        return 'active';
      }
    },
    downloadFile(file) {
      window.open(file.url, '_blank');
    },
    async shareFile(file) {
      this.selectedFile = file;
      this.shareType = 'public';
      await this.generateShareLink();
      this.showShareModal = true;
      this.copySuccess = false;
    },
    async generateShareLink() {
      if (this.shareType === 'public') {
        this.shareLink = this.selectedFile.url;
      } else {
        // 生成 24 小時有效的預簽名 URL
        try {
          this.shareLink = await s3Service.getSignedUrl(this.selectedFile.key, 24 * 60 * 60);
        } catch (error) {
          this.shareLink = '無法生成臨時連結';
        }
      }
    },
    copyShareLink() {
      try {
        navigator.clipboard.writeText(this.shareLink).then(() => {
          this.copySuccess = true;
          setTimeout(() => {
            this.copySuccess = false;
          }, 3000);
        });
      } catch (err) {
        // 舊版瀏覽器可能不支援 navigator.clipboard
        const textarea = document.createElement('textarea');
        textarea.value = this.shareLink;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        this.copySuccess = true;
        setTimeout(() => {
          this.copySuccess = false;
        }, 3000);
      }
    },
    confirmDelete(file) {
      this.selectedFile = file;
      this.showDeleteModal = true;
    },
    async deleteFile() {
      try {
        const result = await s3Service.deleteFile(this.selectedFile.key);
        
        if (result.success) {
          // 從列表中移除檔案
          this.files = this.files.filter(file => file.key !== this.selectedFile.key);
          this.showDeleteModal = false;
        } else {
          alert(`刪除失敗: ${result.error}`);
        }
      } catch (error) {
        alert(`刪除失敗: ${error.message}`);
      }
    },
    
    // 編輯過期時間
    editExpiry(file) {
      this.selectedFile = file;
      
      // 設定預設值
      if (file.expiresAt) {
        const expiryDate = new Date(file.expiresAt);
        this.expiryType = 'custom';
        this.customExpiryDate = expiryDate.toISOString().split('T')[0];
      } else {
        this.expiryType = 'none';
        this.customExpiryDate = null;
      }
      
      this.showExpiryModal = true;
    },
    
    // 儲存過期時間
    async saveExpiry() {
      if (!this.selectedFile) return;
      
      this.savingExpiry = true;
      
      try {
        let expiryDate = null;
        
        if (this.expiryType === 'none') {
          // 不設定過期時間
          expiryDate = null;
        } else if (this.expiryType === 'custom' && this.customExpiryDate) {
          // 使用自定義日期
          expiryDate = new Date(this.customExpiryDate + 'T23:59:59');
        } else {
          // 使用預設時間（小時）
          const hours = parseInt(this.expiryType);
          expiryDate = new Date(new Date().getTime() + hours * 60 * 60 * 1000);
        }
        
        // 更新檔案的過期時間
        const result = await s3Service.setFileExpiration(this.selectedFile.key, expiryDate);
        
        if (result.success) {
          // 更新本地檔案列表
          const fileIndex = this.files.findIndex(f => f.key === this.selectedFile.key);
          if (fileIndex !== -1) {
            this.files[fileIndex].expiresAt = expiryDate;
          }
          
          // 關閉模態框
          this.showExpiryModal = false;
        } else {
          alert(`設定過期時間失敗: ${result.error}`);
        }
      } catch (error) {
        alert(`設定過期時間失敗: ${error.message}`);
      } finally {
        this.savingExpiry = false;
      }
    },
    
    // 獲取最小日期字符串（明天）
    getMinDateString() {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString().split('T')[0];
    }
  }
};
</script>

<style scoped>
.file-list {
  margin-top: 2rem;
}

.loading, .error-message, .no-files, .login-prompt {
  padding: 2rem;
  text-align: center;
  background-color: #f5f5f5;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.error-message {
  color: #c62828;
}

.login-prompt {
  background-color: #e3f2fd;
  color: #1976D2;
}

.login-btn {
  display: inline-block;
  margin-top: 1rem;
  padding: 0.5rem 1.5rem;
  background-color: #2196F3;
  color: white;
  border-radius: 4px;
  font-weight: bold;
  transition: background-color 0.3s;
}

.login-btn:hover {
  background-color: #1976D2;
}

.files-container {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
}

.files-header {
  display: flex;
  padding: 1rem;
  background-color: #f5f5f5;
  font-weight: bold;
  border-bottom: 1px solid #e0e0e0;
}

.file-item {
  display: flex;
  padding: 1rem;
  border-bottom: 1px solid #e0e0e0;
  align-items: center;
  transition: background-color 0.2s;
}

.file-item:last-child {
  border-bottom: none;
}

.file-item:hover {
  background-color: #f5f5f5;
}

.file-name {
  flex: 3;
  display: flex;
  align-items: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-name i {
  margin-right: 10px;
  color: #757575;
}

.file-size, .file-date, .file-expiry {
  flex: 1;
}

.expiry-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.85rem;
}

.expiry-badge.active {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.expiry-badge.expiring-soon {
  background-color: #fff3e0;
  color: #e65100;
}

.expiry-badge.expired {
  background-color: #ffebee;
  color: #c62828;
}

.file-actions {
  flex: 1;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.action-btn {
  border: none;
  background: none;
  cursor: pointer;
  padding: 6px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.action-btn:hover {
  background-color: #e0e0e0;
}

.download {
  color: #2196F3;
}

.share {
  color: #4CAF50;
}

.edit {
  color: #FF9800;
}

.delete {
  color: #F44336;
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

.share-options, .expiry-form {
  margin: 1rem 0;
}

.option, .form-option {
  margin-bottom: 15px;
  display: flex;
  align-items: center;
}

.custom-date {
  margin-left: 0.5rem;
  padding: 0.25rem 0.5rem;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
}

.share-link {
  display: flex;
  margin-top: 1rem;
}

.share-link input {
  flex: 1;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px 0 0 4px;
}

.share-link button {
  background-color: #2196F3;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 0 4px 4px 0;
  cursor: pointer;
}

.copy-success {
  margin-top: 1rem;
  padding: 0.5rem;
  background-color: #e8f5e9;
  color: #2e7d32;
  border-radius: 4px;
  text-align: center;
}

.warning {
  color: #F44336;
  font-style: italic;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 2rem;
}

.cancel-btn, .delete-btn, .save-btn {
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  border: none;
}

.cancel-btn {
  background-color: #e0e0e0;
}

.save-btn {
  background-color: #4CAF50;
  color: white;
}

.save-btn:disabled {
  background-color: #bdbdbd;
  cursor: not-allowed;
}

.delete-btn {
  background-color: #F44336;
  color: white;
}
</style>