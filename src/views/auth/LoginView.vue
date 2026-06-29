<script lang="ts" setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { NInput, NButton, NSpace } from 'naive-ui'
import { useAuthStore } from '@/stores/useAuthStore'
import '@/assets/css/login.less'

const router = useRouter()

function goToRegister() {
  router.push('/register')
}
const authStore = useAuthStore()

const username = ref('')
const password = ref('')
const loading = ref(false)

async function handleLogin() {
  if (!username.value || !password.value) {
    window['$message']?.warning('请输入用户名和密码')
    return
  }

  loading.value = true
  try {
    const ok = await authStore.login(username.value, password.value)
    if (ok) {
      window['$message']?.success('登录成功')
      router.push('/')
    } else {
      window['$message']?.error(authStore.error || '登录失败')
    }
  } catch {
    // 错误已在 store 中处理
  } finally {
    loading.value = false
  }
}

function handleKeyup(e: KeyboardEvent) {
  if (e.key === 'Enter') handleLogin()
}
</script>

<template>
  <div class="login-wrapper h-full">
    <!-- 飞行动画背景 -->
    <div class="fly-box">
      <div class="fly bg-fly-circle1"></div>
      <div class="fly bg-fly-circle2"></div>
      <div class="fly bg-fly-circle3"></div>
      <div class="fly bg-fly-circle4"></div>
    </div>

    <!-- Logo -->
    <div id="logo-name">Lumen IM</div>

    <!-- 登录框 -->
    <div class="login-box login">
      <div class="box-header">登录 Rocket.Chat</div>

      <n-space vertical size="large">
        <n-input
          v-model:value="username"
          placeholder="用户名或邮箱"
          size="large"
          clearable
          @keyup="handleKeyup"
        />

        <n-input
          v-model:value="password"
          type="password"
          placeholder="密码"
          size="large"
          show-password-on="click"
          @keyup="handleKeyup"
        />

        <n-button
          type="primary"
          size="large"
          block
          :loading="loading"
          @click="handleLogin"
        >
          登 录
        </n-button>
      </n-space>

      <div class="helper">
        <span class="text-ellipsis">
          还没有账号？
          <a class="cursor-pointer" style="color: #2196f3" @click="goToRegister">立即注册</a>
        </span>
      </div>
    </div>

    <!-- 版权信息 -->
    <div class="copyright">
      <span>Lumen IM Chat Client</span>
      <span>|</span>
      <span>Powered by Rocket.Chat</span>
    </div>
  </div>
</template>

<style scoped>
.login-wrapper {
  background-color: var(--im-bg-color);
  position: relative;
}
</style>
