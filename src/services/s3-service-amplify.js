// src/services/s3-service-amplify.js
import { Storage } from 'aws-amplify';

export default {
  /**
   * 上傳檔案到 S3
   * @param {File} file - 要上傳的檔案
   * @param {Function} progressCallback - 上傳進度回調
   * @returns {Promise<Object>} - 上傳結果
   */
  async uploadFile(file, progressCallback = null) {
    try {
      // 使用時間戳避免檔案名衝突
      const key = `uploads/${Date.now()}-${file.name}`;
      
      // 使用 Amplify Storage API 上傳檔案
      const result = await Storage.put(key, file, {
        contentType: file.type,
        progressCallback: progressCallback ? (progress) => {
          const percentage = Math.round((progress.loaded * 100) / progress.total);
          progressCallback(percentage);
        } : undefined
      });
      
      // 取得檔案的公開 URL
      const url = await Storage.get(key);
      
      return {
        success: true,
        data: result,
        url: url,
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
      // 使用 Amplify Storage API 列出檔案
      const result = await Storage.list(prefix);
      
      // 轉換結果格式以匹配原有的 API
      return await Promise.all(result.map(async item => {
        // 建立檔案項目
        const fileName = item.key.split('/').pop();
        const url = await Storage.get(item.key);
        
        return {
          key: item.key,
          name: fileName,
          size: item.size,
          lastModified: item.lastModified,
          url: url,
          // 建立分享連結
          shareUrl: url
        };
      }));
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
      // 使用 Amplify Storage API 刪除檔案
      const result = await Storage.remove(key);
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
      // 使用 Amplify Storage API 獲取預簽名 URL
      const signedURL = await Storage.get(key, { 
        expires: expiresIn
      });
      return signedURL;
    } catch (error) {
      console.error('生成簽名 URL 時出錯:', error);
      throw error;
    }
  }
};