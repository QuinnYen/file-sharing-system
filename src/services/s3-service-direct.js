// src/services/s3-service-direct.js
import AWS from 'aws-sdk';
import authService from './auth-service';

// S3儲存桶名稱
const bucketName = 'file-sharing-system-20250407'; 

// 初始化AWS配置
const initAWS = async () => {
  try {
    // 設置區域
    AWS.config.region = 'ap-southeast-2';
    
    // 嘗試獲取當前用戶
    const userInfo = await authService.getCurrentUser();
    
    if (userInfo && userInfo.success && userInfo.isAuthenticated) {
      console.log('用戶已登入，嘗試使用已驗證身份');
      
      try {
        // 嘗試獲取已驗證身份的憑證
        const session = await authService.syncCredentials();
        if (session && session.success) {
          console.log('已成功同步憑證');
          return true;
        }
      } catch (e) {
        console.warn('同步已驗證憑證失敗，將使用匿名憑證:', e);
      }
    }
    
    // 如果上面失敗或用戶未登入，使用匿名身份
    console.log('使用匿名身份');
    AWS.config.credentials = new AWS.CognitoIdentityCredentials({
      IdentityPoolId: 'ap-southeast-2:c63d43af-25ab-415c-9e8a-0d392b96951a',
    });
    
    // 刷新憑證
    await AWS.config.credentials.getPromise();
    return true;
  } catch (error) {
    console.error('初始化 AWS 配置失敗:', error);
    throw error;
  }
};

// 儲存用戶電子郵件到本地存儲
const saveUserEmail = (email) => {
  if (!email || !email.includes('@')) return false;
  
  try {
    // 保存到 localStorage 和 sessionStorage
    localStorage.setItem('userEmail', email);
    sessionStorage.setItem('userEmail', email);
    console.log('已保存用戶電子郵件:', email);
    return true;
  } catch (e) {
    console.warn('保存用戶電子郵件失敗:', e);
    return false;
  }
};

// 從多個來源獲取用戶電子郵件
const getUserEmail = async () => {
  // 1. 嘗試從 authService 獲取
  try {
    const userInfo = await authService.getCurrentUser();
    if (userInfo && userInfo.success) {
      // 從 userInfo 獲取
      if (userInfo.userInfo && userInfo.userInfo.email) {
        const email = userInfo.userInfo.email;
        saveUserEmail(email);
        return email;
      }
      
      // 從 user.attributes 獲取
      if (userInfo.user && userInfo.user.attributes && userInfo.user.attributes.email) {
        const email = userInfo.user.attributes.email;
        saveUserEmail(email);
        return email;
      }
      
      // 從 username 獲取 (如果看起來像電子郵件)
      if (userInfo.user && userInfo.user.username && userInfo.user.username.includes('@')) {
        const email = userInfo.user.username;
        saveUserEmail(email);
        return email;
      }
    }
  } catch (e) {
    console.warn('從 authService 獲取電子郵件失敗:', e);
  }
  
  // 2. 嘗試從本地儲存獲取
  try {
    // 優先從 localStorage 獲取（更持久）
    const localEmail = localStorage.getItem('userEmail');
    if (localEmail && localEmail.includes('@')) {
      return localEmail;
    }
    
    // 然後嘗試 sessionStorage
    const sessionEmail = sessionStorage.getItem('userEmail');
    if (sessionEmail && sessionEmail.includes('@')) {
      return sessionEmail;
    }
  } catch (e) {
    console.warn('從本地儲存獲取電子郵件失敗:', e);
  }
  
  // 3. 嘗試從頁面元素獲取
  try {
    const userEmailElement = document.querySelector('.user-email') || 
                             document.querySelector('[data-user-email]') ||
                             document.querySelector('.navbar-menu .user-menu-trigger span');
    
    if (userEmailElement) {
      const emailText = userEmailElement.textContent || 
                       userEmailElement.getAttribute('data-user-email');
      
      if (emailText && emailText.includes('@')) {
        saveUserEmail(emailText);
        return emailText;
      }
    }
  } catch (e) {
    console.warn('從頁面元素獲取電子郵件失敗:', e);
  }
  
  // 所有嘗試都失敗
  console.error('無法獲取用戶電子郵件');
  return null;
};

// 獲取用戶前綴 (資料夾路徑)
const getUserPrefix = async () => {
  // 首先嘗試從登入電子郵件獲取
  const loginEmail = localStorage.getItem('userEmail') || sessionStorage.getItem('userEmail');
  
  // 如果找到了電子郵件，則使用它來建立資料夾名稱
  if (loginEmail && loginEmail.includes('@')) {
    // 將電子郵件中的特殊字符轉換為安全的格式
    const safeEmail = loginEmail.replace(/[@.]/g, m => m === '@' ? '-at-' : '-dot-');
    console.log('使用電子郵件作為資料夾名稱:', loginEmail, ' -> ', safeEmail);
    // 直接返回，不再查詢其他來源
    return `users/${safeEmail}/`;
  }
  
  // 如果沒有找到電子郵件，再嘗試其他方式獲取
  try {
    const { success, user, userInfo } = await authService.getCurrentUser();
    
    if (success) {
      let userEmail = '';
      
      // 從各種可能的地方獲取電子郵件
      if (userInfo && userInfo.email) {
        userEmail = userInfo.email;
      } else if (user && user.attributes && user.attributes.email) {
        userEmail = user.attributes.email;
      } else if (user && user.username && user.username.includes('@')) {
        userEmail = user.username;
      }
      
      // 如果找到了電子郵件
      if (userEmail && userEmail.includes('@')) {
        // 將電子郵件保存到本地存儲，以便下次使用
        try {
          localStorage.setItem('userEmail', userEmail);
          sessionStorage.setItem('userEmail', userEmail);
        } catch (e) {
          console.warn('保存電子郵件到存儲失敗:', e);
        }
        
        // 將電子郵件轉換為安全的格式並返回
        const safeEmail = userEmail.replace(/[@.]/g, m => m === '@' ? '-at-' : '-dot-');
        console.log('找到用戶電子郵件並使用作為資料夾:', safeEmail);
        return `users/${safeEmail}/`;
      }
      
      // 如果以上都失敗，但有 username，則使用它
      if (user && user.username) {
        // 不使用Cognito隨機ID，而是使用固定的格式
        const userId = `user-${user.username}`;
        console.log('使用用戶名作為資料夾:', userId);
        return `users/${userId}/`;
      }
    }
    
    // 嘗試從頁面元素獲取電子郵件
    try {
      const userEmailElement = document.querySelector('.user-menu-trigger span');
      if (userEmailElement && userEmailElement.textContent && userEmailElement.textContent.includes('@')) {
        const email = userEmailElement.textContent;
        // 保存並使用這個電子郵件
        localStorage.setItem('userEmail', email);
        const safeEmail = email.replace(/[@.]/g, m => m === '@' ? '-at-' : '-dot-');
        console.log('從頁面元素獲取電子郵件作為資料夾:', safeEmail);
        return `users/${safeEmail}/`;
      }
    } catch (e) {
      console.warn('從頁面元素獲取電子郵件失敗:', e);
    }
    
    // 所有方法都失敗，使用固定的匿名ID
    console.warn('無法獲取用戶標識符，使用匿名ID');
    const anonymousId = localStorage.getItem('anonymousUserId') || `anonymous-${Date.now()}`;
    localStorage.setItem('anonymousUserId', anonymousId);
    return `users/${anonymousId}/`;
  } catch (error) {
    console.error('獲取用戶前綴失敗:', error);
    
    // 確保失敗時也使用 "users/" 前綴，以符合 IAM 政策
    // 但使用一個固定的ID，避免每次都生成新的
    const fallbackId = localStorage.getItem('fallbackUserId') || `fallback-${Date.now()}`;
    localStorage.setItem('fallbackUserId', fallbackId);
    return `users/${fallbackId}/`;
  }
};

// 創建S3客戶端
const createS3Client = async () => {
  await initAWS();
  return new AWS.S3({
    region: 'ap-southeast-2',
    signatureVersion: 'v4'
  });
};

// S3 服務對象
const s3Service = {
  /**
   * 上傳檔案到 S3
   * @param {File} file - 要上傳的檔案
   * @param {Function} progressCallback - 上傳進度回調
   * @param {Object} options - 上傳選項
   * @returns {Promise<Object>} - 上傳結果
   */
  async uploadFile(file, progressCallback = null, options = {}) {
    try {
      const s3 = await createS3Client();
      
      // 獲取用戶前綴
      const userPrefix = await getUserPrefix();
      console.log('正在上傳檔案到:', userPrefix);
      
      if (!userPrefix) {
        throw new Error('無法獲取用戶前綴，上傳失敗');
      }
      
      // 使用時間戳避免檔案名衝突
      const key = `${userPrefix}${Date.now()}-${file.name}`;
      
      // 檢查是否設置了過期時間
      const metadata = {};
      if (options.expires) {
        metadata.Expires = options.expires.toISOString();
      }
      
      const params = {
        Bucket: bucketName,
        Key: key,
        Body: file,
        ContentType: file.type || 'application/octet-stream',
        Metadata: metadata
      };

      // 使用 S3 託管上傳進度追蹤
      const upload = s3.upload(params);
      
      if (progressCallback) {
        upload.on('httpUploadProgress', (progress) => {
          const percentage = Math.round((progress.loaded * 100) / progress.total);
          progressCallback(percentage);
        });
      }

      const result = await upload.promise();
      return {
        success: true,
        data: result,
        url: result.Location,
        key: key
      };
    } catch (error) {
      console.error('上傳檔案時出錯:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * 從 S3 獲取檔案列表
   * @returns {Promise<Array>} - 檔案列表
   */
  async listFiles() {
    try {
      const s3 = await createS3Client();
      
      // 獲取用戶前綴
      const prefix = await getUserPrefix();
      console.log('嘗試列出檔案，使用前綴:', prefix);
      
      // 正確的前綴集合 (包含可能的變體)
      // 移除硬編碼的電子郵件地址，改為更靈活的檢測方式
      const prefixes = [prefix];
      
      // 嘗試從 localStorage 和 sessionStorage 獲取電子郵件生成額外前綴
      try {
        const storedEmail = localStorage.getItem('userEmail') || sessionStorage.getItem('userEmail');
        if (storedEmail && storedEmail.includes('@')) {
          const safeEmail = storedEmail.replace(/[@.]/g, m => m === '@' ? '-at-' : '-dot-');
          const additionalPrefix = `users/${safeEmail}/`;
          
          // 僅當不同於當前前綴時添加
          if (additionalPrefix !== prefix) {
            prefixes.push(additionalPrefix);
          }
        }
      } catch (e) {
        console.warn('獲取額外前綴失敗:', e);
      }
      
      // 所有找到的檔案
      let allFiles = [];
      
      // 對每個可能的前綴嘗試獲取檔案
      for (const currentPrefix of prefixes) {
        try {
          const params = {
            Bucket: bucketName,
            Prefix: currentPrefix
          };
          
          const result = await s3.listObjectsV2(params).promise();
          
          // 如果找到了檔案，處理它們
          if (result.Contents && result.Contents.length > 0) {
            // 處理檔案列表
            const items = result.Contents
              .filter(item => !item.Key.endsWith('/'))
              .map(item => {
                const fileName = item.Key.split('/').pop();
                
                // 元數據處理改為非同步處理，避免阻塞檔案列表返回
                return {
                  key: item.Key,
                  name: fileName,
                  size: item.Size,
                  lastModified: item.LastModified,
                  expiresAt: null, // 先設為null，後續異步更新
                  url: `https://${bucketName}.s3.amazonaws.com/${item.Key}`,
                  shareUrl: `https://${bucketName}.s3.amazonaws.com/${item.Key}`
                };
              });
            
            // 合併找到的檔案
            allFiles = [...allFiles, ...items];
            
            // 如果找到了檔案，則更新本地儲存的電子郵件
            if (items.length > 0 && currentPrefix.includes('-at-')) {
              const inferredEmail = currentPrefix
                .replace('users/', '')
                .replace('/', '')
                .replace(/-at-/g, '@')
                .replace(/-dot-/g, '.');
              
              // 確保電子郵件格式有效
              if (inferredEmail.includes('@')) {
                localStorage.setItem('userEmail', inferredEmail);
                sessionStorage.setItem('userEmail', inferredEmail);
              }
            }
          }
        } catch (prefixError) {
          console.warn(`獲取前綴 ${currentPrefix} 的檔案失敗:`, prefixError);
          // 繼續處理下一個前綴，不中斷整個操作
        }
      }
      
      // 返回文件列表，即使為空也返回數組而不是錯誤
      return allFiles;
    } catch (error) {
      console.error('獲取檔案列表時出錯:', error);
      return []; 
    }
  },

  /**
   * 刪除 S3 檔案
   * @param {string} key - 檔案鍵值
   * @returns {Promise<Object>} - 刪除結果
   */
  async deleteFile(key) {
    try {
      const s3 = await createS3Client();
      
      // 獲取用戶前綴
      const userPrefix = await getUserPrefix();
      
      if (!userPrefix) {
        return {
          success: false,
          error: '無法獲取用戶前綴，刪除失敗'
        };
      }
      
      // 檢查是否是用戶自己的檔案
      if (!key.startsWith(userPrefix)) {
        console.warn('試圖刪除非用戶文件:', key, '用戶前綴:', userPrefix);
        return {
          success: false,
          error: '您沒有權限刪除此檔案'
        };
      }
      
      const params = {
        Bucket: bucketName,
        Key: key
      };

      const result = await s3.deleteObject(params).promise();
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('刪除檔案時出錯:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * 獲取檔案的預簽名 URL（更安全的分享方式）
   * @param {string} key - 檔案鍵值
   * @param {number} expiresIn - URL 過期時間（秒）
   * @returns {string} - 預簽名 URL
   */
  async getSignedUrl(key, expiresIn = 3600) {
    try {
      const s3 = await createS3Client();
      
      const params = {
        Bucket: bucketName,
        Key: key,
        Expires: expiresIn
      };

      return s3.getSignedUrl('getObject', params);
    } catch (error) {
      console.error('生成簽名 URL 時出錯:', error);
      throw error;
    }
  },
  
  /**
   * 設置檔案過期時間
   * @param {string} key - 檔案鍵值
   * @param {Date} expiresAt - 過期時間
   * @returns {Promise<Object>} - 設置結果
   */
  async setFileExpiration(key, expiresAt) {
    try {
      const s3 = await createS3Client();
      
      // 獲取用戶前綴
      const userPrefix = await getUserPrefix();
      
      if (!userPrefix) {
        return {
          success: false,
          error: '無法獲取用戶前綴，設置失敗'
        };
      }
      
      // 檢查權限 - 只允許修改自己的檔案
      if (!key.startsWith(userPrefix)) {
        return {
          success: false,
          error: '您沒有權限修改此檔案'
        };
      }
      
      // 先獲取現有的物件元數據
      const headParams = {
        Bucket: bucketName,
        Key: key
      };
      
      const objectData = await s3.headObject(headParams).promise();
      
      // 更新物件的元數據
      const metadata = objectData.Metadata || {};
      
      if (expiresAt) {
        metadata.Expires = expiresAt.toISOString();
      } else {
        // 如果 expiresAt 為 null，刪除過期設置
        delete metadata.Expires;
      }
      
      // 重新複製物件以更新元數據
      const copyParams = {
        Bucket: bucketName,
        CopySource: `${bucketName}/${key}`,
        Key: key,
        Metadata: metadata,
        MetadataDirective: 'REPLACE'
      };
      
      const result = await s3.copyObject(copyParams).promise();
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('設置檔案過期時間時出錯:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  /**
   * 清除服務的會話數據
   */
  clearSessionData() {
    try {
      // 注意：不清除 localStorage 中的 userEmail
      // 因為我們需要它來維持電子郵件的一致性
      
      // 清除 AWS 憑證
      if (AWS.config.credentials) {
        AWS.config.credentials.clearCachedId();
        AWS.config.credentials = null;
      }
      
      console.log('已清除 S3 服務會話數據');
    } catch (e) {
      console.warn('清除會話數據失敗:', e);
    }
  },
  
  /**
   * 獲取當前用戶的電子郵件
   * @returns {Promise<string>} - 電子郵件
   */
  async getCurrentUserEmail() {
    return await getUserEmail();
  },
  
  /**
   * 獲取當前用戶的前綴
   * @returns {Promise<string>} - 前綴
   */
  async getCurrentUserPrefix() {
    return await getUserPrefix();
  },
  
  /**
   * 設定用戶電子郵件（手動設定）
   * @param {string} email - 電子郵件
   */
  setUserEmail(email) {
    if (!email || !email.includes('@')) {
      console.error('無效的電子郵件:', email);
      return false;
    }
    
    return saveUserEmail(email);
  }
};

export default s3Service;