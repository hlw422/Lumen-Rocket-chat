<script lang="ts" setup>
import { ref, watch } from 'vue'
import { NInput, NAvatar, NButton, NSpin, NSpace, useMessage } from 'naive-ui'
import { fetchUsersList, fetchImCreate } from '@/apis/rocket-api'
import { useChatStore } from '@/stores/useChatStore'
import type { RCUser } from '@/types/rocket'

const chatStore = useChatStore()
const message = useMessage()

const searchText = ref('')
const users = ref<RCUser[]>([])
const loading = ref(false)
const searched = ref(false)

async function doSearch() {
  const keyword = searchText.value.trim()
  if (!keyword) return

  loading.value = true
  searched.value = true
  try {
    const res = await fetchUsersList({ query: JSON.stringify({ username: { $regex: keyword, $options: 'i' } }) })
    users.value = res?.users || []
  } catch (err) {
    message.error('搜索失败')
    users.value = []
  } finally {
    loading.value = false
  }
}

async function startChat(user: RCUser) {
  try {
    const res = await fetchImCreate({ username: user.username })
    if (res?.room) {
      message.success(`已打开与 ${user.username} 的对话`)
      await chatStore.loadConversations()
      chatStore.selectConversation(res.room._id)
    }
  } catch (err) {
    message.error('创建对话失败')
  }
}
</script>

<template>
  <div class="user-search h-full" style="background: var(--im-bg-color); padding: 10px;">
    <n-space vertical>
      <n-input
        v-model:value="searchText"
        placeholder="搜索用户..."
        clearable
        @keyup.enter="doSearch"
      >
        <template #suffix>
          <n-button text type="primary" @click="doSearch" :loading="loading">搜索</n-button>
        </template>
      </n-input>

      <n-spin :show="loading">
        <div v-if="searched && users.length === 0" style="color: var(--im-text-color-grey); text-align: center; padding: 40px 0;">
          未找到用户
        </div>

        <div
          v-for="user in users"
          :key="user._id"
          class="flex"
          style="align-items: center; padding: 8px; gap: 10px; border-radius: 8px; cursor: pointer;"
          @click="startChat(user)"
        >
          <n-avatar
            :src="user.avatarUrl || `https://ui-avatars.com/api/?name=${user.username}&background=1890ff&color=fff&size=36`"
            :size="36"
            round
          />
          <div style="flex: 1;">
            <div style="font-weight: 500; color: var(--im-text-color);">{{ user.name || user.username }}</div>
            <div style="font-size: 12px; color: var(--im-text-color-grey);">@{{ user.username }}</div>
          </div>
          <n-button size="small" type="primary" ghost>发消息</n-button>
        </div>
      </n-spin>
    </n-space>
  </div>
</template>
