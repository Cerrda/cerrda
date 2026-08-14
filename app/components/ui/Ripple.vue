<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
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
}

const props = withDefaults(defineProps<Props>(), {
  baseCircleSize: 210,
  baseCircleOpacity: 0.24,
  circleOpacityDowngradeRatio: 0.03,
  waveSpeed: 80,
  spaceBetweenCircle: 70,
  numberOfCircles: 7,
})
</script>

<template>
  <div :class="cn('pointer-events-none absolute inset-0 select-none overflow-hidden', props.class)">
    <RippleCircle
      v-for="index in props.numberOfCircles"
      :key="index"
      :opacity="props.baseCircleOpacity - index * props.circleOpacityDowngradeRatio"
      :size="props.baseCircleSize + index * props.spaceBetweenCircle"
      :animation-delay="index * props.waveSpeed"
      :border-style="index === props.numberOfCircles - 1 ? 'dashed' : 'solid'"
      :class="props.circleClass"
    />
  </div>
</template>
