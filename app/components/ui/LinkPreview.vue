<script lang="ts">
/** 跨实例共享，同一截图只请求一次 */
const imageCache = new Map<string, Promise<boolean>>()

function preloadImage(src: string): Promise<boolean> {
  if (!src || typeof window === 'undefined') return Promise.resolve(false)

  const cached = imageCache.get(src)
  if (cached) return cached

  const promise = new Promise<boolean>((resolve) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => resolve(true)
    img.onerror = () => {
      imageCache.delete(src)
      resolve(false)
    }
    img.src = src
  })

  imageCache.set(src, promise)
  return promise
}

function buildPreviewSrc(options: {
  isStatic: boolean
  imageSrc: string
  url: string
  colorScheme: string
  width: number
  height: number
}) {
  if (options.isStatic) return options.imageSrc

  const params = new URLSearchParams({
    'url': options.url,
    'screenshot': 'true',
    'meta': 'false',
    'embed': 'screenshot.url',
    'colorScheme': options.colorScheme,
    'viewport.isMobile': 'true',
    'viewport.deviceScaleFactor': '1',
    'viewport.width': String(options.width * 3),
    'viewport.height': String(options.height * 3),
  })

  return `https://api.microlink.io/?${params.toString()}`
}
</script>

<script setup lang="ts">
import type { CSSProperties } from 'vue'
import { cn } from '~/lib/utils'
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue'

interface BaseProps {
  class?: string
  linkClass?: string
  width?: number
  height?: number
}

interface StaticImageProps extends BaseProps {
  isStatic?: true
  imageSrc?: string
  url?: string
}

interface URLPreviewProps extends BaseProps {
  isStatic?: false
  imageSrc?: string
  url?: string
}

type Props = StaticImageProps | URLPreviewProps
const props = withDefaults(defineProps<Props>(), {
  isStatic: false,
  imageSrc: '',
  url: '',
  width: 200,
  height: 125,
})

const colorMode = useColorMode()
const colorScheme = computed(() => (colorMode.value === 'dark' ? 'dark' : 'light'))

const isVisible = ref(false)
const isReady = ref(false)
const triggerRef = ref<HTMLElement | null>(null)
const hasPopped = ref(false)

/** image + padding(p-1×2) + border(2×2) */
const CHROME = 12
const EDGE = 8
const GAP = 16

const previewSrc = computed(() =>
  buildPreviewSrc({
    isStatic: props.isStatic,
    imageSrc: props.imageSrc,
    url: props.url,
    colorScheme: colorScheme.value,
    width: props.width,
    height: props.height,
  }),
)

const mousePosition = reactive({
  x: 0,
  y: 0,
})

const previewStyle = computed<CSSProperties>(() => {
  if (!import.meta.client || !isVisible.value) return { visibility: 'hidden' as const }

  const previewWidth = props.width + CHROME
  const previewHeight = props.height + CHROME
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  let x = mousePosition.x - previewWidth / 2
  x = Math.min(Math.max(EDGE, x), viewportWidth - previewWidth - EDGE)

  const linkRect = triggerRef.value?.getBoundingClientRect()
  let y = linkRect ? linkRect.top - previewHeight - GAP : mousePosition.y - previewHeight - GAP

  if (linkRect && y < EDGE) {
    y = linkRect.bottom + GAP
  }
  y = Math.min(Math.max(EDGE, y), viewportHeight - previewHeight - EDGE)

  return {
    position: 'fixed',
    left: `${x}px`,
    top: `${y}px`,
    width: `${previewWidth}px`,
    zIndex: 9999,
  }
})

const imageStyle = computed<CSSProperties>(() => ({
  width: `${props.width}px`,
  height: `${props.height}px`,
}))

const popClass = computed(() => (hasPopped.value ? 'animate-pop' : ''))

async function ensurePreloaded(src: string, preloadAlt = false) {
  if (!src) {
    isReady.value = false
    return
  }
  const ok = await preloadImage(src)
  if (src === previewSrc.value) {
    isReady.value = ok
  }

  if (preloadAlt && ok && !props.isStatic && props.url) {
    const altScheme = colorScheme.value === 'dark' ? 'light' : 'dark'
    void preloadImage(
      buildPreviewSrc({
        isStatic: false,
        imageSrc: '',
        url: props.url,
        colorScheme: altScheme,
        width: props.width,
        height: props.height,
      }),
    )
  }
}

function handleMouseMove(event: MouseEvent) {
  mousePosition.x = event.clientX
  mousePosition.y = event.clientY
}

async function showPreview(event: MouseEvent) {
  mousePosition.x = event.clientX
  mousePosition.y = event.clientY
  void ensurePreloaded(previewSrc.value, true)
  isVisible.value = true
  await nextTick()
  hasPopped.value = true
}

function hidePreview() {
  isVisible.value = false
  hasPopped.value = false
}

let observer: IntersectionObserver | null = null

watch(previewSrc, (src) => {
  isReady.value = false
  void ensurePreloaded(src, true)
})

onMounted(() => {
  const el = triggerRef.value
  if (!el || !('IntersectionObserver' in window)) {
    void ensurePreloaded(previewSrc.value, true)
    return
  }

  observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        void ensurePreloaded(previewSrc.value, true)
        observer?.disconnect()
        observer = null
      }
    },
    { rootMargin: '320px 0px' },
  )
  observer.observe(el)
})

onUnmounted(() => {
  observer?.disconnect()
  observer = null
})
</script>

<template>
  <div ref="triggerRef" :class="cn('relative inline-block', props.class)">
    <NuxtLink
      :to="url"
      :external="url.startsWith('http')"
      :target="url.startsWith('http') ? '_blank' : undefined"
      rel="noopener noreferrer"
      :class="cn('text-foreground', props.linkClass)"
      @mousemove="handleMouseMove"
      @mouseenter="showPreview"
      @mouseleave="hidePreview"
    >
      <slot />
    </NuxtLink>

    <ClientOnly>
      <Teleport to="#teleports">
        <div v-show="isVisible" class="pointer-events-none fixed z-[9999]" :style="previewStyle">
          <div :class="cn('overflow-hidden rounded-xl shadow-xl', popClass, !props.isStatic && 'transform-gpu')">
            <div class="block rounded-xl border-2 border-transparent bg-card p-1 shadow-lg">
              <div class="relative overflow-hidden rounded-lg" :style="imageStyle">
                <div v-if="!isReady" class="absolute inset-0 animate-pulse bg-gradient-to-br from-secondary to-muted" />
                <img
                  :src="previewSrc"
                  :width="width"
                  :height="height"
                  class="size-full rounded-lg object-cover transition-opacity duration-200"
                  :class="isReady ? 'opacity-100' : 'opacity-0'"
                  :style="imageStyle"
                  alt="preview"
                  decoding="async"
                  @load="isReady = true"
                />
              </div>
            </div>
          </div>
        </div>
      </Teleport>
    </ClientOnly>
  </div>
</template>

<style scoped>
.transform-gpu {
  transform: scale3d(0, 0, 1);
  transform-origin: center bottom;
  will-change: transform;
  backface-visibility: hidden;
}

.animate-pop {
  animation: pop 1000ms ease forwards;
  will-change: transform;
}

@keyframes pop {
  0% {
    transform: scale3d(0.26, 0.26, 1);
  }
  25% {
    transform: scale3d(1.1, 1.1, 1);
  }
  65% {
    transform: scale3d(0.98, 0.98, 1);
  }
  100% {
    transform: scale3d(1, 1, 1);
  }
}
</style>
