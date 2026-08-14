<script setup lang="ts">
import type { EditorialArtwork } from '~/data/editorial'
import { cn } from '~/lib/utils'

const props = defineProps<{
  artwork: EditorialArtwork
  /** 显示在头像旁的品牌名；不传则只显示头像 */
  name?: string
  class?: string
}>()

const src = useAppAsset(() => props.artwork.src)
</script>

<template>
  <span :class="cn('inline-flex items-center gap-2.5', props.class)">
    <span class="relative flex size-8 shrink-0 items-center justify-center overflow-hidden md:size-9">
      <img
        :src="src"
        :alt="artwork.alt"
        :title="artwork.title"
        class="block size-full select-none object-contain object-center"
        loading="eager"
        decoding="async"
        draggable="false"
      />
    </span>
    <span v-if="name" class="font-display text-xl leading-none tracking-tight">
      {{ name }}
    </span>
  </span>
</template>
