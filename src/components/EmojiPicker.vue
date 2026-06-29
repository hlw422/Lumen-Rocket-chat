<script lang="ts" setup>
import { ref } from 'vue'
import { NPopover, NButton, NIcon, NTabs, NTabPane } from 'naive-ui'
import { HappyOutline } from '@vicons/ionicons5'

defineProps<{
  onSelect?: (emoji: string) => void
}>()

const emit = defineEmits<{
  select: [emoji: string]
}>()

const visible = ref(false)

const emojis = {
  smileys: ['😀','😃','😄','😁','😅','😂','🤣','😊','😇','🙂','😉','😌','😍','🥰','😘','😗','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🤐','🤨','😐','😑','😶','😏','😒','🙄','😬','😮‍💨','🤥','😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🥴','😵','🤯','🥳','🥺','😢','😭','😤','😠','😡','🤬','💀','☠️','💩','🤡','👹','👺','👻','👽','👾','🤖'],
  gestures: ['👍','👎','👌','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','👇','☝️','✋','🤚','🖐️','🖖','👋','🤏','✍️','🙌','👏','🙏','🤝','💪','🦵','🦶','👂','🦻','👃','🧠','🫀','🫁','👀','👁️','👅','👄','💋'],
  hearts: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟','♥️','💌','💒','💏','💑','👩‍❤️‍👨','👨‍❤️‍👨','👩‍❤️‍👩','💐','🌹','🌺','🌸','🌼','🌻'],
  objects: ['💯','🔥','⭐','🌟','✨','💫','🎉','🎊','🎈','🎂','🍰','☕','🍺','🍻','🥂','🍾','💰','🎁','🏆','🥇','🥈','🥉','🔔','🎵','🎶','📢','💬','💭','🗯️','💡','🔦','🔑','🔒','🔓','📌','📍','✂️','📎','🔗','🧲','⚡','💣','🧨','🔪','💊','🩹','🧻','🧯','🛡️'],
  animals: ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🙈','🙉','🙊','🐒','🐔','🐧','🐦','🐤','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🐛','🦋','🐌','🐞','🐜','🦟','🦗','🕷️','🦂','🐢','🐍','🦎','🦖','🦕','🐙','🦑','🦐','🦞','🦀','🐡','🐠','🐟','🐬','🐳','🐋','🦈','🐊','🐅','🐆','🦓','🦍','🦧','🐘','🦛','🦏','🐪','🐫','🦒','🦘','🐃','🐂','🐄','🐎','🐖','🐏','🐑','🦙','🐐','🦌','🐕','🐩','🦮','🐕‍🦺','🐈','🐈‍⬛','🪶','🐓','🦃','🦤','🦚','🦜','🦢','🦩','🕊️','🐇','🦝','🦨','🦡','🦫','🦦','🦥','🐁','🐀','🐿️','🦔','🐾','🐉','🐲'],
  food: ['🍏','🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🫐','🍈','🍒','🍑','🥭','🍍','🥥','🥝','🍅','🍆','🥑','🥦','🥬','🥒','🌶️','🫑','🌽','🥕','🫒','🧄','🧅','🥔','🍠','🥐','🍞','🥖','🥨','🧀','🥚','🍳','🧈','🥞','🧇','🥓','🥩','🍗','🍖','🦴','🌭','🍔','🍟','🍕','🫓','🥪','🥙','🧆','🌮','🌯','🫔','🥗','🥘','🫕','🥫','🍝','🍜','🍲','🍛','🍣','🍱','🥟','🦪','🍤','🍙','🍚','🍘','🍥','🥠','🥮','🍢','🍡','🍧','🍨','🍦','🥧','🧁','🍰','🎂','🍮','🍭','🍬','🍫','🍿','🍩','🍪','🌰','🥜','🍯','🥛','🍼','🫖','☕','🍵','🧃','🥤','🧋','🍶','🍺','🍻','🥂','🍷','🥃','🍸','🍹','🧉','🍾','🧊','🥄','🍴','🍽️','🥣','🥡','🥢','🧂']
}

const tabs = [
  { name: 'smileys', label: '😀', emojis: emojis.smileys },
  { name: 'gestures', label: '👍', emojis: emojis.gestures },
  { name: 'hearts', label: '❤️', emojis: emojis.hearts },
  { name: 'objects', label: '🎉', emojis: emojis.objects },
  { name: 'animals', label: '🐶', emojis: emojis.animals },
  { name: 'food', label: '🍎', emojis: emojis.food }
]

function selectEmoji(emoji: string) {
  emit('select', emoji)
  visible.value = false
}
</script>

<template>
  <n-popover trigger="click" :show-arrow="false" placement="top-start" :width="320" v-model:show="visible">
    <template #trigger>
      <n-button quaternary circle>
        <template #icon>
          <n-icon size="20"><happy-outline /></n-icon>
        </template>
      </n-button>
    </template>

    <n-tabs type="segment" animated size="small">
      <n-tab-pane v-for="tab in tabs" :key="tab.name" :name="tab.name" :tab="tab.label">
        <div style="max-height: 220px; overflow-y: auto; padding: 4px;">
          <span
            v-for="emoji in tab.emojis"
            :key="emoji"
            @click="selectEmoji(emoji)"
            style="display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px; font-size: 20px; cursor: pointer; border-radius: 6px; transition: background 0.15s;"
            @mouseenter="($event.target as HTMLElement).style.background = 'var(--im-message-left-bg-color)'"
            @mouseleave="($event.target as HTMLElement).style.background = 'transparent'"
          >{{ emoji }}</span>
        </div>
      </n-tab-pane>
    </n-tabs>
  </n-popover>
</template>
