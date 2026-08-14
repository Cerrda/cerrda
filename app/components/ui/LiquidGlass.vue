<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '~/lib/utils'
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'

interface Props {
  radius?: number
  border?: number
  lightness?: number
  displace?: number
  blend?: string
  xChannel?: 'R' | 'G' | 'B'
  yChannel?: 'R' | 'G' | 'B'
  alpha?: number
  blur?: number
  rOffset?: number
  gOffset?: number
  bOffset?: number
  scale?: number
  frost?: number
  class?: HTMLAttributes['class']
  containerClass?: HTMLAttributes['class']
}

// Props definition
const props = withDefaults(defineProps<Props>(), {
  radius: 16,
  border: 0.07,
  lightness: 50,
  blend: 'difference',
  xChannel: 'R',
  yChannel: 'B',
  alpha: 0.93,
  blur: 11,
  rOffset: 0,
  gOffset: 10,
  bOffset: 20,
  scale: -180,
  frost: 0.05,
})

// Refs
const liquidGlassRoot = ref<HTMLElement | null>(null)
const filterId = `displacementFilter-${useId().replace(/\W/g, '')}`
const dimensions = reactive({
  width: 0,
  height: 0,
})
const isVisible = ref(true)

let observer: ResizeObserver | null = null
let visibilityObserver: IntersectionObserver | null = null

const baseStyle = computed(() => {
  return {
    '--frost': props.frost,
    'border-radius': `${props.radius}px`,
    'backdrop-filter': isVisible.value ? `url(#${filterId})` : 'none',
  }
})

// Computed displacement image
const displacementImage = computed(() => {
  const border = Math.min(dimensions.width, dimensions.height) * (props.border * 0.5)
  const yBorder = Math.min(dimensions.width, dimensions.height) * (props.border * 0.5)

  return `
    <svg viewBox="0 0 ${dimensions.width} ${dimensions.height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="red" x1="100%" y1="0%" x2="0%" y2="0%">
          <stop offset="0%" stop-color="#0000"/>
          <stop offset="100%" stop-color="red"/>
        </linearGradient>
        <linearGradient id="blue" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#0000"/>
          <stop offset="100%" stop-color="blue"/>
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="${dimensions.width}" height="${dimensions.height}" fill="black"></rect>
      <rect x="0" y="0" width="${dimensions.width}" height="${dimensions.height}" rx="${props.radius}" fill="url(#red)" />
      <rect x="0" y="0" width="${dimensions.width}" height="${dimensions.height}" rx="${props.radius}" fill="url(#blue)" style="mix-blend-mode: ${props.blend}" />
      <rect 
        x="${border}" 
        y="${yBorder}" 
        width="${dimensions.width - border * 2}" 
        height="${dimensions.height - border * 2}" 
        rx="${props.radius}" 
        fill="hsl(0 0% ${props.lightness}% / ${props.alpha})" 
        style="filter:blur(${props.blur}px)" 
      />
    </svg>
  `
})

// Data URI for SVG filter
const displacementDataUri = computed(() => {
  const encoded = encodeURIComponent(displacementImage.value)
  return `data:image/svg+xml,${encoded}`
})

// Lifecycle hooks
onMounted(() => {
  if (!liquidGlassRoot.value) return

  observer = new ResizeObserver((entries) => {
    if (!isVisible.value) return
    const entry = entries[0]
    if (!entry) return

    let width = 0
    let height = 0

    if (entry.borderBoxSize && entry.borderBoxSize?.length) {
      width = entry.borderBoxSize[0]!.inlineSize
      height = entry.borderBoxSize[0]!.blockSize
    } else if (entry.contentRect) {
      width = entry.contentRect.width
      height = entry.contentRect.height
    }

    dimensions.width = width
    dimensions.height = height
  })

  observer.observe(liquidGlassRoot.value)

  visibilityObserver = new IntersectionObserver(
    ([entry]) => {
      isVisible.value = entry?.isIntersecting ?? true
    },
    { rootMargin: '140px' },
  )
  visibilityObserver.observe(liquidGlassRoot.value)
})

onUnmounted(() => {
  observer?.disconnect()
  visibilityObserver?.disconnect()
})
</script>

<template>
  <div ref="liquidGlassRoot" :style="baseStyle" :class="cn(`effect`, props.containerClass)">
    <div :class="cn(`slot-container`, props.class)">
      <slot />
    </div>

    <svg v-show="isVisible" class="filter" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter :id="filterId" color-interpolation-filters="sRGB">
          <feImage x="0" y="0" width="100%" height="100%" :href="displacementDataUri" result="map" />
          <feDisplacementMap
            id="redchannel"
            in="SourceGraphic"
            in2="map"
            :xChannelSelector="xChannel"
            :yChannelSelector="yChannel"
            :scale="scale + rOffset"
            result="dispRed"
          />
          <feColorMatrix in="dispRed" type="matrix" values="1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0" result="red" />
          <feDisplacementMap
            id="greenchannel"
            in="SourceGraphic"
            in2="map"
            :xChannelSelector="xChannel"
            :yChannelSelector="yChannel"
            :scale="scale + gOffset"
            result="dispGreen"
          />
          <feColorMatrix in="dispGreen" type="matrix" values="0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0" result="green" />
          <feDisplacementMap
            id="bluechannel"
            in="SourceGraphic"
            in2="map"
            :xChannelSelector="xChannel"
            :yChannelSelector="yChannel"
            :scale="scale + bOffset"
            result="dispBlue"
          />
          <feColorMatrix in="dispBlue" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0" result="blue" />
          <feBlend in="red" in2="green" mode="screen" result="rg" />
          <feBlend in="rg" in2="blue" mode="screen" result="output" />
          <feGaussianBlur :stdDeviation="displace" />
        </filter>
      </defs>
    </svg>
  </div>
</template>

<style scoped>
.effect {
  position: relative;
  display: block;
  width: 100%;
  opacity: 1;
  border-radius: inherit;
  overflow: hidden;
  background: color-mix(in oklch, var(--card) calc(var(--frost) * 100%), transparent);
  box-shadow:
    0 0 2px 1px color-mix(in oklch, var(--foreground) 10%, transparent) inset,
    0 0 10px 4px color-mix(in oklch, var(--foreground) 5%, transparent) inset,
    0 16px 56px color-mix(in oklch, var(--foreground) 6%, transparent);
}

.slot-container {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: inherit;
}

@supports not (backdrop-filter: url(#a)) {
  .effect {
    background: color-mix(in oklch, var(--card) 55%, transparent);
    backdrop-filter: blur(24px) saturate(1.5);
  }
}

.filter {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
