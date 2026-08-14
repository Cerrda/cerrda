<script lang="ts" setup>
import type { HTMLAttributes } from 'vue'
import { cn } from '~/lib/utils'

interface Props {
  class?: HTMLAttributes['class']
}

const props = defineProps<Props>()
</script>

<template>
  <div
    :class="
      cn(
        `group/bento row-span-1 flex flex-col justify-between space-y-4 rounded-xl border border-border/60 bg-card p-4 shadow-[0_10px_28px_-16px_var(--shadow-bloom)] transition duration-200 hover:border-primary/30 hover:shadow-[0_14px_32px_-12px_var(--shadow-bloom)] dark:border-white/15 dark:bg-card dark:shadow-none`,
        props.class,
      )
    "
  >
    <slot name="header" />
    <div class="transition duration-200 group-hover/bento:translate-x-2">
      <slot name="icon" />
      <div class="my-2 font-sans font-bold text-foreground">
        <slot name="title" />
      </div>
      <div class="font-sans text-xs font-normal text-muted-foreground">
        <slot name="description" />
      </div>
    </div>
  </div>
</template>
