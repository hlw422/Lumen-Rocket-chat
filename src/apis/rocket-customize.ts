// ============================================================
// 自定义 API - Rocket.Chat 专用（文件上传等特殊请求）
// ============================================================

import { createApi } from './request'

/**
 * 上传文件到指定房间
 * POST /api/v1/rooms.upload/:roomId
 */
export const fetchFilesUpload = createApi<FormData, any>(
  '/api/v1/rooms.upload',
  'POST'
)

/**
 * 上传头像
 * POST /api/v1/users.setAvatar
 */
export const fetchUploadAvatar = createApi<FormData, any>(
  '/api/v1/users.setAvatar',
  'POST'
)
