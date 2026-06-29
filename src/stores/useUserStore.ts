// ============================================================
// 用户设置/偏好状态管理
// ============================================================

import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export interface UserSettings {
  themeMode: 'light' | 'dark' | 'auto'
  themeColor: string
  enableNotificationSound: boolean
}

export const useUserStore = defineStore('user', () => {
  // ---- state ----
  const settings = ref<UserSettings>({
    themeMode: 'auto',
    themeColor: '#2080f0',
    enableNotificationSound: true
  })

  // ---- actions ----

  /**
   * 从 localStorage 加载用户设置
   * （对应原 App.vue 中的 loadSetting 逻辑）
   */
  async function loadSetting(): Promise<void> {
    try {
      const saved = localStorage.getItem('lumenim_settings')
      if (saved) {
        const parsed = JSON.parse(saved)
        settings.value = {
          themeMode: parsed.themeMode ?? 'auto',
          themeColor: parsed.themeColor ?? '#2080f0',
          enableNotificationSound: parsed.enableNotificationSound ?? true
        }
      }
    } catch (err) {
      console.warn('[useUserStore] loadSetting failed:', err)
    }
  }

  /**
   * 保存用户设置到 localStorage
   */
  function saveSetting(): void {
    try {
      localStorage.setItem('lumenim_settings', JSON.stringify(settings.value))
    } catch (err) {
      console.warn('[useUserStore] saveSetting failed:', err)
    }
  }

  /**
   * 更新设置项
   */
  function updateSetting<K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ): void {
    settings.value[key] = value
    saveSetting()
  }

  return {
    settings,
    loadSetting,
    saveSetting,
    updateSetting
  }
})
