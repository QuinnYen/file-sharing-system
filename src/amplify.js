// src/amplify.js
// 初始化 Amplify
import { Amplify } from 'aws-amplify';
import awsConfig from './amplify-config';

// 配置 Amplify
Amplify.configure(awsConfig);

export default Amplify;