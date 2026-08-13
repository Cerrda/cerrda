<script lang="ts" setup>
import type { LightSpeedProps } from '~/lib/inspira/light-speed/LightSpeedApp'
import { defaultOptions, distortions, LightSpeedApp } from '~/lib/inspira/light-speed/LightSpeedApp'

const props = defineProps<LightSpeedProps>()
const containerRef = useTemplateRef<HTMLElement>('lightSpeedRef')
let app: LightSpeedApp | null = null

onMounted(() => {
  if (!containerRef.value) return

  const mergedOptions = {
    ...defaultOptions,
    ...props.effectOptions,
  }

  if (typeof mergedOptions.distortion === 'string') {
    mergedOptions.distortion = distortions[mergedOptions.distortion as keyof typeof distortions]
  }

  app = new LightSpeedApp(containerRef.value, mergedOptions)
  app.loadAssets().then(() => {
    app?.init()
    const canvas = containerRef.value?.querySelector('canvas')
    if (canvas) {
      canvas.style.width = '100%'
      canvas.style.height = '100%'
      canvas.style.display = 'block'
      canvas.style.cursor = 'pointer'
    }
  })
})

onBeforeUnmount(() => {
  const canvas = containerRef.value?.querySelector('canvas')
  canvas?.remove()
  app = null
})
</script>

<template>
  <div ref="lightSpeedRef" class="relative block h-full min-h-72 w-full touch-none overflow-hidden" />
</template>
