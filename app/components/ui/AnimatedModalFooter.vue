<script setup lang="ts">
import { cn } from '~/lib/utils'
interface Props {
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  class: '',
})
</script>

<template>
  <div :class="cn(`mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-border/60 pt-5`, props.class)">
    <slot />
  </div>
</template>
