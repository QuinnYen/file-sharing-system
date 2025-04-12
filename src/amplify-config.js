const awsConfig = {
    Auth: {
      region: 'ap-northeast-1', // 替換為您的區域
      userPoolId: 'ap-northeast-1_xxxxxxxx', // 替換為您的用戶池 ID
      userPoolWebClientId: 'xxxxxxxxxxxxxxxxxxxxxxxxxx', // 替換為您的應用程式客戶端 ID
      identityPoolId: 'ap-northeast-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', // 替換為您的身份池 ID
      mandatorySignIn: true
    }
  };
  
  export default awsConfig;