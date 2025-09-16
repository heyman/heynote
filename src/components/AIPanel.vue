<script>
import { mapStores, mapWritableState, mapState, mapActions } from 'pinia'
import { useHeynoteStore } from '../stores/heynote-store'

export default {
  name: 'AIPanel',
  mounted() {
    // focus input when panel opens
    this.$nextTick(() => {
      this.$refs.input?.focus()
      const el = this.$refs.chat
      if (el) el.scrollTop = el.scrollHeight
    })
  },
  watch: {
    aiMessages() {
      // auto scroll to bottom on new messages
      this.$nextTick(() => {
        const el = this.$refs.chat
        if (el) el.scrollTop = el.scrollHeight
      })
    },
  },
  computed: {
    ...mapStores(useHeynoteStore),
    ...mapState(useHeynoteStore, [
      'aiMessages',
      'aiInput',
      'showAIPanel',
    ]),
  },
  methods: {
    ...mapActions(useHeynoteStore, ['aiSend', 'closeAIPanel']),
    onSend() {
      this.aiSend()
      // 可在此处触发真正的 AI 请求；当前仅将消息放入会话区
    },
    onKeydown(e) {
      // Cmd+Enter 发送（macOS 上使用 Meta 键）
      if (e.key === 'Enter' && e.metaKey) {
        e.preventDefault()
        this.onSend()
      }
    },
  },
}
</script>

<template>
  <div class="ai-panel" @keydown.stop>
    <div class="ai-header">
      <div class="title">AI Assistant</div>
      <button class="close" @click="closeAIPanel">✕</button>
    </div>

    <div class="ai-chat" ref="chat">
      <div v-if="aiMessages.length === 0" class="placeholder">
        开始与 AI 对话…
      </div>
      <div
        v-for="(m, i) in aiMessages"
        :key="i"
        class="msg"
        :class="m.role"
      >
        <div class="bubble">{{ m.content }}</div>
      </div>
    </div>

    <div class="ai-input">
      <textarea
        ref="input"
        v-model="heynoteStore.aiInput"
        placeholder="输入要发送给 AI 的内容…"
        rows="4"
        @keydown="onKeydown"
      />
      <button class="send" @click="onSend" aria-label="发送">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
          <path d="M12 19V5M12 5l-6 6M12 5l6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped lang="sass">
.ai-panel
  position: absolute
  top: 0
  right: 0
  width: min(520px, 42vw)
  height: 100%
  background: var(--surface-0, #1f2430)
  color: #fff
  border-left: 1px solid rgba(255,255,255,0.08)
  display: flex
  flex-direction: column
  z-index: 50

.ai-header
  display: flex
  align-items: center
  justify-content: space-between
  padding: 10px 12px
  border-bottom: 1px solid rgba(255,255,255,0.08)
  .title
    font-weight: 600
  .close
    background: transparent
    border: none
    color: inherit
    font-size: 16px
    cursor: pointer

.ai-chat
  flex: 1
  overflow: auto
  padding: 12px
  .placeholder
    opacity: 0.6
  .msg
    margin: 8px 0
    display: flex
    &.user
      justify-content: flex-end
      .bubble
        background: #4a7cf7
        color: #fff
    &.assistant
      justify-content: flex-start
      .bubble
        background: #2b3242
        color: #fff
    .bubble
      padding: 8px 10px
      border-radius: 8px
      max-width: 80%
      white-space: pre-wrap
      word-break: break-word
      line-height: 1.5

.ai-input
  border-top: 1px solid rgba(255,255,255,0.08)
  padding: 10px 12px
  display: grid
  grid-template-columns: 1fr auto
  grid-gap: 8px
  textarea
    width: 100%
    background: rgba(255,255,255,0.06)
    border: 1px solid rgba(255,255,255,0.12)
    color: #fff
    border-radius: 8px
    padding: 8px 10px
    resize: vertical
    outline: none
  .send
    background: #4a7cf7
    border: none
    color: #fff
    width: 40px
    height: 40px
    border-radius: 50%
    display: grid
    place-items: center
    cursor: pointer
    align-self: end
    transition: background 0.15s ease
    &:hover
      background: #3e6ce0
</style>
