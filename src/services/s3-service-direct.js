// src/services/s3-service-direct.js
import AWS from 'aws-sdk';

// 使用 Cognito 身份池創建憑證
const getCredentials = async () => {
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
    region: 'ap-northeast-1',
    signatureVersion: 'v4'
  });
};

const bucketName = 'file-sharing-system-20250407'; // 您的 S3 儲存桶名稱

export default {
  /**
   * 上傳檔案到 S3
   * @param {File} file - 要上傳的檔案
   * @param {Function} progressCallback - 上傳進度回調
   * @returns {Promise<Object>} - 上傳結果
   */
  async uploadFile(file, progressCallback = null) {
    try {
      const s3 = await createS3Client();
      // 使用時間戳避免檔案名衝突
      const key = `uploads/${Date.now()}-${file.name}`;
      
      const params = {
        Bucket: bucketName,
        Key: key,
        Body: file,
        ContentType: file.type
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
  async listFiles(prefix = 'uploads/') {
    try {
      const s3 = await createS3Client();
      
      const params = {
        Bucket: bucketName,
        Prefix: prefix
      };

      const result = await s3.listObjectsV2(params).promise();
      
      return result.Contents.map(item => {
        // 建立檔案項目
        const fileName = item.Key.split('/').pop();
        return {
          key: item.Key,
          name: fileName,
          size: item.Size,
          lastModified: item.LastModified,
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
  }
};