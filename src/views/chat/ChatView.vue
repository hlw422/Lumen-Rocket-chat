<script lang="ts" setup>
import { onMounted, onUnmounted } from 'vue'
import { useChatStore } from '@/stores/useChatStore'
import ConversationList from './ConversationList.vue'
import MessagePanel from './MessagePanel.vue'
import UserSearch from './UserSearch.vue'

const chatStore = useChatStore()

onMounted(async () => {
  chatStore.connectDdp()
  await chatStore.loadConversations()
})

onUnmounted(() => {
  chatStore.dispose()
})
</script>

<template>
  <div class="chat-view el-container h-full" style="height: 100vh;">
    <!-- 左侧：会话列表 -->
    <div class="el-aside" style="width: 280px; min-width: 280px; border-right: 1px solid var(--border-color);">
      <ConversationList />
    </div>

    <!-- 中间：消息面板 -->
    <div class="el-main" style="flex: 1; padding: 0;">
      <MessagePanel />
    </div>

    <!-- 右侧：用户搜索 -->
    <div class="el-aside" style="width: 280px; min-width: 280px; border-left: 1px solid var(--border-color);">
      <UserSearch />
    </div>
  </div>
</template>

<style scoped>
.chat-view {
  background-color: var(--im-bg-color);
}
</style>
