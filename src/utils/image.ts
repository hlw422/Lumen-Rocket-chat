// ============================================================
// 图片/文件加载工具 — 带 Rocket.Chat 认证头
// ============================================================

import { getAuthHeaders } from './auth'

/** 已加载图片的 blob URL 缓存 (URL → blobUrl) */
const imageCache = new Map<string, string>()

/**
 * 将任意图片 URL 转为可 fetch 的相对路径（走 Vite 代理）
 */
function normalizeUrl(url: string): string {
  if (!url) return ''
  // 已是相对路径，直接返回
  if (url.startsWith('/')) return url

  // 匹配已知 Rocket.Chat 主机
  const host = import.meta.env.VITE_RC_HOST
  if (host && url.startsWith(host)) {
    return url.slice(host.length)
  }

  // 其他绝对 URL：提取 pathname 作为代理路径
  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      const u = new URL(url)
      return u.pathname + u.search
    } catch {
      return url
    }
  }

  return url
}

/**
 * 获取带认证头的图片 blob URL
 * URL 会被转为相对路径，通过 Vite 代理请求（代理会透传 auth 头到 Rocket.Chat）
 */
export async function loadImage(url: string): Promise<string> {
  if (!url) return ''

  // 命中缓存
  const cached = imageCache.get(url)
  if (cached) return cached

  const fetchUrl = normalizeUrl(url)

  const auth = getAuthHeaders()
  const headers: Record<string, string> = {}
  if (auth) {
    headers['X-Auth-Token'] = auth['X-Auth-Token']
    headers['X-User-Id'] = auth['X-User-Id']
  }

  let resp: Response
  try {
    resp = await fetch(fetchUrl, { headers })
  } catch (err) {
    console.error('[loadImage] Fetch error:', fetchUrl, err)
    throw err
  }

  if (!resp.ok) {
    console.error('[loadImage] Status:', resp.status, fetchUrl)
    throw new Error(`Image fetch failed: ${resp.status}`)
  }
  const blob = await resp.blob()
  const blobUrl = URL.createObjectURL(blob)

  // 放入缓存（最多缓存 200 张）
  if (imageCache.size > 200) {
    const firstKey = imageCache.keys().next().value
    if (firstKey) {
      const old = imageCache.get(firstKey)
      if (old) URL.revokeObjectURL(old)
      imageCache.delete(firstKey)
    }
  }
  imageCache.set(url, blobUrl)

  return blobUrl
}

/**
 * 下载文件（fetch 带认证头 → blob → 触发浏览器下载）
 */
export async function downloadFile(url: string, fileName?: string): Promise<void> {
  const fetchUrl = normalizeUrl(url)

  const auth = getAuthHeaders()
  const headers: Record<string, string> = {}
  if (auth) {
    headers['X-Auth-Token'] = auth['X-Auth-Token']
    headers['X-User-Id'] = auth['X-User-Id']
  }

  const resp = await fetch(fetchUrl, { headers })
  if (!resp.ok) throw new Error(`Download failed: ${resp.status}`)

  const blob = await resp.blob()
  const blobUrl = URL.createObjectURL(blob)

  const name = fileName || url.split('/').pop() || 'download'
  const a = document.createElement('a')
  a.href = blobUrl
  a.download = name
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)

  // 延迟释放 blob URL
  setTimeout(() => URL.revokeObjectURL(blobUrl), 10000)
}

/**
 * 清理缓存
 */
export function clearImageCache(): void {
  for (const blobUrl of imageCache.values()) {
    URL.revokeObjectURL(blobUrl)
  }
  imageCache.clear()
}
