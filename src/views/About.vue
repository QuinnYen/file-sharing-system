<!-- src/views/About.vue -->
<template>
    <div class="about">
      <div class="container">
        <h1>關於本系統</h1>
        
        <section class="section">
          <h2>專案簡介</h2>
          <p>本系統是一個基於雲端服務的檔案上傳與分享平台，專為碩士課堂報告所開發。透過結合 AWS S3 物件儲存服務和 AWS Amplify 靜態網站託管，打造了一個簡單高效的檔案管理解決方案。</p>
        </section>
        
        <section class="section">
          <h2>使用的技術</h2>
          <div class="tech-stack">
            <div class="tech-item">
              <h3>前端技術</h3>
              <ul>
                <li>Vue.js 3 - 前端框架</li>
                <li>Vue Router - 頁面路由</li>
                <li>AWS SDK for JavaScript - AWS 服務整合</li>
                <li>CSS3 - 樣式與動畫</li>
              </ul>
            </div>
            
            <div class="tech-item">
              <h3>雲端服務</h3>
              <ul>
                <li>AWS S3 - 物件儲存服務</li>
                <li>AWS Amplify - 靜態網站託管</li>
                <li>AWS IAM - 身份與存取管理</li>
              </ul>
            </div>
          </div>
        </section>
        
        <section class="section">
          <h2>系統架構</h2>
          <div class="architecture">
            <div class="architecture-diagram">
              <!-- 簡單的架構圖 -->
              <svg width="100%" height="300" viewBox="0 0 800 300">
                <!-- AWS 雲 -->
                <rect x="100" y="50" width="600" height="200" rx="20" ry="20" fill="#f7f7f7" stroke="#232f3e" stroke-width="2" />
                <text x="120" y="80" font-size="18" fill="#232f3e">AWS Cloud</text>
                
                <!-- Amplify -->
                <rect x="150" y="120" width="160" height="80" rx="5" ry="5" fill="#FF9900" stroke="#232f3e" stroke-width="2" />
                <text x="175" y="165" font-size="16" fill="white">AWS Amplify</text>
                
                <!-- S3 -->
                <rect x="490" y="120" width="160" height="80" rx="5" ry="5" fill="#569A31" stroke="#232f3e" stroke-width="2" />
                <text x="540" y="165" font-size="16" fill="white">AWS S3</text>
                
                <!-- 連線 -->
                <path d="M310 160 L490 160" stroke="#232f3e" stroke-width="2" />
                <polygon points="485,155 500,160 485,165" fill="#232f3e" />
                
                <!-- 使用者 -->
                <circle cx="50" cy="160" r="30" fill="#4285F4" />
                <text x="50" y="165" font-size="12" fill="white" text-anchor="middle">使用者</text>
                
                <!-- 使用者到 Amplify 的連線 -->
                <path d="M80 160 L150 160" stroke="#232f3e" stroke-width="2" />
                <polygon points="145,155 160,160 145,165" fill="#232f3e" />
              </svg>
            </div>
            <div class="architecture-description">
              <p>本系統採用無伺服器架構，使用者通過 AWS Amplify 託管的 Vue.js 應用程式介面與系統互動。前端直接與 AWS S3 服務通訊，進行檔案上傳、下載和分享等操作，無需後端伺服器。</p>
              <p>這種架構具有高可靠性、可擴展性和低維護成本的特點，同時提供出色的使用者體驗。</p>
            </div>
          </div>
        </section>
        
        <section class="section">
          <h2>開發者資訊</h2>
          <p>本專案由 顏寬、李世彥 為碩士課程報告所開發，僅供教育和展示目的使用。</p>
          <p>日期：{{ new Date().toLocaleDateString() }}</p>
        </section>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'AboutPage'
  }
  </script>
  
  <style scoped>
  .about {
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
  
  .section {
    margin-bottom: 2.5rem;
  }
  
  h2 {
    color: #2196F3;
    margin-bottom: 1rem;
  }
  
  .tech-stack {
    display: flex;
    gap: 2rem;
  }
  
  .tech-item {
    flex: 1;
    background-color: #f9f9f9;
    padding: 1.5rem;
    border-radius: 8px;
  }
  
  h3 {
    margin-bottom: 1rem;
    color: #333;
  }
  
  ul {
    padding-left: 1.5rem;
  }
  
  li {
    margin-bottom: 0.5rem;
  }
  
  .architecture {
    background-color: #f9f9f9;
    padding: 1.5rem;
    border-radius: 8px;
  }
  
  .architecture-diagram {
    margin-bottom: 1.5rem;
    background-color: white;
    padding: 1rem;
    border-radius: 8px;
    border: 1px solid #e0e0e0;
  }
  
  .architecture-description {
    line-height: 1.8;
  }
  
  @media (max-width: 768px) {
    .tech-stack {
      flex-direction: column;
    }
    
    .container {
      padding: 1rem;
    }
  }
  </style>