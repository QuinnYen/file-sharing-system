// src/services/s3-service-direct.js
import AWS from 'aws-sdk';
import authService from './auth-service';

// 獲取憑證
const getCredentials = async () => {
  // 首先嘗試獲取已驗證用戶的憑證
  try {
    const userInfo = await authService.getCurrentUser();
    if (userInfo && userInfo.success && userInfo.user) {
      console.log('用戶已登入，使用已驗證憑證');
      // 用戶已登入，使用同步過的憑證
      const syncResult = await authService.syncCredentials();
      if (syncResult && syncResult.success) {
        return AWS.config.credentials;
      } else {
        throw new Error('憑證同步失敗');
      }
    } else {
      throw new Error('用戶未登入或無效');
    }
  } catch (error) {
    console.log('未使用已驗證身份，將使用未驗證身份', error);
    
    // 清除任何可能存在的過期憑證
    AWS.config.credentials = null;
    
    // 使用未驗證身份
    AWS.config.region = 'ap-southeast-2'; // 您的區域
    
    // 設置身份池 ID
    AWS.config.credentials = new AWS.CognitoIdentityCredentials({
      IdentityPoolId: 'ap-southeast-2:c63d43af-25ab-415c-9e8a-0d392b96951a', // 替換為您的身份池 ID
    });
    
    // 刷新憑證
    try {
      await AWS.config.credentials.getPromise();
      return AWS.config.credentials;
    } catch (error) {
      console.error('無法獲取 AWS 憑證:', error);
      throw error;
    }
  }
};

// 創建 S3 服務
const createS3Client = async () => {
  await getCredentials();
  return new AWS.S3({
    region: 'ap-southeast-2',
    signatureVersion: 'v4'
  });
};

const bucketName = 'file-sharing-system-20250407'; // 您的 S3 儲存桶名稱

// 獲取用戶特定的前綴
const getUserPrefix = async () => {
  try {
    const { success, user } = await authService.getCurrentUser();
    
    if (success && user) {
      // 嘗試獲取 Cognito Identity ID (子標識符) - 這是與 IAM 策略匹配的值
      let userId = '';
      
      // 嘗試從 AWS 憑證中獲取身份 ID
      try {
        const credentials = AWS.config.credentials;
        if (credentials && credentials.identityId) {
          userId = credentials.identityId;
          console.log('使用 Cognito Identity ID:', userId);
        } else {
          // 備用: 使用用戶名
          userId = user.username || '';
          console.log('使用用戶名作為 ID:', userId);
        }
      } catch (idError) {
        console.warn('無法獲取身份 ID，使用用戶名:', idError);
        userId = user.username || '';
      }
      
      if (!userId) {
        console.warn('無法獲取用戶 ID，使用時間戳');
        userId = `user-${Date.now()}`;
      }
      
      // 使用 "users/" 前綴以符合 IAM 政策
      return `users/${userId}/`;
    }
    
    // 未登入用戶可能無權限使用 S3，但如果要使用，要確保 IAM 有配置相應政策
    throw new Error('用戶未登入，無法獲取 S3 存取權限');
  } catch (error) {
    console.error('獲取用戶前綴失敗:', error);
    // 確保失敗時也使用 "users/" 前綴，以符合 IAM 政策
    const fallbackId = `unknown-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    return `users/${fallbackId}/`;
  }
};

// 創建帶緩存的用戶前綴函數
let cachedPrefix = null;
let prefixExpiry = 0;

const getCachedUserPrefix = async () => {
  const now = Date.now();
  
  // 如果緩存有效且未過期（30分鐘），則使用緩存
  if (cachedPrefix && prefixExpiry > now) {
    return cachedPrefix;
  }
  
  // 否則獲取新前綴並更新緩存
  cachedPrefix = await getUserPrefix();
  prefixExpiry = now + (30 * 60 * 1000); // 30 分鐘有效期
  return cachedPrefix;
};

export default {
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
      
      // 獲取用戶特定前綴（使用緩存）
      const userPrefix = await getCachedUserPrefix();
      console.log('正在上傳檔案到:', userPrefix);
      
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
        ContentType: file.type,
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
   * @param {string} prefix - 可選的前綴過濾
   * @returns {Promise<Array>} - 檔案列表
   */
    async listFiles(prefix = null) {
    try {
      const s3 = await createS3Client();
      
      // 如果沒有提供前綴，則使用用戶特定前綴（使用緩存）
      if (!prefix) {
        prefix = await getCachedUserPrefix();
      }
      
      // 確保前綴以 "users/" 開頭，符合 IAM 政策
      if (!prefix.startsWith('users/')) {
        console.warn('前綴不符合 IAM 政策，調整為用戶路徑');
        // 重新獲取用戶前綴
        prefix = await getUserPrefix();
      }
      
      console.log('正在獲取檔案列表，使用前綴:', prefix);
      
      const params = {
        Bucket: bucketName,
        Prefix: prefix,
        // 添加更多檢查條件，確保只獲取當前前綴的文件
        Delimiter: '/' 
      };
  
      const result = await s3.listObjectsV2(params).promise();
      
      // 檢查是否有內容
      if (!result.Contents || result.Contents.length === 0) {
        console.log('未找到檔案');
        return [];
      }
      
      console.log(`找到 ${result.Contents.length} 個檔案`);
      
      return result.Contents
        // 過濾掉目錄本身
        .filter(item => !item.Key.endsWith('/'))
        .map(item => {
          // 建立檔案項目
          const fileName = item.Key.split('/').pop();
          
          // 檢查元數據中是否有過期時間
          let expiresAt = null;
          
          return {
            key: item.Key,
            name: fileName,
            size: item.Size,
            lastModified: item.LastModified,
            expiresAt: expiresAt,
            url: `https://${bucketName}.s3.amazonaws.com/${item.Key}`,
            // 建立分享連結
            shareUrl: `https://${bucketName}.s3.amazonaws.com/${item.Key}`
          };
        });
    } catch (error) {
      console.error('獲取檔案列表時出錯:', error);
      return []; // 返回空數組而不是拋出錯誤，提高用戶體驗
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
      
      // 檢查是否是用戶自己的檔案
      const userPrefix = await getCachedUserPrefix();
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
      
      // 檢查權限 - 只允許修改自己的檔案
      const userPrefix = await getCachedUserPrefix();
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
      metadata.Expires = expiresAt.toISOString();
      
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
   * 清除此服務産生的會話數據
   */
  clearSessionData() {
    // 清除本地緩存
    sessionStorage.removeItem('anonymousId');
    cachedPrefix = null;
    prefixExpiry = 0;
    
    // 清除 AWS 憑證
    if (AWS.config.credentials) {
      AWS.config.credentials.clearCachedId();
      AWS.config.credentials = null;
    }
    
    console.log('已清除 S3 服務會話數據');
  },
  
  /**
   * 僅供測試 - 獲取當前用戶的前綴
   */
  async _getCurrentPrefix() {
    return await getCachedUserPrefix();
  }
};