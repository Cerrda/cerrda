<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '~/lib/utils'
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    class?: HTMLAttributes['class']
    slotClass?: HTMLAttributes['class']
    gradientSize?: number
    gradientColor?: string
    gradientOpacity?: number
  }>(),
  {
    class: '',
    slotClass: '',
    gradientSize: 280,
    gradientColor: '',
    gradientOpacity: 0.55,
  },
)

const colorMode = useColorMode()

const resolvedGradientColor = computed(() => {
  if (props.gradientColor) return props.gradientColor
  return colorMode.value === 'dark' ? 'oklch(0.72 0.12 350 / 0.45)' : 'oklch(0.82 0.1 350 / 0.28)'
})

const rootStyle = computed(() => ({
  '--spot-color': resolvedGradientColor.value,
  '--spot-size': `${props.gradientSize}px`,
  '--spot-opacity': String(props.gradientOpacity),
}))

function handlePointerMove(e: PointerEvent) {
  const el = e.currentTarget as HTMLElement
  const rect = el.getBoundingClientRect()
  el.style.setProperty('--spot-x', `${e.clientX - rect.left}px`)
  el.style.setProperty('--spot-y', `${e.clientY - rect.top}px`)
}

function handlePointerLeave(e: PointerEvent) {
  const el = e.currentTarget as HTMLElement
  el.style.setProperty('--spot-x', `-${props.gradientSize * 10}px`)
  el.style.setProperty('--spot-y', `-${props.gradientSize * 10}px`)
}
</script>

<template>
  <div
    :class="
      cn(
        'group relative flex w-full overflow-hidden rounded-[1.5rem] border border-border/60 bg-card/70 text-card-foreground shadow-[0_10px_28px_-16px_var(--shadow-bloom)] dark:border-white/15 dark:bg-card/60 dark:shadow-none',
        props.class,
      )
    "
    :style="rootStyle"
    @pointermove="handlePointerMove"
    @pointerleave="handlePointerLeave"
  >
    <div class="card-spotlight-glow" />
    <div :class="cn('relative z-10 w-full', props.slotClass)">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.card-spotlight-glow {
  pointer-events: none;
  position: absolute;
  inset: 0;
  border-radius: inherit;
  opacity: 0;
  background: radial-gradient(
    circle var(--spot-size) at var(--spot-x, -999px) var(--spot-y, -999px),
    var(--spot-color) 0%,
    transparent 70%
  );
  transition: opacity 0.5s ease;
}

.group:hover .card-spotlight-glow {
  opacity: var(--spot-opacity, 0.55);
}
</style>
