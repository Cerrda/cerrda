<script lang="ts" setup>
import { cn } from '~/lib/utils'
import { ref } from 'vue'

interface Props {
  text?: string
  class?: string
}
const props = withDefaults(defineProps<Props>(), {
  text: 'Button',
})

const buttonRef = ref<HTMLButtonElement>()
</script>

<template>
  <button
    ref="buttonRef"
    :class="
      cn(
        `group bg-card relative w-auto cursor-pointer overflow-hidden rounded-full border border-primary/25 p-2 px-6 text-center font-semibold`,
        props.class,
      )
    "
  >
    <div class="flex items-center gap-2">
      <div class="ihb-dot bg-primary size-2 rounded-lg group-[.bg-primary]:bg-primary-foreground" />
      <span
        class="inline-block whitespace-nowrap transition-all duration-300 group-hover:translate-x-12 group-hover:opacity-0"
      >
        {{ text }}
      </span>
    </div>

    <div
      class="text-primary-foreground absolute top-0 z-10 flex size-full translate-x-12 items-center justify-center gap-2 opacity-0 transition-all duration-300 group-hover:-translate-x-5 group-hover:opacity-100 group-[.bg-primary]:text-primary"
    >
      <span class="whitespace-nowrap">{{ text }}</span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="lucide lucide-arrow-right"
      >
        <path d="M5 12h14" />
        <path d="m12 5 7 7-7 7" />
      </svg>
    </div>
  </button>
</template>

<style scoped>
/*
  Inspira / Magic UI 原意是 Tailwind v3 的 scale(100.8)（放大 100.8 倍）。
  v4 里 scale-100 是 100%，scale-[100.8] 是无单位 100.8，无法插值，圆点几乎不放大。
*/
.ihb-dot {
  scale: 1;
  transition: scale 300ms;
}

.group:hover .ihb-dot {
  scale: 100.8;
}

@media (prefers-reduced-motion: reduce) {
  .ihb-dot {
    transition: none;
  }
}
</style>
