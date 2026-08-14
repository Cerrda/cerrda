<script lang="ts" setup>
import type { HTMLAttributes } from 'vue'
import { cn } from '~/lib/utils'

interface Props {
  name: string
  class?: HTMLAttributes['class']
  icon?: string
  description: string
  href: string
  cta: string
}

const props = defineProps<Props>()
</script>

<template>
  <div
    :key="name"
    :class="
      cn(
        `group relative col-span-3 flex transform-gpu flex-col justify-end overflow-hidden rounded-xl bg-card shadow-[0_0_0_1px_color-mix(in_oklch,var(--primary)_8%,transparent),0_12px_28px_var(--shadow-bloom)] dark:bg-card dark:shadow-[0_-20px_80px_-20px_#ffffff1f_inset] dark:[border:1px_solid_rgba(255,255,255,.1)]`,
        props.class,
      )
    "
  >
    <slot name="background" />

    <div
      class="pointer-events-none z-10 flex transform-gpu flex-col gap-1 p-6 transition-all duration-300 group-hover:-translate-y-10"
    >
      <component
        :is="icon"
        v-if="icon"
        class="size-12 origin-left transform-gpu text-neutral-700 transition-all duration-300 ease-in-out group-hover:scale-75"
      />
      <div
        v-else
        class="size-12 origin-left transform-gpu text-neutral-700 transition-all duration-300 ease-in-out group-hover:scale-75"
      />
      <h3 class="text-xl font-semibold text-neutral-700 dark:text-neutral-300">
        {{ name }}
      </h3>
      <p class="max-w-lg text-neutral-400">{{ description }}</p>
    </div>

    <div
      class="pointer-events-none absolute bottom-0 flex w-full translate-y-10 transform-gpu flex-row items-center p-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100"
    >
      <a
        :href="href"
        class="pointer-events-auto inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
      >
        {{ cta }} →
      </a>
    </div>
    <div
      class="pointer-events-none absolute inset-0 transform-gpu transition-all duration-300 group-hover:bg-black/3 group-hover:dark:bg-neutral-800/10"
    />
  </div>
</template>
