<script lang="ts" setup>
import AppProvider from '@/layout/AppProvider.vue'
import { useUserStore } from '@/stores/useUserStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { isLogin } from '@/utils/auth'

const { loadSetting } = useUserStore()
const auth = useAuthStore()

onMounted(async () => {
  if (isLogin()) {
    loadSetting()
    // 恢复并验证登录态
    await auth.init()
  }
})
</script>

<template>
  <AppProvider>
    <router-view />
  </AppProvider>
</template>
