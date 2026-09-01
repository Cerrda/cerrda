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
  position: 'absolute',
  top: '50%',
  left: '50%',
  width: `${props.size}px`,
  height: `${props.size}px`,
  borderRadius: '50%',
  boxSizing: 'border-box',
  borderWidth: '1px',
  borderColor: 'rgba(255,255,255,0.15)',
  pointerEvents: 'none',
  opacity: props.opacity,
  animationDelay: `${props.animationDelay}ms`,
  borderStyle: props.borderStyle,
}))
</script>

<template>
  <div
    :class="
      cn(
        'animate-ripple-circle absolute rounded-full border border-black/15 bg-black/[0.02] shadow-xl dark:border-white/15 dark:bg-white/[0.02]',
        props.class,
      )
    "
    :style="circleStyle"
  />
</template>

<style scoped>
.animate-ripple-circle {
  position: absolute;
  border-radius: 50%;
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
</style>
