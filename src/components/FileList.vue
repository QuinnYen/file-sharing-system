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
          <span class="file-actions">操作</span>
        </div>
        
        <div v-for="file in files" :key="file.key" class="file-item">
          <div class="file-name">
            <i class="fas fa-file"></i>
            {{ file.name }}
          </div>
          <div class="file-size">{{ formatFileSize(file.size) }}</div>
          <div class="file-date">{{ formatDate(file.lastModified) }}</div>
          <div class="file-actions">
            <button class="action-btn download" @click="downloadFile(file)">
              <i class="fas fa-download"></i>
            </button>
            <button class="action-btn share" @click="shareFile(file)">
              <i class="fas fa-share-alt"></i>
            </button>
            <button class="action-btn delete" @click="confirmDelete(file)">
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
  import s3Service from '@/services/s3-service';
  
  export default {
    name: 'FileList',
    data() {
      return {
        files: [],
        loading: true,
        error: null,
        showShareModal: false,
        showDeleteModal: false,
        selectedFile: null,
        shareType: 'public',
        shareLink: '',
        copySuccess: false
      };
    },
    created() {
      this.loadFiles();
    },
    methods: {
      async loadFiles() {
        this.loading = true;
        this.error = null;
        
        try {
          this.files = await s3Service.listFiles();
        } catch (error) {
          this.error = `無法載入檔案列表: ${error.message}`;
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
      downloadFile(file) {
        window.open(file.url, '_blank');
      },
      shareFile(file) {
        this.selectedFile = file;
        this.shareType = 'public';
        this.generateShareLink();
        this.showShareModal = true;
        this.copySuccess = false;
      },
      generateShareLink() {
        if (this.shareType === 'public') {
          this.shareLink = this.selectedFile.url;
        } else {
          // 生成 24 小時有效的預簽名 URL
          try {
            this.shareLink = s3Service.getSignedUrl(this.selectedFile.key, 24 * 60 * 60);
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
      }
    }
  };
  </script>
  
  <style scoped>
  .file-list {
    margin-top: 2rem;
  }
  
  .loading, .error-message, .no-files {
    padding: 2rem;
    text-align: center;
    background-color: #f5f5f5;
    border-radius: 8px;
    margin-bottom: 1rem;
  }
  
  .error-message {
    color: #c62828;
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
  
  .file-size, .file-date {
    flex: 1;
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
  
  .share-options {
    margin: 1rem 0;
  }
  
  .option {
    margin-bottom: 10px;
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
  
  .cancel-btn, .delete-btn {
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .cancel-btn {
    background-color: #e0e0e0;
    border: none;
  }
  
  .delete-btn {
    background-color: #F44336;
    color: white;
    border: none;
  }
  </style>