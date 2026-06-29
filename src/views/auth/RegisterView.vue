<script lang="ts" setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { NInput, NButton, NSpace } from 'naive-ui'
import { useAuthStore } from '@/stores/useAuthStore'
import '@/assets/css/login.less'

const router = useRouter()
const authStore = useAuthStore()

const form = reactive({
  username: '',
  email: '',
  name: '',
  password: '',
  confirmPassword: ''
})
const loading = ref(false)

async function handleRegister() {
  if (!form.username || !form.email || !form.password) {
    window['$message']?.warning('请填写必填字段')
    return
  }

  if (form.password !== form.confirmPassword) {
    window['$message']?.warning('两次输入的密码不一致')
    return
  }

  if (form.password.length < 6) {
    window['$message']?.warning('密码长度至少为 6 位')
    return
  }

  loading.value = true
  try {
    const ok = await authStore.register({
      username: form.username,
      email: form.email,
      pass: form.password,
      name: form.name || form.username
    })

    if (ok) {
      window['$message']?.success('注册成功，请登录')
      router.push('/login')
    } else {
      window['$message']?.error(authStore.error || '注册失败')
    }
  } catch {
    // 错误已在 store 中处理
  } finally {
    loading.value = false
  }
}

function goToLogin() {
  router.push('/login')
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

    <!-- 注册框 -->
    <div class="login-box register">
      <div class="box-header">创建新账号</div>

      <n-space vertical size="medium">
        <n-input
          v-model:value="form.username"
          placeholder="用户名 *"
          size="large"
          clearable
          :maxlength="30"
        />

        <n-input
          v-model:value="form.email"
          placeholder="邮箱 *"
          size="large"
          clearable
          type="email"
        />

        <n-input
          v-model:value="form.name"
          placeholder="显示名称（可选）"
          size="large"
          clearable
          :maxlength="50"
        />

        <n-input
          v-model:value="form.password"
          type="password"
          placeholder="密码 *"
          size="large"
          show-password-on="click"
          :minlength="6"
        />

        <n-input
          v-model:value="form.confirmPassword"
          type="password"
          placeholder="确认密码 *"
          size="large"
          show-password-on="click"
        />

        <n-button
          type="primary"
          size="large"
          block
          :loading="loading"
          @click="handleRegister"
        >
          注 册
        </n-button>
      </n-space>

      <div class="helper">
        <span class="text-ellipsis">
          已有账号？
          <a class="cursor-pointer" style="color: #2196f3" @click="goToLogin">立即登录</a>
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
