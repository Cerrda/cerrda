<script lang="ts" setup>
import { PhArrowRight } from '@phosphor-icons/vue'
import { cn } from '~/lib/utils'

interface Props {
  text?: string
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  text: 'Button',
})
</script>

<template>
  <button
    type="button"
    :class="
      cn(
        `group relative w-auto cursor-pointer overflow-hidden rounded-full border border-primary/25 bg-card p-2 px-6 text-center font-semibold transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]`,
        props.class,
      )
    "
  >
    <div class="flex items-center gap-2">
      <div class="ihb-dot size-2 rounded-lg bg-primary group-[.bg-primary]:bg-primary-foreground" />
      <span
        class="inline-block whitespace-nowrap transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-12 group-hover:opacity-0"
      >
        {{ text }}
      </span>
    </div>

    <div
      class="absolute top-0 z-10 flex size-full translate-x-12 items-center justify-center gap-2 text-primary-foreground opacity-0 transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:-translate-x-5 group-hover:opacity-100 group-[.bg-primary]:text-primary"
    >
      <span class="whitespace-nowrap">{{ text }}</span>
      <PhArrowRight :size="18" weight="bold" />
    </div>
  </button>
</template>

<style scoped>
.ihb-dot {
  scale: 1;
  transition: scale 500ms cubic-bezier(0.32, 0.72, 0, 1);
}

.group:hover .ihb-dot {
  scale: 100.8;
}
</style>
