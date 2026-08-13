<script setup lang="ts">
defineProps({
  rotate: Number,
  scale: Number,
})
</script>

<template>
  <div
    :style="{
      transform: `rotateX(${rotate}deg) scale(${scale})`,
      boxShadow:
        '0 0 oklch(0.35 0.06 350 / 0.28), 0 9px 20px oklch(0.4 0.08 350 / 0.22), 0 37px 37px oklch(0.45 0.08 350 / 0.16), 0 84px 50px oklch(0.5 0.06 350 / 0.1)',
    }"
    class="mx-auto -mt-12 h-120 w-full max-w-5xl rounded-[30px] border-4 border-border bg-panel-deep p-2 shadow-2xl md:h-160 md:p-6"
  >
    <div class="size-full overflow-hidden rounded-2xl bg-card md:rounded-2xl md:p-4">
      <slot />
    </div>
  </div>
</template>
