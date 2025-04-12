<!-- src/views/Home.vue -->
<template>
    <div class="home">
      <header class="header">
        <h1>雲端檔案上傳與分享系統</h1>
        <p>使用 AWS S3 和 Amplify 構建的簡單檔案管理系統</p>
      </header>
  
      <div class="container">
        <FileUploader @file-uploaded="onFileUploaded" />
        <FileList ref="fileList" />
      </div>
    </div>
  </template>
  
  <script>
  import FileUploader from '@/components/FileUploader.vue';
  import FileList from '@/components/FileList.vue';
  
  export default {
    name: 'HomePage',
    components: {
      FileUploader,
      FileList
    },
    methods: {
      onFileUploaded() {
        // 當檔案上傳完成後，刷新檔案列表
        this.$refs.fileList.loadFiles();
      }
    }
  };
  </script>
  
  <style scoped>
  .home {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }
  
  .header {
    text-align: center;
    margin-bottom: 3rem;
  }
  
  .header h1 {
    margin-bottom: 0.5rem;
    color: #333;
  }
  
  .header p {
    color: #757575;
  }
  
  .container {
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    padding: 2rem;
  }
  
  @media (max-width: 768px) {
    .home {
      padding: 1rem;
    }
    
    .container {
      padding: 1rem;
    }
  }
  </style>