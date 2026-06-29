<script lang="ts" setup>
import { ref, watch, computed } from 'vue'
import { NInput, NButton, NSpin, NIcon, NTag } from 'naive-ui'
import { SearchOutline, CloseOutline, ImageOutline, VideocamOutline, MusicalNotesOutline, DocumentOutline } from '@vicons/ionicons5'
import { useChatStore } from '@/stores/useChatStore'
import type { ChatMessage, ChatAttachment } from '@/types/view'

const emit = defineEmits<{ close: [] }>()

const chatStore = useChatStore()
const keyword = ref('')
let debounceTimer: ReturnType<typeof setTimeout> | null = null

function onInput(value: string) {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    chatStore.searchMessages(value)
  }, 300)
}

function onClear() {
  keyword.value = ''
  chatStore.clearSearch()
}

function formatTime(ms: number): string {
  const d = new Date(ms)
  const now = new Date()
  const pad = (n: number) => n.toString().padStart(2, '0')
  if (d.toDateString() === now.toDateString()) {
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`
  }
  return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function highlightText(text: string, q: string): string {
  if (!q) return text.slice(0, 120)
  const idx = text.toLowerCase().indexOf(q.toLowerCase())
  if (idx < 0) return text.slice(0, 120)
  const start = Math.max(0, idx - 20)
  const end = Math.min(text.length, idx + q.length + 80)
  let result = (start > 0 ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : '')
  return result
}

function attIcon(type: ChatAttachment['type']): string {
  switch (type) {
    case 'image': return '🖼️'
    case 'video': return '🎬'
    case 'audio': return '🎵'
    default: return '📎'
  }
}

watch(
  () => chatStore.currentRoomId,
  () => {
    keyword.value = ''
    chatStore.clearSearch()
  }
)
</script>

<template>
  <div class="message-search-overlay" style="display: flex; flex-direction: column; background: var(--im-bg-color);">
    <!-- 搜索栏 -->
    <div style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-bottom: 1px solid var(--im-border-color);">
      <n-input
        v-model:value="keyword"
        placeholder="搜索聊天记录（不区分大小写）"
        clearable
        :autofocus="true"
        @update:value="onInput"
        @clear="onClear"
        style="flex: 1;"
      >
        <template #prefix>
          <n-icon :component="SearchOutline" size="16" />
        </template>
      </n-input>
      <n-button size="small" @click="emit('close')">
        <template #icon><n-icon :component="CloseOutline" /></template>
        关闭
      </n-button>
    </div>

    <!-- 结果 -->
    <div style="flex: 1; overflow-y: auto;">
      <div v-if="!chatStore.searchQuery" style="display: flex; align-items: center; justify-content: center; height: 100%; color: var(--im-text-color-grey); font-size: 14px;">
        输入关键词搜索聊天记录
      </div>

      <n-spin v-else-if="chatStore.searchLoading" style="display: flex; justify-content: center; padding: 40px;" />

      <div v-else-if="chatStore.searchResults.length === 0" style="display: flex; align-items: center; justify-content: center; height: 200px; color: var(--im-text-color-grey); font-size: 14px;">
        未找到包含 "{{ chatStore.searchQuery }}" 的消息
      </div>

      <div v-else style="padding: 4px 0;">
        <div style="padding: 8px 16px; font-size: 12px; color: var(--im-text-color-grey);">
          找到 {{ chatStore.searchResults.length }} 条结果
        </div>
        <div
          v-for="msg in chatStore.searchResults"
          :key="msg.id"
          style="padding: 10px 16px; border-bottom: 1px solid var(--im-border-color); cursor: default; transition: background 0.15s;"
          @mouseenter="($event.target as HTMLElement).style.background = 'var(--im-hover-color)'"
          @mouseleave="($event.target as HTMLElement).style.background = ''"
        >
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
            <span style="font-weight: 600; font-size: 13px; color: var(--im-text-color);">{{ msg.senderName }}</span>
            <span style="font-size: 11px; color: var(--im-text-color-grey);">{{ formatTime(msg.timestamp) }}</span>
          </div>
          <div style="font-size: 13px; color: var(--im-text-color); line-height: 1.5; word-break: break-all;">
            {{ highlightText(msg.content, chatStore.searchQuery) }}
          </div>
          <div v-if="msg.attachments && msg.attachments.length > 0" style="margin-top: 4px; display: flex; gap: 4px; flex-wrap: wrap;">
            <span
              v-for="(att, idx) in msg.attachments"
              :key="idx"
              style="font-size: 12px; color: var(--im-text-color-grey); background: var(--im-message-left-bg-color); padding: 1px 6px; border-radius: 4px;"
            >
              {{ attIcon(att.type) }} {{ att.title || att.name || '文件' }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
