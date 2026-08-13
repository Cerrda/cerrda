<script setup lang="ts">
import { Motion } from 'motion-v'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { cn } from '~/lib/utils'

interface Props {
  open?: boolean
  title?: string
  subtitle?: string
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  title: '',
  subtitle: '',
})

const rootRef = ref<HTMLElement | null>(null)
const mouseX = ref(0)
const tipPos = ref({ top: 0, left: 0 })

const rotation = computed(() => (mouseX.value / 100) * 50)
const translation = computed(() => (mouseX.value / 100) * 50)

function updateMouseX(event: MouseEvent) {
  const target = event.currentTarget as HTMLElement | null
  if (!target) return
  const rect = target.getBoundingClientRect()
  mouseX.value = event.clientX - rect.left - rect.width / 2
}

function updateTipPosition() {
  const el = rootRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  tipPos.value = {
    top: rect.top - 8,
    left: rect.left + rect.width / 2,
  }
}

watch(
  () => props.open,
  (open) => {
    if (!open) return
    mouseX.value = 0
    updateTipPosition()
  },
)

onBeforeUnmount(() => {
  mouseX.value = 0
})
</script>

<template>
  <div ref="rootRef" :class="cn('relative inline-flex', props.class)" @mousemove="updateMouseX">
    <Teleport to="body">
      <Motion
        v-if="open"
        :initial="{
          opacity: 0,
          y: 20,
          scale: 0.6,
        }"
        :animate="{
          opacity: 1,
          y: 0,
          scale: 1,
        }"
        :transition="{
          type: 'spring',
          stiffness: 260,
          damping: 10,
        }"
        :exit="{
          opacity: 0,
          y: 20,
          scale: 0.6,
        }"
        :style="{
          top: `${tipPos.top}px`,
          left: `${tipPos.left}px`,
          translateX: `calc(-50% + ${translation}px)`,
          translateY: '-100%',
          rotate: `${rotation}deg`,
        }"
        class="pointer-events-none fixed z-[10050] flex flex-col items-center justify-center rounded-md bg-black px-4 py-2 text-xs whitespace-nowrap shadow-xl"
      >
        <div
          class="absolute right-1/2 -bottom-px z-30 me-1 h-px w-2/5 translate-x-1/2 bg-linear-to-r from-transparent via-emerald-500 to-transparent"
        />
        <div
          class="absolute -bottom-px left-1/2 z-30 ms-1 h-px w-2/5 -translate-x-1/2 bg-linear-to-r from-transparent via-sky-500 to-transparent"
        />
        <div class="relative z-30 text-sm font-bold text-white">
          {{ title }}
        </div>
        <div v-if="subtitle" class="relative z-30 max-w-[16rem] truncate text-xs text-white/80">
          {{ subtitle }}
        </div>
      </Motion>
    </Teleport>
    <slot />
  </div>
</template>
