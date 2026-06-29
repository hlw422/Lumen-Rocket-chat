// ============================================================
// 格式化工具函数
// ============================================================

import dayjs from 'dayjs'

/**
 * 格式化消息时间
 * - 当天显示 HH:mm
 * - 昨天显示 昨天 HH:mm
 * - 今年显示 MM-DD HH:mm
 * - 往年显示 YYYY-MM-DD HH:mm
 */
export function formatMessageTime(timestamp: number | string): string {
  const d = dayjs(timestamp)
  const now = dayjs()

  if (d.isSame(now, 'day')) {
    return d.format('HH:mm')
  } else if (d.isSame(now.subtract(1, 'day'), 'day')) {
    return `昨天 ${d.format('HH:mm')}`
  } else if (d.isSame(now, 'year')) {
    return d.format('MM-DD HH:mm')
  } else {
    return d.format('YYYY-MM-DD HH:mm')
  }
}

/**
 * 格式化会话列表时间
 */
export function formatConversationTime(timestamp?: number): string {
  if (!timestamp) return ''
  return formatMessageTime(timestamp)
}

/**
 * 简单时间显示（HH:mm）
 */
export function formatSimpleTime(timestamp: number): string {
  return dayjs(timestamp).format('HH:mm')
}

/**
 * 日期显示
 */
export function formatDate(timestamp: number | string): string {
  return dayjs(timestamp).format('YYYY-MM-DD')
}

/**
 * 消息内容截断显示
 */
export function truncateMessage(msg: string, maxLen = 50): string {
  if (!msg) return ''
  // 移除换行符
  const cleaned = msg.replace(/\n/g, ' ')
  if (cleaned.length <= maxLen) return cleaned
  return cleaned.slice(0, maxLen) + '...'
}
