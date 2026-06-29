// ============================================================
// 图片/文件加载工具 — 带 Rocket.Chat 认证头
// ============================================================

import { getAuthHeaders } from './auth'

/** 已加载图片的 blob URL 缓存 (URL → blobUrl) */
const imageCache = new Map<string, string>()

/**
 * 获取带认证头的图片 blob URL
 * 如果 URL 是相对路径，通过 Vite 代理请求（url 本身是相对路径即可）
 * 如果 URL 是绝对路径，直接 fetch（跨域但 <img> 不触发 CORS，只是可能 401）
 * 优先返回缓存的 blob URL
 */
export async function loadImage(url: string): Promise<string> {
  if (!url) return ''

  // 命中缓存
  const cached = imageCache.get(url)
  if (cached) return cached

  // 将绝对 Rocket.Chat URL 转为相对路径走代理
  let fetchUrl = url
  const host = import.meta.env.VITE_RC_HOST
  if (host && url.startsWith(host)) {
    fetchUrl = url.slice(host.length)
  }

  const auth = getAuthHeaders()
  const headers: Record<string, string> = {}
  if (auth) {
    headers['X-Auth-Token'] = auth['X-Auth-Token']
    headers['X-User-Id'] = auth['X-User-Id']
  }

  const resp = await fetch(fetchUrl, { headers })
  if (!resp.ok) {
    throw new Error(`Image fetch failed: ${resp.status}`)
  }
  const blob = await resp.blob()
  const blobUrl = URL.createObjectURL(blob)

  // 放入缓存（最多缓存 200 张）
  if (imageCache.size > 200) {
    const firstKey = imageCache.keys().next().value
    if (firstKey) imageCache.delete(firstKey)
  }
  imageCache.set(url, blobUrl)

  return blobUrl
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
