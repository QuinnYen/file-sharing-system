// src/services/s3-service-direct.js
import AWS from 'aws-sdk';
// 移除未使用的導入
import authService from './auth-service';

// 獲取憑證 - 現在支援已驗證和未驗證用戶
const getCredentials = async () => {
  // 首先嘗試獲取已驗證用戶的憑證
  try {
    const { success } = await authService.getCurrentUser();
    if (success) {
      // 用戶已登入，使用同步過的憑證
      const { success: syncSuccess } = await authService.syncCredentials();
      if (syncSuccess) {
        return AWS.config.credentials;
      }
    }
  } catch (error) {
    console.log('未使用已驗證身份，將使用未驗證身份', error);
  }
  
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
  const { success, user } = await authService.getCurrentUser();
  
  if (success && user) {
    // 使用用戶ID作為前綴，確保每個用戶有自己的"文件夾"
    return `users/${user.username}/`;
  }
  
  // 未登入用戶使用公共區域
  return 'public/';
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
      
      // 獲取用戶特定前綴
      const userPrefix = await getUserPrefix();
      
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
      
      // 如果沒有提供前綴，則使用用戶特定前綴
      if (!prefix) {
        prefix = await getUserPrefix();
      }
      
      const params = {
        Bucket: bucketName,
        Prefix: prefix
      };

      const result = await s3.listObjectsV2(params).promise();
      
      // 檢查是否有內容
      if (!result.Contents || result.Contents.length === 0) {
        return [];
      }
      
      return result.Contents.map(item => {
        // 建立檔案項目
        const fileName = item.Key.split('/').pop();
        
        // 檢查是否有過期時間
        let expiresAt = null;
        if (item.Metadata && item.Metadata.Expires) {
          expiresAt = new Date(item.Metadata.Expires);
        }
        
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
      throw error;
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
      const userPrefix = await getUserPrefix();
      if (!key.startsWith(userPrefix) && !key.startsWith('public/')) {
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
  }
};