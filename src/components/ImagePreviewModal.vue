<script>
export default {
  name: 'ImagePreviewModal',
  props: {
    url: {
      type: String,
      required: false,
      default: '',
    },
    filename: {
      type: String,
      required: false,
      default: '',
    },
    loading: {
      type: Boolean,
      required: false,
      default: false,
    },
    error: {
      type: String,
      required: false,
      default: '',
    },
  },
  emits: ['close'],
  data() {
    return {
      zoom: 1,
      isFullscreen: false,
    }
  },
  computed: {
    zoomLabel() {
      return `${Math.round(this.zoom * 100)}%`
    },
  },
  methods: {
    onBackdrop(e) {
      if (e.target === e.currentTarget) {
        this.$emit('close')
      }
    },
    zoomIn() {
      this.zoom = Math.min(this.zoom + 0.25, 4)
    },
    zoomOut() {
      this.zoom = Math.max(this.zoom - 0.25, 0.25)
    },
    resetZoom() {
      this.zoom = 1
    },
    toggleFullscreen() {
      this.isFullscreen = !this.isFullscreen
    },
    async downloadImage() {
      if (!this.url) return
      try {
        const a = document.createElement('a')
        a.href = this.url
        a.download = this.filename || 'image'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      } catch (e) {
        // 静默失败即可，在控制台留个记录
        console.error('[ImagePreviewModal] download failed', e)
      }
    },
  },
}
</script>

<template>
  <div class="img-modal-backdrop" @click="onBackdrop">
    <div class="img-modal" :class="{ 'fullscreen': isFullscreen }" @click.stop>
      <div class="img-modal-header">
        <span class="title">图片预览</span>
        <div class="header-actions">
          <button class="icon-btn" type="button" @click="zoomOut" title="缩小">－</button>
          <button class="icon-btn" type="button" @click="zoomIn" title="放大">＋</button>
          <button class="icon-btn" type="button" @click="resetZoom" title="重置缩放">{{ zoomLabel }}</button>
          <button class="icon-btn" type="button" @click="toggleFullscreen" :title="isFullscreen ? '退出全屏' : '全屏预览'">
            {{ isFullscreen ? '🗗' : '🗖' }}
          </button>
          <button class="icon-btn" type="button" @click="downloadImage" title="下载">⤓</button>
          <button class="close-btn" type="button" @click="$emit('close')">✕</button>
        </div>
      </div>
      <div class="img-modal-body">
        <div v-if="loading" class="status">正在加载…</div>
        <div v-else-if="error" class="status error">{{ error }}</div>
        <div v-else-if="url" class="img-wrapper">
          <img
            :src="url"
            :alt="filename || 'image'"
            :style="{ transform: `scale(${zoom})` }"
          />
        </div>
        <div v-else class="status">暂无可预览内容</div>
      </div>
      <div class="img-modal-footer">
        <span class="filename" v-if="filename">{{ filename }}</span>
        <button class="ok-btn" type="button" @click="$emit('close')">关闭</button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="sass">
.img-modal-backdrop
  position: fixed
  inset: 0
  background: rgba(0, 0, 0, 0.45)
  display: flex
  align-items: center
  justify-content: center
  z-index: 60

.img-modal
  min-width: min(640px, 90vw)
  max-width: 90vw
  max-height: 90vh
  background: #1f2430
  color: #fff
  border-radius: 10px
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.4)
  display: flex
  flex-direction: column
  position: relative

  &.fullscreen
    width: 100vw
    height: 100vh
    max-width: 100vw
    max-height: 100vh
    border-radius: 0

.img-modal-header
  padding: 10px 14px
  display: flex
  align-items: center
  justify-content: space-between
  border-bottom: 1px solid rgba(255,255,255,0.08)
  position: relative
  z-index: 2
  .title
    font-weight: 600
  .header-actions
    display: flex
    align-items: center
    gap: 6px
  .close-btn
    background: transparent
    border: none
    color: inherit
    font-size: 16px
    cursor: pointer

.icon-btn
  background: transparent
  border: 1px solid rgba(255,255,255,0.25)
  color: inherit
  border-radius: 4px
  padding: 2px 6px
  font-size: 12px
  cursor: pointer
  line-height: 1.2
  &:hover
    background: rgba(255,255,255,0.12)

.img-modal-body
  padding: 10px 14px
  flex: 1
  display: flex
  align-items: center
  justify-content: center
  position: relative
  z-index: 1
  .status
    opacity: 0.8
    &.error
      color: #ff8080
  .img-wrapper
    max-width: 100%
    max-height: 100%
    display: flex
    align-items: center
    justify-content: center
    img
      max-width: 100%
      max-height: 70vh
      border-radius: 4px

.img-modal-footer
  padding: 8px 14px 10px
  display: flex
  align-items: center
  justify-content: space-between
  border-top: 1px solid rgba(255,255,255,0.08)
  .filename
    opacity: 0.75
    font-size: 12px
  .ok-btn
    padding: 4px 10px
    border-radius: 6px
    border: none
    background: #4a7cf7
    color: #fff
    cursor: pointer
    font-size: 13px
    &:hover
      background: #3e6ce0
</style>
