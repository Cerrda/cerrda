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

const chromatic = computed(() => props.rOffset !== 0 || props.gOffset !== 0 || props.bOffset !== 0)
const backdropValue = computed(() => (isVisible.value ? `url(#${filterId})` : 'none'))

const baseStyle = computed(() => {
  return {
    '--frost': props.frost,
    'border-radius': `${props.radius}px`,
    'backdrop-filter': backdropValue.value,
    '-webkit-backdrop-filter': backdropValue.value,
  }
})

// Computed displacement image
const displacementImage = computed(() => {
  const width = dimensions.width
  const height = dimensions.height
  if (width <= 0 || height <= 0) return ''

  // 边框厚度按短边比例；内外圆角必须同心，否则胶囊外形里会出现更尖的内框。
  const border = Math.min(width, height) * (props.border * 0.5)
  const outerRx = Math.min(props.radius, width / 2, height / 2)
  const innerRx = Math.max(0, outerRx - border)
  const innerW = Math.max(0, width - border * 2)
  const innerH = Math.max(0, height - border * 2)

  return `
    <svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
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
      <rect x="0" y="0" width="${width}" height="${height}" fill="black"></rect>
      <rect x="0" y="0" width="${width}" height="${height}" rx="${outerRx}" fill="url(#red)" />
      <rect x="0" y="0" width="${width}" height="${height}" rx="${outerRx}" fill="url(#blue)" style="mix-blend-mode: ${props.blend}" />
      <rect
        x="${border}"
        y="${border}"
        width="${innerW}"
        height="${innerH}"
        rx="${innerRx}"
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

    width = Math.round(width)
    height = Math.round(height)
    if (width === dimensions.width && height === dimensions.height) return

    dimensions.width = width
    dimensions.height = height
  })

  observer.observe(liquidGlassRoot.value)

  visibilityObserver = new IntersectionObserver(
    ([entry]) => {
      isVisible.value = entry?.isIntersecting ?? true
      if (isVisible.value && liquidGlassRoot.value) {
        const rect = liquidGlassRoot.value.getBoundingClientRect()
        const width = Math.round(rect.width)
        const height = Math.round(rect.height)
        if (width > 0 && height > 0 && (width !== dimensions.width || height !== dimensions.height)) {
          dimensions.width = width
          dimensions.height = height
        }
      }
    },
    { rootMargin: '40px' },
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
          <template v-if="chromatic">
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
            <feColorMatrix
              in="dispGreen"
              type="matrix"
              values="0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0"
              result="green"
            />
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
          </template>
          <feDisplacementMap
            v-else
            in="SourceGraphic"
            in2="map"
            :xChannelSelector="xChannel"
            :yChannelSelector="yChannel"
            :scale="scale"
          />
          <feGaussianBlur v-if="displace" :stdDeviation="displace" />
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
  background: color-mix(in oklch, var(--card) calc(var(--frost) * 100%), transparent);
  box-shadow:
    0 0 2px 1px color-mix(in oklch, var(--foreground) 10%, transparent) inset,
    0 0 10px 4px color-mix(in oklch, var(--foreground) 6%, transparent) inset,
    0 4px 16px var(--shadow-bloom),
    0 8px 24px var(--shadow-bloom);
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
