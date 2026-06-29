// ============================================================
// 视图层统一数据模型（页面组件使用）
// ============================================================

/** 会话类型 */
export type ConversationType = 'channel' | 'group' | 'direct'

/** 会话列表项 */
export interface Conversation {
  id: string
  name: string
  avatar?: string
  type: ConversationType
  lastMessage?: string
  lastMessageTime?: number
  unread: number
  usersCount?: number
  isReadOnly?: boolean
  description?: string
  topic?: string
}

/** 聊天消息 */
export interface ChatMessage {
  id: string
  roomId: string
  content: string
  senderId: string
  senderName: string
  senderAvatar?: string
  timestamp: number
  editedAt?: number
  isEdited?: boolean
  attachments?: ChatAttachment[]
  type?: string
}

/** 消息附件 */
export interface ChatAttachment {
  type: 'image' | 'video' | 'audio' | 'file'
  url: string
  title?: string
  description?: string
}

/** 联系人/用户 */
export interface Contact {
  id: string
  username: string
  name: string
  avatar?: string
  status: 'online' | 'away' | 'busy' | 'offline'
  email?: string
}

/** 群组成员 */
export interface Member {
  id: string
  username: string
  name: string
  avatar?: string
  status: string
}

/** 发送消息参数 */
export interface SendMessageParams {
  roomId: string
  text: string
}

/** 分页参数 */
export interface PageParams {
  count?: number
  offset?: number
}
