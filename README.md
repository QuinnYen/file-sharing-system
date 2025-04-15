# 雲端檔案上傳與分享系統

這是一個基於 Vue.js 和 AWS 雲服務打造的檔案上傳與分享平台，專為碩士課堂報告所開發。透過結合 AWS S3 物件儲存服務和 AWS Amplify 認證機制，提供了一個安全高效的檔案管理解決方案。

![fhs](https://github.com/user-attachments/assets/b037c85e-bd3a-4286-ba88-cb9dc5b2f65c)

## 功能特點

* **使用者認證**：整合 AWS Cognito 用戶池，支援註冊、登入、密碼重設等功能
* **檔案上傳**：支援拖放或選擇檔案上傳，實時顯示上傳進度
* **檔案管理**：列出、下載和刪除用戶的檔案
* **檔案分享**：支援生成公開連結或有時效性的臨時連結
* **過期機制**：為檔案設定過期時間，系統自動處理檔案生命週期
* **個人資料**：查看基本資訊和檔案統計數據
* **安全防護**：檔案訪問權限隔離，確保使用者只能操作自己的檔案

## 技術架構

### 前端技術
* **Vue.js 3**：現代化的響應式前端框架
* **Vue Router 4**：頁面路由與導航守衛
* **AWS SDK for JavaScript**：與 AWS 服務直接互動
* **Responsive CSS**：自適應各種裝置的界面設計

### 雲端服務
* **AWS S3**：安全且可靠的物件儲存服務
* **AWS Cognito**：使用者身份管理與認證
* **AWS IAM**：精細的存取控制機制
* **AWS Amplify**：前端與雲服務的橋接框架

## 系統架構圖
![fhs2](https://github.com/user-attachments/assets/a1106d16-630e-478e-8774-08189bf8656e)


本系統採用無伺服器架構，透過 Vue.js 單頁應用程式提供使用者介面。用戶認證透過 AWS Cognito 處理，所有檔案操作透過 AWS SDK 直接與 S3 服務通訊，實現前後端分離的設計。

系統為每個用戶自動創建獨立的檔案儲存區，確保資料隔離與安全。每個上傳的檔案都可以設定過期時間，系統會自動進行生命週期管理。

## 安裝與運行

### 前置需求
* Node.js 14.x 或更高版本
* npm 6.x 或更高版本
* AWS 帳戶

### 安裝步驟

1. 克隆專案到本地
   ```bash
   git clone https://github.com/yourusername/file-sharing-system.git
   cd file-sharing-system
   ```

2. 安裝依賴
   ```bash
   npm install
   ```

3. 修改 AWS 配置 
   打開 `src/amplify-config.js` 文件，按照您的 AWS 資源設置相應參數：
   ```javascript
   const amplifyConfig = {
     Auth: {
       Cognito: {
         userPoolId: 'YOUR_USER_POOL_ID',
         userPoolClientId: 'YOUR_USER_POOL_CLIENT_ID',
         identityPoolId: 'YOUR_IDENTITY_POOL_ID',
         region: 'YOUR_REGION'
       }
     }
   };
   ```

4. 在 `src/services/s3-service-direct.js` 中修改 S3 儲存桶名稱
   ```javascript
   const bucketName = 'YOUR_S3_BUCKET_NAME';
   ```

5. 啟動開發伺服器
   ```bash
   npm run serve
   ```

6. 瀏覽器打開 http://localhost:8080 訪問應用

### 生產環境部署
```bash
npm run build
```
編譯後的文件將被生成到 `dist/` 目錄，可以部署到任何靜態網站托管服務。

## AWS 服務配置指南

### 創建必要的 AWS 資源

1. **創建 Cognito 用戶池**
   * 在 AWS 管理控制台中創建用戶池
   * 設置密碼策略和多因素認證選項
   * 記錄用戶池 ID

2. **創建用戶池應用客戶端**
   * 在用戶池中創建應用客戶端
   * 禁用客戶端密碼
   * 記錄客戶端 ID

3. **創建身份池**
   * 創建新的身份池，啟用未認證的身份訪問
   * 設置身份池與用戶池的關聯
   * 記錄身份池 ID

4. **創建 S3 儲存桶**
   * 創建新的 S3 儲存桶
   * 配置 CORS 以允許前端訪問
   * 設置適當的存取控制策略

5. **配置 IAM 角色**
   * 為認證和未認證使用者配置 IAM 角色
   * 設置 S3 的讀寫權限策略

## 專案結構

```
├── public/                   # 靜態資源
├── src/
│   ├── assets/               # 圖片等資源
│   ├── components/           # Vue 組件
│   │   ├── FileList.vue      # 檔案列表組件
│   │   └── FileUploader.vue  # 檔案上傳組件
│   ├── services/             # 服務層
│   │   ├── auth-service.js   # 認證服務
│   │   ├── auth-state.js     # 認證狀態管理
│   │   └── s3-service-direct.js  # S3 檔案操作服務
│   ├── views/                # 頁面視圖
│   │   ├── About.vue         # 關於頁面
│   │   ├── Home.vue          # 主頁
│   │   ├── Login.vue         # 登入/註冊頁面
│   │   └── Profile.vue       # 用戶個人資料頁面
│   ├── App.vue               # 主應用組件
│   ├── main.js               # 應用入口
│   ├── router.js             # 路由配置
│   └── amplify-config.js     # AWS Amplify 配置
├── babel.config.js           # Babel 配置
├── vue.config.js             # Vue CLI 配置
└── package.json              # 專案依賴和腳本
```

## 安全考量

* 使用 AWS Cognito 的身份池和用戶池進行身份驗證
* 檔案存取權限隔離，確保使用者只能訪問自己的檔案
* 支援生成臨時訪問連結，提高檔案分享安全性
* 過期機制自動清理過期檔案，減少敏感資料洩露風險

## 開發者

* 顏寬
* 李世彥

本專案為碩士課程「雲服務管理與安全議題」所開發，僅供教育和展示目的使用。

## 授權聲明

本專案為教育目的所開發，非商業用途。

*注意：使用本系統前請確保您有適當的 AWS 帳戶和權限，並了解相關服務的計費模式。*
