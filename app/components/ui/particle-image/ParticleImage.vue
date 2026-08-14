<script lang="ts" setup>
import { cn } from '~/lib/utils'
import { onBeforeUnmount, onMounted } from 'vue'
import type { InspiraImageParticle as ImageParticle } from './inspiraImageParticles'
import { inspiraImageParticles } from './inspiraImageParticles'

interface Props {
  imageSrc: string
  alt?: string
  class?: string
  canvasWidth?: string
  canvasHeight?: string
  gravity?: string
  particleSize?: string
  particleGap?: string
  mouseForce?: string
  renderer?: 'default' | 'webgl'
  color?: string
  colorArr?: number[]
  initPosition?: 'random' | 'top' | 'left' | 'bottom' | 'right' | 'misplaced' | 'none'
  initDirection?: 'random' | 'top' | 'left' | 'bottom' | 'right' | 'none'
  fadePosition?: 'explode' | 'top' | 'left' | 'bottom' | 'right' | 'random' | 'none'
  fadeDirection?: 'random' | 'top' | 'left' | 'bottom' | 'right' | 'none'
  noise?: number
  responsiveWidth?: boolean
  densityFocusX?: number
  densityFocusY?: number
  densityPower?: number
  densityEdgeKeep?: number
  densityLumaWeight?: number
  densityTopBoost?: number
  densityBottomTaper?: number
  accentColor?: string
  accentPalette?: string[]
  accentChance?: number
  imageFit?: 'contain' | 'cover'
  coverFocusX?: number
  coverFocusY?: number
  accentPaletteLight?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  alt: '',
  gravity: '0.1',
  particleSize: '1',
  particleGap: '3',
  mouseForce: '45',
  renderer: 'default',
  initPosition: 'random',
  initDirection: 'random',
  fadePosition: 'none',
  fadeDirection: 'none',
  noise: 6,
  responsiveWidth: false,
})

const colorMode = useColorMode()
const { particlesReady } = useAppBoot()
const wrapperRef = useTemplateRef<HTMLElement>('wrapperRef')
const imageParticleRef = useTemplateRef<HTMLImageElement>('imageParticleRef')
const resolvedSrc = useAppAsset(() => props.imageSrc)

let particles: ImageParticle | undefined
let started = false
let sizeFrame = 0
let offscreen = false
let themeObserver: MutationObserver | undefined
let viewObserver: IntersectionObserver | undefined

function currentTheme(): 'dark' | 'light' {
  if (import.meta.client && document.documentElement.classList.contains('dark')) return 'dark'
  if (colorMode.value === 'dark') return 'dark'
  return 'light'
}

function applyParticleTheme() {
  particles?.setTheme(currentTheme())
}

function syncPlayback() {
  if (!particles) return
  if (offscreen) particles.pauseLoop()
  else particles.resumeLoop()
}

function measure() {
  const node = wrapperRef.value
  if (!node) return { width: 0, height: 0 }
  const rect = node.getBoundingClientRect()
  return {
    width: Math.max(1, Math.round(rect.width)),
    height: Math.max(1, Math.round(rect.height)),
  }
}

function start() {
  if (started || !imageParticleRef.value || !wrapperRef.value) return

  const size = measure()
  if (size.width < 8 || size.height < 8) {
    sizeFrame = requestAnimationFrame(start)
    return
  }

  started = true
  const { InspiraImageParticle } = inspiraImageParticles()
  particles = new InspiraImageParticle({
    image: imageParticleRef.value,
    wrapperElement: wrapperRef.value,
    width: Number(props.canvasWidth) || size.width,
    height: Number(props.canvasHeight) || size.height,
    gravity: Number(props.gravity),
    particleGap: Number(props.particleGap),
    particleSize: Number(props.particleSize),
    mouseForce: Number(props.mouseForce),
    renderer: props.renderer,
    initPosition: props.initPosition,
    initDirection: props.initDirection,
    fadePosition: props.fadePosition,
    fadeDirection: props.fadeDirection,
    noise: props.noise,
    color: props.color,
    colorArr: props.colorArr,
    responsiveWidth: props.responsiveWidth,
    densityFocusX: props.densityFocusX,
    densityFocusY: props.densityFocusY,
    densityPower: props.densityPower,
    densityEdgeKeep: props.densityEdgeKeep,
    densityLumaWeight: props.densityLumaWeight,
    densityTopBoost: props.densityTopBoost,
    densityBottomTaper: props.densityBottomTaper,
    accentColor: props.accentColor,
    accentPalette: props.accentPalette,
    accentChance: props.accentChance,
    imageFit: props.imageFit,
    coverFocusX: props.coverFocusX,
    coverFocusY: props.coverFocusY,
    theme: currentTheme(),
    accentPaletteLight: props.accentPaletteLight,
  })
  applyParticleTheme()
  syncPlayback()
  requestAnimationFrame(() => {
    particlesReady.value = true
  })
}

onMounted(() => {
  start()
  themeObserver = new MutationObserver(applyParticleTheme)
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

  if (wrapperRef.value) {
    viewObserver = new IntersectionObserver(
      ([entry]) => {
        offscreen = !(entry?.isIntersecting ?? true)
        syncPlayback()
      },
      { rootMargin: '120px', threshold: 0 },
    )
    viewObserver.observe(wrapperRef.value)
  }
})

watch(() => colorMode.value, applyParticleTheme)

onBeforeUnmount(() => {
  themeObserver?.disconnect()
  themeObserver = undefined
  viewObserver?.disconnect()
  viewObserver = undefined
  cancelAnimationFrame(sizeFrame)
  particles?.stop({ fadePosition: 'none' })
  particles = undefined
  wrapperRef.value?.querySelector('canvas')?.remove()
})
</script>

<template>
  <div ref="wrapperRef" :class="cn('relative size-full overflow-visible', props.class)">
    <img
      ref="imageParticleRef"
      :src="resolvedSrc"
      :alt="alt"
      class="pointer-events-none absolute size-0 overflow-hidden opacity-0"
      decoding="async"
      draggable="false"
      aria-hidden="true"
    />
  </div>
</template>

<style scoped>
:deep(canvas) {
  display: block !important;
  width: 100%;
  height: 100%;
  border: 0 !important;
  outline: none !important;
  background: transparent !important;
  box-shadow: none !important;
}
</style>
