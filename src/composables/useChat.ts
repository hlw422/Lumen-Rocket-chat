// ============================================================
// 聊天组合函数
// ============================================================

import { ref } from 'vue'
import { useChatStore } from '@/stores/useChatStore'
import type { ChatMessage } from '@/types/view'

export function useChat() {
  const chatStore = useChatStore()
  const sending = ref(false)

  /**
   * 发送消息
   */
  async function sendMessage(roomId: string, text: string): Promise<ChatMessage | null> {
    sending.value = true
    try {
      return await chatStore.sendMessage(roomId, text)
    } finally {
      sending.value = false
    }
  }

  /**
   * 加载消息历史
   */
  async function loadMessages(roomId: string, count = 50, offset = 0): Promise<void> {
    await chatStore.loadMessages(roomId, count, offset)
  }

  /**
   * 删除消息
   */
  async function deleteMessage(roomId: string, msgId: string): Promise<boolean> {
    return await chatStore.deleteMessage(roomId, msgId)
  }

  return {
    sending,
    sendMessage,
    loadMessages,
    deleteMessage
  }
}
