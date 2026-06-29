<script lang="ts" setup>
import { computed } from 'vue'
import { NAvatar, NBadge, NSpin, NInput } from 'naive-ui'
import { useChatStore } from '@/stores/useChatStore'
import { useAuthStore } from '@/stores/useAuthStore'
import type { Conversation } from '@/types/view'

const chatStore = useChatStore()
const authStore = useAuthStore()

const emits = defineEmits<{
  'select': [conv: Conversation]
}>()

const roomTypeLabel = computed(() => ({
  channel: '#',
  group: '*',
  direct: '@'
}))

function getAvatar(conv: Conversation): string {
  return conv.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(conv.name)}&background=1890ff&color=fff&size=48`
}

function handleSelect(conv: Conversation) {
  chatStore.selectConversation(conv.id)
  emits('select', conv)
}
</script>

<template>
  <div class="conversation-list h-full" style="background: var(--im-bg-color);">
    <!-- 顶部操作区 -->
    <div class="me-view-header border-bottom" style="height: 50px;">
      <div class="flex-center" style="gap: 8px;">
        <n-avatar
          :src="authStore.avatarUrl || `https://ui-avatars.com/api/?name=${authStore.username}&background=1890ff&color=fff&size=32`"
          :size="32"
          round
        />
        <span style="font-weight: 500; color: var(--im-text-color);">{{ authStore.username }}</span>
      </div>
      <n-button text type="primary" @click="authStore.logout()">退出</n-button>
    </div>

    <!-- 会话列表 -->
    <n-spin :show="chatStore.loading">
      <div class="view-box me-scrollbar" style="height: calc(100% - 50px); overflow-y: auto;">
        <div
          v-for="conv in chatStore.conversations"
          :key="conv.id"
          class="view-list"
          :class="{ selectd: chatStore.currentRoomId === conv.id }"
          style="height: 60px; cursor: pointer;"
          @click="handleSelect(conv)"
        >
          <div class="image">
            <n-avatar :src="getAvatar(conv)" :size="46" round />
          </div>
          <div class="content">
            <div class="name text-ellipsis">
              {{ roomTypeLabel[conv.type] }}{{ conv.name }}
            </div>
            <div class="desc text-ellipsis" style="color: var(--im-text-color-grey);">
              {{ conv.lastMessage || '暂无消息' }}
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div
          v-if="!chatStore.loading && chatStore.conversations.length === 0"
          class="flex-center"
          style="height: 200px; color: var(--im-text-color-grey);"
        >
          暂无会话，请在 Rocket.Chat 中创建
        </div>
      </div>
    </n-spin>
  </div>
</template>

<style scoped>
@import '@/assets/css/contact.less';
</style>
