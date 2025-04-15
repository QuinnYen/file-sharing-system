<!-- src/views/About.vue -->
<template>
  <div class="about">
    <div class="container">
      <h1>關於本系統</h1>
      
      <section class="section">
        <h2>專案簡介</h2>
        <p>本系統是一個基於雲端服務的檔案上傳與分享平台，專為碩士課堂報告所開發。透過結合 AWS S3 物件儲存服務和 AWS Amplify 認證機制，打造了一個安全高效的檔案管理解決方案。系統支援檔案上傳、下載、分享以及生命週期管理功能。</p>
      </section>
      
      <section class="section">
        <h2>主要功能</h2>
        <div class="features-grid">
          <div class="feature-item">
            <i class="fas fa-user-shield"></i>
            <h3>使用者認證</h3>
            <p>整合 AWS Cognito 用戶池管理使用者身份，支援註冊、登入、密碼重設等功能。</p>
          </div>
          
          <div class="feature-item">
            <i class="fas fa-cloud-upload-alt"></i>
            <h3>檔案上傳</h3>
            <p>支援拖放或選擇檔案上傳，實時顯示上傳進度，並自動分類儲存。</p>
          </div>
          
          <div class="feature-item">
            <i class="fas fa-share-alt"></i>
            <h3>檔案分享</h3>
            <p>支援生成公開連結或有時效性的臨時連結，方便與他人分享檔案。</p>
          </div>
          
          <div class="feature-item">
            <i class="fas fa-clock"></i>
            <h3>過期機制</h3>
            <p>可為檔案設定過期時間，系統自動處理檔案生命週期，有效管理儲存空間。</p>
          </div>
        </div>
      </section>
      
      <section class="section">
        <h2>使用的技術</h2>
        <div class="tech-stack">
          <div class="tech-item">
            <h3>前端技術</h3>
            <ul>
              <li>Vue.js 3 - 現代化的響應式前端框架</li>
              <li>Vue Router 4 - 頁面路由與導航守衛</li>
              <li>AWS SDK for JavaScript - 與 AWS 服務直接互動</li>
              <li>Responsive CSS - 自適應各種裝置的界面設計</li>
            </ul>
          </div>
          
          <div class="tech-item">
            <h3>雲端服務</h3>
            <ul>
              <li>AWS S3 - 安全且可靠的物件儲存服務</li>
              <li>AWS Cognito - 使用者身份管理與認證</li>
              <li>AWS IAM - 精細的存取控制機制</li>
              <li>AWS Amplify - 前端與雲服務的橋接框架</li>
            </ul>
          </div>
        </div>
      </section>
      
      <section class="section">
        <h2>系統架構</h2>
        <div class="architecture">
          <div class="architecture-diagram">
            <!-- 架構圖保持不變 -->
            <svg width="100%" height="300" viewBox="0 0 800 300">
              <!-- AWS 雲 -->
              <rect x="100" y="50" width="600" height="200" rx="20" ry="20" fill="#f7f7f7" stroke="#232f3e" stroke-width="2" />
              <text x="120" y="80" font-size="18" fill="#232f3e">AWS Cloud</text>
              
              <!-- Amplify / Cognito -->
              <rect x="150" y="120" width="160" height="80" rx="5" ry="5" fill="#FF9900" stroke="#232f3e" stroke-width="2" />
              <text x="175" y="155" font-size="16" fill="white">AWS Amplify</text>
              <text x="175" y="175" font-size="12" fill="white">用戶認證與管理</text>
              
              <!-- S3 -->
              <rect x="490" y="120" width="160" height="80" rx="5" ry="5" fill="#569A31" stroke="#232f3e" stroke-width="2" />
              <text x="540" y="155" font-size="16" fill="white">AWS S3</text>
              <text x="525" y="175" font-size="12" fill="white">檔案儲存與管理</text>
              
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
            <p>本系統採用無伺服器架構，透過 Vue.js 單頁應用程式提供使用者介面。用戶認證透過 AWS Cognito 處理，所有檔案操作透過 AWS SDK 直接與 S3 服務通訊，實現前後端分離的設計。</p>
            <p>系統使用安全憑證管理，針對每個用戶自動創建獨立的檔案儲存區，確保資料隔離與安全。每個上傳的檔案都可以設定過期時間，系統會自動進行生命週期管理。</p>
            <p>此架構具有可擴展性高、維護成本低、安全性佳等優點，非常適合輕量級的檔案分享應用。</p>
          </div>
        </div>
      </section>
      
      <section class="section">
        <h2>安全性考量</h2>
        <div class="security-features">
          <div class="security-item">
            <i class="fas fa-user-lock"></i>
            <h3>身份驗證</h3>
            <p>透過 AWS Cognito 提供安全的使用者身份驗證，支援多因素認證機制。</p>
          </div>
          
          <div class="security-item">
            <i class="fas fa-shield-alt"></i>
            <h3>存取控制</h3>
            <p>檔案權限隔離機制確保使用者只能存取自己的檔案，保障資料安全。</p>
          </div>
          
          <div class="security-item">
            <i class="fas fa-link"></i>
            <h3>安全連結</h3>
            <p>分享功能支援臨時連結生成，可設定過期時間，減少安全風險。</p>
          </div>
        </div>
      </section>
      
      <section class="section">
        <h2>開發者資訊</h2>
        <p>本專案由 顏寬、李世彥 為碩士課程「雲服務管理與安全議題」所開發，僅供教育和展示目的使用。</p>
        <p>更新日期：{{ new Date().toLocaleDateString('zh-TW') }}</p>
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
/* 原有樣式保留 */
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
  margin-bottom: 1.5rem;
}

/* 新增樣式 */
.features-grid, .security-features {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1rem;
}

.feature-item, .security-item {
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 1.5rem;
  text-align: center;
  transition: transform 0.3s ease;
}

.feature-item:hover, .security-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.feature-item i, .security-item i {
  font-size: 2.5rem;
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
  
  .features-grid, .security-features {
    grid-template-columns: 1fr;
  }
}
</style>