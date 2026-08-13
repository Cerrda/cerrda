<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '~/lib/utils'
import { computed, onMounted, ref } from 'vue'

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
const mouseX = ref(-props.gradientSize * 10)
const mouseY = ref(-props.gradientSize * 10)

const resolvedGradientColor = computed(() => {
  if (props.gradientColor) return props.gradientColor
  return colorMode.value === 'dark' ? 'oklch(0.72 0.12 350 / 0.45)' : 'oklch(0.78 0.12 350 / 0.55)'
})

function handleMouseMove(e: MouseEvent) {
  const target = e.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  mouseX.value = e.clientX - rect.left
  mouseY.value = e.clientY - rect.top
}

function handleMouseLeave() {
  mouseX.value = -props.gradientSize * 10
  mouseY.value = -props.gradientSize * 10
}

onMounted(() => {
  mouseX.value = -props.gradientSize * 10
  mouseY.value = -props.gradientSize * 10
})

const backgroundStyle = computed(
  () =>
    `radial-gradient(circle ${props.gradientSize}px at ${mouseX.value}px ${mouseY.value}px, ${resolvedGradientColor.value} 0%, transparent 70%)`,
)
</script>

<template>
  <div
    :class="
      cn(
        'group relative flex size-full overflow-hidden rounded-[1.5rem] border border-border/55 bg-card/55 text-foreground backdrop-blur-sm dark:bg-card/45',
        props.class,
      )
    "
    @mousemove="handleMouseMove"
    @mouseleave="handleMouseLeave"
  >
    <div
      class="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
      :style="{
        background: backgroundStyle,
        opacity: gradientOpacity,
      }"
    />
    <div :class="cn('relative z-10 size-full', props.slotClass)">
      <slot />
    </div>
  </div>
</template>
