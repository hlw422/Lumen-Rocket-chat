// ============================================================
// Rocket.Chat API 接口封装（核心 25 个）
// ============================================================

import { createApi } from './request'
import type {
  RCLoginRequest,
  RCLoginResponse,
  RCLogoutResponse,
  RCMeResponse,
  RCRegisterRequest,
  RCRegisterResponse,
  RCUsersListResponse,
  RCUserInfoResponse,
  RCChannelsListResponse,
  RCGroupsListResponse,
  RCImListResponse,
  RCChannelInfoResponse,
  RCGroupInfoResponse,
  RCCreateRoomRequest,
  RCCreateRoomResponse,
  RCCreateImRequest,
  RCCreateImResponse,
  RCInviteRequest,
  RCMessagesResponse,
  RCPostMessageRequest,
  RCPostMessageResponse,
  RCDeleteMessageRequest,
  RCMembersListResponse,
  RCPagination
} from '@/types/rocket'

// ==================== 认证 ====================

/** POST /api/v1/login - 用户名密码登录 */
export const fetchLogin = createApi<RCLoginRequest, RCLoginResponse>(
  '/api/v1/login',
  'POST'
)

/** POST /api/v1/users.register - 注册新用户（无需认证） */
export const fetchRegister = createApi<RCRegisterRequest, RCRegisterResponse>(
  '/api/v1/users.register',
  'POST'
)

/** POST /api/v1/logout - 登出（需认证） */
export const fetchLogout = createApi<Record<string, never>, RCLogoutResponse>(
  '/api/v1/logout',
  'POST'
)

/** GET /api/v1/me - 获取当前用户信息（需认证） */
export const fetchMe = createApi<Record<string, never>, RCMeResponse>(
  '/api/v1/me',
  'GET'
)

// ==================== 用户 ====================

/** GET /api/v1/users.list - 获取用户列表 */
export const fetchUsersList = createApi<RCPagination, RCUsersListResponse>(
  '/api/v1/users.list',
  'GET'
)

/** GET /api/v1/users.info - 获取用户信息 */
export const fetchUsersInfo = createApi<{ userId?: string; username?: string }, RCUserInfoResponse>(
  '/api/v1/users.info',
  'GET'
)

/** POST /api/v1/users.setAvatar - 设置用户头像 */
export const fetchUsersSetAvatar = createApi<FormData, any>(
  '/api/v1/users.setAvatar',
  'POST'
)

// ==================== 频道 Channels ====================

/** GET /api/v1/channels.list - 获取公开频道列表 */
export const fetchChannelsList = createApi<RCPagination, RCChannelsListResponse>(
  '/api/v1/channels.list',
  'GET'
)

/** GET /api/v1/channels.info - 获取频道详情 */
export const fetchChannelsInfo = createApi<{ roomId: string }, RCChannelInfoResponse>(
  '/api/v1/channels.info',
  'GET'
)

/** POST /api/v1/channels.create - 创建公开频道 */
export const fetchChannelsCreate = createApi<RCCreateRoomRequest, RCCreateRoomResponse>(
  '/api/v1/channels.create',
  'POST'
)

/** POST /api/v1/channels.invite - 邀请用户加入频道 */
export const fetchChannelsInvite = createApi<RCInviteRequest, any>(
  '/api/v1/channels.invite',
  'POST'
)

/** GET /api/v1/channels.messages - 获取频道消息历史 */
export const fetchChannelsMessages = createApi<
  { roomId: string; count?: number; offset?: number; sort?: string },
  RCMessagesResponse
>('/api/v1/channels.messages', 'GET')

/** GET /api/v1/channels.members - 获取频道成员列表 */
export const fetchChannelsMembers = createApi<
  { roomId: string; count?: number; offset?: number },
  RCMembersListResponse
>('/api/v1/channels.members', 'GET')

/** POST /api/v1/channels.leave - 离开频道 */
export const fetchChannelsLeave = createApi<{ roomId: string }, any>(
  '/api/v1/channels.leave',
  'POST'
)

// ==================== 私有群组 Groups ====================

/** GET /api/v1/groups.list - 获取私有群组列表 */
export const fetchGroupsList = createApi<RCPagination, RCGroupsListResponse>(
  '/api/v1/groups.list',
  'GET'
)

/** GET /api/v1/groups.info - 获取群组详情 */
export const fetchGroupsInfo = createApi<{ roomId: string }, RCGroupInfoResponse>(
  '/api/v1/groups.info',
  'GET'
)

/** POST /api/v1/groups.create - 创建私有群组 */
export const fetchGroupsCreate = createApi<RCCreateRoomRequest, RCCreateRoomResponse>(
  '/api/v1/groups.create',
  'POST'
)

/** POST /api/v1/groups.invite - 邀请用户加入群组 */
export const fetchGroupsInvite = createApi<RCInviteRequest, any>(
  '/api/v1/groups.invite',
  'POST'
)

/** GET /api/v1/groups.messages - 获取群组消息历史 */
export const fetchGroupsMessages = createApi<
  { roomId: string; count?: number; offset?: number; sort?: string },
  RCMessagesResponse
>('/api/v1/groups.messages', 'GET')

/** GET /api/v1/groups.members - 获取群组成员列表 */
export const fetchGroupsMembers = createApi<
  { roomId: string; count?: number; offset?: number },
  RCMembersListResponse
>('/api/v1/groups.members', 'GET')

/** POST /api/v1/groups.leave - 离开群组 */
export const fetchGroupsLeave = createApi<{ roomId: string }, any>(
  '/api/v1/groups.leave',
  'POST'
)

// ==================== 私聊 IM ====================

/** GET /api/v1/im.list - 获取私聊列表 */
export const fetchImList = createApi<RCPagination, RCImListResponse>(
  '/api/v1/im.list',
  'GET'
)

/** POST /api/v1/im.create - 创建/打开与用户的私聊 */
export const fetchImCreate = createApi<RCCreateImRequest, RCCreateImResponse>(
  '/api/v1/im.create',
  'POST'
)

/** GET /api/v1/im.messages - 获取私聊消息历史 */
export const fetchImMessages = createApi<
  { roomId: string; count?: number; offset?: number; sort?: string },
  RCMessagesResponse
>('/api/v1/im.messages', 'GET'
)

/** POST /api/v1/im.close - 关闭私聊会话 */
export const fetchImClose = createApi<{ roomId: string }, any>(
  '/api/v1/im.close',
  'POST'
)

// ==================== 消息 ====================

/** POST /api/v1/chat.postMessage - 发送消息 */
export const fetchChatPostMessage = createApi<RCPostMessageRequest, RCPostMessageResponse>(
  '/api/v1/chat.postMessage',
  'POST'
)

/** POST /api/v1/chat.delete - 删除消息 */
export const fetchChatDelete = createApi<RCDeleteMessageRequest, any>(
  '/api/v1/chat.delete',
  'POST'
)

/** POST /api/v1/chat.update - 编辑消息 */
export const fetchChatUpdate = createApi<
  { roomId: string; msgId: string; text: string },
  any
>('/api/v1/chat.update', 'POST'
)

// ==================== 文件上传 ====================

/** POST /api/v1/rooms.upload/:roomId - 上传文件到房间 */
export const fetchRoomsUpload = createApi<FormData, any>(
  '/api/v1/rooms.upload',
  'POST'
)
