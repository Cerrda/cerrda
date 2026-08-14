<script setup lang="ts">
/**
 * Overlay 滚动条：浮在视口右侧，不占布局宽度。
 * 滚动仍发生在 document，不改 body 结构。
 */
import { useEventListener } from '@vueuse/core'

const route = useRoute()
const trackRef = ref<HTMLElement | null>(null)
const progress = ref(0)
const thumbHeight = ref(32)
const thumbY = ref(0)
const canScroll = ref(false)
const dragging = ref(false)
const active = ref(false)

let metricsRaf = 0
let hideTimer = 0
let observer: ResizeObserver | undefined

const thumbStyle = computed(() => ({
  height: `${thumbHeight.value}px`,
  transform: `translate3d(0, ${thumbY.value}px, 0)`,
}))

function updateMetrics() {
  const view = window.innerHeight
  const total = document.documentElement.scrollHeight
  const max = Math.max(0, total - view)
  const track = trackRef.value
  const trackH = track && track.clientHeight > 0 ? track.clientHeight : view
  const ratio = total > 0 ? Math.min(1, view / total) : 1
  const nextHeight = Math.max(32, trackH * ratio)
  const y = max > 0 ? (window.scrollY / max) * Math.max(0, trackH - nextHeight) : 0
  const nextCanScroll = ratio < 0.995
  const becameVisible = nextCanScroll && !canScroll.value

  canScroll.value = nextCanScroll
  if (becameVisible) scheduleMetrics()
  thumbHeight.value = nextHeight
  thumbY.value = y
  progress.value = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
}

function scheduleMetrics() {
  if (metricsRaf) return
  metricsRaf = requestAnimationFrame(() => {
    metricsRaf = 0
    updateMetrics()
  })
}

function reveal() {
  if (!canScroll.value) return
  active.value = true
  window.clearTimeout(hideTimer)
  if (dragging.value) return
  hideTimer = window.setTimeout(() => {
    if (!dragging.value) active.value = false
  }, 800)
}

function scrollFromClientY(clientY: number) {
  const track = trackRef.value
  if (!track) return
  const rect = track.getBoundingClientRect()
  const maxTrack = Math.max(1, rect.height - thumbHeight.value)
  const y = clientY - rect.top - thumbHeight.value / 2
  const next = Math.min(1, Math.max(0, y / maxTrack))
  const distance = document.documentElement.scrollHeight - window.innerHeight
  window.scrollTo({ top: next * Math.max(0, distance), behavior: 'auto' })
  updateMetrics()
}

function onPointerDown(event: PointerEvent) {
  if (event.button !== 0) return
  event.preventDefault()
  dragging.value = true
  document.documentElement.classList.add('is-overlay-scrollbar-dragging')
  trackRef.value?.setPointerCapture(event.pointerId)
  scrollFromClientY(event.clientY)
  reveal()
}

function onPointerMove(event: PointerEvent) {
  if (!dragging.value) return
  scrollFromClientY(event.clientY)
}

function onPointerUp(event: PointerEvent) {
  if (!dragging.value) return
  dragging.value = false
  document.documentElement.classList.remove('is-overlay-scrollbar-dragging')
  if (trackRef.value?.hasPointerCapture(event.pointerId)) {
    trackRef.value.releasePointerCapture(event.pointerId)
  }
  reveal()
}

watch(
  () => route.fullPath,
  () => {
    nextTick(() => {
      scheduleMetrics()
      reveal()
    })
  },
)

onMounted(() => {
  updateMetrics()
  observer = new ResizeObserver(scheduleMetrics)
  observer.observe(document.documentElement)
  if (document.body) observer.observe(document.body)
})

onUnmounted(() => {
  observer?.disconnect()
  window.clearTimeout(hideTimer)
  if (metricsRaf) cancelAnimationFrame(metricsRaf)
  document.documentElement.classList.remove('is-overlay-scrollbar-dragging')
})

useEventListener(
  window,
  'scroll',
  () => {
    scheduleMetrics()
    reveal()
  },
  { passive: true },
)
useEventListener(window, 'resize', scheduleMetrics)
</script>

<template>
  <div
    v-show="canScroll"
    ref="trackRef"
    class="overlay-scrollbar"
    role="scrollbar"
    aria-orientation="vertical"
    aria-label="页面滚动"
    :aria-valuenow="Math.round(progress * 100)"
    aria-valuemin="0"
    aria-valuemax="100"
    :class="{ 'is-active': active, 'is-dragging': dragging }"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
  >
    <div class="overlay-scrollbar-thumb" :style="thumbStyle" />
  </div>
</template>

<style scoped>
.overlay-scrollbar {
  position: fixed;
  top: 0;
  right: 0;
  z-index: 60;
  display: flex;
  width: 12px;
  height: 100vh;
  height: 100dvh;
  padding: 4px 3px;
  pointer-events: auto;
  touch-action: none;
  opacity: 0;
  transition: opacity 220ms ease;
}

.overlay-scrollbar.is-active,
.overlay-scrollbar:hover,
.overlay-scrollbar.is-dragging {
  opacity: 1;
}

.overlay-scrollbar-thumb {
  width: 5px;
  margin-left: auto;
  border-radius: 999px;
  background: color-mix(in oklch, var(--primary) 52%, transparent);
  will-change: transform;
  transition:
    width 180ms ease,
    background-color 220ms ease;
}

.overlay-scrollbar:hover .overlay-scrollbar-thumb,
.overlay-scrollbar.is-dragging .overlay-scrollbar-thumb {
  width: 7px;
  background: color-mix(in oklch, var(--primary) 72%, transparent);
}

:global(.dark) .overlay-scrollbar-thumb {
  background: color-mix(in oklch, var(--primary) 45%, transparent);
}

:global(.dark) .overlay-scrollbar:hover .overlay-scrollbar-thumb,
:global(.dark) .overlay-scrollbar.is-dragging .overlay-scrollbar-thumb {
  background: color-mix(in oklch, var(--primary) 68%, transparent);
}

@media (pointer: coarse) {
  .overlay-scrollbar {
    display: none;
  }
}
</style>
