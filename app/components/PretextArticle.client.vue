<script setup lang="ts">
import { useEventListener } from '@vueuse/core'
import { PretextArticleEngine } from '~/lib/pretext/engine'
import type { OverlaySpec } from '~/lib/pretext/types'
import { withAppBase } from '~/utils/withAppBase'

const props = defineProps<{
  html: string
}>()

const config = useRuntimeConfig()

function overlaySrc(src: string) {
  return withAppBase(src, config.app.baseURL)
}

const wrapRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const ready = ref(false)
const failed = ref(false)
const overlays = ref<OverlaySpec[]>([])

let engine: PretextArticleEngine | null = null
let overlayObserver: ResizeObserver | undefined
let wrapObserver: ResizeObserver | undefined
let lastWrapWidth = 0

const useCanvas = computed(() => !failed.value)

async function boot() {
  const wrap = wrapRef.value
  const canvas = canvasRef.value
  if (!wrap || !canvas || !useCanvas.value) return

  engine?.destroy()
  engine = new PretextArticleEngine({
    canvas,
    wrap,
    skipFirstHeading: true,
  })

  try {
    await engine.init(props.html)
    overlays.value = engine.getOverlaySpecs()
    await nextTick()
    observeOverlays()
    engine.positionOverlays()
    engine.start()
    ready.value = true
  } catch (error) {
    console.warn('[PretextArticle] fallback to HTML', error)
    failed.value = true
    engine?.destroy()
    engine = null
  }
}

function observeOverlays() {
  overlayObserver?.disconnect()
  overlayObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const id = (entry.target as HTMLElement).dataset.pretextOverlay
      if (!id) continue
      engine?.setOverlayHeight(id, entry.contentRect.height)
    }
  })
  wrapRef.value?.querySelectorAll<HTMLElement>('[data-pretext-overlay]').forEach((el) => overlayObserver?.observe(el))
}

function onOverlayResize(event: Event) {
  const img = event.target as HTMLImageElement
  const overlay = img.closest<HTMLElement>('[data-pretext-overlay]')
  const id = overlay?.dataset.pretextOverlay
  if (!id || !overlay) return
  engine?.setOverlayHeight(id, overlay.getBoundingClientRect().height)
}

function onPointerMove(event: PointerEvent) {
  if (!engine || !ready.value) return
  const wrap = wrapRef.value
  if (!wrap) return
  const rect = wrap.getBoundingClientRect()
  const inside =
    event.clientX >= rect.left &&
    event.clientX <= rect.right &&
    event.clientY >= rect.top &&
    event.clientY <= rect.bottom
  engine.setPointerClient(event.clientX, event.clientY, inside)
}

function onPointerLeave(event: PointerEvent) {
  if (!engine || !ready.value) return
  engine.setPointerClient(event.clientX, event.clientY, false)
}

function onPointerDown(event: PointerEvent) {
  if (!engine || !ready.value || event.button !== 0) return
  const target = event.target as HTMLElement | null
  if (target?.closest('[data-pretext-overlay]')) return
  const result = engine.pointerDown(event.clientX, event.clientY)
  if (result.href) {
    const external = /^https?:/i.test(result.href)
    if (external) window.open(result.href, '_blank', 'noopener,noreferrer')
    else window.location.assign(result.href)
  }
}

function observeWrap(node: HTMLElement) {
  wrapObserver?.disconnect()
  wrapObserver = new ResizeObserver((entries) => {
    const width = Math.round(entries[0]?.contentRect.width ?? 0)
    if (width === lastWrapWidth) return
    lastWrapWidth = width
    engine?.resize()
  })
  wrapObserver.observe(node)
}
onMounted(async () => {
  await nextTick()
  if (wrapRef.value) observeWrap(wrapRef.value)
  if (useCanvas.value) await boot()
  if (!ready.value && useCanvas.value && (!wrapRef.value || !canvasRef.value)) {
    await nextTick()
    if (wrapRef.value && !wrapObserver) observeWrap(wrapRef.value)
    await boot()
  }
})

watch(useCanvas, async (enabled) => {
  if (enabled) {
    await nextTick()
    boot()
    return
  }
  engine?.destroy()
  engine = null
  ready.value = false
  overlays.value = []
})

watch(
  () => props.html,
  async () => {
    if (!useCanvas.value) return
    await nextTick()
    boot()
  },
)

watch(canvasRef, async (el) => {
  if (!el || !useCanvas.value || ready.value) return
  await nextTick()
  boot()
})

useEventListener(window, 'pointermove', onPointerMove, { passive: true })
useEventListener(window, 'scroll', () => engine?.syncPointerFromScroll(), { passive: true })

onBeforeUnmount(() => {
  overlayObserver?.disconnect()
  wrapObserver?.disconnect()
  engine?.destroy()
  engine = null
})
</script>

<template>
  <div class="relative select-none" @selectstart.prevent>
    <div
      v-if="useCanvas"
      ref="wrapRef"
      class="pretext-article relative w-full select-none"
      :class="ready ? '' : 'pointer-events-none absolute inset-x-0 top-0 opacity-0'"
      @pointerleave="onPointerLeave"
      @pointerdown="onPointerDown"
    >
      <canvas ref="canvasRef" class="pointer-events-none block w-full select-none" aria-hidden="true" />

      <div
        v-for="overlay in overlays"
        :key="overlay.id"
        class="pretext-overlay pointer-events-auto absolute top-0 right-0 left-0 z-[1] select-none"
        :data-pretext-overlay="overlay.id"
      >
        <div v-if="overlay.type === 'table'" class="prose-article overflow-x-auto" v-html="overlay.html" />
        <img
          v-else-if="overlay.type === 'image'"
          :src="overlaySrc(overlay.src)"
          :alt="overlay.alt || ''"
          referrerpolicy="no-referrer"
          decoding="async"
          class="block w-full max-w-full rounded-[1rem]"
          @load="onOverlayResize"
        />
      </div>
    </div>

    <div
      v-show="!useCanvas || !ready"
      class="prose-article select-none space-y-4 text-base leading-8 text-foreground/90"
      v-html="html"
    />

    <div v-if="useCanvas && ready" class="sr-only select-none" v-html="html" />
  </div>
</template>

<style scoped>
.prose-article :deep(h2) {
  margin-top: 2rem;
  font-family: var(--font-display);
  font-size: 1.5rem;
}
.prose-article :deep(h3) {
  margin-top: 1.5rem;
  font-family: var(--font-display);
  font-size: 1.2rem;
}
.prose-article :deep(pre) {
  overflow-x: auto;
  border-radius: 1rem;
  background: color-mix(in oklch, var(--secondary) 80%, transparent);
  padding: 1rem;
  font-size: 0.85rem;
}
.prose-article :deep(code) {
  font-family: var(--font-mono);
}
.prose-article :deep(ul) {
  padding-left: 1.2rem;
  list-style: disc;
}
.prose-article :deep(ol) {
  padding-left: 1.2rem;
  list-style: decimal;
}
.prose-article :deep(p) {
  margin: 0.85rem 0;
}
.prose-article :deep(img) {
  display: block;
  width: 100%;
  height: auto;
  max-width: 100%;
  border-radius: 1rem;
}
.prose-article :deep(a) {
  color: var(--primary);
  text-underline-offset: 4px;
}
.prose-article :deep(table) {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}
.prose-article :deep(th),
.prose-article :deep(td) {
  border: 1px solid color-mix(in oklch, var(--border) 80%, transparent);
  padding: 0.5rem 0.75rem;
}
.prose-article :deep(blockquote) {
  border-left: 2px solid color-mix(in oklch, var(--primary) 55%, transparent);
  padding-left: 1rem;
  color: var(--muted-foreground);
}
.pretext-article,
.pretext-article :deep(*),
.prose-article,
.prose-article :deep(*),
.sr-only {
  user-select: none;
  -webkit-user-select: none;
}
</style>
