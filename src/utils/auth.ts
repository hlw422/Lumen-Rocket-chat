// ============================================================
// 认证工具函数 - Rocket.Chat 适配版
// ============================================================

const AUTH_STORAGE_KEY = 'rocketchat_auth'

interface AuthData {
  userId: string
  authToken: string
  me?: Record<string, any>
}

export interface AuthHeaders {
  'X-Auth-Token': string
  'X-User-Id': string
}

/**
 * 存储认证凭据
 */
export function setAuthToken(userId: string, authToken: string): void {
  const data: AuthData = { userId, authToken }
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data))
}

/**
 * 获取认证凭据
 */
export function getAuthData(): AuthData | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AuthData
  } catch {
    return null
  }
}

/**
 * 获取认证请求头（供拦截器使用）
 */
export function getAuthHeaders(): AuthHeaders | null {
  const data = getAuthData()
  if (!data || !data.userId || !data.authToken) return null
  return {
    'X-Auth-Token': data.authToken,
    'X-User-Id': data.userId
  }
}

/**
 * 获取 authToken
 */
export function getToken(): string | null {
  return getAuthData()?.authToken ?? null
}

/**
 * 获取 userId
 */
export function getUserId(): string | null {
  return getAuthData()?.userId ?? null
}

/**
 * 清除认证凭据
 */
export function clearAuth(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY)
}

/**
 * 删除 token（别名，兼容旧调用）
 */
export function deleteToken(): void {
  clearAuth()
}

/**
 * 判断是否已登录
 */
export function isLogin(): boolean {
  return getAuthData() !== null
}
