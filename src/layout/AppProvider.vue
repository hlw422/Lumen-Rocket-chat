<script lang="ts" setup>
import { NConfigProvider, NMessageProvider, NDialogProvider, NNotificationProvider, NLoadingBarProvider, darkTheme } from 'naive-ui'
import { useUserStore } from '@/stores/useUserStore'
import { computed } from 'vue'

const userStore = useUserStore()

const themeOverrides = computed(() => {
  const isDark = userStore.settings.themeMode === 'dark'
  const autoDark = userStore.settings.themeMode === 'auto' &&
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-color-scheme: dark)').matches

  return (isDark || autoDark) ? darkTheme : undefined
})
</script>

<template>
  <NConfigProvider :theme="themeOverrides" :theme-overrides="{}">
    <NLoadingBarProvider>
      <NMessageProvider>
        <NDialogProvider>
          <NNotificationProvider>
            <slot />
          </NNotificationProvider>
        </NDialogProvider>
      </NMessageProvider>
    </NLoadingBarProvider>
  </NConfigProvider>
</template>
