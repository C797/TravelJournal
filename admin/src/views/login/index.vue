<template>
  <div class="login-page">
    <div class="brand-panel">
      <div class="brand-logo">途</div>
      <div class="brand-name">途记 TravelJournal</div>
      <div class="brand-sub">旅行日记 · 后台管理系统</div>
    </div>
    <div class="form-panel">
      <div class="login-card">
        <h2 class="card-title">管理员登录</h2>
        <p class="card-sub">欢迎回来，请登录你的账号</p>
        <div class="field" :class="{ error: errorMsg }">
          <span class="field-label">账号</span>
          <input
            v-model="account"
            class="field-input"
            placeholder="请输入账号"
            autocomplete="username"
            @keyup.enter="focusPassword"
          />
        </div>
        <div class="field" :class="{ error: errorMsg }">
          <span class="field-label">密码</span>
          <input
            ref="pwdRef"
            v-model="password"
            type="password"
            class="field-input"
            placeholder="请输入密码"
            autocomplete="current-password"
            @keyup.enter="onLogin"
          />
        </div>
        <p v-if="errorMsg" class="error-tip">{{ errorMsg }}</p>
        <button class="login-btn" :disabled="loading" @click="onLogin">
          {{ loading ? '登录中…' : '登 录' }}
        </button>
        <p class="agreement">登录即代表同意《服务协议》与《隐私政策》</p>
        <p class="demo-tip">演示账号：admin / admin123</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const account = ref('admin')
const password = ref('')
const loading = ref(false)
const errorMsg = ref('')
const pwdRef = ref<HTMLInputElement | null>(null)

function focusPassword() {
  pwdRef.value?.focus()
}

async function onLogin() {
  if (loading.value) return
  errorMsg.value = ''

  if (!account.value.trim()) {
    errorMsg.value = '请输入账号'
    return
  }
  if (!password.value) {
    errorMsg.value = '请输入密码'
    return
  }

  loading.value = true
  try {
    await authStore.login(account.value, password.value)
    router.push('/dashboard')
  } catch (e: any) {
    errorMsg.value = e?.message || '登录失败，请重试'
    password.value = ''
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  display: flex;
  height: 100%;
}
.brand-panel {
  width: 39%;
  background: #17332a;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
}
.brand-logo {
  width: 60px;
  height: 60px;
  border-radius: 14px;
  background: #2e9e5b;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
  font-weight: 700;
}
.brand-name {
  color: #fff;
  font-size: 26px;
  font-weight: 700;
}
.brand-sub {
  color: #8fa39a;
  font-size: 13px;
}
.form-panel {
  flex: 1;
  background: #f5f6f7;
  display: flex;
  align-items: center;
  justify-content: center;
}
.login-card {
  width: 340px;
  background: #fff;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
}
.card-title {
  font-size: 20px;
  font-weight: 700;
  color: #1a1a1a;
}
.card-sub {
  font-size: 13px;
  color: #999;
  margin: 8px 0 24px;
}
.field {
  display: flex;
  align-items: center;
  background: #f0f1f2;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 16px;
}
.field-label {
  font-size: 13px;
  color: #999;
  margin-right: 12px;
  width: 40px;
}
.field-input {
  border: none;
  outline: none;
  background: transparent;
  flex: 1;
  font-size: 14px;
  color: #1a1a1a;
}
.login-btn {
  width: 100%;
  height: 44px;
  border: none;
  border-radius: 8px;
  background: #2e9e5b;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 8px;
}
.login-btn:hover {
  background: #278a4e;
}
.login-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
.field.error {
  background: #fdf1ef;
  box-shadow: inset 0 0 0 1px #e6b0a4;
}
.error-tip {
  font-size: 12px;
  color: #c0563f;
  margin: -6px 0 12px 2px;
}
.agreement {
  text-align: center;
  font-size: 12px;
  color: #999;
  margin-top: 20px;
}
.demo-tip {
  text-align: center;
  font-size: 12px;
  color: #b0b8b2;
  margin-top: 6px;
}
</style>
