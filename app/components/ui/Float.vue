<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '~/lib/utils'

interface Props {
  speed?: number
  amplitude?: [number, number]
  rotation?: number
  timeOffset?: number
  class?: HTMLAttributes['class']
}

const props = withDefaults(defineProps<Props>(), {
  speed: 0.55,
  amplitude: () => [6, 10] as [number, number],
  rotation: 1.4,
  timeOffset: 0,
})

const innerRef = useTemplateRef<HTMLElement>('innerRef')
const rootRef = useTemplateRef<HTMLElement>('rootRef')

let raf = 0
let time = props.timeOffset
let inView = true
let pageVisible = true
let viewObserver: IntersectionObserver | undefined

function apply(x: number, y: number, rotate: number) {
  const el = innerRef.value
  if (!el) return
  el.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${rotate}deg)`
}

function tick() {
  raf = 0
  if (!inView || !pageVisible) return

  time += props.speed * 0.016
  const x = Math.sin(time * 0.7 + props.timeOffset) * props.amplitude[0]
  const y = Math.sin(time * 0.55 + props.timeOffset) * props.amplitude[1]
  const rotate = Math.sin(time * 0.32 + props.timeOffset) * props.rotation
  apply(x, y, rotate)
  raf = requestAnimationFrame(tick)
}

function stop() {
  if (raf) {
    cancelAnimationFrame(raf)
    raf = 0
  }
}

function sync() {
  pageVisible = typeof document === 'undefined' ? true : document.visibilityState === 'visible'
  if (inView && pageVisible) {
    if (!raf) raf = requestAnimationFrame(tick)
    return
  }
  stop()
}

onMounted(() => {
  if (rootRef.value) {
    viewObserver = new IntersectionObserver(
      ([entry]) => {
        inView = entry?.isIntersecting ?? true
        sync()
      },
      { rootMargin: '80px' },
    )
    viewObserver.observe(rootRef.value)
  }

  document.addEventListener('visibilitychange', sync)
  sync()
})

onUnmounted(() => {
  stop()
  viewObserver?.disconnect()
  document.removeEventListener('visibilitychange', sync)
})
</script>

<template>
  <div ref="rootRef" :class="cn('will-change-transform', props.class)">
    <div ref="innerRef" class="will-change-transform">
      <slot />
    </div>
  </div>
</template>
