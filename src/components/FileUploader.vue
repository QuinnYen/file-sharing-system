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

    <!-- 顯示已選檔案 -->
    <div v-if="selectedFile && !isUploading" class="selected-file">
      <p>已選檔案: {{ selectedFile.name }} ({{ formatFileSize(selectedFile.size) }})</p>
      <button class="upload-btn" @click="uploadFile" :disabled="isUploading">
        上傳檔案
      </button>
    </div>
  </div>
</template>

<script>
// 引用路徑
import s3Service from '@/services/s3-service-direct';

export default {
  name: 'FileUploader',
  data() {
    return {
      selectedFile: null,
      isDragging: false,
      isUploading: false,
      progressPercentage: 0,
      uploadMessage: '',
      uploadError: false
    };
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
      }
    },
    async uploadFile() {
      if (!this.selectedFile) {
        this.uploadMessage = '請先選擇一個檔案';
        this.uploadError = true;
        return;
      }

      this.isUploading = true;
      this.progressPercentage = 0;
      this.uploadMessage = '';
      this.uploadError = false;

      try {
        // 上傳檔案並追蹤進度
        const result = await s3Service.uploadFile(this.selectedFile, (percentage) => {
          this.progressPercentage = percentage;
        });

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

.selected-file {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: #f5f5f5;
  border-radius: 4px;
  margin-top: 1rem;
}

.upload-btn {
  background-color: #2196F3;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
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