<!-- src/views/Login.vue -->
<template>
    <div class="auth-page">
      <div class="auth-container">
        <h1>{{ isLogin ? '登入' : '註冊' }}</h1>
        
        <!-- 錯誤訊息 -->
        <div v-if="error" class="error-message">
          {{ error }}
        </div>
        
        <!-- 成功訊息 -->
        <div v-if="successMessage" class="success-message">
          {{ successMessage }}
        </div>
        
        <!-- 登入表單 -->
        <form v-if="isLogin && !showConfirmation" @submit.prevent="handleLogin">
          <div class="form-group">
            <label for="login-email">電子郵件</label>
            <input 
              type="email" 
              id="login-email" 
              v-model="loginForm.email" 
              required 
              placeholder="您的電子郵件"
            />
          </div>
          
          <div class="form-group">
            <label for="login-password">密碼</label>
            <input 
              type="password" 
              id="login-password" 
              v-model="loginForm.password" 
              required 
              placeholder="您的密碼"
            />
          </div>
          
          <div class="form-actions">
            <button type="submit" class="primary-btn" :disabled="loading">
              {{ loading ? '登入中...' : '登入' }}
            </button>
            <button type="button" class="secondary-btn" @click="forgotPassword">
              忘記密碼
            </button>
          </div>
          
          <div class="form-footer">
            <p>
              還沒有帳戶？
              <a href="#" @click.prevent="toggleMode">註冊新帳戶</a>
            </p>
          </div>
        </form>
        
        <!-- 註冊表單 -->
        <form v-if="!isLogin && !showConfirmation" @submit.prevent="handleSignUp">
          <div class="form-group">
            <label for="signup-email">電子郵件</label>
            <input 
              type="email" 
              id="signup-email" 
              v-model="signupForm.email" 
              required 
              placeholder="您的電子郵件"
            />
          </div>
          
          <div class="form-group">
            <label for="signup-password">密碼</label>
            <input 
              type="password" 
              id="signup-password" 
              v-model="signupForm.password" 
              required 
              placeholder="設定密碼（至少8個字符）"
              minlength="8"
            />
          </div>
          
          <div class="form-group">
            <label for="signup-confirm-password">確認密碼</label>
            <input 
              type="password" 
              id="signup-confirm-password" 
              v-model="signupForm.confirmPassword" 
              required 
              placeholder="再次輸入密碼"
            />
          </div>
          
          <div class="form-actions">
            <button type="submit" class="primary-btn" :disabled="loading">
              {{ loading ? '註冊中...' : '註冊' }}
            </button>
          </div>
          
          <div class="form-footer">
            <p>
              已有帳戶？
              <a href="#" @click.prevent="toggleMode">返回登入</a>
            </p>
          </div>
        </form>
        
        <!-- 驗證碼確認表單 -->
        <form v-if="showConfirmation" @submit.prevent="handleConfirmation">
          <div class="form-group">
            <label for="confirmation-code">驗證碼</label>
            <input 
              type="text" 
              id="confirmation-code" 
              v-model="confirmationCode" 
              required 
              placeholder="請輸入您收到的驗證碼"
            />
            <p class="help-text">
              驗證碼已發送到您的電子郵件地址。請檢查您的收件箱。
            </p>
          </div>
          
          <div class="form-actions">
            <button type="submit" class="primary-btn" :disabled="loading">
              {{ loading ? '驗證中...' : '驗證帳戶' }}
            </button>
            <button type="button" class="secondary-btn" @click="resendCode">
              重新發送驗證碼
            </button>
          </div>
        </form>
        
        <!-- 忘記密碼表單 -->
        <form v-if="showForgotPassword" @submit.prevent="handleForgotPassword">
          <div class="form-group">
            <label for="reset-email">電子郵件</label>
            <input 
              type="email" 
              id="reset-email" 
              v-model="resetForm.email" 
              required 
              placeholder="您的電子郵件"
            />
          </div>
          
          <div v-if="resetForm.showCode" class="form-group">
            <label for="reset-code">驗證碼</label>
            <input 
              type="text" 
              id="reset-code" 
              v-model="resetForm.code" 
              required 
              placeholder="請輸入您收到的驗證碼"
            />
          </div>
          
          <div v-if="resetForm.showCode" class="form-group">
            <label for="new-password">新密碼</label>
            <input 
              type="password" 
              id="new-password" 
              v-model="resetForm.newPassword" 
              required 
              placeholder="設定新密碼（至少8個字符）"
              minlength="8"
            />
          </div>
          
          <div class="form-actions">
            <button type="submit" class="primary-btn" :disabled="loading">
              {{ loading ? '處理中...' : (resetForm.showCode ? '重設密碼' : '發送驗證碼') }}
            </button>
            <button type="button" class="secondary-btn" @click="cancelForgotPassword">
              返回登入
            </button>
          </div>
        </form>
      </div>
    </div>
  </template>
  
  <script>
  import authService from '@/services/auth-service';
  import authState from '@/services/auth-state';
  
  export default {
    name: 'LoginPage',
    data() {
      return {
        isLogin: true,
        showConfirmation: false,
        showForgotPassword: false,
        loading: false,
        error: '',
        successMessage: '',
        confirmationCode: '',
        confirmingUser: '',
        
        loginForm: {
          email: '',
          password: ''
        },
        
        signupForm: {
          email: '',
          password: '',
          confirmPassword: ''
        },
        
        resetForm: {
          email: '',
          code: '',
          newPassword: '',
          showCode: false
        }
      };
    },
    methods: {
      toggleMode() {
        this.isLogin = !this.isLogin;
        this.error = '';
        this.successMessage = '';
      },
      
      async handleLogin() {
        if (!this.validateEmail(this.loginForm.email)) {
          this.error = '請輸入有效的電子郵件地址';
          return;
        }
        
        this.loading = true;
        this.error = '';
        
        try {
          const { success, error } = await authState.signIn(this.loginForm.email, this.loginForm.password);
          
          if (success) {
            // 登入成功，導航到主頁
            this.$router.push('/');
          } else {
            this.error = error || '登入失敗，請檢查您的憑證。';
          }
        } catch (err) {
          this.error = err.message || '登入過程中發生錯誤。';
        } finally {
          this.loading = false;
        }
      },
      
      async handleSignUp() {
        if (!this.validateEmail(this.signupForm.email)) {
          this.error = '請輸入有效的電子郵件地址';
          return;
        }
        
        if (this.signupForm.password !== this.signupForm.confirmPassword) {
          this.error = '密碼不匹配';
          return;
        }
        
        if (this.signupForm.password.length < 8) {
          this.error = '密碼至少需要8個字符';
          return;
        }
        
        this.loading = true;
        this.error = '';
        
        try {
          const response = await authService.signUp(
            this.signupForm.email, 
            this.signupForm.password,
            this.signupForm.email
          );
          
          if (response.success) {
            this.successMessage = response.message;
            this.showConfirmation = true;
            this.confirmingUser = this.signupForm.email;
          } else {
            this.error = response.error || '註冊過程中發生錯誤。';
          }
        } catch (err) {
          this.error = err.message || '註冊過程中發生錯誤。';
        } finally {
          this.loading = false;
        }
      },
      
      async handleConfirmation() {
        if (!this.confirmationCode) {
          this.error = '請輸入驗證碼';
          return;
        }
        
        this.loading = true;
        this.error = '';
        
        try {
          const response = await authService.confirmSignUp(
            this.confirmingUser, 
            this.confirmationCode
          );
          
          if (response.success) {
            this.successMessage = response.message;
            this.showConfirmation = false;
            this.isLogin = true;
            
            // 清空表單
            this.signupForm = {
              email: '',
              password: '',
              confirmPassword: ''
            };
            this.confirmationCode = '';
          } else {
            this.error = response.error || '驗證過程中發生錯誤。';
          }
        } catch (err) {
          this.error = err.message || '驗證過程中發生錯誤。';
        } finally {
          this.loading = false;
        }
      },
      
      async resendCode() {
        this.loading = true;
        this.error = '';
        
        try {
          // 此處需要實作重新發送驗證碼的功能
          this.successMessage = '驗證碼已重新發送到您的電子郵件。';
        } catch (err) {
          this.error = err.message || '重新發送驗證碼時發生錯誤。';
        } finally {
          this.loading = false;
        }
      },
      
      forgotPassword() {
        this.showForgotPassword = true;
        this.isLogin = false;
        this.showConfirmation = false;
        this.error = '';
        this.successMessage = '';
      },
      
      cancelForgotPassword() {
        this.showForgotPassword = false;
        this.isLogin = true;
        this.resetForm = {
          email: '',
          code: '',
          newPassword: '',
          showCode: false
        };
        this.error = '';
        this.successMessage = '';
      },
      
      async handleForgotPassword() {
        if (!this.validateEmail(this.resetForm.email)) {
          this.error = '請輸入有效的電子郵件地址';
          return;
        }
        
        this.loading = true;
        this.error = '';
        
        // 如果已經顯示輸入驗證碼和新密碼的輸入框
        if (this.resetForm.showCode) {
          try {
            const response = await authService.confirmNewPassword(
              this.resetForm.email,
              this.resetForm.code,
              this.resetForm.newPassword
            );
            
            if (response.success) {
              this.successMessage = response.message;
              // 重設完成，返回登入
              setTimeout(() => {
                this.cancelForgotPassword();
              }, 2000);
            } else {
              this.error = response.error || '密碼重設失敗。';
            }
          } catch (err) {
            this.error = err.message || '密碼重設過程中發生錯誤。';
          } finally {
            this.loading = false;
          }
        } else {
          // 第一步：請求發送重設密碼的驗證碼
          try {
            const response = await authService.forgotPassword(this.resetForm.email);
            
            if (response.success) {
              this.successMessage = response.message;
              this.resetForm.showCode = true;
            } else {
              this.error = response.error || '發送重設密碼請求失敗。';
            }
          } catch (err) {
            this.error = err.message || '發送重設密碼請求時發生錯誤。';
          } finally {
            this.loading = false;
          }
        }
      },
      
      validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
      }
    }
  };
  </script>
  
  <style scoped>
  .auth-page {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: calc(100vh - 200px);
    padding: 2rem;
  }
  
  .auth-container {
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    padding: 2rem;
    width: 100%;
    max-width: 500px;
  }
  
  h1 {
    text-align: center;
    margin-bottom: 2rem;
    color: #2196F3;
  }
  
  .form-group {
    margin-bottom: 1.5rem;
  }
  
  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
  }
  
  input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    font-size: 1rem;
  }
  
  .help-text {
    font-size: 0.875rem;
    color: #757575;
    margin-top: 0.5rem;
  }
  
  .form-actions {
    display: flex;
    justify-content: space-between;
    margin-bottom: 1.5rem;
  }
  
  .primary-btn, .secondary-btn {
    padding: 0.75rem 1.5rem;
    border-radius: 4px;
    font-size: 1rem;
    cursor: pointer;
    border: none;
  }
  
  .primary-btn {
    background-color: #2196F3;
    color: white;
  }
  
  .primary-btn:disabled {
    background-color: #bdbdbd;
    cursor: not-allowed;
  }
  
  .secondary-btn {
    background-color: #f5f5f5;
    color: #757575;
  }
  
  .form-footer {
    text-align: center;
    border-top: 1px solid #e0e0e0;
    padding-top: 1.5rem;
  }
  
  .form-footer a {
    color: #2196F3;
    text-decoration: none;
  }
  
  .error-message {
    background-color: #ffebee;
    color: #c62828;
    padding: 1rem;
    border-radius: 4px;
    margin-bottom: 1.5rem;
  }
  
  .success-message {
    background-color: #e8f5e9;
    color: #2e7d32;
    padding: 1rem;
    border-radius: 4px;
    margin-bottom: 1.5rem;
  }
  </style>