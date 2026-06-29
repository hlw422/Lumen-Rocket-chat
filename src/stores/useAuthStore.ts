// ============================================================
// 认证状态管理 - Rocket.Chat 适配版
// ============================================================

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { fetchLogin, fetchLogout, fetchMe, fetchRegister } from '@/apis/rocket-api'
import { setAuthToken, clearAuth, getAuthData, isLogin } from '@/utils/auth'
import type { RCMeResponse, RCRegisterRequest } from '@/types/rocket'
import router from '@/router'

export const useAuthStore = defineStore('auth', () => {
  // ---- state ----
  const user = ref<RCMeResponse | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // ---- getters ----
  const isLoggedIn = computed(() => !!user.value)
  const userId = computed(() => user.value?._id ?? '')
  const username = computed(() => user.value?.username ?? '')
  const avatarUrl = computed(() => user.value?.avatarUrl ?? '')

  // ---- actions ----

  /**
   * 用户名+密码登录
   */
  async function login(loginUser: string, password: string): Promise<boolean> {
    loading.value = true
    error.value = null

    try {
      // Rocket.Chat 响应拦截器自动解包 data
      const res: any = await fetchLogin({ user: loginUser, password })

      // 检查响应中是否包含 authToken（拦截器已解包 data）
      if (res && res.userId && res.authToken) {
        setAuthToken(res.userId, res.authToken)
        user.value = res.me || null
        return true
      }

      error.value = '登录失败：认证信息不完整'
      return false
    } catch (err: any) {
      error.value = err?.message || '登录失败，请检查网络连接'
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取当前用户完整信息
   */
  async function loadMe(): Promise<void> {
    if (!isLogin()) return

    try {
      const me = await fetchMe({})
      if (me) {
        user.value = me
      }
    } catch (err) {
      console.error('[useAuthStore] loadMe failed:', err)
      // 不计为致命错误
    }
  }

  /**
   * 登出
   */
  async function logout(): Promise<void> {
    try {
      await fetchLogout({})
    } catch (err) {
      // 即使后端登出失败也清除本地状态
      console.warn('[useAuthStore] logout failed:', err)
    } finally {
      clearAuth()
      user.value = null
      router.push('/login')
    }
  }

  /**
   * 初始化认证状态（从 localStorage 恢复）
   */
  async function init(): Promise<void> {
    if (!isLogin()) return

    // 从 localStorage 恢复基本用户信息
    const auth = getAuthData()
    if (auth?.me) {
      user.value = auth.me as RCMeResponse
    }

    // 异步获取最新用户信息
    await loadMe()
  }

  /**
   * 注册新用户
   */
  async function register(params: RCRegisterRequest): Promise<boolean> {
    loading.value = true
    error.value = null

    try {
      const res: any = await fetchRegister(params)

      if (res && res.success === true) {
        return true
      }

      error.value = '注册失败，请稍后重试'
      return false
    } catch (err: any) {
      error.value = err?.message || '注册失败，请检查网络连接'
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    user,
    loading,
    error,
    isLoggedIn,
    userId,
    username,
    avatarUrl,
    login,
    logout,
    loadMe,
    init,
    register
  }
})
