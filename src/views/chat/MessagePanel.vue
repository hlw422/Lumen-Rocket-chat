<script lang="ts" setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { NAvatar, NInput, NButton, NSpin, NSpace } from 'naive-ui'
import { useChatStore } from '@/stores/useChatStore'
import { useAuthStore } from '@/stores/useAuthStore'
import type { ChatMessage } from '@/types/view'

const chatStore = useChatStore()
const authStore = useAuthStore()

const inputText = ref('')
const messagesContainer = ref<HTMLElement>()

// 滚动到底部
async function scrollToBottom() {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// 监听消息变化，自动滚动
watch(
  () => chatStore.messages.length,
  () => scrollToBottom()
)

onMounted(() => scrollToBottom())

// 判断消息是否由当前用户发送
function isSelf(senderId: string): boolean {
  return senderId === authStore.userId
}

// 发送消息
async function handleSend() {
  const text = inputText.value.trim()
  if (!text || !chatStore.currentRoomId) return

  inputText.value = ''
  await chatStore.sendMessage(chatStore.currentRoomId, text)
  scrollToBottom()
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

// 格式化时间
function formatTime(ts: number): string {
  const d = new Date(ts)
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}
</script>

<template>
  <div class="message-panel h-full" style="display: flex; flex-direction: column; background: var(--im-bg-color);">
    <!-- 顶部会话标题 -->
    <div class="me-view-header border-bottom" style="height: 50px;">
      <span style="font-weight: 500; font-size: 16px; color: var(--im-text-color);">
        {{ chatStore.currentConversation?.name || '选择一个会话' }}
      </span>
      <span v-if="chatStore.currentConversation?.usersCount" style="font-size: 12px; color: var(--im-text-color-grey);">
        {{ chatStore.currentConversation.usersCount }} 人
      </span>
    </div>

    <!-- 消息列表 -->
    <div
      ref="messagesContainer"
      class="me-scrollbar"
      style="flex: 1; padding: 15px; overflow-y: auto;"
    >
      <n-spin :show="chatStore.messagesLoading">
        <div
          v-for="msg in chatStore.messages"
          :key="msg.id"
          class="message-item"
          :class="{ self: isSelf(msg.senderId) }"
          style="margin-bottom: 16px; display: flex; align-items: flex-start; gap: 8px;"
        >
          <!-- 对方消息：头像在左 -->
          <template v-if="!isSelf(msg.senderId)">
            <n-avatar
              :src="`https://ui-avatars.com/api/?name=${msg.senderName}&background=52c41a&color=fff&size=36`"
              :size="36"
              round
            />
            <div>
              <div style="font-size: 12px; color: var(--im-text-color-grey); margin-bottom: 2px;">
                {{ msg.senderName }}
              </div>
              <div
                style="background: var(--im-message-left-bg-color); color: var(--im-message-left-text-color); padding: 8px 12px; border-radius: 8px; max-width: 480px; word-break: break-all; font-size: 14px;"
              >
                {{ msg.content }}
              </div>
              <div v-if="msg.isEdited" style="font-size: 11px; color: var(--im-text-color-grey); margin-top: 2px;">
                (已编辑)
              </div>
            </div>
          </template>

          <!-- 自己消息：内容在右 -->
          <template v-else>
            <div style="margin-left: auto; text-align: right;">
              <div
                style="background: var(--im-message-right-bg-color); color: var(--im-message-right-text-color); padding: 8px 12px; border-radius: 8px; max-width: 480px; word-break: break-all; font-size: 14px; text-align: left;"
              >
                {{ msg.content }}
              </div>
              <div style="font-size: 11px; color: var(--im-text-color-grey); margin-top: 2px;">
                {{ formatTime(msg.timestamp) }}
              </div>
            </div>
          </template>
        </div>

        <!-- 空状态 -->
        <div
          v-if="!chatStore.messagesLoading && chatStore.messages.length === 0 && chatStore.currentRoomId"
          class="flex-center"
          style="height: 200px; color: var(--im-text-color-grey);"
        >
          暂无消息，发送第一条消息吧
        </div>
      </n-spin>
    </div>

    <!-- 输入框 -->
    <div
      v-if="chatStore.currentRoomId"
      class="border-top"
      style="padding: 12px 15px; display: flex; gap: 10px; background: var(--im-bg-color);"
    >
      <n-input
        v-model:value="inputText"
        type="textarea"
        placeholder="输入消息，Enter 发送"
        :autosize="{ minRows: 1, maxRows: 4 }"
        @keydown="handleKeydown"
      />
      <n-button type="primary" @click="handleSend" style="height: auto;">发送</n-button>
    </div>
  </div>
</template>

<style scoped>
.message-item.self {
  justify-content: flex-end;
}
</style>
