<script lang="ts" setup>
import type { LightSpeedProps } from '~/lib/inspira/light-speed/LightSpeedApp'
import { defaultOptions, distortions, LightSpeedApp } from '~/lib/inspira/light-speed/LightSpeedApp'

const props = defineProps<LightSpeedProps>()
const containerRef = useTemplateRef<HTMLElement>('lightSpeedRef')
const { gpuProfile, lightSpeedCompiled } = useAppBoot()

let app: LightSpeedApp | null = null
let intersectionObserver: IntersectionObserver | undefined
let started = false

function syncPlayback() {
  if (!app) return
  const node = containerRef.value
  if (!node) return
  const visible = document.visibilityState === 'visible'
  const rect = node.getBoundingClientRect()
  const inView = rect.bottom > 0 && rect.top < window.innerHeight
  if (visible && inView) app.resume()
  else app.pause()
}

function handleVisibility() {
  syncPlayback()
}

async function start() {
  if (started || !containerRef.value) return
  started = true

  const mergedOptions = {
    ...defaultOptions,
    ...props.effectOptions,
    pixelRatio: gpuProfile.value.lightSpeedPixelRatio,
  }

  if (typeof mergedOptions.distortion === 'string') {
    mergedOptions.distortion = distortions[mergedOptions.distortion as keyof typeof distortions]
  }

  app = new LightSpeedApp(containerRef.value, mergedOptions)
  await app.loadAssets()
  if (!app) return
  app.init()

  const canvas = containerRef.value.querySelector('canvas')
  if (canvas) {
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    canvas.style.display = 'block'
    canvas.style.cursor = 'pointer'
  }

  await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
  lightSpeedCompiled.value = true

  intersectionObserver = new IntersectionObserver(
    ([entry]) => {
      if (!app) return
      if (entry?.isIntersecting && document.visibilityState === 'visible') app.resume()
      else app.pause()
    },
    { rootMargin: '120px' },
  )
  intersectionObserver.observe(containerRef.value)
  document.addEventListener('visibilitychange', handleVisibility)
  syncPlayback()
}

onMounted(() => {
  void start()
})

onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', handleVisibility)
  intersectionObserver?.disconnect()
  app?.dispose()
  app = null
})
</script>

<template>
  <div ref="lightSpeedRef" class="relative block h-full min-h-72 w-full touch-none overflow-hidden" />
</template>
