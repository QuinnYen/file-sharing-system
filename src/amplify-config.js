// src/amplify-config.js
// AWS Amplify 專用配置文件

const amplifyConfig = {
  // v6 版本需要的配置格式
  Auth: {
    Cognito: {
      // 用戶池
      userPoolId: 'ap-southeast-2_SH4OtDwN5',
      userPoolClientId: '1h7od4svptvtk880d774n9122m',
      
      // 身份池 (用於未驗證訪問 S3 等服務)
      identityPoolId: 'ap-southeast-2:c63d43af-25ab-415c-9e8a-0d392b96951a',
      
      // 所在區域
      region: 'ap-southeast-2',
      
      // 登入機制配置
      loginWith: {
        email: false,  // 如果使用電子郵件作為用戶名，這應該設為 true
        username: true,
        phone: false,
        oauth: {
          domain: null,
          scope: [],
          redirectSignIn: [],
          redirectSignOut: [],
          responseType: ''
        }
      }
    }
  }
};

export default amplifyConfig;