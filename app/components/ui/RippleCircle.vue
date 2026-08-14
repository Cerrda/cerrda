<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { computed } from 'vue'
import { cn } from '~/lib/utils'

interface Props {
  size?: number
  class?: HTMLAttributes['class']
  opacity?: number
  animationDelay?: number
  borderStyle?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 210,
  opacity: 0.24,
  animationDelay: 0,
  borderStyle: 'solid',
})

const circleStyle = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
  opacity: props.opacity,
  animationDelay: `${props.animationDelay}ms`,
  borderStyle: props.borderStyle,
}))
</script>

<template>
  <div :class="cn('animate-ripple-circle absolute rounded-full border shadow-xl', props.class)" :style="circleStyle" />
</template>

<style scoped>
.animate-ripple-circle {
  animation: ripple-effect var(--duration, 2s) ease-in-out infinite;
  border-width: 1px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(1);
}

@keyframes ripple-effect {
  0%,
  100% {
    transform: translate(-50%, -50%) scale(1);
  }

  50% {
    transform: translate(-50%, -50%) scale(0.9);
  }
}

@media (prefers-reduced-motion: reduce) {
  .animate-ripple-circle {
    animation: none;
  }
}
</style>
