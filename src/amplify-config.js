// src/amplify-config.js
const awsConfig = {
    Auth: {
      // 身份池設定
      identityPoolId: 'ap-southeast-2:c63d43af-25ab-415c-9e8a-0d392b96951a', // 替換為您的身份池 ID
      region: 'ap-southeast-2', // 您的區域
      
      // 設定為 false 以允許未登入用戶訪問
      mandatorySignIn: false
    },
    
    Storage: {
      AWSS3: {
        bucket: 'file-sharing-system-20250407', // 您的 S3 儲存桶名稱
        region: 'ap-southeast-2', // 您的區域
        
        // 簽名級別，可以是：public, private, protected
        // 這裡設定為 public 示例意味著所有用戶都可以讀取文件
        level: 'public'
      }
    }
  };
  
  export default awsConfig;