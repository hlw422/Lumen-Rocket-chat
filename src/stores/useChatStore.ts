// ============================================================
// 聊天状态管理 - Rocket.Chat DDP WebSocket 实时版
// ============================================================

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  fetchChannelsList,
  fetchGroupsList,
  fetchImList,
  fetchChannelsMessages,
  fetchGroupsMessages,
  fetchImMessages,
  fetchChatPostMessage,
  fetchChatDelete
} from '@/apis/rocket-api'
import { ddpClient } from '@/services/ddp-client'
import { getAuthData, getAuthHeaders } from '@/utils/auth'
import type { RCRoom, RCMessage, RCAttachment } from '@/types/rocket'
import type { Conversation, ChatMessage, ChatAttachment, ConversationType } from '@/types/view'

export const useChatStore = defineStore('chat', () => {
  // ---- state ----
  const conversations = ref<Conversation[]>([])
  const currentRoomId = ref<string | null>(null)
  const messages = ref<ChatMessage[]>([])
  const loading = ref(false)
  const messagesLoading = ref(false)
  const ddpConnected = ref(false)

  // ---- getters ----
  const currentConversation = computed(() =>
    conversations.value.find((c) => c.id === currentRoomId.value) ?? null
  )

  // ---- private helpers ----

  function roomToConversation(room: RCRoom, type: ConversationType): Conversation {
    return {
      id: room._id,
      name: room.fname || room.name || (room.usernames?.join(', ') ?? 'Unknown'),
      type,
      lastMessage: room.lastMessage?.msg ?? '',
      lastMessageTime: room.lm ? new Date(room.lm).getTime() : undefined,
      unread: 0,
      usersCount: room.usersCount,
      description: room.description,
      topic: room.topic
    }
  }

  function rcMessageToChatMessage(msg: RCMessage): ChatMessage {
    // 映射附件
    const attachments: ChatAttachment[] | undefined = msg.attachments?.map(rcAttToChatAtt)

    return {
      id: msg._id,
      roomId: msg.rid,
      content: msg.msg ?? '',
      senderId: msg.u._id,
      senderName: msg.u.name || msg.u.username,
      timestamp: new Date(msg.ts).getTime(),
      editedAt: msg.editedAt ? new Date(msg.editedAt).getTime() : undefined,
      isEdited: !!msg.editedAt,
      attachments,
      type: msg.t
    }
  }

  /** 将 Rocket.Chat Attachment 转为视图层 ChatAttachment */
  function rcAttToChatAtt(att: RCAttachment): ChatAttachment {
    let type: ChatAttachment['type'] = 'file'
    let url = ''
    if (att.image_url) {
      type = 'image'
      url = att.image_url
    } else if (att.video_url) {
      type = 'video'
      url = att.video_url
    } else if (att.audio_url) {
      type = 'audio'
      url = att.audio_url
    } else {
      url = att.title_link || ''
    }
    return {
      type,
      url,
      title: att.title,
      name: att.title,
      description: att.description || att.text,
      thumbUrl: att.thumb_url,
      color: att.color,
      titleLinkDownload: att.title_link_download
    }
  }

  /**
   * DDP 收到消息时的回调
   */
  function onDdpMessage(rcMsg: RCMessage): void {
    // 只处理当前活跃房间的消息
    if (rcMsg.rid !== currentRoomId.value) return

    const chatMsg = rcMessageToChatMessage(rcMsg)
    // 去重
    if (!messages.value.some((m) => m.id === chatMsg.id)) {
      messages.value = [...messages.value, chatMsg].sort(
        (a, b) => a.timestamp - b.timestamp
      )
    }
  }

  // ---- actions ----

  /**
   * 建立 DDP WebSocket 连接
   */
  function connectDdp(): void {
    const auth = getAuthData()
    if (!auth?.authToken || !auth?.userId) return

    const wsUrl = `${import.meta.env.VITE_SOCKET_API}/websocket`
    ddpClient.connect(wsUrl, auth.userId, auth.authToken)

    // 监听连接状态
    ddpClient.onStatus((status) => {
      ddpConnected.value = status === 'connected'
      if (status === 'connected') {
        console.log('[useChatStore] DDP connected')
      }
    })
  }

  /**
   * 断开 DDP 连接
   */
  function disconnectDdp(): void {
    ddpClient.disconnect()
    ddpConnected.value = false
  }

  /**
   * 加载合并后的会话列表：channels + groups + im
   */
  async function loadConversations(): Promise<void> {
    loading.value = true
    try {
      const results = await Promise.allSettled([
        fetchChannelsList({}),
        fetchGroupsList({}),
        fetchImList({})
      ])

      const merged: Conversation[] = []

      const [chRes, grRes, imRes] = results
      if (chRes.status === 'fulfilled' && chRes.value?.channels) {
        for (const ch of chRes.value.channels) {
          merged.push(roomToConversation(ch, 'channel'))
        }
      }
      if (grRes.status === 'fulfilled' && grRes.value?.groups) {
        for (const gr of grRes.value.groups) {
          merged.push(roomToConversation(gr, 'group'))
        }
      }
      if (imRes.status === 'fulfilled' && imRes.value?.ims) {
        for (const im of imRes.value.ims) {
          merged.push(roomToConversation(im, 'direct'))
        }
      }

      conversations.value = merged
    } catch (err) {
      console.error('[useChatStore] loadConversations failed:', err)
      conversations.value = []
    } finally {
      loading.value = false
    }
  }

  /**
   * 选择会话：取消旧订阅，加载历史，DDP 实时订阅
   */
  async function selectConversation(roomId: string): Promise<void> {
    // 取消旧房间的 DDP 订阅
    if (currentRoomId.value) {
      ddpClient.unsubscribeRoom(currentRoomId.value)
    }

    currentRoomId.value = roomId
    await loadMessages(roomId)

    // 通过 DDP 实时订阅该房间的新消息
    ddpClient.subscribeRoom(roomId, onDdpMessage)
  }

  /**
   * 加载指定房间的消息历史
   */
  async function loadMessages(
    roomId: string,
    count = 50,
    offset = 0
  ): Promise<void> {
    messagesLoading.value = true
    try {
      const conv = conversations.value.find((c) => c.id === roomId)
      let res: any

      const params = { roomId, count, offset }

      switch (conv?.type) {
        case 'channel':
          res = await fetchChannelsMessages(params)
          break
        case 'group':
          res = await fetchGroupsMessages(params)
          break
        case 'direct':
        default:
          res = await fetchImMessages(params)
          break
      }

      if (res?.messages) {
        const existIds = new Set(messages.value.map((m) => m.id))
        const newMsgs = res.messages
          .map(rcMessageToChatMessage)
          .filter((m: ChatMessage) => !existIds.has(m.id))

        if (messagesLoading.value) {
          // 首次加载直接赋值
          messages.value = res.messages
            .map(rcMessageToChatMessage)
            .sort((a, b) => a.timestamp - b.timestamp)
        } else {
          messages.value = [...messages.value, ...newMsgs].sort(
            (a, b) => a.timestamp - b.timestamp
          )
        }
      }
    } catch (err) {
      console.error('[useChatStore] loadMessages failed:', err)
    } finally {
      messagesLoading.value = false
    }
  }

  /**
   * 发送消息
   */
  async function sendMessage(roomId: string, text: string): Promise<ChatMessage | null> {
    try {
      const res = await fetchChatPostMessage({ roomId, text })
      if (res?.message) {
        const msg = rcMessageToChatMessage(res.message)
        if (!messages.value.some((m) => m.id === msg.id)) {
          messages.value.push(msg)
        }
        return msg
      }
      return null
    } catch (err) {
      console.error('[useChatStore] sendMessage failed:', err)
      return null
    }
  }

  /**
   * 上传文件到房间（自动发送为一条消息）
   */
  async function uploadFile(roomId: string, file: File, description?: string): Promise<ChatMessage | null> {
    const auth = getAuthHeaders()
    if (!auth) {
      console.error('[useChatStore] uploadFile: not authenticated')
      return null
    }

    const formData = new FormData()
    formData.append('file', file)
    if (description) {
      formData.append('description', description)
    }

    const baseUrl = import.meta.env.VITE_BASE_API || ''
    const url = `${baseUrl}/api/v1/rooms.upload/${roomId}`

    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'X-Auth-Token': auth['X-Auth-Token'],
          'X-User-Id': auth['X-User-Id']
        },
        body: formData,
        // 大文件上传不设超时
      })

      const body = await resp.json()
      if (!resp.ok) {
        throw new Error(body?.error || 'Upload failed')
      }

      // rooms.upload 返回 { success: true, message: RCMessage }
      if (body?.message) {
        const msg = rcMessageToChatMessage(body.message)
        if (!messages.value.some((m) => m.id === msg.id)) {
          messages.value.push(msg)
        }
        return msg
      }

      return null
    } catch (err: any) {
      console.error('[useChatStore] uploadFile failed:', err)
      return null
    }
  }

  /**
   * 删除消息
   */
  async function deleteMessage(roomId: string, msgId: string): Promise<boolean> {
    try {
      await fetchChatDelete({ roomId, msgId })
      messages.value = messages.value.filter((m) => m.id !== msgId)
      return true
    } catch (err) {
      console.error('[useChatStore] deleteMessage failed:', err)
      return false
    }
  }

  /**
   * 清理资源
   */
  function dispose(): void {
    if (currentRoomId.value) {
      ddpClient.unsubscribeRoom(currentRoomId.value)
    }
    disconnectDdp()
    conversations.value = []
    messages.value = []
    currentRoomId.value = null
  }

  return {
    conversations,
    currentRoomId,
    messages,
    loading,
    messagesLoading,
    ddpConnected,
    currentConversation,
    loadConversations,
    selectConversation,
    loadMessages,
    sendMessage,
    uploadFile,
    deleteMessage,
    connectDdp,
    disconnectDdp,
    dispose
  }
})
