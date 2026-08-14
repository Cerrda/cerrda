<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { useElementSize } from '@vueuse/core'
import { computed, ref } from 'vue'
import RippleCircle from '~/components/ui/RippleCircle.vue'
import { cn } from '~/lib/utils'

interface Props {
  class?: HTMLAttributes['class']
  baseCircleSize?: number
  baseCircleOpacity?: number
  spaceBetweenCircle?: number
  circleOpacityDowngradeRatio?: number
  circleClass?: string
  waveSpeed?: number
  numberOfCircles?: number
  /** Size rings from the container so they reach the corners. */
  fill?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  baseCircleSize: 210,
  baseCircleOpacity: 0.24,
  circleOpacityDowngradeRatio: 0.03,
  waveSpeed: 80,
  spaceBetweenCircle: 70,
  numberOfCircles: 7,
  fill: false,
})

const rootRef = ref<HTMLElement | null>(null)
const { width, height } = useElementSize(rootRef)

const layout = computed(() => {
  const count = Math.max(props.numberOfCircles, 1)
  if (!props.fill) {
    return {
      base: props.baseCircleSize,
      space: props.spaceBetweenCircle,
      opacityStep: props.circleOpacityDowngradeRatio,
    }
  }

  const w = width.value || (import.meta.client ? window.innerWidth : 1920)
  const h = height.value || (import.meta.client ? window.innerHeight : 1080)
  const inner = Math.min(w, h) * 0.28
  const outer = Math.hypot(w, h) * 1.12
  const space = count > 1 ? (outer - inner) / (count - 1) : outer
  const minOuterOpacity = Math.min(0.1, props.baseCircleOpacity * 0.35)

  return {
    base: inner - space,
    space,
    opacityStep: (props.baseCircleOpacity - minOuterOpacity) / count,
  }
})
</script>

<template>
  <div ref="rootRef" :class="cn('pointer-events-none absolute inset-0 select-none overflow-hidden', props.class)">
    <RippleCircle
      v-for="index in props.numberOfCircles"
      :key="index"
      :opacity="props.baseCircleOpacity - index * layout.opacityStep"
      :size="layout.base + index * layout.space"
      :animation-delay="index * props.waveSpeed"
      :border-style="index === props.numberOfCircles - 1 ? 'dashed' : 'solid'"
      :class="props.circleClass"
    />
  </div>
</template>
