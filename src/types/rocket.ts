// ============================================================
// Rocket.Chat 原生 API 类型定义
// ============================================================

/** Rocket.Chat 统一成功响应 */
export interface RCSuccessResponse<T = any> {
  success: boolean
  data?: T
  status?: string
  message?: string
}

/** Rocket.Chat 错误响应 */
export interface RCErrorResponse {
  success: boolean
  error: string
  errorType: string
  message?: string
}

// ---- 认证相关 ----

/** POST /api/v1/login 请求 */
export interface RCLoginRequest {
  user: string
  password: string
  code?: string // 2FA code
}

/** POST /api/v1/login 响应 */
export interface RCLoginResponse {
  status: string
  data: {
    userId: string
    authToken: string
    me: RCUser
  }
}

/** POST /api/v1/users.register 请求 */
export interface RCRegisterRequest {
  username: string
  email: string
  pass: string
  name: string
  secretURL?: string
}

/** POST /api/v1/users.register 响应（拦截器不解包data，原样返回） */
export interface RCRegisterResponse {
  success: boolean
  user: {
    _id: string
    type: string
    status: string
    active: boolean
    name: string
    utcOffset: number
    username: string
  }
}

// ---- 用户相关 ----

/** Rocket.Chat 用户对象 */
export interface RCUser {
  _id: string
  name?: string
  username: string
  emails?: { address: string; verified?: boolean }[]
  status?: 'online' | 'away' | 'busy' | 'offline'
  statusConnection?: string
  utcOffset?: number
  active?: boolean
  roles?: string[]
  avatarUrl?: string
  lastLogin?: string
  createdAt?: string
  customFields?: Record<string, any>
  settings?: {
    preferences?: Record<string, any>
  }
}

/** GET /api/v1/users.list 响应 */
export interface RCUsersListResponse {
  users: RCUser[]
  count: number
  offset: number
  total: number
}

/** GET /api/v1/users.info 响应 */
export interface RCUserInfoResponse {
  user: RCUser
}

// ---- 房间相关 (channels / groups / im) ----

/** Rocket.Chat 房间/会话 */
export interface RCRoom {
  _id: string
  name?: string
  fname?: string
  t: 'c' | 'p' | 'd' // c=channel, p=private group, d=direct message
  usernames?: string[]
  usersCount?: number
  msgs?: number
  ts?: string
  ro?: boolean // read-only
  sysMes?: boolean
  default?: boolean
  _updatedAt?: string
  lastMessage?: RCMessage
  lm?: string // last message timestamp
  description?: string
  announcement?: string
  topic?: string
  muted?: string[]
  unmuted?: string[]
  joinCodeRequired?: boolean
  open?: boolean
  u?: Pick<RCUser, '_id' | 'username' | 'name'>
}

/** GET /api/v1/channels.list 响应 */
export interface RCChannelsListResponse {
  channels: RCRoom[]
  count: number
  offset: number
  total: number
}

/** GET /api/v1/groups.list 响应 */
export interface RCGroupsListResponse {
  groups: RCRoom[]
  count: number
  offset: number
  total: number
}

/** GET /api/v1/im.list 响应 */
export interface RCImListResponse {
  ims: RCRoom[]
  count: number
  offset: number
  total: number
}

/** GET /api/v1/channels.info 响应 */
export interface RCChannelInfoResponse {
  channel: RCRoom
}

/** GET /api/v1/groups.info 响应 */
export interface RCGroupInfoResponse {
  group: RCRoom
}

/** POST /api/v1/channels.create / groups.create 请求 */
export interface RCCreateRoomRequest {
  name: string
  members?: string[]
  readOnly?: boolean
  excludeSelf?: boolean
}

/** POST /api/v1/channels.create / groups.create 响应 */
export interface RCCreateRoomResponse {
  channel?: RCRoom
  group?: RCRoom
}

/** POST /api/v1/channels.invite / groups.invite 请求 */
export interface RCInviteRequest {
  roomId: string
  userId: string
}

/** 群组成员列表 */
export interface RCMembersListResponse {
  members: RCMember[]
  count: number
  offset: number
  total: number
}

export interface RCMember {
  _id: string
  username: string
  name?: string
  status?: string
}

/** POST /api/v1/im.create 请求 */
export interface RCCreateImRequest {
  username: string
}

/** POST /api/v1/im.create 响应 */
export interface RCCreateImResponse {
  room: RCRoom
}

// ---- 消息相关 ----

/** Rocket.Chat 消息 */
export interface RCMessage {
  _id: string
  rid: string // room id
  msg: string
  ts: string // timestamp (ISO string from meteor)
  u: {
    _id: string
    username: string
    name?: string
  }
  t?: string // message type: 'e2e', 'uj' (user join), etc.
  attachments?: RCAttachment[]
  urls?: any[]
  mentions?: any[]
  channels?: any[]
  editedAt?: string
  editedBy?: { _id: string; username: string }
  groupable?: boolean
  parseUrls?: boolean
  alias?: string
  avatar?: string
}

/** Rocket.Chat 消息附件 */
export interface RCAttachment {
  color?: string
  text?: string
  ts?: string
  thumb_url?: string
  message_link?: string
  collapsed?: boolean
  author_name?: string
  author_link?: string
  author_icon?: string
  title?: string
  title_link?: string
  title_link_download?: boolean
  image_url?: string
  audio_url?: string
  video_url?: string
  fields?: { title: string; value: string; short?: boolean }[]
}

/** GET /api/v1/channels.messages / im.messages 响应 */
export interface RCMessagesResponse {
  messages: RCMessage[]
  count: number
  offset: number
  total: number
  updatedAt?: string
}

/** POST /api/v1/chat.postMessage 请求 */
export interface RCPostMessageRequest {
  roomId: string
  text?: string
  alias?: string
  emoji?: string
  avatar?: string
  attachments?: RCAttachment[]
  channel?: string // deprecated, use roomId instead
}

/** POST /api/v1/chat.postMessage 响应 */
export interface RCPostMessageResponse {
  ts: number
  channel: string
  message: RCMessage
}

/** POST /api/v1/chat.delete 请求 */
export interface RCDeleteMessageRequest {
  roomId: string
  msgId: string
  asUser?: boolean
}

// ---- 其他 ----

/** GET /api/v1/me 响应 */
export interface RCMeResponse {
  _id: string
  name?: string
  username: string
  emails?: { address: string; verified?: boolean }[]
  status?: string
  statusConnection?: string
  utcOffset?: number
  active?: boolean
  roles?: string[]
  avatarUrl?: string
  settings?: {
    preferences?: Record<string, any>
  }
  customFields?: Record<string, any>
}

/** POST /api/v1/logout 响应 */
export interface RCLogoutResponse {
  status: string
  data: {
    message: string
  }
}

/** 分页参数 */
export interface RCPagination {
  count?: number
  offset?: number
  sort?: string
  query?: string
}
