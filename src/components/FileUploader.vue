<!-- src/components/FileUploader.vue -->
<template>
  <div class="file-uploader">
    <h2>上傳檔案</h2>
    
    <!-- 拖放上傳區域 -->
    <div 
      class="drop-zone" 
      :class="{ 'active': isDragging }"
      @dragover.prevent="onDragOver"
      @dragleave.prevent="onDragLeave"
      @drop.prevent="onDrop"
      @click="triggerFileInput"
    >
      <div v-if="!isUploading">
        <i class="fas fa-cloud-upload-alt"></i>
        <p>拖放檔案到此處，或點擊選擇檔案</p>
        <input 
          type="file" 
          ref="fileInput" 
          style="display: none" 
          @change="onFileSelected" 
        />
      </div>
      
      <div v-else class="upload-progress">
        <div class="progress-bar">
          <div class="progress" :style="{ width: progressPercentage + '%' }"></div>
        </div>
        <p>{{ progressPercentage }}% 已上傳</p>
      </div>
    </div>

    <!-- 上傳狀態訊息 -->
    <div v-if="uploadMessage" class="upload-message" :class="{ 'error': uploadError }">
      {{ uploadMessage }}
    </div>

    <!-- 顯示已選檔案和過期時間設定 -->
    <div v-if="selectedFile && !isUploading" class="selected-file-container">
      <div class="selected-file">
        <p>已選檔案: {{ selectedFile.name }} ({{ formatFileSize(selectedFile.size) }})</p>
      </div>
      
      <!-- 過期時間設定 -->
      <div class="expiry-settings">
        <label class="expiry-toggle">
          <input type="checkbox" v-model="expiryEnabled">
          <span>自動過期</span>
        </label>
        
        <div v-if="expiryEnabled" class="expiry-options">
          <div class="expiry-option">
            <input 
              type="radio" 
              id="expiry-24h" 
              value="24" 
              v-model="expiryHours"
            >
            <label for="expiry-24h">24小時</label>
          </div>
          
          <div class="expiry-option">
            <input 
              type="radio" 
              id="expiry-72h" 
              value="72" 
              v-model="expiryHours"
            >
            <label for="expiry-72h">3天</label>
          </div>
          
          <div class="expiry-option">
            <input 
              type="radio" 
              id="expiry-168h" 
              value="168" 
              v-model="expiryHours"
            >
            <label for="expiry-168h">7天</label>
          </div>
          
          <div class="expiry-option">
            <input 
              type="radio" 
              id="expiry-custom" 
              value="custom" 
              v-model="expiryHours"
            >
            <label for="expiry-custom">自訂日期</label>
            
            <input 
              v-if="expiryHours === 'custom'" 
              type="date"
              class="custom-date"
              v-model="customExpiryDate"
              :min="minDateString"
            >
          </div>
        </div>
        
        <div v-if="expiryEnabled" class="expiry-info">
          <p>
            此檔案將在 <strong>{{ formatExpiryDate(calculateExpiryDate()) }}</strong> 後自動刪除
          </p>
        </div>
      </div>
      
      <button class="upload-btn" @click="uploadFile" :disabled="isUploading">
        上傳檔案
      </button>
    </div>
  </div>
</template>

<script>
// 引用路徑
import s3Service from '@/services/s3-service-direct';
import authState from '@/services/auth-state';

export default {
  name: 'FileUploader',
  data() {
    return {
      selectedFile: null,
      isDragging: false,
      isUploading: false,
      progressPercentage: 0,
      uploadMessage: '',
      uploadError: false,
      
      // 過期時間設定
      expiryEnabled: false,
      expiryHours: "24",  // 預設24小時
      customExpiryDate: null,
      
      // 最小日期（明天）
      minDateString: this.getMinDateString()
    };
  },
  computed: {
    isAuthenticated() {
      return authState.state.isAuthenticated;
    }
  },
  methods: {
    triggerFileInput() {
      this.$refs.fileInput.click();
    },
    onFileSelected(event) {
      const files = event.target.files;
      if (files.length > 0) {
        this.selectedFile = files[0];
        this.uploadMessage = '';
        
        // 預設過期時間設置
        this.expiryEnabled = false;
        this.expiryHours = "24";
        this.customExpiryDate = null;
      }
    },
    onDragOver() {
      this.isDragging = true;
    },
    onDragLeave() {
      this.isDragging = false;
    },
    onDrop(event) {
      this.isDragging = false;
      const files = event.dataTransfer.files;
      if (files.length > 0) {
        this.selectedFile = files[0];
        this.uploadMessage = '';
        
        // 預設過期時間設置
        this.expiryEnabled = false;
        this.expiryHours = "24";
        this.customExpiryDate = null;
      }
    },
    async uploadFile() {
      if (!this.selectedFile) {
        this.uploadMessage = '請先選擇一個檔案';
        this.uploadError = true;
        return;
      }

      // 檢查用戶是否登入
      if (!this.isAuthenticated) {
        this.uploadMessage = '請先登入以上傳檔案';
        this.uploadError = true;
        return;
      }

      this.isUploading = true;
      this.progressPercentage = 0;
      this.uploadMessage = '';
      this.uploadError = false;

      try {
        // 獲取過期時間（如果啟用）
        const options = {};
        if (this.expiryEnabled) {
          options.expires = this.calculateExpiryDate();
        }
        
        // 上傳檔案並追蹤進度
        const result = await s3Service.uploadFile(this.selectedFile, (percentage) => {
          this.progressPercentage = percentage;
        }, options);

        if (result.success) {
          this.uploadMessage = '檔案上傳成功！';
          this.selectedFile = null;
          
          // 發送事件通知父組件更新檔案列表
          this.$emit('file-uploaded', result.data);
        } else {
          this.uploadMessage = `上傳失敗: ${result.error}`;
          this.uploadError = true;
        }
      } catch (error) {
        this.uploadMessage = `上傳失敗: ${error.message}`;
        this.uploadError = true;
      } finally {
        this.isUploading = false;
      }
    },
    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes';
      
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(1024));
      
      return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
    },
    
    // 計算過期日期
    calculateExpiryDate() {
      const now = new Date();
      
      if (this.expiryHours === 'custom' && this.customExpiryDate) {
        return new Date(this.customExpiryDate + 'T23:59:59');
      } else {
        const hours = parseInt(this.expiryHours);
        return new Date(now.getTime() + hours * 60 * 60 * 1000);
      }
    },
    
    // 格式化過期日期
    formatExpiryDate(date) {
      if (!date) return '';
      
      return date.toLocaleString('zh-TW', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    },
    
    // 獲取最小日期字符串 (明天)
    getMinDateString() {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString().split('T')[0];
    }
  }
};
</script>

<style scoped>
.file-uploader {
  margin-bottom: 2rem;
}

.drop-zone {
  border: 2px dashed #ccc;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: #f9f9f9;
  margin-bottom: 1rem;
}

.drop-zone.active {
  border-color: #2196F3;
  background-color: #e3f2fd;
}

.drop-zone i {
  font-size: 3rem;
  color: #757575;
  margin-bottom: 1rem;
}

.drop-zone p {
  margin: 0;
  color: #757575;
}

.upload-progress {
  width: 100%;
}

.progress-bar {
  width: 100%;
  height: 20px;
  background-color: #e0e0e0;
  border-radius: 10px;
  margin-bottom: 10px;
  overflow: hidden;
}

.progress {
  height: 100%;
  background-color: #4CAF50;
  border-radius: 10px;
  transition: width 0.3s ease;
}

.upload-message {
  margin-top: 1rem;
  padding: 0.5rem;
  border-radius: 4px;
  background-color: #e8f5e9;
  color: #2e7d32;
}

.upload-message.error {
  background-color: #ffebee;
  color: #c62828;
}

.selected-file-container {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  margin-top: 1rem;
}

.selected-file {
  padding: 1rem;
  background-color: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
}

.expiry-settings {
  padding: 1rem;
  background-color: white;
}

.expiry-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  margin-bottom: 1rem;
  cursor: pointer;
}

.expiry-options {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1rem;
}

.expiry-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.custom-date {
  margin-left: 0.5rem;
  padding: 0.25rem;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
}

.expiry-info {
  background-color: #e3f2fd;
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.upload-btn {
  width: 100%;
  padding: 1rem;
  background-color: #2196F3;
  color: white;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.upload-btn:hover {
  background-color: #1976D2;
}

.upload-btn:disabled {
  background-color: #bdbdbd;
  cursor: not-allowed;
}
</style>