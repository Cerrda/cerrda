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

const { particlesReady } = useAppBoot()
const wrapperRef = useTemplateRef<HTMLElement>('wrapperRef')
const imageParticleRef = useTemplateRef<HTMLImageElement>('imageParticleRef')

let particles: ImageParticle | undefined
let started = false
let sizeFrame = 0

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
  })
  requestAnimationFrame(() => {
    particlesReady.value = true
  })
}

onMounted(() => {
  start()
})

onBeforeUnmount(() => {
  cancelAnimationFrame(sizeFrame)
  particles?.stop({ fadePosition: 'none' })
  particles = undefined
  wrapperRef.value?.querySelector('canvas')?.remove()
})
</script>

<template>
  <div ref="wrapperRef" :class="cn('relative size-full overflow-hidden', props.class)">
    <img ref="imageParticleRef" :src="imageSrc" :alt="alt" class="hidden" decoding="async" draggable="false" />
  </div>
</template>

<style scoped>
:deep(canvas) {
  display: block !important;
  width: 100%;
  height: 100%;
}
</style>
