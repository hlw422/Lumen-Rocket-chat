import { ApiClient, ApiError } from '@/apis/client'
import { getAuthHeaders, clearAuth } from '@/utils/auth'
import { useThrottleFn } from '@vueuse/core'

// Rocket.Chat API 基地址
export const client = new ApiClient(import.meta.env.VITE_BASE_API, {
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 15000 // Rocket.Chat 部分接口响应较慢，放宽到 15 秒
})

// ---- 请求拦截器：注入 X-Auth-Token + X-User-Id ----
client.interceptor.request.use((_: string, req: RequestInit) => {
  const authHeaders = getAuthHeaders()

  if (authHeaders) {
    req.headers = {
      ...req.headers,
      ...authHeaders
    }
  }

  return req
})

// ---- 401 处理：登录过期弹窗 ----
const showAuthDialog = useThrottleFn(() => {
  clearAuth()

  window['$modal']?.create({
    preset: 'dialog',
    title: '登录提示',
    content: '登录已过期，请重新登录',
    style: 'width: 500px;',
    positiveText: '立即登录',
    negativeText: '取消',
    onPositiveClick: () => {
      location.href = '/login'
    }
  })
}, 5000)

// ---- 响应拦截器 ----
client.interceptor.response.use((res: Response, body: any) => {
  // 处理 401 未授权
  if (res.status === 401) {
    showAuthDialog()
    throw new ApiError(401, '未授权，请重新登录')
  }

  // Rocket.Chat 响应格式：{ success: true, data: {...} }
  // 或 { status: "success", data: {...} }
  // 错误格式：{ success: false, error: "...", errorType: "..." }
  if (body && typeof body === 'object') {
    // 处理 Rocket.Chat 成功响应：解包 data 字段
    if (body.success === true || body.status === 'success') {
      return body.data !== undefined ? body.data : body
    }

    // 处理 Rocket.Chat 错误响应
    if (body.success === false) {
      throw new ApiError(
        res.status || 400,
        body.error || body.message || '请求失败'
      )
    }
  }

  return body
})

// ---- 高阶函数：创建 API 调用函数 ----
export const createApi = client.request.bind(client)

// ---- 辅助函数 ----

export interface FetchApiOption {
  loading?: Ref<boolean>
  error?: boolean
  errorText?: string
  successText?: string
  onSuccess?: () => void
}

/**
 * 封装 API 调用：自动处理 loading、错误提示、成功提示
 * 返回 [error, data] 元组
 */
export async function fetchApi<R, T>(
  fn: (param: R) => Promise<T>,
  param: R,
  options?: FetchApiOption
) {
  if (options?.error === undefined) options = { ...options, error: true }

  try {
    if (options?.loading) options.loading.value = true
    const data = await fn(param)

    if (options?.successText) {
      window['$message']?.success(options?.successText)
    }

    return [undefined, data] as [undefined, T]
  } catch (err) {
    if (options?.error) error((err as Error)?.message || '未知错误')
    return [err, undefined] as [any, T]
  } finally {
    if (options?.loading) options.loading.value = false
  }
}

interface SyncOptions {
  loading?: Ref<boolean>
  error?: boolean
  errorText?: string
  successText?: string
  onError?: (err: any) => void
  onComplete?: () => void
  onSuccess?: () => void
}

/**
 * 副作用操作（fire-and-forget 模式）
 */
export function sync(fn: () => Promise<void>, options?: SyncOptions): void {
  if (options?.loading) options.loading.value = true

  fn()
    .then(() => {
      if (options?.loading) options.loading.value = false
      if (options?.successText) {
        window['$message']?.success(options?.successText)
      }
      options?.onSuccess?.()
      options?.onComplete?.()
    })
    .catch((err) => {
      if (options?.loading) options.loading.value = false
      error(options?.errorText || err?.message)
      console.error('[sync] error:', err)
      options?.onError?.(err)
    })
}

export function isApiError(err: any): err is ApiError {
  return err instanceof ApiError
}

function error(message: string) {
  if (window['$message']) {
    window['$message']?.error(message)
  } else {
    alert(message)
  }
}
