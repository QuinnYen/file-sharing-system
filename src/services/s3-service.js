// src/services/s3-service.js
import AWS from 'aws-sdk';

// 使用環境變數
const accessKeyId = process.env.VUE_APP_AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.VUE_APP_AWS_SECRET_ACCESS_KEY;
const region = process.env.VUE_APP_AWS_REGION || 'ap-northeast-1';
const bucketName = process.env.VUE_APP_S3_BUCKET_NAME || 'your-bucket-name';

// 配置 AWS
AWS.config.update({
  region,
  credentials: new AWS.Credentials({
    accessKeyId,
    secretAccessKey
  })
});


// 創建 S3 實例
const s3 = new AWS.S3();

export default {
  /**
   * 上傳檔案到 S3
   * @param {File} file - 要上傳的檔案
   * @param {Function} progressCallback - 上傳進度回調
   * @returns {Promise<Object>} - 上傳結果
   */
  async uploadFile(file, progressCallback = null) {
    const params = {
      Bucket: bucketName,
      Key: `uploads/${Date.now()}-${file.name}`, // 使用時間戳避免檔案名衝突
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

    try {
      const result = await upload.promise();
      return {
        success: true,
        data: result,
        url: result.Location,
        key: result.Key
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
    const params = {
      Bucket: bucketName,
      Prefix: prefix
    };

    try {
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
    const params = {
      Bucket: bucketName,
      Key: key
    };

    try {
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
  getSignedUrl(key, expiresIn = 3600) {
    const params = {
      Bucket: bucketName,
      Key: key,
      Expires: expiresIn
    };

    try {
      return s3.getSignedUrl('getObject', params);
    } catch (error) {
      console.error('生成簽名 URL 時出錯:', error);
      throw error;
    }
  }
};