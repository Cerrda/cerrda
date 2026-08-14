<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '~/lib/utils'

interface GridItem {
  title: string
  subtitle?: string
  tag?: string
}

interface Props {
  class?: HTMLAttributes['class']
  items: GridItem[]
}

const props = defineProps<Props>()

const loopItems = computed(() => [...props.items, ...props.items])
</script>

<template>
  <div
    :class="
      cn(
        'relative overflow-hidden rounded-[2rem] border border-border/50 bg-card/40 p-4 md:p-6 dark:border-border/40 dark:bg-card/25',
        props.class,
      )
    "
  >
    <div
      class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,oklch(0.82_0.05_350/0.14),transparent_50%)] dark:bg-[radial-gradient(circle_at_30%_20%,oklch(0.45_0.04_350/0.12),transparent_50%)]"
    />
    <div class="infinite-track flex w-max gap-4 py-2">
      <div
        v-for="(item, index) in loopItems"
        :key="`${item.title}-${index}`"
        class="w-56 shrink-0 rounded-2xl border border-border/50 bg-background/80 p-4 md:w-64 dark:border-border/40 dark:bg-background/55"
      >
        <p class="text-[10px] uppercase tracking-[0.18em] text-primary dark:text-pink-200/80">
          {{ item.tag || 'Project' }}
        </p>
        <h3 class="mt-3 font-display text-lg text-foreground dark:text-white">
          {{ item.title }}
        </h3>
        <p class="mt-2 text-sm text-muted-foreground dark:text-white/65">
          {{ item.subtitle }}
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.infinite-track {
  animation: infinite-scroll 28s linear infinite;
  will-change: transform;
  transform: translateZ(0);
}

@keyframes infinite-scroll {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-50%);
  }
}
</style>
