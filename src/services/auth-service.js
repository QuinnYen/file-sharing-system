// src/services/auth-service.js
import { Auth } from 'aws-amplify';
import AWS from 'aws-sdk';

// Cognito 用戶池配置
const configureAmplify = () => {
  const awsConfig = {
    Auth: {
      // 用戶池配置
      region: 'ap-northeast-1',
      userPoolId: 'ap-northeast-1_XXXXXXXX', // 替換為您的用戶池 ID
      userPoolWebClientId: 'XXXXXXXXXXXXXXXXXX', // 替換為您的應用程式客戶端 ID
      
      // 身份池配置（與您的未驗證身份相同）
      identityPoolId: 'ap-northeast-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', // 替換為您的身份池 ID
      
      // 登入機制設定
      authenticationFlowType: 'USER_PASSWORD_AUTH'
    }
  };

  // 配置 Amplify
  return awsConfig;
};

// 同步 Cognito 憑證到 AWS SDK
const syncCognitoToAwsSDK = async () => {
  const currentCredentials = await Auth.currentCredentials();
  AWS.config.credentials = currentCredentials;
  return AWS.config.credentials;
};

// 服務方法
export default {
  // 獲取配置
  getConfig() {
    return configureAmplify();
  },
  
  // 註冊新用戶
  async signUp(username, password, email) {
    try {
      const result = await Auth.signUp({
        username, // 通常使用電子郵件作為用戶名
        password,
        attributes: {
          email
        }
      });
      
      return {
        success: true,
        data: result,
        message: '註冊成功！請檢查您的電子郵件以完成驗證。'
      };
    } catch (error) {
      console.error('註冊失敗:', error);
      return {
        success: false,
        error: error.message || '註冊過程中發生錯誤。'
      };
    }
  },
  
  // 確認註冊（驗證碼）
  async confirmSignUp(username, code) {
    try {
      await Auth.confirmSignUp(username, code);
      return {
        success: true,
        message: '帳戶已成功驗證！您現在可以登入。'
      };
    } catch (error) {
      console.error('帳戶驗證失敗:', error);
      return {
        success: false,
        error: error.message || '驗證過程中發生錯誤。'
      };
    }
  },
  
  // 登入
  async signIn(username, password) {
    try {
      const user = await Auth.signIn(username, password);
      await syncCognitoToAwsSDK(); // 同步憑證
      
      return {
        success: true,
        user,
        message: '登入成功！'
      };
    } catch (error) {
      console.error('登入失敗:', error);
      return {
        success: false,
        error: error.message || '登入過程中發生錯誤。'
      };
    }
  },
  
  // 登出
  async signOut() {
    try {
      await Auth.signOut();
      return {
        success: true,
        message: '已成功登出。'
      };
    } catch (error) {
      console.error('登出失敗:', error);
      return {
        success: false,
        error: error.message || '登出過程中發生錯誤。'
      };
    }
  },
  
  // 獲取當前用戶
  async getCurrentUser() {
    try {
      const user = await Auth.currentAuthenticatedUser();
      return {
        success: true,
        user,
        isAuthenticated: true
      };
    } catch (error) {
      console.log('未登入或獲取用戶信息失敗');
      return {
        success: false,
        isAuthenticated: false
      };
    }
  },
  
  // 重設密碼
  async forgotPassword(username) {
    try {
      await Auth.forgotPassword(username);
      return {
        success: true,
        message: '已發送密碼重設指示到您的電子郵件。'
      };
    } catch (error) {
      console.error('密碼重設請求失敗:', error);
      return {
        success: false,
        error: error.message || '密碼重設過程中發生錯誤。'
      };
    }
  },
  
  // 確認新密碼
  async confirmNewPassword(username, code, newPassword) {
    try {
      await Auth.forgotPasswordSubmit(username, code, newPassword);
      return {
        success: true,
        message: '密碼已成功重設！您現在可以使用新密碼登入。'
      };
    } catch (error) {
      console.error('密碼重設確認失敗:', error);
      return {
        success: false,
        error: error.message || '密碼重設確認過程中發生錯誤。'
      };
    }
  },
  
  // 同步當前用戶憑證到 AWS SDK
  async syncCredentials() {
    try {
      const credentials = await syncCognitoToAwsSDK();
      return {
        success: true,
        credentials
      };
    } catch (error) {
      console.error('同步憑證失敗:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};