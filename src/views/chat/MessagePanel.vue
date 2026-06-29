<script lang="ts" setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { NAvatar, NInput, NButton, NSpin, NIcon, NModal } from 'naive-ui'
import { AttachOutline } from '@vicons/ionicons5'
import { useChatStore } from '@/stores/useChatStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { loadImage } from '@/utils/image'
import type { ChatMessage, ChatAttachment } from '@/types/view'

const chatStore = useChatStore()
const authStore = useAuthStore()

const inputText = ref('')
const messagesContainer = ref<HTMLElement>()
const fileInput = ref<HTMLInputElement>()
const uploading = ref(false)
const selectedFiles = ref<File[]>([])

/** 已加载的图片 blobUrl 映射 */
const loadedImages = ref<Record<string, string>>({})
/** 图片加载状态 */
const imageLoading = ref<Record<string, boolean>>({})
/** 图片预览 */
const previewUrl = ref('')
const previewVisible = ref(false)

/** 加载图片（blob URL） */
async function tryLoadImage(rawUrl: string) {
  if (!rawUrl || loadedImages.value[rawUrl]) return
  imageLoading.value[rawUrl] = true
  try {
    const blobUrl = await loadImage(rawUrl)
    loadedImages.value[rawUrl] = blobUrl
  } catch {
    // 加载失败，保留空
  } finally {
    imageLoading.value[rawUrl] = false
  }
}

function openPreview(url: string) {
  previewUrl.value = loadedImages.value[url] || url
  previewVisible.value = true
}

// ---- 滚动 ----
async function scrollToBottom() {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

watch(() => chatStore.messages.length, () => {
  // 新消息到来时自动加载图片
  for (const msg of chatStore.messages) {
    if (msg.attachments) {
      for (const att of msg.attachments) {
        if (att.type === 'image' && att.url) {
          tryLoadImage(att.url)
        }
      }
    }
  }
  scrollToBottom()
})
onMounted(() => scrollToBottom())

// ---- 辅助 ----
function isSelf(senderId: string): boolean {
  return senderId === authStore.userId
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

// ---- 文件选择 ----
function triggerFileInput() {
  fileInput.value?.click()
}

function onFilesSelected(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files) {
    selectedFiles.value = Array.from(input.files)
    // 立即上传
    uploadSelectedFiles()
  }
  input.value = ''
}

async function uploadSelectedFiles() {
  if (!chatStore.currentRoomId || selectedFiles.value.length === 0) return

  uploading.value = true
  try {
    for (const file of selectedFiles.value) {
      await chatStore.uploadFile(chatStore.currentRoomId, file)
    }
    selectedFiles.value = []
    scrollToBottom()
  } catch (err) {
    window['$message']?.error('文件上传失败')
  } finally {
    uploading.value = false
  }
}

function removeFile(index: number) {
  selectedFiles.value.splice(index, 1)
}

// ---- 发送文本 ----
async function handleSend() {
  const text = inputText.value.trim()
  if ((!text && selectedFiles.value.length === 0) || !chatStore.currentRoomId) return

  if (selectedFiles.value.length > 0) {
    uploading.value = true
    try {
      for (const file of selectedFiles.value) {
        await chatStore.uploadFile(chatStore.currentRoomId, file, text || undefined)
      }
      selectedFiles.value = []
      inputText.value = ''
      scrollToBottom()
    } catch {
      window['$message']?.error('发送失败')
    } finally {
      uploading.value = false
    }
    return
  }

  if (!text) return
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

// ---- 粘贴图片 ----
function handlePaste(e: ClipboardEvent) {
  const items = e.clipboardData?.items
  if (!items) return
  for (const item of Array.from(items)) {
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile()
      if (file && chatStore.currentRoomId) {
        uploading.value = true
        chatStore.uploadFile(chatStore.currentRoomId, file).finally(() => {
          uploading.value = false
          scrollToBottom()
        })
      }
    }
  }
}
</script>

<template>
  <div
    class="message-panel h-full"
    style="display: flex; flex-direction: column; background: var(--im-bg-color);"
    @paste="handlePaste"
  >
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
            <div style="max-width: 520px;">
              <div style="font-size: 12px; color: var(--im-text-color-grey); margin-bottom: 2px;">
                {{ msg.senderName }}
              </div>

              <!-- 文本内容 -->
              <div
                v-if="msg.content"
                style="background: var(--im-message-left-bg-color); color: var(--im-message-left-text-color); padding: 8px 12px; border-radius: 8px; word-break: break-all; font-size: 14px;"
              >
                {{ msg.content }}
              </div>

              <!-- 附件：图片 -->
              <template v-if="msg.attachments?.length">
                <div
                  v-for="(att, ai) in msg.attachments"
                  :key="ai"
                  :style="msg.content ? 'margin-top: 8px;' : ''"
                >
                  <!-- 图片 -->
                  <div
                    v-if="att.type === 'image' && att.url"
                    style="max-width: 360px; cursor: pointer;"
                  >
                    <n-spin v-if="imageLoading[att.url]" size="small" />
                    <img
                      v-else-if="loadedImages[att.url]"
                      :src="loadedImages[att.url]"
                      style="max-width: 360px; max-height: 300px; border-radius: 8px; object-fit: cover;"
                      @click="openPreview(att.url)"
                    />
                    <div
                      v-else
                      style="width: 200px; height: 120px; background: var(--im-message-left-bg-color); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: var(--im-text-color-grey); font-size: 13px;"
                    >
                      🖼️ 加载失败
                    </div>
                  </div>

                  <!-- 视频 -->
                  <div v-else-if="att.type === 'video' && att.url" class="att-file-card">
                    <span class="att-file-icon">🎬</span>
                    <div class="att-file-info">
                      <a :href="att.url" target="_blank" class="att-file-name">{{ att.title || '视频文件' }}</a>
                    </div>
                  </div>

                  <!-- 音频 -->
                  <div v-else-if="att.type === 'audio' && att.url" class="att-file-card">
                    <span class="att-file-icon">🎵</span>
                    <div class="att-file-info">
                      <audio :src="att.url" controls style="max-width: 300px; height: 32px;" />
                    </div>
                  </div>

                  <!-- 普通文件 -->
                  <div v-else-if="att.url" class="att-file-card">
                    <span class="att-file-icon">📎</span>
                    <div class="att-file-info">
                      <a :href="att.url" target="_blank" class="att-file-name">{{ att.title || att.name || '未知文件' }}</a>
                      <span v-if="att.size" class="att-file-size">{{ formatFileSize(att.size) }}</span>
                    </div>
                  </div>
                </div>
              </template>

              <div v-if="msg.isEdited" style="font-size: 11px; color: var(--im-text-color-grey); margin-top: 2px;">
                (已编辑)
              </div>
            </div>
          </template>

          <!-- 自己消息：内容在右 -->
          <template v-else>
            <div style="margin-left: auto; text-align: right; max-width: 520px;">
              <!-- 文本内容 -->
              <div
                v-if="msg.content"
                style="background: var(--im-message-right-bg-color); color: var(--im-message-right-text-color); padding: 8px 12px; border-radius: 8px; word-break: break-all; font-size: 14px; text-align: left; display: inline-block;"
              >
                {{ msg.content }}
              </div>

              <!-- 附件：图片 -->
              <template v-if="msg.attachments?.length">
                <div
                  v-for="(att, ai) in msg.attachments"
                  :key="ai"
                  :style="msg.content ? 'margin-top: 8px;' : ''"
                  style="text-align: left;"
                >
                  <!-- 图片：self -->
                  <div
                    v-if="att.type === 'image' && att.url"
                    style="max-width: 360px; cursor: pointer;"
                  >
                    <n-spin v-if="imageLoading[att.url]" size="small" />
                    <img
                      v-else-if="loadedImages[att.url]"
                      :src="loadedImages[att.url]"
                      style="max-width: 360px; max-height: 300px; border-radius: 8px; object-fit: cover;"
                      @click="openPreview(att.url)"
                    />
                    <div
                      v-else
                      style="width: 200px; height: 120px; background: var(--im-message-right-bg-color); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: var(--im-text-color-grey); font-size: 13px;"
                    >
                      🖼️ 加载失败
                    </div>
                  </div>

                  <div v-else-if="att.type === 'video' && att.url" class="att-file-card">
                    <span class="att-file-icon">🎬</span>
                    <div class="att-file-info">
                      <a :href="att.url" target="_blank" class="att-file-name">{{ att.title || '视频文件' }}</a>
                    </div>
                  </div>

                  <div v-else-if="att.type === 'audio' && att.url" class="att-file-card">
                    <span class="att-file-icon">🎵</span>
                    <div class="att-file-info">
                      <audio :src="att.url" controls style="max-width: 300px; height: 32px;" />
                    </div>
                  </div>

                  <div v-else-if="att.url" class="att-file-card">
                    <span class="att-file-icon">📎</span>
                    <div class="att-file-info">
                      <a :href="att.url" target="_blank" class="att-file-name">{{ att.title || att.name || '未知文件' }}</a>
                      <span v-if="att.size" class="att-file-size">{{ formatFileSize(att.size) }}</span>
                    </div>
                  </div>
                </div>
              </template>

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

    <!-- 已选文件预览 -->
    <div
      v-if="selectedFiles.length > 0"
      style="padding: 8px 15px; display: flex; gap: 8px; flex-wrap: wrap; background: var(--im-bg-color); border-top: 1px solid var(--border-color);"
    >
      <div
        v-for="(f, fi) in selectedFiles"
        :key="fi"
        style="display: flex; align-items: center; gap: 6px; padding: 4px 10px; background: var(--im-message-left-bg-color); border-radius: 6px; font-size: 12px;"
      >
        <span>{{ f.type.startsWith('image/') ? '🖼️' : '📎' }}</span>
        <span style="max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--im-text-color);">{{ f.name }}</span>
        <span style="cursor: pointer; color: var(--im-text-color-grey);" @click="removeFile(fi)">✕</span>
      </div>
    </div>

    <!-- 输入框 -->
    <div
      v-if="chatStore.currentRoomId"
      class="border-top"
      style="padding: 12px 15px; display: flex; gap: 10px; align-items: flex-end; background: var(--im-bg-color);"
    >
      <!-- 隐藏文件输入 -->
      <input
        ref="fileInput"
        type="file"
        multiple
        style="display: none;"
        @change="onFilesSelected"
      />

      <!-- 附件按钮 -->
      <n-button
        quaternary
        circle
        :disabled="uploading"
        @click="triggerFileInput"
        style="flex-shrink: 0;"
      >
        <template #icon>
          <n-icon size="20"><attach-outline /></n-icon>
        </template>
      </n-button>

      <n-input
        v-model:value="inputText"
        type="textarea"
        placeholder="输入消息，Enter 发送；Ctrl+V 粘贴图片"
        :autosize="{ minRows: 1, maxRows: 4 }"
        :disabled="uploading"
        @keydown="handleKeydown"
      />

      <n-button
        type="primary"
        @click="handleSend"
        :loading="uploading"
        :disabled="!inputText.trim() && selectedFiles.length === 0"
        style="height: 36px; flex-shrink: 0;"
      >
        {{ uploading ? '上传中' : '发送' }}
      </n-button>
    </div>
  </div>

  <!-- 图片预览弹窗 -->
  <n-modal
    v-model:show="previewVisible"
    preset="card"
    title="图片预览"
    style="max-width: 90vw; max-height: 90vh;"
    :bordered="false"
    size="huge"
  >
    <img
      v-if="previewUrl"
      :src="previewUrl"
      style="max-width: 100%; max-height: 75vh; object-fit: contain; display: block; margin: 0 auto;"
    />
  </n-modal>
</template>

<style scoped>
.message-item.self {
  justify-content: flex-end;
}

/* 附件文件卡片 */
.att-file-card {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--im-message-left-bg-color);
  border-radius: 8px;
  max-width: 360px;
}

.att-file-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.att-file-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.att-file-name {
  color: var(--im-text-color);
  text-decoration: none;
  font-size: 13px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.att-file-name:hover {
  color: #2196f3;
  text-decoration: underline;
}

.att-file-size {
  font-size: 11px;
  color: var(--im-text-color-grey);
}
</style>
